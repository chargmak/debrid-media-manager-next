import { useLibraryCache } from '@/contexts/LibraryCacheContext';
import { useAllDebridApiKey, useRealDebridAccessToken, useTorBoxAccessToken } from '@/hooks/auth';
import { adInstantCheck, getMagnetStatus, uploadMagnet } from '@/services/allDebrid';
import { EnrichedHashlistTorrent, Hashlist, HashlistTorrent } from '@/services/mediasearch';
import {
	checkCachedStatus,
	createTorrent,
	getTorrentList,
	TorBoxRateLimitError,
} from '@/services/torbox';
import { TorBoxTorrentInfo } from '@/services/types';
import UserTorrentDB from '@/torrent/db';
import { handleAddAsMagnetInRd } from '@/utils/addMagnet';
import { runConcurrentFunctions } from '@/utils/batch';
import {
	handleDeleteAdTorrent,
	handleDeleteRdTorrent,
	handleDeleteTbTorrent,
} from '@/utils/deleteTorrent';
import {
	convertToAllDebridUserTorrent,
	convertToTbUserTorrent,
	convertToUserTorrent,
} from '@/utils/fetchTorrents';
import {
	checkDatabaseAvailabilityAd2,
	checkDatabaseAvailabilityRd2,
	checkDatabaseAvailabilityTb2,
	wrapLoading,
} from '@/utils/instantChecks';
import { getMediaId } from '@/utils/mediaId';
import { getTypeByName } from '@/utils/mediaType';
import getReleaseTags from '@/utils/score';
import { genericToastOptions } from '@/utils/toastOptions';
import { generateTokenAndHash } from '@/utils/token';
import { filenameParse } from '@ctrl/video-filename-parser';
import {
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Download,
	Film,
	Shuffle,
	Tv,
	X,
} from 'lucide-react';
import lzString from 'lz-string';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';

const ONE_GIGABYTE = 1024 * 1024 * 1024;
const ITEMS_PER_PAGE = 100;

interface SortBy {
	column: 'hash' | 'filename' | 'title' | 'bytes' | 'score';
	direction: 'asc' | 'desc';
}

const torrentDB = new UserTorrentDB();

