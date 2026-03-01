import MediaHeader from '@/components/MediaHeader';
import SearchTokens from '@/components/SearchTokens';
import TvSearchResults from '@/components/TvSearchResults';
import { showInfoForRD } from '@/components/showInfo';
import { useLibraryCache } from '@/contexts/LibraryCacheContext';
import { useAllDebridApiKey, useRealDebridAccessToken, useTorBoxAccessToken } from '@/hooks/auth';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { useExternalSources } from '@/hooks/useExternalSources';
import { useMassReport } from '@/hooks/useMassReport';
import { useTorrentManagement } from '@/hooks/useTorrentManagement';
import { SearchApiResponse, SearchResult } from '@/services/mediasearch';
import { TorrentInfoResponse } from '@/services/types';
import UserTorrentDB from '@/torrent/db';
import { handleCastTvShowAllDebrid } from '@/utils/allDebridCastApiClient';
import axiosWithRetry from '@/utils/axiosWithRetry';
import { getLocalStorageBoolean, getLocalStorageItemOrDefault } from '@/utils/browserStorage';
import { handleCastTvShow } from '@/utils/castApiClient';
import { handleCopyOrDownloadMagnet } from '@/utils/copyMagnet';
import {
	getColorScale,
	getExpectedEpisodeCount,
	getQueryForEpisodeCount,
} from '@/utils/episodeUtils';
import {
	checkDatabaseAvailabilityAd,
	checkDatabaseAvailabilityRd,
	checkDatabaseAvailabilityTb,
} from '@/utils/instantChecks';
import { quickSearch } from '@/utils/quickSearch';
import { sortByMedian } from '@/utils/results';
import { isVideo } from '@/utils/selectable';
import {
	defaultEpisodeSize,
	defaultTorrentsFilter as defaultFilterSetting,
	defaultPlayer,
} from '@/utils/settings';
import { castToastOptions, searchToastOptions } from '@/utils/toastOptions';
import { generateTokenAndHash } from '@/utils/token';
import { handleCastTvShowTorBox } from '@/utils/torboxCastApiClient';
import { getMultipleTrackerStats } from '@/utils/trackerStats';
import { withAuth } from '@/utils/withAuth';
import { AxiosError } from 'axios';
import { CloudOff, Loader2, RotateCcw, Search, Sparkles, Tv, Zap } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FunctionComponent, useEffect, useMemo, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

type ShowInfo = {
	title: string;
	description: string;
	poster: string;
	backdrop: string;
	season_count: number;
	season_names: string[];
	has_specials: boolean;
	imdb_score: number;
	season_episode_counts: Record<number, number>;
	trailer: string;
};

const torrentDB = new UserTorrentDB();