function HashlistPage() {
	const router = useRouter();
	const [query, setQuery] = useState('');

	const [hashlistTitle, setHashlistTitle] = useState<string>('');
	const [userTorrentsList, setUserTorrentsList] = useState<EnrichedHashlistTorrent[]>([]);
	const [filteredList, setFilteredList] = useState<EnrichedHashlistTorrent[]>([]);
	const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
	const [sortBy, setSortBy] = useState<SortBy>({ column: 'hash', direction: 'asc' });

	const [rdKey] = useRealDebridAccessToken();
	const adKey = useAllDebridApiKey();
	const tbKey = useTorBoxAccessToken();
	const { addTorrent: addToCache, removeTorrent: removeFromCache } = useLibraryCache();

	const [currentPage, setCurrentPage] = useState(1);
	const [movieCount, setMovieCount] = useState<number>(0);
	const [tvCount, setTvCount] = useState<number>(0);
	const [movieGrouping] = useState<Record<string, number>>({});
	const [tvGroupingByEpisode] = useState<Record<string, number>>({});
	const [tvGroupingByTitle] = useState<Record<string, number>>({});
	const [hasDupes] = useState<Array<string>>([]);
	const [totalBytes, setTotalBytes] = useState<number>(0);

	// Hashlist navigation state (for browsing hashlists from /hashlists page)
	const [navState, setNavState] = useState<{
		files: string[];
		names: string[];
		currentIndex: number;
	} | null>(null);
	const [navLoading, setNavLoading] = useState(false);
	const [mounted, setMounted] = useState(false);

	// Load navigation state from sessionStorage (client-side only)
	useEffect(() => {
		setMounted(true);
		const stored = sessionStorage.getItem('hashlistNav');
		if (stored) {
			try {
				setNavState(JSON.parse(stored));
			} catch {
				// Invalid JSON, ignore
			}
		}
	}, []);

	async function navigateToHashlist(index: number) {
		if (!navState || index < 0 || index >= navState.files.length) return;

		setNavLoading(true);
		try {
			const response = await fetch(navState.files[index]);
			const html = await response.text();
			const match = html.match(/src="https:\/\/debridmediamanager\.com\/hashlist#([^"]+)"/);
			if (match && match[1]) {
				// Update navigation state
				const newNavState = { ...navState, currentIndex: index };
				sessionStorage.setItem('hashlistNav', JSON.stringify(newNavState));
				setNavState(newNavState);
				// Navigate to new hashlist
				window.location.hash = match[1];
				window.location.reload();
			}
		} catch (err) {
			console.error('Failed to load hashlist:', err);
		} finally {
			setNavLoading(false);
		}
	}

	function handleNavPrevious() {
		if (navState && navState.currentIndex > 0) {
			navigateToHashlist(navState.currentIndex - 1);
		}
	}

	function handleNavNext() {
		if (navState && navState.currentIndex < navState.files.length - 1) {
			navigateToHashlist(navState.currentIndex + 1);
		}
	}

	function handleNavRandom() {
		if (!navState || navState.files.length <= 1) return;
		let newIndex;
		do {
			newIndex = Math.floor(Math.random() * navState.files.length);
		} while (newIndex === navState.currentIndex);
		navigateToHashlist(newIndex);
	}

	function clearNavState() {
		sessionStorage.removeItem('hashlistNav');
		setNavState(null);
	}

	async function initialize() {
		await torrentDB.initializeDB();
		await Promise.all([fetchUserTorrentsList(), fetchHashAndProgress()]);
	}

	useEffect(() => {
		if (userTorrentsList.length !== 0) return;
		initialize();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rdKey, adKey, tbKey]);

	async function decodeJsonStringFromUrl(): Promise<string> {
		const hash = window.location.hash;
		if (!hash) return '';
		const jsonString = lzString.decompressFromEncodedURIComponent(hash.substring(1));
		return jsonString;
	}

	async function readHashlist(): Promise<HashlistTorrent[]> {
		const jsonString = await decodeJsonStringFromUrl();
		if (jsonString.charAt(0) !== '[') {
			const hashlist = JSON.parse(jsonString) as Hashlist;
			setHashlistTitle(hashlist.title);
			return hashlist.torrents;
		}

		const torrents = JSON.parse(jsonString) as HashlistTorrent[];
		setHashlistTitle('Share this page');
		return torrents;
	}

	async function fetchUserTorrentsList() {
		try {
			const torrents = (await readHashlist())
				.map((torrent) => {
					const mediaType = getTypeByName(torrent.filename);
					const info =
						mediaType === 'movie'
							? filenameParse(torrent.filename)
							: filenameParse(torrent.filename, true);
					return {
						score: getReleaseTags(torrent.filename, torrent.bytes / ONE_GIGABYTE).score,
						info,
						mediaType,
						title: getMediaId(info, mediaType, false) || torrent.filename,
						rdAvailable: false,
						adAvailable: false,
						tbAvailable: false,
						noVideos: false,
						files: [],
						...torrent,
					};
				})
				// Filter out movies without a valid year; TV shows don't need one
				.filter(
					(t) => t.mediaType === 'tv' || (t.info.year && Number(t.info.year) > 0)
				) as EnrichedHashlistTorrent[];
			if (!torrents.length) return;
			setUserTorrentsList(torrents);

			const hashArr = torrents.map((r) => r.hash);
			if (rdKey) {
				const [tokenWithTimestamp, tokenHash] = await generateTokenAndHash();
				wrapLoading(
					'RD',
					checkDatabaseAvailabilityRd2(
						tokenWithTimestamp,
						tokenHash,
						rdKey,
						hashArr,
						setUserTorrentsList
					)
				);
			}
			if (adKey)
				wrapLoading(
					'AD',
					checkDatabaseAvailabilityAd2(adKey, hashArr, setUserTorrentsList)
				);
			if (tbKey)
				wrapLoading(
					'TB',
					checkDatabaseAvailabilityTb2(tbKey, hashArr, setUserTorrentsList)
				);
		} catch (error) {
			console.error('Error fetching user torrents list:', error);
			setUserTorrentsList([]);
			toast.error('Failed to fetch user torrents.');
		}
	}

	const [hashAndProgress, setHashAndProgress] = useState<Record<string, number>>({});
	async function fetchHashAndProgress(hash?: string) {
		const torrents = await torrentDB.all();
		const records: Record<string, number> = {};
		for (const t of torrents) {
			if (hash && t.hash !== hash) continue;
			records[`${t.id.substring(0, 3)}${t.hash}`] = t.progress;
		}
		setHashAndProgress((prev) => ({ ...prev, ...records }));
	}
	const isDownloading = (service: string, hash: string) =>
		`${service}:${hash}` in hashAndProgress && hashAndProgress[`${service}:${hash}`] < 100;
	const isDownloaded = (service: string, hash: string) =>
		`${service}:${hash}` in hashAndProgress && hashAndProgress[`${service}:${hash}`] === 100;
	const notInLibrary = (service: string, hash: string) =>
		!(`${service}:${hash}` in hashAndProgress);

	// aggregate metadata
	useEffect(() => {
		setMovieCount(0);
		setTvCount(0);
		setTotalBytes(0);

		let tmpTotalBytes = 0;
		clearGroupings(movieGrouping);
		clearGroupings(tvGroupingByEpisode);
		for (const t of userTorrentsList) {
			tmpTotalBytes += t.bytes;
			if (t.title in getGroupings(t.mediaType)) {
				if (getGroupings(t.mediaType)[t.title] === 1) hasDupes.push(t.title);
				getGroupings(t.mediaType)[t.title]++;
			} else {
				getGroupings(t.mediaType)[t.title] = 1;
			}
			if (t.mediaType === 'tv') {
				if (t.title in tvGroupingByTitle) {
					tvGroupingByTitle[t.title]++;
				} else {
					tvGroupingByTitle[t.title] = 1;
				}
			}
		}

		setMovieCount(Object.keys(movieGrouping).length);
		setTvCount(Object.keys(tvGroupingByTitle).length);
		setTotalBytes(tmpTotalBytes);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userTorrentsList]);

	// set the list you see
	async function filterOutAlreadyDownloaded(unfiltered: EnrichedHashlistTorrent[]) {
		if (unfiltered.length <= 1) return unfiltered;
		const hashes = await torrentDB.hashes();
		return unfiltered.filter((t) => !hashes.has(t.hash));
	}
	function applyQuickSearch(unfiltered: EnrichedHashlistTorrent[]) {
		let regexFilters: RegExp[] = [];
		for (const q of query.split(' ')) {
			try {
				regexFilters.push(new RegExp(q, 'i'));
			} catch (error) {
				continue;
			}
		}
		return query
			? unfiltered.filter((t) => regexFilters.every((regex) => regex.test(t.filename)))
			: unfiltered;
	}
	async function filterList() {
		const notYetDownloaded = await filterOutAlreadyDownloaded(userTorrentsList);
		let tmpList = notYetDownloaded;
		// ensure tmpList is also unique in terms of hash
		tmpList = tmpList.filter((t, i, self) => self.findIndex((s) => s.hash === t.hash) === i);

		// Filter for instantly available torrents if enabled and keys are present
		if (showOnlyAvailable && (rdKey || adKey || tbKey)) {
			tmpList = tmpList.filter((t) => t.rdAvailable || t.adAvailable || t.tbAvailable);
		}

		if (Object.keys(router.query).length === 0) {
			setFilteredList(applyQuickSearch(tmpList));
			return;
		}
		const { filter: titleFilter, mediaType } = router.query;
		if (titleFilter) {
			const decodedTitleFilter = decodeURIComponent(titleFilter as string);
			tmpList = tmpList.filter((t) => decodedTitleFilter === t.title);
			setFilteredList(applyQuickSearch(tmpList));
		}
		if (mediaType) {
			tmpList = tmpList.filter((t) => mediaType === t.mediaType);
			setFilteredList(applyQuickSearch(tmpList));
		}
	}
	useEffect(() => {
		filterList();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		query,
		userTorrentsList,
		movieGrouping,
		tvGroupingByEpisode,
		router.query,
		showOnlyAvailable,
	]);

	function handleSort(column: typeof sortBy.column) {
		setSortBy({
			column,
			direction: sortBy.column === column && sortBy.direction === 'asc' ? 'desc' : 'asc',
		});
	}

	function sortedData() {
		// Check if sortBy.column is not set
		// if (sortBy.column === 'hash') {
		// 	// Randomize the list
		// 	return filteredList.sort(() => Math.random() - 0.5);
		// }
		filteredList.sort((a, b) => {
			const isAsc = sortBy.direction === 'asc';
			let comparison = 0;
			if (a[sortBy.column] > b[sortBy.column]) {
				comparison = 1;
			} else if (a[sortBy.column] < b[sortBy.column]) {
				comparison = -1;
			}
			return isAsc ? comparison : comparison * -1;
		});

		return filteredList;
	}

	function currentPageData() {
		return sortedData().slice(
			(currentPage - 1) * ITEMS_PER_PAGE,
			(currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE
		);
	}

	const getGroupings = (mediaType: EnrichedHashlistTorrent['mediaType']) =>
		mediaType === 'tv' ? tvGroupingByEpisode : movieGrouping;

	function clearGroupings(frequencyMap: { [x: string]: number }) {
		for (let key in frequencyMap) {
			delete frequencyMap[key];
		}
	}

	function wrapDownloadFilesInRdFn(t: EnrichedHashlistTorrent) {
		return async () => await addRd(t.hash);
	}

	async function downloadNonDupeTorrentsInRd() {
		const libraryHashes = await torrentDB.hashes();
		const yetToDownload = filteredList
			.filter((t) => !libraryHashes.has(t.hash))
			.map(wrapDownloadFilesInRdFn);
		if (yetToDownload.length === 0) {
			toast.custom(
				(t) => (
					<div className="flex items-center rounded-lg bg-gray-800 px-4 py-3 text-white shadow-lg">
						<CheckCircle className="mr-2 h-5 w-5 text-green-500" />
						<span>Everything already downloaded</span>
					</div>
				),
				genericToastOptions
			);
			return;
		}

		const progressToast = toast.loading(
			`Downloading 0/${yetToDownload.length} torrents...`,
			genericToastOptions
		);

		const [results, errors] = await runConcurrentFunctions(
			yetToDownload,
			4,
			0,
			(completed, total, errorCount) => {
				const message =
					errorCount > 0
						? `Downloading ${completed}/${total} torrents (${errorCount} errors)...`
						: `Downloading ${completed}/${total} torrents...`;
				toast.loading(message, { id: progressToast });
			}
		);

		// Update the progress toast to show final result
		if (errors.length && results.length) {
			toast.error(`Downloaded ${results.length}; ${errors.length} failed.`, {
				id: progressToast,
				...genericToastOptions,
			});
		} else if (errors.length) {
			toast.error(`Failed to download ${errors.length} torrents.`, {
				id: progressToast,
				...genericToastOptions,
			});
		} else if (results.length) {
			toast.success(`Started ${results.length} downloads.`, {
				id: progressToast,
				...genericToastOptions,
			});
		} else {
			toast.dismiss(progressToast);
		}
	}

	function wrapDownloadFilesInAdFn(t: EnrichedHashlistTorrent) {
		return async () => await addAd(t.hash);
	}
	async function downloadNonDupeTorrentsInAd() {
		const libraryHashes = await torrentDB.hashes();
		const yetToDownload = filteredList
			.filter((t) => !libraryHashes.has(t.hash))
			.map(wrapDownloadFilesInAdFn);
		if (yetToDownload.length === 0) {
			toast.custom(
				(t) => (
					<div className="flex items-center rounded-lg bg-gray-800 px-4 py-3 text-white shadow-lg">
						<CheckCircle className="mr-2 h-5 w-5 text-green-500" />
						<span>Everything already downloaded</span>
					</div>
				),
				genericToastOptions
			);
			return;
		}

		const progressToast = toast.loading(`Downloading 0/${yetToDownload.length} torrents...`);

		const [results, errors] = await runConcurrentFunctions(
			yetToDownload,
			4,
			0,
			(completed, total, errorCount) => {
				const message =
					errorCount > 0
						? `Downloading ${completed}/${total} torrents (${errorCount} errors)...`
						: `Downloading ${completed}/${total} torrents...`;
				toast.loading(message, { id: progressToast });
			}
		);

		// Update the progress toast to show final result
		if (errors.length && results.length) {
			toast.error(`Downloaded ${results.length}; ${errors.length} failed.`, {
				id: progressToast,
			});
		} else if (errors.length) {
			toast.error(`Failed to download ${errors.length} torrents.`, { id: progressToast });
		} else if (results.length) {
			toast.success(`Started ${results.length} downloads.`, { id: progressToast });
		} else {
			toast.dismiss(progressToast);
		}
	}

	function wrapDownloadFilesInTbFn(t: EnrichedHashlistTorrent) {
		return async () => await addTb(t.hash);
	}
	async function downloadNonDupeTorrentsInTb() {
		const libraryHashes = await torrentDB.hashes();
		const yetToDownload = filteredList
			.filter((t) => !libraryHashes.has(t.hash))
			.map(wrapDownloadFilesInTbFn);
		if (yetToDownload.length === 0) {
			toast.custom(
				(t) => (
					<div className="flex items-center rounded-lg bg-gray-800 px-4 py-3 text-white shadow-lg">
						<CheckCircle className="mr-2 h-5 w-5 text-green-500" />
						<span>Everything already downloaded</span>
					</div>
				),
				genericToastOptions
			);
			return;
		}

		const progressToast = toast.loading(`Downloading 0/${yetToDownload.length} torrents...`);

		const [results, errors] = await runConcurrentFunctions(
			yetToDownload,
			4,
			0,
			(completed, total, errorCount) => {
				const message =
					errorCount > 0
						? `Downloading ${completed}/${total} torrents (${errorCount} errors)...`
						: `Downloading ${completed}/${total} torrents...`;
				toast.loading(message, { id: progressToast });
			}
		);

		// Update the progress toast to show final result
		if (errors.length && results.length) {
			toast.error(`Downloaded ${results.length}; ${errors.length} failed.`, {
				id: progressToast,
			});
		} else if (errors.length) {
			toast.error(`Failed to download ${errors.length} torrents.`, { id: progressToast });
		} else if (results.length) {
			toast.success(`Started ${results.length} downloads.`, { id: progressToast });
		} else {
			toast.dismiss(progressToast);
		}
	}

	async function addRd(hash: string) {
		await handleAddAsMagnetInRd(
			rdKey!,
			hash,
			async (info) => {
				const userTorrent = convertToUserTorrent({
					...info,
					id: info.id,
					filename: info.filename,
					bytes: info.bytes,
					status: info.status,
					added: info.added,
					links: info.links,
					hash: info.hash,
				});
				await torrentDB.addAll([userTorrent]);
				addToCache(userTorrent);
				await fetchHashAndProgress(hash);
			},
			true
		);
	}

	async function addAd(hash: string) {
		try {
			// Check if instant first
			const instantResp = await adInstantCheck(adKey!, [hash]);
			const magnetInfo = instantResp.data?.magnets?.[0];
			if (!magnetInfo?.instant) {
				toast.error('Torrent not instant in AD; skipped.', genericToastOptions);
				return;
			}

			// Add the magnet
			const magnetUri = hash.startsWith('magnet:?') ? hash : `magnet:?xt=urn:btih:${hash}`;
			const resp = await uploadMagnet(adKey!, [magnetUri]);
			if (resp.magnets.length === 0 || resp.magnets[0].error) {
				toast.error('Failed to add hash to AD.', genericToastOptions);
				return;
			}
			if (resp.magnets[0].id) {
				const statusResp = await getMagnetStatus(adKey!, String(resp.magnets[0].id));
				if (statusResp.data?.magnets?.[0]) {
					const userTorrent = convertToAllDebridUserTorrent(statusResp.data.magnets[0]);
					await torrentDB.addAll([userTorrent]);
					addToCache(userTorrent);
					await fetchHashAndProgress(hash);
					toast.success('Torrent added to AD.', genericToastOptions);
				}
			}
		} catch (error) {
			console.error('Error adding magnet to AllDebrid:', error);
			toast.error('Failed to add hash to AD.', genericToastOptions);
		}
	}

	async function deleteRd(hash: string) {
		const torrents = await torrentDB.getAllByHash(hash);
		for (const t of torrents) {
			if (!t.id.startsWith('rd:')) continue;
			await handleDeleteRdTorrent(rdKey!, t.id);
			await torrentDB.deleteByHash('rd', hash);
			removeFromCache(t.id); // Update global cache
			setHashAndProgress((prev) => {
				const newHashAndProgress = { ...prev };
				delete newHashAndProgress[`rd:${hash}`];
				return newHashAndProgress;
			});
		}
	}

	async function deleteAd(hash: string) {
		const torrents = await torrentDB.getAllByHash(hash);
		for (const t of torrents) {
			if (!t.id.startsWith('ad:')) continue;
			await handleDeleteAdTorrent(adKey!, t.id);
			await torrentDB.deleteByHash('ad', hash);
			removeFromCache(t.id); // Update global cache
			setHashAndProgress((prev) => {
				const newHashAndProgress = { ...prev };
				delete newHashAndProgress[`ad:${hash}`];
				return newHashAndProgress;
			});
		}
	}

	async function addTb(hash: string) {
		try {
			// Check if instant first
			const instantResp = await checkCachedStatus(
				{ hash: [hash], format: 'object', list_files: true },
				tbKey!
			);
			const cachedData = instantResp.data as any;
			if (!cachedData?.[hash]) {
				toast.error('Torrent not instant in TorBox; skipped.', genericToastOptions);
				return;
			}

			// Add the magnet
			const magnetUri = hash.startsWith('magnet:?') ? hash : `magnet:?xt=urn:btih:${hash}`;
			const resp = await createTorrent(tbKey!, { magnet: magnetUri });
			if (!resp.success || !resp.data?.torrent_id) {
				toast.error('Failed to add hash to TorBox.', genericToastOptions);
				return;
			}

			const torrentInfo = await getTorrentList(tbKey!, { id: resp.data.torrent_id });
			if (torrentInfo.success && torrentInfo.data) {
				const info = torrentInfo.data as TorBoxTorrentInfo;
				const userTorrent = convertToTbUserTorrent(info);
				await torrentDB.addAll([userTorrent]);
				addToCache(userTorrent);
				await fetchHashAndProgress(hash);
				toast.success('Torrent added to TorBox.', genericToastOptions);
			}
		} catch (error) {
			console.error('Error adding magnet to TorBox:', error);
			if (error instanceof TorBoxRateLimitError) {
				toast.error(
					'TorBox rate limit exceeded. Please wait and try again.',
					genericToastOptions
				);
			} else {
				toast.error('Failed to add hash to TorBox.', genericToastOptions);
			}
		}
	}

	async function deleteTb(hash: string) {
		const torrents = await torrentDB.getAllByHash(hash);
		for (const t of torrents) {
			if (!t.id.startsWith('tb:')) continue;
			await handleDeleteTbTorrent(tbKey!, t.id);
			await torrentDB.deleteByHash('tb', hash);
			removeFromCache(t.id); // Update global cache
			setHashAndProgress((prev) => {
				const newHashAndProgress = { ...prev };
				delete newHashAndProgress[`tb:${hash}`];
				return newHashAndProgress;
			});
		}
	}

	const handlePrevPage = useCallback(() => {
		setCurrentPage((prev) => prev - 1);
	}, []);

	const handleNextPage = useCallback(() => {
		setCurrentPage((prev) => prev + 1);
	}, []);

	return (
		<div className="flex min-h-screen flex-col bg-black text-foreground selection:bg-primary/30">
			<Head>
				<title>{`${hashlistTitle} | DMM`}</title>
			</Head>
			<Toaster position="bottom-right" />

			{/* Hashlist Navigation Bar (when browsing from /hashlists) */}
			{mounted && navState && (
				<div className="z-50 sticky top-0 flex items-center justify-between border-b border-white/5 bg-black/60 px-4 py-2 backdrop-blur-xl">
					<div className="flex items-center gap-3">
						<button
							onClick={handleNavPrevious}
							disabled={navState.currentIndex <= 0 || navLoading}
							className="flex h-9 w-9 items-center justify-center rounded-lg bg-content2/50 text-default-400 transition-all hover:bg-secondary/20 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
							title="Previous Hashlist"
						>
							<ChevronLeft className="h-5 w-5" />
						</button>
						<button
							onClick={handleNavRandom}
							disabled={navState.files.length <= 1 || navLoading}
							className="flex h-9 w-9 items-center justify-center rounded-lg bg-content2/50 text-default-400 transition-all hover:bg-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
							title="Random Hashlist"
						>
							<Shuffle className="h-5 w-5" />
						</button>
						<button
							onClick={handleNavNext}
							disabled={
								navState.currentIndex >= navState.files.length - 1 || navLoading
							}
							className="flex h-9 w-9 items-center justify-center rounded-lg bg-content2/50 text-default-400 transition-all hover:bg-secondary/20 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
							title="Next Hashlist"
						>
							<ChevronRight className="h-5 w-5" />
						</button>
						<div className="ml-2 flex flex-col">
							<span className="text-xs font-medium text-default-400">Browsing Community Lists</span>
							<span className="text-sm font-bold text-white line-clamp-1">
								{navLoading
									? 'Loading...'
									: `${navState.names[navState.currentIndex]} (${navState.currentIndex + 1}/${navState.files.length})`}
							</span>
						</div>
					</div>
					<button
						onClick={clearNavState}
						className="flex h-9 w-9 items-center justify-center rounded-lg bg-content2/50 text-default-400 transition-all hover:bg-danger/20 hover:text-danger"
						title="Exit Browser Mode"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
			)}

			<div className="flex flex-col gap-6 p-4 sm:p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div className="space-y-1">
						<h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
							{hashlistTitle}
						</h1>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-default-400">
							<span className="flex items-center gap-1.5">
								<Film className="h-3.5 w-3.5" />
								{userTorrentsList.length} files
							</span>
							<span className="flex items-center gap-1.5">
								<Download className="h-3.5 w-3.5" />
								{(totalBytes / ONE_GIGABYTE / 1024).toFixed(1)} TB total
							</span>
						</div>
					</div>
					<Link
						href="/"
						className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
					>
						Go Home
					</Link>
				</div>

				<div className="glass-card flex items-center p-2">
					<div className="flex h-10 w-10 items-center justify-center text-default-400">
						<Shuffle className="h-5 w-5" />
					</div>
					<input
						className="h-10 w-full bg-transparent px-2 text-sm text-white placeholder:text-default-400 focus:outline-none"
						type="text"
						id="query"
						placeholder="Filter by filename, hash, or id..."
						value={query}
						onChange={(e) => {
							setQuery(e.target.value.toLocaleLowerCase());
						}}
					/>
				</div>
			</div>
			<div className="mb-4">
				<button
					className={`mb-2 mr-1 rounded border-2 border-indigo-500 bg-indigo-900/30 px-1 py-1 text-indigo-100 transition-colors hover:bg-indigo-800/50 ${currentPage <= 1 ? 'cursor-not-allowed opacity-60' : ''
						}`}
					onClick={handlePrevPage}
					disabled={currentPage <= 1}
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="w-16 text-center">
					{currentPage}/{Math.max(1, Math.ceil(sortedData().length / ITEMS_PER_PAGE))}
				</span>
				<button
					className={`mb-2 ml-1 mr-2 rounded border-2 border-indigo-500 bg-indigo-900/30 px-1 py-1 text-xs text-indigo-100 transition-colors hover:bg-indigo-800/50 ${currentPage >= Math.ceil(sortedData().length / ITEMS_PER_PAGE)
						? 'cursor-not-allowed opacity-60'
						: ''
						}`}
					onClick={handleNextPage}
					disabled={currentPage >= Math.ceil(sortedData().length / ITEMS_PER_PAGE)}
				>
					<ChevronRight className="h-4 w-4" />
				</button>
				<div className="flex flex-wrap items-center gap-2">
					<Link
						href="/hashlist?mediaType=movie"
						className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-content2/50 px-3 text-xs font-bold text-default-600 transition-all hover:bg-content3/50 hover:text-white"
					>
						<Film className="h-3.5 w-3.5" />
						{movieCount} Movies
					</Link>
					<Link
						href="/hashlist?mediaType=tv"
						className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-content2/50 px-3 text-xs font-bold text-default-600 transition-all hover:bg-content3/50 hover:text-white"
					>
						<Tv className="h-3.5 w-3.5" />
						{tvCount} TV Shows
					</Link>
					{mounted && (rdKey || adKey || tbKey) && (
						<button
							className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-bold transition-all ${showOnlyAvailable
								? 'bg-success/20 text-success'
								: 'bg-content2/50 text-default-600 hover:bg-content3/50'
								}`}
							onClick={() => {
								setShowOnlyAvailable(!showOnlyAvailable);
								setCurrentPage(1);
							}}
						>
							{showOnlyAvailable ? 'Show All' : 'Show Instant'}
						</button>
					)}

					<div className="h-4 w-px bg-white/10" />

					{mounted && rdKey && (
						<button
							className="inline-flex h-9 items-center justify-center rounded-lg bg-primary/20 px-4 text-xs font-bold text-primary transition-all hover:bg-primary/30 disabled:opacity-50"
							onClick={downloadNonDupeTorrentsInRd}
							disabled={filteredList.length === 0 || !rdKey}
						>
							RD Download ({filteredList.length})
						</button>
					)}
					{mounted && adKey && (
						<button
							className="inline-flex h-9 items-center justify-center rounded-lg bg-secondary/20 px-4 text-xs font-bold text-secondary transition-all hover:bg-secondary/30 disabled:opacity-50"
							onClick={downloadNonDupeTorrentsInAd}
							disabled={filteredList.length === 0 || !adKey}
						>
							AD Download ({filteredList.length})
						</button>
					)}
					{mounted && tbKey && (
						<button
							className="inline-flex h-9 items-center justify-center rounded-lg bg-purple-500/20 px-4 text-xs font-bold text-purple-400 transition-all hover:bg-purple-500/30 disabled:opacity-50"
							onClick={downloadNonDupeTorrentsInTb}
							disabled={filteredList.length === 0 || !tbKey}
						>
							TB Download ({filteredList.length})
						</button>
					)}

					{Object.keys(router.query).length !== 0 && (
						<Link
							href="/hashlist"
							className="inline-flex h-9 items-center justify-center rounded-lg bg-danger/20 px-4 text-xs font-bold text-danger transition-all hover:bg-danger/30"
						>
							Reset Filters
						</Link>
					)}

					{mounted && !rdKey && !adKey && !tbKey && (
						<span className="text-xs font-medium text-default-400">
							Login to RD/AD/TB to download
						</span>
					)}

					{mounted && (rdKey || adKey || tbKey) && (
						<span className="ml-auto text-xs font-medium text-default-400">
							<strong className="text-white">{userTorrentsList.length - filteredList.length}</strong> hidden
						</span>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-x-auto px-4 sm:px-6">
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-b border-white/5">
							<th
								className="group cursor-pointer py-4 text-left text-xs font-bold uppercase tracking-wider text-default-400"
								onClick={() => handleSort('title')}
							>
								<div className="flex items-center gap-2">
									Title
									<span className={`transition-opacity ${sortBy.column === 'title' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
										{sortBy.direction === 'asc' ? '↑' : '↓'}
									</span>
								</div>
							</th>
							<th
								className="group cursor-pointer py-4 text-left text-xs font-bold uppercase tracking-wider text-default-400"
								onClick={() => handleSort('bytes')}
							>
								<div className="flex items-center gap-2">
									Size
									<span className={`transition-opacity ${sortBy.column === 'bytes' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
										{sortBy.direction === 'asc' ? '↑' : '↓'}
									</span>
								</div>
							</th>
							<th className="py-4 text-right text-xs font-bold uppercase tracking-wider text-default-400">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-white/5">
						{currentPageData().map((t, i) => {
							const groupCount = getGroupings(t.mediaType)[t.filename];
							const filterText =
								groupCount > 1 && !router.query.filter
									? `${groupCount - 1} other file${groupCount === 1 ? '' : 's'}`
									: '';
							return (
								<tr key={i} className="group hover:bg-white/5 transition-colors">
									<td className="py-4 pr-4">
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-2">
												{t.mediaType === 'tv' ? (
													<Tv className="h-4 w-4 text-primary" />
												) : (
													<Film className="h-4 w-4 text-secondary" />
												)}
												<span className="text-sm font-bold text-white line-clamp-1">
													{t.title}
												</span>
												{filterText && (
													<Link
														href={`/library?filter=${encodeURIComponent(t.title)}`}
														className="inline-flex h-5 items-center rounded-md bg-success/20 px-1.5 text-[10px] font-bold text-success hover:bg-success/30"
													>
														{filterText}
													</Link>
												)}
												<Link
													href={`/search?query=${encodeURIComponent(((t.info.title + ' ' + (t.info.year || '')).trim() || t.title))}`}
													target="_blank"
													className="inline-flex h-5 items-center rounded-md bg-primary/20 px-1.5 text-[10px] font-bold text-primary hover:bg-primary/30"
												>
													Search
												</Link>
											</div>
											<span className="text-xs text-default-400 line-clamp-2">
												{t.filename}
											</span>
										</div>
									</td>
									<td className="py-4 pr-4 whitespace-nowrap">
										<span className="text-sm font-medium text-default-400">
											{(t.bytes / ONE_GIGABYTE).toFixed(1)} GB
										</span>
									</td>
									<td className="py-4 text-right">
										<div className="flex items-center justify-end gap-1.5">
											{mounted && rdKey && (
												<>
													{isDownloading('rd', t.hash) ? (
														<button
															className="inline-flex h-8 items-center justify-center rounded-lg bg-danger/20 px-3 text-[10px] font-bold text-danger transition-all hover:bg-danger/30"
															onClick={() => deleteRd(t.hash)}
														>
															RD {hashAndProgress[`rd:${t.hash}`] || 0}%
														</button>
													) : notInLibrary('rd', t.hash) ? (
														<button
															className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-[10px] font-bold transition-all ${t.rdAvailable
																? 'bg-success/20 text-success hover:bg-success/30'
																: 'bg-primary/20 text-primary hover:bg-primary/30'
																}`}
															onClick={() => addRd(t.hash)}
														>
															<Download className="mr-1.5 h-3 w-3" />
															RD
														</button>
													) : (
														<span className="inline-flex h-8 items-center rounded-lg bg-success/10 px-3 text-[10px] font-bold text-success/50">
															IN LIBRARY
														</span>
													)}
												</>
											)}

											{mounted && adKey && (
												<>
													{isDownloading('ad', t.hash) ? (
														<button
															className="inline-flex h-8 items-center justify-center rounded-lg bg-danger/20 px-3 text-[10px] font-bold text-danger transition-all hover:bg-danger/30"
															onClick={() => deleteAd(t.hash)}
														>
															AD {hashAndProgress[`ad:${t.hash}`]}%
														</button>
													) : notInLibrary('ad', t.hash) ? (
														<button
															className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-[10px] font-bold transition-all ${t.adAvailable
																? 'bg-success/20 text-success hover:bg-success/30'
																: 'bg-secondary/20 text-secondary hover:bg-secondary/30'
																}`}
															onClick={() => addAd(t.hash)}
														>
															<Download className="mr-1.5 h-3 w-3" />
															AD
														</button>
													) : (
														<span className="inline-flex h-8 items-center rounded-lg bg-success/10 px-3 text-[10px] font-bold text-success/50">
															IN LIBRARY
														</span>
													)}
												</>
											)}

											{mounted && tbKey && (
												<>
													{isDownloading('tb', t.hash) ? (
														<button
															className="inline-flex h-8 items-center justify-center rounded-lg bg-danger/20 px-3 text-[10px] font-bold text-danger transition-all hover:bg-danger/30"
															onClick={() => deleteTb(t.hash)}
														>
															TB {hashAndProgress[`tb:${t.hash}`] || 0}%
														</button>
													) : notInLibrary('tb', t.hash) ? (
														<button
															className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-[10px] font-bold transition-all ${t.tbAvailable
																? 'bg-success/20 text-success hover:bg-success/30'
																: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
																}`}
															onClick={() => addTb(t.hash)}
														>
															<Download className="mr-1.5 h-3 w-3" />
															TB
														</button>
													) : (
														<span className="inline-flex h-8 items-center rounded-lg bg-success/10 px-3 text-[10px] font-bold text-success/50">
															IN LIBRARY
														</span>
													)}
												</>
											)}
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div className="sticky bottom-0 z-50 mt-auto border-t border-white/5 bg-black/80 p-4 backdrop-blur-xl">
				<div className="mx-auto flex max-w-xl items-center justify-between gap-4">
					<button
						className="flex h-10 w-10 items-center justify-center rounded-xl bg-content2/50 text-default-400 transition-all hover:bg-content3/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
						onClick={handlePrevPage}
						disabled={currentPage === 1}
					>
						<ChevronLeft className="h-6 w-6" />
					</button>
					<div className="flex flex-col items-center">
						<span className="text-sm font-bold text-white">
							Page {currentPage} of {Math.max(1, Math.ceil(sortedData().length / ITEMS_PER_PAGE))}
						</span>
						<span className="text-[10px] font-medium text-default-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5">
							{filteredList.length} Torrents Shown
						</span>
					</div>
					<button
						className="flex h-10 w-10 items-center justify-center rounded-xl bg-content2/50 text-default-400 transition-all hover:bg-content3/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
						onClick={handleNextPage}
						disabled={currentPage >= Math.ceil(sortedData().length / ITEMS_PER_PAGE)}
					>
						<ChevronRight className="h-6 w-6" />
					</button>
				</div>
			</div>
		</div>
	);
}

export default HashlistPage;