const TvSearch: FunctionComponent = () => {
	const isMounted = useRef(true);
	const hasLoadedTrackerStats = useRef(false);
	const player = getLocalStorageItemOrDefault('settings:player', defaultPlayer);
	const episodeMaxSize = getLocalStorageItemOrDefault(
		'settings:episodeMaxSize',
		defaultEpisodeSize
	);
	const onlyTrustedTorrents = getLocalStorageBoolean('settings:onlyTrustedTorrents', false);
	const storedTorrentsFilter = useMemo(
		() => getLocalStorageItemOrDefault('settings:defaultTorrentsFilter', defaultFilterSetting),
		[]
	);

	const [showInfo, setShowInfo] = useState<ShowInfo | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [searchState, setSearchState] = useState<string>('loading');
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [errorMessage, setErrorMessage] = useState('');
	const [query, setQuery] = useState(storedTorrentsFilter);
	const [descLimit, setDescLimit] = useState(100);
	const [rdKey] = useRealDebridAccessToken();
	const adKey = useAllDebridApiKey();
	const torboxKey = useTorBoxAccessToken();

	// Library sync status - used to prevent auto-availability check while library is still loading
	const { isFetching: isLibrarySyncing } = useLibraryCache();

	const [onlyShowCached, setOnlyShowCached] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState(0);
	const [hasMoreResults, setHasMoreResults] = useState(true);
	const [searchCompleteInfo, setSearchCompleteInfo] = useState<{
		finalResults: number;
		totalAvailableCount: number;
		rdAvailableCount?: number;
		adAvailableCount?: number;
		tbAvailableCount?: number;
		allSourcesCompleted: boolean;
		pendingAvailabilityChecks: number;
		isAvailabilityOnly?: boolean;
	} | null>(null);
	const [shouldDownloadMagnets] = useState(
		() =>
			typeof window !== 'undefined' &&
			window.localStorage.getItem('settings:downloadMagnets') === 'true'
	);
	const [showMassReportButtons] = useState(
		() =>
			typeof window !== 'undefined' &&
			window.localStorage.getItem('settings:showMassReportButtons') === 'true'
	);

	const router = useRouter();
	const { imdbid, seasonNum } = router.query;

	// Use shared hooks
	const {
		hashAndProgress,
		fetchHashAndProgress,
		addRd,
		addAd,
		addTb,
		deleteRd,
		deleteAd,
		deleteTb,
	} = useTorrentManagement(
		rdKey,
		adKey,
		torboxKey,
		imdbid as string,
		searchResults,
		setSearchResults
	);

	const { fetchEpisodeFromExternalSource, getEnabledSources } = useExternalSources(rdKey);

	const { isCheckingAvailability, checkServiceAvailability, checkServiceAvailabilityBulk } =
		useAvailabilityCheck(
			rdKey,
			adKey,
			torboxKey,
			imdbid as string,
			searchResults,
			setSearchResults,
			hashAndProgress,
			addRd,
			addAd,
			addTb,
			deleteRd,
			deleteAd,
			deleteTb,
			sortByMedian
		);

	const { handleMassReport } = useMassReport(rdKey, adKey, torboxKey, imdbid as string);

	const expectedEpisodeCount = useMemo(
		() =>
			getExpectedEpisodeCount(
				seasonNum as string | undefined,
				showInfo?.season_episode_counts || {}
			),
		[seasonNum, showInfo]
	);

	useEffect(() => {
		if (!imdbid || !seasonNum) return;

		const fetchShowInfo = async () => {
			try {
				const response = await axiosWithRetry.get(`/api/info/show?imdbid=${imdbid}`);
				setShowInfo(response.data);

				const requestedSeason = parseInt(seasonNum as string);
				if (
					requestedSeason > response.data.season_count ||
					(requestedSeason === 0 && !response.data.has_specials) ||
					requestedSeason < 0
				) {
					router.push(`/show/${imdbid}/1`);
				}
			} catch (error) {
				console.error('Error fetching show info:', error);
				setErrorMessage('Failed to fetch show information');
			} finally {
				setIsLoading(false);
			}
		};

		fetchShowInfo();
	}, [imdbid, seasonNum, router]);

	useEffect(() => {
		if (!imdbid || !seasonNum || isLoading) return;

		// Clear previous results and query input when season changes
		setSearchResults([]);
		setQuery(storedTorrentsFilter);

		const initializeData = async () => {
			await torrentDB.initializeDB();
			await Promise.all([
				fetchData(imdbid as string, parseInt(seasonNum as string), 0),
				fetchHashAndProgress(),
			]);
		};

		initializeData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [imdbid, seasonNum, isLoading, storedTorrentsFilter]);

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	async function fetchData(imdbId: string, seasonNum: number, page: number = 0) {
		const [tokenWithTimestamp, tokenHash] = await generateTokenAndHash();
		if (page === 0) {
			setSearchResults([]);
		}
		setErrorMessage('');
		setSearchState('loading');

		// Track completion
		let completedSources = 0;
		let totalSources = 1; // Start with 1 for DMM
		let rdAvailableCount = 0;
		let adAvailableCount = 0;
		let tbAvailableCount = 0;
		let externalSourcesActive = 0;
		let pendingAvailabilityChecks = 0;
		let allSourcesCompleted = false;
		let finalResultCount = 0;
		let toastShown = false;

		// Helper to check if everything is done and show toast only once
		const checkAndShowFinalToast = () => {
			if (toastShown) return;
			if (!allSourcesCompleted || pendingAvailabilityChecks > 0) return;

			toastShown = true;
			setSearchCompleteInfo({
				finalResults: finalResultCount,
				totalAvailableCount: rdAvailableCount + adAvailableCount + tbAvailableCount,
				rdAvailableCount,
				adAvailableCount,
				tbAvailableCount,
				allSourcesCompleted: true,
				pendingAvailabilityChecks: 0,
			});
		};

		// Helper to process results from any source
		const processSourceResults = async (sourceResults: SearchResult[], sourceName: string) => {
			if (!isMounted.current) return;

			// Deduplicate and update results
			setSearchResults((prevResults) => {
				const existingHashes = new Set(prevResults.map((r) => r.hash));
				const newUniqueResults = sourceResults.filter(
					(r) => r.hash && !existingHashes.has(r.hash)
				);

				if (newUniqueResults.length === 0) {
					completedSources++;
					// Check if all done
					if (completedSources === totalSources) {
						allSourcesCompleted = true;
						finalResultCount = prevResults.length;
						setSearchState('loaded');
						checkAndShowFinalToast();
					}
					return prevResults;
				}

				// Merge and sort
				const merged = [...prevResults, ...newUniqueResults];
				const sorted = merged.sort((a, b) => {
					const aAvailable = a.rdAvailable || a.adAvailable;
					const bAvailable = b.rdAvailable || b.adAvailable;
					if (aAvailable !== bAvailable) {
						return aAvailable ? -1 : 1;
					}
					// Second priority: file size (largest first)
					if (a.fileSize !== b.fileSize) {
						return b.fileSize - a.fileSize;
					}
					// Third priority: hash (alphabetically)
					return a.hash.localeCompare(b.hash);
				});

				// Check availability for new non-cached results
				const nonCachedNew = newUniqueResults.filter(
					(r) => !r.rdAvailable && !r.adAvailable && !r.tbAvailable
				);

				// Always increment the completed sources counter synchronously
				completedSources++;

				if (nonCachedNew.length > 0) {
					const hashArr = nonCachedNew.map((r) => r.hash);

					// Check RD database for cached availability
					if (rdKey) {
						// Track pending availability check
						pendingAvailabilityChecks++;

						// Start async RD database check
						(async () => {
							const [tokenWithTimestamp, tokenHash] = await generateTokenAndHash();
							const count = await checkDatabaseAvailabilityRd(
								tokenWithTimestamp,
								tokenHash,
								imdbId,
								hashArr,
								setSearchResults,
								sortByMedian
							);
							// Update the count
							rdAvailableCount += count;

							// Decrement pending checks
							pendingAvailabilityChecks--;
							checkAndShowFinalToast();
						})();
					}

					// Check AllDebrid database for cached availability
					if (adKey) {
						// Track pending availability check
						pendingAvailabilityChecks++;

						// Start async AllDebrid database check
						(async () => {
							const [tokenWithTimestamp, tokenHash] = await generateTokenAndHash();
							const count = await checkDatabaseAvailabilityAd(
								tokenWithTimestamp,
								tokenHash,
								imdbId,
								hashArr,
								setSearchResults,
								sortByMedian
							);
							// Update the count
							adAvailableCount += count;

							// Decrement pending checks
							pendingAvailabilityChecks--;
							checkAndShowFinalToast();
						})();
					}

					// Check TorBox database for cached availability
					if (torboxKey) {
						// Track pending availability check
						pendingAvailabilityChecks++;

						// Start async TorBox database check
						(async () => {
							const count = await checkDatabaseAvailabilityTb(
								torboxKey,
								hashArr,
								setSearchResults,
								sortByMedian
							);
							// Update the count
							tbAvailableCount += count;

							// Decrement pending checks
							pendingAvailabilityChecks--;
							checkAndShowFinalToast();
						})();
					}
				}

				// Check if all sources completed
				if (completedSources === totalSources) {
					allSourcesCompleted = true;
					finalResultCount = sorted.length;
					setSearchState('loaded');
					checkAndShowFinalToast();
				}

				return sorted;
			});
		};

		try {
			// Start DMM fetch
			const dmmPromise = axiosWithRetry.get<SearchApiResponse>(
				`/api/torrents/tv?imdbId=${imdbId}&seasonNum=${seasonNum}&dmmProblemKey=${tokenWithTimestamp}&solution=${tokenHash}&onlyTrusted=${onlyTrustedTorrents}&maxSize=${episodeMaxSize}&page=${page}`
			);

			// Start external sources if first page
			if (page === 0) {
				const episodeCount = expectedEpisodeCount || 10;

				// Count external sources
				const enabledSources = getEnabledSources();
				totalSources += enabledSources.length;
				externalSourcesActive = enabledSources.length;

				// Start external fetches
				if (externalSourcesActive > 0) {
					// Process each source in parallel
					enabledSources.forEach(async (source) => {
						try {
							let episodeNum = 1;
							let consecutiveEmpty = 0;

							// Keep fetching episodes, 2 at a time
							while (episodeNum <= episodeCount + 10) {
								// Allow some buffer beyond expected
								const batch = [episodeNum, episodeNum + 1];
								const batchPromises = batch.map((ep) =>
									fetchEpisodeFromExternalSource(imdbId, seasonNum, ep, source)
								);

								const batchResults = await Promise.all(batchPromises);

								// Process each episode's results immediately
								let allEmpty = true;
								for (let i = 0; i < batchResults.length; i++) {
									const episodeResults = batchResults[i];
									if (episodeResults.length > 0) {
										allEmpty = false;
										// Send results immediately for progressive display
										processSourceResults(episodeResults, source);
									}
								}

								if (allEmpty) {
									consecutiveEmpty++;
									// Stop if we get 2 consecutive empty batches (4 episodes)
									if (consecutiveEmpty >= 2) {
										break;
									}
								} else {
									consecutiveEmpty = 0;
								}

								episodeNum += 2;

								// Add a small delay to avoid hammering the API
								await new Promise((resolve) => setTimeout(resolve, 100));
							}
						} catch (error) {
							console.error(`Error fetching ${source}:`, error);
						} finally {
							// Source completed
							completedSources++;
							if (completedSources === totalSources) {
								allSourcesCompleted = true;
								setSearchState('loaded');
								setSearchResults((prevResults) => {
									finalResultCount = prevResults.length;
									checkAndShowFinalToast();
									return prevResults;
								});
							}
						}
					});
				}
			}

			// Process DMM results
			const response = await dmmPromise;

			if (response.status !== 200) {
				setSearchState(response.headers.status ?? 'loaded');
				return;
			}

			const dmmResults = response.data.results || [];
			setHasMoreResults(dmmResults.length > 0);

			// Always process DMM results through processSourceResults for consistency
			const formattedResults = dmmResults.map((r) => ({
				...r,
				rdAvailable: false,
				adAvailable: false,
				tbAvailable: false,
				noVideos: false,
				files: r.files || [],
			}));
			await processSourceResults(formattedResults, 'DMM');
		} catch (error) {
			console.error(
				'Error fetching torrents:',
				error instanceof Error ? error.message : 'Unknown error'
			);
			if ((error as AxiosError).response?.status === 403) {
				setErrorMessage(
					'Please check the time in your device. If it is correct, please try again.'
				);
			} else {
				setErrorMessage(
					'There was an error searching for the query. Please try again later.'
				);
				setHasMoreResults(false);
			}
			setSearchState('loaded');
		}
	}

	// Derive filtered results and uncached count using useMemo to prevent setState during render
	const filteredResults = useMemo(() => {
		if (searchResults.length === 0) {
			return [];
		}
		return quickSearch(query, searchResults);
	}, [query, searchResults]);

	const totalUncachedCount = useMemo(() => {
		return filteredResults.filter((r) => !r.rdAvailable && !r.adAvailable && !r.tbAvailable)
			.length;
	}, [filteredResults]);

	// Handle toast notifications when search completes
	useEffect(() => {
		if (!searchCompleteInfo) return;

		const {
			finalResults,
			totalAvailableCount,
			rdAvailableCount,
			adAvailableCount,
			tbAvailableCount,
			allSourcesCompleted,
			pendingAvailabilityChecks,
			isAvailabilityOnly,
		} = searchCompleteInfo;

		// Show search results toast (only if this is not an availability-only update)
		if (!isAvailabilityOnly) {
			if (finalResults === 0) {
				toast('No torrents found', searchToastOptions);
			} else {
				toast(`${finalResults} unique torrents found`, searchToastOptions);
			}
		}

		// Show availability toast and/or auto-trigger availability check per service
		if (allSourcesCompleted && pendingAvailabilityChecks === 0) {
			// Build service-specific availability message
			const servicesWithCache = [];
			if (rdKey && (rdAvailableCount ?? 0) > 0)
				servicesWithCache.push(`RD: ${rdAvailableCount}`);
			if (adKey && (adAvailableCount ?? 0) > 0)
				servicesWithCache.push(`AD: ${adAvailableCount}`);
			if (torboxKey && (tbAvailableCount ?? 0) > 0)
				servicesWithCache.push(`TB: ${tbAvailableCount}`);

			// Show toast for cached torrents if any found
			if (totalAvailableCount > 0) {
				const message =
					servicesWithCache.length > 0
						? `${totalAvailableCount} cached (${servicesWithCache.join(', ')})`
						: `${totalAvailableCount} cached torrents available`;
				toast(message, searchToastOptions);
			}
		}

		// Clear the info after handling
		setSearchCompleteInfo(null);
	}, [
		searchCompleteInfo,
		rdKey,
		adKey,
		torboxKey,
		isCheckingAvailability,
		isLibrarySyncing,
		checkServiceAvailabilityBulk,
		filteredResults,
		imdbid,
		seasonNum,
	]);

	// Load cached tracker stats from database for uncached torrents
	useEffect(() => {
		async function loadCachedTrackerStats() {
			// Find uncached results that don't have tracker stats yet
			const uncachedResults = searchResults.filter(
				(r) => !r.rdAvailable && !r.adAvailable && !r.tbAvailable && !r.trackerStats
			);

			if (uncachedResults.length === 0) {
				return;
			}

			try {
				// Bulk fetch existing tracker stats from database (no new scraping)
				const hashes = uncachedResults.map((r) => r.hash);
				const trackerStatsArray = await getMultipleTrackerStats(hashes);

				if (!isMounted.current) return;

				// Update search results with cached tracker stats
				if (trackerStatsArray.length > 0) {
					setSearchResults((prev) => {
						return prev.map((r) => {
							const stats = trackerStatsArray.find((s) => s.hash === r.hash);
							if (stats) {
								return {
									...r,
									trackerStats: {
										seeders: stats.seeders,
										leechers: stats.leechers,
										downloads: stats.downloads,
										hasActivity:
											stats.seeders >= 1 &&
											stats.leechers + stats.downloads >= 1,
									},
								};
							}
							return r;
						});
					});
				}
				// Mark that we've loaded tracker stats
				hasLoadedTrackerStats.current = true;
			} catch (error) {
				console.error('Error loading cached tracker stats:', error);
			}
		}

		// Only run once when search is loaded and we haven't loaded stats yet
		if (
			searchState === 'loaded' &&
			searchResults.length > 0 &&
			!hasLoadedTrackerStats.current
		) {
			loadCachedTrackerStats();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchState]); // Depend on searchState only

	// Reset the tracker stats flag when season changes
	useEffect(() => {
		hasLoadedTrackerStats.current = false;
	}, [imdbid, seasonNum]);

	const handleShowInfo = (result: SearchResult) => {
		let files = result.files
			.filter((file) => isVideo({ path: file.filename }))
			.map((file) => ({
				id: file.fileId,
				path: file.filename,
				bytes: file.filesize,
				selected: 1,
			}));
		const info = {
			id: '',
			filename: result.title,
			original_filename: result.title,
			hash: result.hash,
			bytes: result.fileSize * 1024 * 1024,
			original_bytes: result.fileSize,
			progress: 100,
			files,
			links: [],
			fake: true,
			host: '',
			split: 0,
			status: 'downloaded',
			added: '',
			ended: '',
			speed: 0,
			seeders: 0,
		} as TorrentInfoResponse;
		rdKey && showInfoForRD(player, rdKey!, info, imdbid as string, 'tv', shouldDownloadMagnets);
	};

	async function handleCast(hash: string, fileIds: string[]) {
		await toast.promise(
			handleCastTvShow(imdbid as string, rdKey!, hash, fileIds),
			{
				loading: `Casting ${fileIds.length} episodes...`,
				success: 'Casting succeeded.',
				error: 'Casting failed.',
			},
			castToastOptions
		);
		// open stremio after casting
		window.open(`stremio://detail/series/${imdbid}/${imdbid}:${seasonNum}:1`);
	}

	async function handleCastTorBox(hash: string, fileIds: string[]) {
		await toast.promise(
			handleCastTvShowTorBox(imdbid as string, torboxKey!, hash, fileIds),
			{
				loading: `Casting ${fileIds.length} episodes (TorBox)...`,
				success: 'Casting succeeded.',
				error: 'Casting failed.',
			},
			castToastOptions
		);
		// open stremio after casting
		window.open(`stremio://detail/series/${imdbid}/${imdbid}:${seasonNum}:1`);
	}

	async function handleCastAllDebrid(hash: string, fileIds: string[]) {
		await toast.promise(
			handleCastTvShowAllDebrid(imdbid as string, adKey!, hash, fileIds),
			{
				loading: `Casting ${fileIds.length} episodes (AllDebrid)...`,
				success: 'Casting succeeded.',
				error: 'Casting failed.',
			},
			castToastOptions
		);
		// open stremio after casting
		window.open(`stremio://detail/series/${imdbid}/${imdbid}:${seasonNum}:1`);
	}

	// Helper function to find the first complete season torrent
	const getFirstCompleteSeasonTorrent = () => {
		// Find torrents that have all or most episodes for the season
		// A complete season typically has videoCount close to expectedEpisodeCount
		return filteredResults.find((result) => {
			// Must be available in RD
			if (!result.rdAvailable) return false;

			// Check if it has enough videos for a complete season
			// Allow some flexibility (e.g., season might have 22 episodes but torrent has 20-24)
			const minEpisodes = Math.max(1, expectedEpisodeCount - 2);
			const maxEpisodes = expectedEpisodeCount + 2;

			return result.videoCount >= minEpisodes && result.videoCount <= maxEpisodes;
		});
	};

	// Helper function to find individual episode torrents
	const getIndividualEpisodeTorrents = () => {
		// Find torrents that are individual episodes (videoCount === 1)
		return filteredResults.filter((result) => {
			// Must be available in RD
			if (!result.rdAvailable) return false;

			// Individual episodes typically have exactly 1 video file
			return result.videoCount === 1;
		});
	};

	async function handleInstantRdWholeSeason() {
		const completeSeasonTorrent = getFirstCompleteSeasonTorrent();
		if (!completeSeasonTorrent) {
			toast.error('No complete season torrents found.');
			return;
		}

		// Check if torrent is already in library
		if (`rd:${completeSeasonTorrent.hash}` in hashAndProgress) {
			toast.success('Season already in your Real-Debrid library.');
			return;
		}

		addRd(completeSeasonTorrent.hash);
	}

	async function handleInstantRdEveryEpisode() {
		const individualEpisodes = getIndividualEpisodeTorrents();
		if (individualEpisodes.length === 0) {
			toast.error('No individual episode torrents found.');
			return;
		}

		// Extract episode numbers from torrents
		const episodesWithNumbers = individualEpisodes.map((ep) => {
			// Try to extract episode number from title or filename
			let episodeNum = 0;
			const title = ep.title.toLowerCase();

			// Common patterns: S##E##, ##x##, E##, Episode ##
			const patterns = [
				/s\d+e(\d+)/i, // S01E05
				/\d+x(\d+)/i, // 1x05
				/episode\s*(\d+)/i, // Episode 5
				/ep\s*(\d+)/i, // Ep 5
				/e(\d+)/i, // E05
				/\s(\d{1,2})\s/, // isolated numbers
			];

			for (const pattern of patterns) {
				const match = title.match(pattern);
				if (match && match[1]) {
					episodeNum = parseInt(match[1]);
					break;
				}
			}

			// If still no match, check first file in torrent
			if (episodeNum === 0 && ep.files && ep.files.length > 0) {
				const filename = ep.files[0].filename.toLowerCase();
				for (const pattern of patterns) {
					const match = filename.match(pattern);
					if (match && match[1]) {
						episodeNum = parseInt(match[1]);
						break;
					}
				}
			}

			return { ...ep, episodeNum };
		});

		// Sort by episode number (0 will go to the end)
		episodesWithNumbers.sort((a, b) => {
			if (a.episodeNum === 0) return 1;
			if (b.episodeNum === 0) return -1;
			return a.episodeNum - b.episodeNum;
		});

		// Create a map for quick episode lookup
		const episodeMap = new Map<number, (typeof episodesWithNumbers)[0]>();
		episodesWithNumbers.forEach((ep) => {
			if (ep.episodeNum > 0 && !episodeMap.has(ep.episodeNum)) {
				episodeMap.set(ep.episodeNum, ep);
			}
		});

		// Determine the range of episodes to add
		const maxEpisode = Math.max(expectedEpisodeCount, ...Array.from(episodeMap.keys()));

		const toastId = toast.loading(`Checking episodes 1-${maxEpisode}...`);

		let addedCount = 0;
		let skippedCount = 0;
		let notFoundCount = 0;
		const notFoundEpisodes: number[] = [];

		try {
			// Process episodes sequentially from 1 to max
			for (let epNum = 1; epNum <= maxEpisode; epNum++) {
				const episode = episodeMap.get(epNum);

				if (!episode) {
					notFoundCount++;
					notFoundEpisodes.push(epNum);
					toast.error(`Episode ${epNum}: Not found`, { duration: 2000 });
					continue;
				}

				// Check if already in library
				if (`rd:${episode.hash}` in hashAndProgress) {
					skippedCount++;
					toast(`Episode ${epNum}: Already in library`, { duration: 2000 });
					continue;
				}

				// Update progress toast
				toast.loading(
					`Adding Episode ${epNum} (${addedCount} added, ${skippedCount} skipped, ${notFoundCount} missing)...`,
					{ id: toastId }
				);

				// Add to RD
				await addRd(episode.hash);
				addedCount++;
				toast.success(`Episode ${epNum}: Added`, { duration: 2000 });
			}

			// Final summary
			toast.dismiss(toastId);

			const summaryParts = [];
			if (addedCount > 0) summaryParts.push(`${addedCount} added`);
			if (skippedCount > 0) summaryParts.push(`${skippedCount} already in library`);
			if (notFoundCount > 0) {
				summaryParts.push(`${notFoundCount} not found`);
				if (notFoundEpisodes.length <= 5) {
					summaryParts.push(`(Episodes ${notFoundEpisodes.join(', ')})`);
				}
			}

			const summaryMessage = `Episodes 1-${maxEpisode}: ${summaryParts.join(', ')}`;

			if (notFoundCount === 0) {
				toast.success(summaryMessage, { duration: 5000 });
			} else if (addedCount > 0) {
				toast.success(summaryMessage, { duration: 5000 });
			} else {
				toast.error(summaryMessage, { duration: 5000 });
			}
		} catch (error) {
			toast.error('Failed to add some episodes.', { id: toastId });
			console.error('Error adding episodes:', error);
		}
	}

	if (isLoading) {
		return <div className="min-h-screen max-w-full bg-mesh bg-noise flex items-center justify-center text-foreground">Loading...</div>;
	}

	if (!showInfo) {
		return (
			<div className="min-h-screen max-w-full bg-mesh bg-noise flex items-center justify-center text-foreground">
				No show information available
			</div>
		);
	}

	const imdbId = (Array.isArray(imdbid) ? imdbid[0] : imdbid) ?? '';
	const seasonId = (Array.isArray(seasonNum) ? seasonNum[0] : seasonNum) ?? '1';
	const selectedSeason = Number.parseInt(seasonId, 10);

	const seasonNavigation = (
		<div className="flex items-center gap-2 overflow-x-auto pb-2" data-testid="media-header-season-nav">
			{showInfo.has_specials && (
				<Link
					href={`/show/${imdbId}/0`}
					className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all backdrop-blur-sm ${selectedSeason === 0
						? 'border-primary/50 bg-primary/20 text-primary shadow-sm'
						: 'border-divider bg-content1/40 text-default-500 hover:bg-content2 hover:text-foreground'
						}`}
				>
					<Tv className="mr-1.5 h-3.5 w-3.5" />
					Specials
				</Link>
			)}
			{Array.from({ length: showInfo.season_count }, (_, i) => showInfo.season_count - i).map(
				(season, idx) => (
					<Link
						key={idx}
						href={`/show/${imdbId}/${season}`}
						className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all backdrop-blur-sm ${selectedSeason === season
							? 'border-primary/50 bg-primary/20 text-primary shadow-sm'
							: 'border-divider bg-content1/40 text-default-500 hover:bg-content2 hover:text-foreground'
							}`}
					>
						<Tv className="mr-1.5 h-3.5 w-3.5" />
						{showInfo.season_names && showInfo.season_names[season - 1]
							? showInfo.season_names[season - 1]
							: `Season ${season}`}
					</Link>
				)
			)}
		</div>
	);

	const headerActionButtons = (
		<div className="flex flex-wrap gap-2 mb-4" data-testid="media-header-actions">
			{(rdKey || adKey || torboxKey) && (
				<>
					{rdKey && (
						<button
							className="inline-flex items-center justify-center rounded-md border border-warning/20 bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning transition-all hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm"
							onClick={() => checkServiceAvailabilityBulk(filteredResults, ['RD'])}
							disabled={isCheckingAvailability}
						>
							{isCheckingAvailability ? (
								<>
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									Checking RD...
								</>
							) : (
								<>
									<Search className="mr-1.5 h-3.5 w-3.5" />
									Check RD
								</>
							)}
						</button>
					)}
					{adKey && (
						<button
							className="inline-flex items-center justify-center rounded-md border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-3 py-1.5 text-xs font-semibold text-[#F59E0B] transition-all hover:bg-[#F59E0B]/20 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm"
							onClick={() => checkServiceAvailabilityBulk(filteredResults, ['AD'])}
							disabled={isCheckingAvailability}
						>
							{isCheckingAvailability ? (
								<>
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									Checking AD...
								</>
							) : (
								<>
									<Search className="mr-1.5 h-3.5 w-3.5" />
									Check AD
								</>
							)}
						</button>
					)}
					{torboxKey && (
						<button
							className="inline-flex items-center justify-center rounded-md border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-3 py-1.5 text-xs font-semibold text-[#22D3EE] transition-all hover:bg-[#22D3EE]/20 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm"
							onClick={() => checkServiceAvailabilityBulk(filteredResults, ['TB'])}
							disabled={isCheckingAvailability}
						>
							{isCheckingAvailability ? (
								<>
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									Checking TB...
								</>
							) : (
								<>
									<Search className="mr-1.5 h-3.5 w-3.5" />
									Check TB
								</>
							)}
						</button>
					)}
					{getFirstCompleteSeasonTorrent() && (
						<button
							className="inline-flex items-center justify-center rounded-md border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition-all hover:bg-success/20 backdrop-blur-sm mx-1"
							onClick={handleInstantRdWholeSeason}
						>
							<Zap className="mr-1.5 h-3.5 w-3.5" />
							Instant RD (Whole Season)
						</button>
					)}
					{getIndividualEpisodeTorrents().length > 0 && (
						<button
							className="inline-flex items-center justify-center rounded-md border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition-all hover:bg-success/20 backdrop-blur-sm mx-1"
							onClick={handleInstantRdEveryEpisode}
						>
							<Zap className="mr-1.5 h-3.5 w-3.5" />
							Instant RD (Every Episode)
						</button>
					)}
					<button
						className="inline-flex items-center justify-center rounded-md border border-[#A855F7]/20 bg-[#A855F7]/10 px-3 py-1.5 text-xs font-semibold text-[#A855F7] transition-all hover:bg-[#A855F7]/20 backdrop-blur-sm"
						onClick={() =>
							window.open(`stremio://detail/series/${imdbId}/${imdbId}:${seasonId}:1`)
						}
					>
						<Sparkles className="mr-1.5 h-3.5 w-3.5" />
						Stremio
					</button>
				</>
			)}
			{onlyShowCached && totalUncachedCount > 0 && (
				<button
					className="inline-flex items-center justify-center rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20 backdrop-blur-sm"
					onClick={() => {
						setOnlyShowCached(false);
					}}
				>
					<CloudOff className="mr-1.5 h-3.5 w-3.5" />
					Show {totalUncachedCount} uncached
				</button>
			)}
		</div>
	);

	return (
		<div className="min-h-screen max-w-full bg-mesh bg-noise text-foreground pb-20">
			<Head>
				<title>DMM — TV Show — {showInfo.title} (Season {seasonNum})</title>
			</Head>
			<Toaster position="bottom-right" toastOptions={{
				style: { background: '#18181B', color: '#FAFAFA', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }
			}} />

			<MediaHeader
				mediaType="tv"
				imdbId={imdbId}
				title={showInfo.title}
				seasonNum={seasonId}
				description={showInfo.description}
				poster={showInfo.poster}
				backdrop={showInfo.backdrop}
				imdbScore={showInfo.imdb_score}
				descLimit={descLimit}
				onDescToggle={() => setDescLimit(0)}
				actionButtons={headerActionButtons}
				additionalInfo={seasonNavigation}
				trailer={showInfo.trailer}
			/>

			{searchState === 'loading' && (
				<div className="flex items-center justify-center bg-black">Loading...</div>
			)}
			{searchState === 'requested' && (
				<div className="relative mt-4 rounded border border-yellow-400 bg-yellow-500 px-4 py-3 text-yellow-900">
					<strong className="font-bold">Notice:</strong>
					<span className="block sm:inline">
						{' '}
						The request has been received. This might take at least 5 minutes.
					</span>
				</div>
			)}
			{searchState === 'processing' && (
				<div className="relative mt-4 rounded border border-blue-400 bg-blue-700 px-4 py-3 text-blue-100">
					<strong className="font-bold">Notice:</strong>
					<span className="block sm:inline">
						{' '}
						Looking for torrents in the dark web. Please wait for 1-2 minutes.
					</span>
				</div>
			)}
			{errorMessage && (
				<div className="relative mt-4 rounded border border-red-400 bg-red-900 px-4 py-3">
					<strong className="font-bold">Error:</strong>
					<span className="block sm:inline"> {errorMessage}</span>
				</div>
			)}

			<div className="mb-4 flex items-center border border-divider bg-content1/50 rounded-xl px-2 py-1 focus-within:border-primary/50 focus-within:bg-content2 transition-colors max-w-2xl mt-4">
				<Search className="h-4 w-4 text-default-400 ml-2 mr-1" />
				<input
					className="w-full appearance-none border-none bg-transparent px-2 py-2 text-sm font-medium leading-tight text-foreground focus:outline-none placeholder:text-default-400"
					type="text"
					id="query"
					placeholder="Filter results, supports regex"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value.toLocaleLowerCase());
					}}
				/>
				<button
					className="mx-1 inline-flex cursor-pointer items-center justify-center rounded-lg bg-content2 px-3 py-1.5 text-xs font-semibold text-default-600 transition-colors hover:bg-content3 hover:text-foreground"
					onClick={() => setQuery('')}
					title="Reset search"
				>
					<RotateCcw className="h-3.5 w-3.5 mr-1" />
					<span className="hidden sm:inline">Reset</span>
				</button>
				<div className="flex items-center gap-1.5 px-3 py-1 bg-content2 rounded-lg text-xs font-semibold text-default-500 mr-1 whitespace-nowrap">
					<span className="text-secondary">
						{
							filteredResults.filter(
								(r) => r.rdAvailable || r.adAvailable || r.tbAvailable
							).length
						}
					</span>
					<span>/</span>
					<span>{filteredResults.length}</span>
				</div>
				{query && filteredResults.length > 0 && rdKey && showMassReportButtons && (
					<div className="ml-2 flex gap-2">
						<button
							className="cursor-pointer whitespace-nowrap rounded-lg border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
							onClick={() => handleMassReport('porn', filteredResults)}
							title="Report all filtered torrents as pornographic content"
						>
							Report as Porn ({filteredResults.length})
						</button>
						<button
							className="cursor-pointer whitespace-nowrap rounded-lg border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
							onClick={() => handleMassReport('wrong_imdb', filteredResults)}
							title="Report all filtered torrents as wrong IMDB ID"
						>
							Report Wrong IMDB ({filteredResults.length})
						</button>
						<button
							className="cursor-pointer whitespace-nowrap rounded-lg border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
							onClick={() => handleMassReport('wrong_season', filteredResults)}
							title="Report all filtered torrents as wrong season"
						>
							Report Wrong Season ({filteredResults.length})
						</button>
					</div>
				)}
			</div>

			<div className="mb-2 flex items-center gap-2 overflow-x-auto p-2">
				<SearchTokens
					title={showInfo.title}
					year={seasonNum as string}
					isShow={true}
					onTokenClick={(token) =>
						setQuery((prev) => (prev ? `${prev} ${token}` : token))
					}
				/>
				{getColorScale(expectedEpisodeCount).map((scale, idx) => (
					<span
						key={idx}
						className={`${scale.color} cursor-pointer whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold backdrop-blur-sm`}
						onClick={() => {
							const queryText = getQueryForEpisodeCount(
								scale.threshold,
								expectedEpisodeCount
							);
							setQuery((prev) => {
								const cleanedPrev = prev.replace(/\bvideos:[^\s]+/g, '').trim();
								return cleanedPrev ? `${cleanedPrev} ${queryText}` : queryText;
							});
						}}
					>
						{scale.label}
					</span>
				))}
			</div>

			<TvSearchResults
				filteredResults={filteredResults}
				expectedEpisodeCount={expectedEpisodeCount}
				onlyShowCached={onlyShowCached}
				episodeMaxSize={episodeMaxSize}
				rdKey={rdKey}
				adKey={adKey}
				torboxKey={torboxKey}
				player={player}
				hashAndProgress={hashAndProgress}
				handleShowInfo={handleShowInfo}
				handleCast={handleCast}
				handleCastTorBox={torboxKey ? handleCastTorBox : undefined}
				handleCastAllDebrid={adKey ? handleCastAllDebrid : undefined}
				handleCopyMagnet={(hash) => handleCopyOrDownloadMagnet(hash, shouldDownloadMagnets)}
				checkServiceAvailability={checkServiceAvailability}
				addRd={addRd}
				addAd={addAd}
				addTb={addTb}
				deleteRd={deleteRd}
				deleteAd={deleteAd}
				deleteTb={deleteTb}
				imdbId={imdbid as string}
				isCheckingAvailability={isCheckingAvailability}
			/>

			{searchResults.length > 0 && searchState === 'loaded' && hasMoreResults && (
				<button
					className="my-4 w-full rounded-xl border border-divider bg-content1/50 backdrop-blur-sm px-4 py-3 font-semibold text-foreground shadow-sm transition-all duration-200 hover:bg-content2 hover:border-primary/50"
					onClick={() => {
						setCurrentPage((prev) => prev + 1);
						fetchData(imdbid as string, parseInt(seasonNum as string), currentPage + 1);
					}}
				>
					Show More Results
				</button>
			)}
		</div>
	);
};

export default withAuth(TvSearch);
