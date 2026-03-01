import type { DebridService } from '@/hooks/useAvailabilityCheck';
import { SearchResult } from '@/services/mediasearch';
import { downloadMagnetFile } from '@/utils/downloadMagnet';
import { borderColor, getBtnClasses, btnIcon, btnLabel, fileSize } from '@/utils/results';
import { isVideo } from '@/utils/selectable';
import {
	Cast,
	Download,
	Eye as EyeIcon,
	Folder,
	Link2,
	Loader2,
	Search as SearchIcon,
	X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ReportButton from './ReportButton';

type MovieSearchResultsProps = {
	filteredResults: SearchResult[];
	onlyShowCached: boolean;
	movieMaxSize: string;
	rdKey: string | null;
	adKey: string | null;
	torboxKey: string | null;
	player: string;
	hashAndProgress: Record<string, number>;
	handleShowInfo: (result: SearchResult) => void;
	handleCast: (hash: string) => Promise<void>;
	handleCastTorBox?: (hash: string) => Promise<void>;
	handleCastAllDebrid?: (hash: string) => Promise<void>;
	handleCopyMagnet: (hash: string) => void;
	checkServiceAvailability: (
		result: SearchResult,
		servicesToCheck?: DebridService[]
	) => Promise<void>;
	addRd: (hash: string) => Promise<void>;
	addAd: (hash: string) => Promise<void>;
	addTb: (hash: string) => Promise<void>;
	deleteRd: (hash: string) => Promise<void>;
	deleteAd: (hash: string) => Promise<void>;
	deleteTb: (hash: string) => Promise<void>;
	imdbId?: string;
	isCheckingAvailability?: boolean;
};

const MovieSearchResults = ({
	filteredResults,
	onlyShowCached,
	movieMaxSize,
	rdKey,
	adKey,
	torboxKey,
	player,
	hashAndProgress,
	handleShowInfo,
	handleCast,
	handleCastTorBox,
	handleCastAllDebrid,
	handleCopyMagnet,
	checkServiceAvailability,
	addRd,
	addAd,
	addTb,
	deleteRd,
	deleteAd,
	deleteTb,
	imdbId,
	isCheckingAvailability = false,
}: MovieSearchResultsProps) => {
	const [loadingHashes, setLoadingHashes] = useState<Set<string>>(new Set());
	const [castingHashes, setCastingHashes] = useState<Set<string>>(new Set());
	const [castingTbHashes, setCastingTbHashes] = useState<Set<string>>(new Set());
	const [castingAdHashes, setCastingAdHashes] = useState<Set<string>>(new Set());
	const [checkingHashes, setCheckingHashes] = useState<Map<string, string>>(new Map());
	const [downloadMagnets, setDownloadMagnets] = useState(false);

	useEffect(() => {
		const shouldDownloadMagnets =
			window.localStorage.getItem('settings:downloadMagnets') === 'true';
		setDownloadMagnets(shouldDownloadMagnets);
	}, []);

	const resolveServiceLabel = (services?: DebridService[]) => {
		const available: DebridService[] = [];
		if (rdKey) available.push('RD');
		if (adKey) available.push('AD');
		if (torboxKey) available.push('TB');

		const targetServices =
			services && services.length > 0
				? available.filter((service) => services.includes(service))
				: available;

		return targetServices.length > 0 ? targetServices.join(' / ') : 'services';
	};

	const isDownloading = (service: string, hash: string) =>
		`${service}:${hash}` in hashAndProgress && hashAndProgress[`${service}:${hash}`] < 100;
	const isDownloaded = (service: string, hash: string) =>
		`${service}:${hash}` in hashAndProgress && hashAndProgress[`${service}:${hash}`] === 100;
	const inLibrary = (service: string, hash: string) => `${service}:${hash}` in hashAndProgress;
	const notInLibrary = (service: string, hash: string) =>
		!(`${service}:${hash}` in hashAndProgress);

	const handleAddRd = async (hash: string) => {
		if (loadingHashes.has(hash)) return;
		setLoadingHashes((prev) => new Set(prev).add(hash));
		try {
			await addRd(hash);
		} finally {
			setLoadingHashes((prev) => {
				const newSet = new Set(prev);
				newSet.delete(hash);
				return newSet;
			});
		}
	};

	const handleAddAd = async (hash: string) => {
		if (loadingHashes.has(hash)) return;
		setLoadingHashes((prev) => new Set(prev).add(hash));
		try {
			await addAd(hash);
		} finally {
			setLoadingHashes((prev) => {
				const newSet = new Set(prev);
				newSet.delete(hash);
				return newSet;
			});
		}
	};

	const handleAddTb = async (hash: string) => {
		if (loadingHashes.has(hash)) return;
		setLoadingHashes((prev) => new Set(prev).add(hash));
		try {
			await addTb(hash);
		} finally {
			setLoadingHashes((prev) => {
				const newSet = new Set(prev);
				newSet.delete(hash);
				return newSet;
			});
		}
	};

	const handleDeleteRd = async (hash: string) => {
		if (loadingHashes.has(hash)) return;
		setLoadingHashes((prev) => new Set(prev).add(hash));
		try {
			await deleteRd(hash);
		} finally {
			setLoadingHashes((prev) => {
				const newSet = new Set(prev);
				newSet.delete(hash);
				return newSet;
			});
		}
	};

	const handleDeleteTb = async (hash: string) => {
		if (loadingHashes.has(hash)) return;
		setLoadingHashes((prev) => new Set(prev).add(hash));
		try {
			await deleteTb(hash);
		} finally {
			setLoadingHashes((prev) => {
				const newSet = new Set(prev);
				newSet.delete(hash);
				return newSet;
			});
		}
	};

	const handleDeleteAd = async (hash: string) => {
		if (loadingHashes.has(hash)) return;
		setLoadingHashes((prev) => new Set(prev).add(hash));
		try {
			await deleteAd(hash);
		} finally {
			setLoadingHashes((prev) => {
				const newSet = new Set(prev);
				newSet.delete(hash);
				return newSet;
			});
		}
	};

	const handleCastWithLoading = async (hash: string) => {
		if (castingHashes.has(hash)) return;
		setCastingHashes((prev) => new Set(prev).add(hash));
		try {
			await handleCast(hash);
		} finally {
			setCastingHashes((prev) => {
				const newSet = new Set(prev);
				newSet.delete(hash);
				return newSet;
			});
		}
	};

	const handleCastTorBoxWithLoading = async (hash: string) => {
		if (!handleCastTorBox || castingTbHashes.has(hash)) return;
		setCastingTbHashes((prev) => new Set(prev).add(hash));
		try {
			await handleCastTorBox(hash);
		} finally {
			setCastingTbHashes((prev) => {
				const newSet = new Set(prev);
				newSet.delete(hash);
				return newSet;
			});
		}
	};

	const handleCastAllDebridWithLoading = async (hash: string) => {
		if (!handleCastAllDebrid || castingAdHashes.has(hash)) return;
		setCastingAdHashes((prev) => new Set(prev).add(hash));
		try {
			await handleCastAllDebrid(hash);
		} finally {
			setCastingAdHashes((prev) => {
				const newSet = new Set(prev);
				newSet.delete(hash);
				return newSet;
			});
		}
	};

	const handleCheckWithLoading = async (result: SearchResult, services?: DebridService[]) => {
		if (checkingHashes.has(result.hash)) return;
		const label = resolveServiceLabel(services);
		setCheckingHashes((prev) => {
			const next = new Map(prev);
			next.set(result.hash, label);
			return next;
		});
		try {
			await checkServiceAvailability(result, services);
		} finally {
			setCheckingHashes((prev) => {
				const next = new Map(prev);
				next.delete(result.hash);
				return next;
			});
		}
	};

	const handleMagnetAction = (hash: string) => {
		if (downloadMagnets) {
			downloadMagnetFile(hash);
		} else {
			handleCopyMagnet(hash);
		}
	};

	const getBiggestFileId = (result: SearchResult) => {
		if (!result.files || !result.files.length) return '';
		const biggestFile = result.files
			.filter((f) => isVideo({ path: f.filename }))
			.sort((a, b) => b.filesize - a.filesize)[0];
		return biggestFile?.fileId ?? '';
	};

	const getMovieCountLabel = (videoCount: number) => {
		if (videoCount === 1) return `Single`;
		return `With extras (${videoCount})`;
	};

	const getMovieCountClass = (videoCount: number, isInstantlyAvailable: boolean) => {
		if (!isInstantlyAvailable) return 'bg-content1/20';
		if (videoCount === 1) return 'bg-content2/40';
		return 'bg-primary/5';
	};

	return (
		<div className="mx-1 my-1 grid grid-cols-1 gap-2 overflow-x-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
			{filteredResults.map((r: SearchResult, i: number) => {
				const downloaded =
					isDownloaded('rd', r.hash) ||
					isDownloaded('ad', r.hash) ||
					isDownloaded('tb', r.hash);
				const downloading =
					isDownloading('rd', r.hash) ||
					isDownloading('ad', r.hash) ||
					isDownloading('tb', r.hash);
				const inYourLibrary = downloaded || downloading;

				if (
					onlyShowCached &&
					!r.rdAvailable &&
					!r.adAvailable &&
					!r.tbAvailable &&
					!inYourLibrary
				)
					return null;
				if (
					movieMaxSize !== '0' &&
					(r.biggestFileSize ?? r.fileSize) > parseInt(movieMaxSize) * 1024 &&
					!inYourLibrary
				)
					return null;

				const rdClasses = getBtnClasses(r.rdAvailable, r.noVideos);
				const adClasses = getBtnClasses(r.adAvailable, r.noVideos);
				const tbClasses = getBtnClasses(r.tbAvailable, r.noVideos);
				const isLoading = loadingHashes.has(r.hash);
				const isCasting = castingHashes.has(r.hash);
				const isCastingTb = castingTbHashes.has(r.hash);
				const isCastingAd = castingAdHashes.has(r.hash);
				const checkingLabel = checkingHashes.get(r.hash);

				return (
					<div
						key={i}
						className={`relative flex flex-col border ${borderColor(downloaded, downloading)} ${getMovieCountClass(r.videoCount, r.rdAvailable || r.adAvailable || r.tbAvailable)} overflow-hidden rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group`}
					>
						<div className="space-y-2 p-1">
							<h2 className="line-clamp-2 min-h-[2.5rem] overflow-hidden text-ellipsis break-words text-sm font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
								{r.title}
							</h2>

							{r.videoCount > 0 ? (
								<div className="text-xs text-gray-300">
									<span
										className="inline-flex cursor-pointer items-center rounded-lg bg-content3/50 px-2 py-1.5 font-semibold text-default-700 transition-all hover:bg-content3"
										onClick={() => handleShowInfo(r)}
									>
										<Folder className="mr-1.5 h-3.5 w-3.5" />
										{getMovieCountLabel(r.videoCount)}
									</span>
									{r.videoCount > 1 ? (
										<span className="ml-2">
											Total: {fileSize(r.fileSize)} GB; Biggest:{' '}
											{fileSize(r.biggestFileSize)} GB
											{r.trackerStats &&
												!r.rdAvailable &&
												!r.adAvailable &&
												!r.tbAvailable &&
												(r.trackerStats.seeders > 0 ? (
													<span className="text-green-400">
														{' '}
														• Has seeders
													</span>
												) : (
													<span className="text-red-400">
														{' '}
														• No seeders
													</span>
												))}
										</span>
									) : (
										<span className="ml-2">
											Total: {fileSize(r.fileSize)} GB
											{r.trackerStats &&
												!r.rdAvailable &&
												!r.adAvailable &&
												!r.tbAvailable &&
												(r.trackerStats.seeders > 0 ? (
													<span className="text-green-400">
														{' '}
														• Has seeders
													</span>
												) : (
													<span className="text-red-400">
														{' '}
														• No seeders
													</span>
												))}
										</span>
									)}
								</div>
							) : (
								<div className="text-xs text-gray-300">
									Total: {fileSize(r.fileSize)} GB
									{r.trackerStats &&
										!r.rdAvailable &&
										!r.adAvailable &&
										!r.tbAvailable &&
										(r.trackerStats.seeders > 0 ? (
											<span className="text-green-400"> • Has seeders</span>
										) : (
											<span className="text-red-400"> • No seeders</span>
										))}
								</div>
							)}

							<div className="space-x-1 space-y-1">
								{/* RD download/delete */}
								{rdKey && inLibrary('rd', r.hash) && (
									<button
										className={`haptic-sm inline rounded border-2 border-red-500 bg-red-900/30 px-1 text-xs text-red-100 transition-colors hover:bg-red-800/50 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
										onClick={() => handleDeleteRd(r.hash)}
										disabled={isLoading}
									>
										{isLoading ? (
											<Loader2 className="inline-block h-3 w-3 animate-spin" />
										) : (
											<X className="mr-2 inline h-3 w-3" />
										)}
										{isLoading
											? 'Removing...'
											: `RD (${hashAndProgress[`rd:${r.hash}`] + '%'})`}
									</button>
								)}
								{rdKey && notInLibrary('rd', r.hash) && (
									<button
										className={`inline-flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-bold transition-all ${rdClasses} ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
										onClick={() => handleAddRd(r.hash)}
										disabled={isLoading}
									>
										{isLoading ? (
											<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
										) : (
											btnIcon(r.rdAvailable)
										)}
										{isLoading ? 'Adding...' : btnLabel(r.rdAvailable, 'RD')}
									</button>
								)}

								{/* AD download/delete */}
								{adKey && inLibrary('ad', r.hash) && (
									<button
										className={`haptic-sm inline rounded border-2 border-red-500 bg-red-900/30 px-1 text-xs text-red-100 transition-colors hover:bg-red-800/50 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
										onClick={() => handleDeleteAd(r.hash)}
										disabled={isLoading}
									>
										{isLoading ? (
											<Loader2 className="inline-block h-3 w-3 animate-spin" />
										) : (
											<X className="mr-2 inline h-3 w-3" />
										)}
										{isLoading
											? 'Removing...'
											: `AD (${hashAndProgress[`ad:${r.hash}`] + '%'})`}
									</button>
								)}
								{adKey && notInLibrary('ad', r.hash) && (
									<button
										className={`inline-flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-bold transition-all ${adClasses} ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
										onClick={() => handleAddAd(r.hash)}
										disabled={isLoading}
									>
										{isLoading ? (
											<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
										) : (
											btnIcon(r.adAvailable)
										)}
										{isLoading ? 'Adding...' : btnLabel(r.adAvailable, 'AD')}
									</button>
								)}

								{/* TorBox download/delete */}
								{torboxKey && inLibrary('tb', r.hash) && (
									<button
										className={`haptic-sm inline rounded border-2 border-red-500 bg-red-900/30 px-1 text-xs text-red-100 transition-colors hover:bg-red-800/50 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
										onClick={() => handleDeleteTb(r.hash)}
										disabled={isLoading}
									>
										{isLoading ? (
											<Loader2 className="inline-block h-3 w-3 animate-spin" />
										) : (
											<X className="mr-2 inline h-3 w-3" />
										)}
										{isLoading
											? 'Removing...'
											: `TB (${hashAndProgress[`tb:${r.hash}`] + '%'})`}
									</button>
								)}
								{torboxKey && notInLibrary('tb', r.hash) && (
									<button
										className={`inline-flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-bold transition-all ${tbClasses} ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
										onClick={() => handleAddTb(r.hash)}
										disabled={isLoading}
									>
										{isLoading ? (
											<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
										) : (
											btnIcon(r.tbAvailable)
										)}
										{isLoading ? 'Adding...' : btnLabel(r.tbAvailable, 'TB')}
									</button>
								)}

								{/* Cast (RD) btn - only show if cached on RD */}
								{rdKey && r.rdAvailable && (
									<button
										className={`inline-flex items-center justify-center rounded-lg border border-success/30 bg-success/10 px-2 py-1.5 text-xs font-bold text-success transition-all hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm`}
										onClick={() => handleCastWithLoading(r.hash)}
										disabled={isCasting}
									>
										{isCasting ? (
											<>
												<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
												Casting...
											</>
										) : (
											<span className="inline-flex items-center">
												<Cast className="mr-1.5 h-3.5 w-3.5" />
												Cast (RD)
											</span>
										)}
									</button>
								)}

								{/* Cast (TB) btn - only show if cached on TB */}
								{torboxKey && handleCastTorBox && r.tbAvailable && (
									<button
										className={`inline-flex items-center justify-center rounded-lg border border-secondary/30 bg-secondary/10 px-2 py-1.5 text-xs font-bold text-secondary transition-all hover:bg-secondary/20 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm`}
										onClick={() => handleCastTorBoxWithLoading(r.hash)}
										disabled={isCastingTb}
									>
										{isCastingTb ? (
											<>
												<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
												Casting...
											</>
										) : (
											<span className="inline-flex items-center">
												<Cast className="mr-1.5 h-3.5 w-3.5" />
												Cast (TB)
											</span>
										)}
									</button>
								)}

								{/* Cast (AD) btn - only show if cached on AD */}
								{adKey && handleCastAllDebrid && r.adAvailable && (
									<button
										className={`inline-flex items-center justify-center rounded-lg border border-warning/30 bg-warning/10 px-2 py-1.5 text-xs font-bold text-warning transition-all hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm`}
										onClick={() => handleCastAllDebridWithLoading(r.hash)}
										disabled={isCastingAd}
									>
										{isCastingAd ? (
											<>
												<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
												Casting...
											</>
										) : (
											<span className="inline-flex items-center">
												<Cast className="mr-1.5 h-3.5 w-3.5" />
												Cast (AD)
											</span>
										)}
									</button>
								)}

								{/* Check service availability btns per service */}
								{rdKey && !r.rdAvailable && (
									<button
										className={`inline-flex items-center justify-center rounded-lg border border-warning/30 bg-warning/10 px-2 py-1.5 text-xs font-bold text-warning transition-all hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm`}
										onClick={() => handleCheckWithLoading(r, ['RD'])}
										disabled={
											isCheckingAvailability || checkingHashes.has(r.hash)
										}
									>
										{isCheckingAvailability || checkingHashes.has(r.hash) ? (
											<>
												<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
												{checkingLabel || 'Checking...'}
											</>
										) : (
											<span className="inline-flex items-center">
												<SearchIcon className="mr-1.5 h-3.5 w-3.5" />
												Check RD
											</span>
										)}
									</button>
								)}
								{adKey && !r.adAvailable && (
									<button
										className={`inline-flex items-center justify-center rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-2 py-1.5 text-xs font-bold text-[#F59E0B] transition-all hover:bg-[#F59E0B]/20 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm`}
										onClick={() => handleCheckWithLoading(r, ['AD'])}
										disabled={
											isCheckingAvailability || checkingHashes.has(r.hash)
										}
									>
										{isCheckingAvailability || checkingHashes.has(r.hash) ? (
											<>
												<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
												{checkingLabel || 'Checking...'}
											</>
										) : (
											<span className="inline-flex items-center">
												<SearchIcon className="mr-1.5 h-3.5 w-3.5" />
												Check AD
											</span>
										)}
									</button>
								)}
								{torboxKey && !r.tbAvailable && (
									<button
										className={`inline-flex items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1.5 text-xs font-bold text-cyan-500 transition-all hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm`}
										onClick={() => handleCheckWithLoading(r, ['TB'])}
										disabled={
											isCheckingAvailability || checkingHashes.has(r.hash)
										}
									>
										{isCheckingAvailability || checkingHashes.has(r.hash) ? (
											<>
												<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
												{checkingLabel || 'Checking...'}
											</>
										) : (
											<span className="inline-flex items-center">
												<SearchIcon className="mr-1.5 h-3.5 w-3.5" />
												Check TB
											</span>
										)}
									</button>
								)}

								{/* Watch btn */}
								{(r.rdAvailable || r.adAvailable || r.tbAvailable) && (
									<>
										{r.rdAvailable && player && (
											<button
												className="inline-flex items-center justify-center rounded-lg border border-secondary/30 bg-secondary/10 px-2 py-1.5 text-xs font-bold text-secondary transition-all hover:bg-secondary/20 backdrop-blur-sm"
												onClick={() =>
													window.open(
														`/api/watch/instant/${player}?token=${rdKey}&hash=${r.hash}&fileId=${getBiggestFileId(r)}`
													)
												}
											>
												<span className="inline-flex items-center">
													<EyeIcon className="mr-1.5 h-3.5 w-3.5" />
													Watch
												</span>
											</button>
										)}
									</>
								)}

								{/* Magnet btn */}
								<button
									className="inline-flex items-center justify-center rounded-lg border border-pink-500/30 bg-pink-500/10 px-2 py-1.5 text-xs font-bold text-pink-500 transition-all hover:bg-pink-500/20 backdrop-blur-sm"
									onClick={() => handleMagnetAction(r.hash)}
								>
									<span className="inline-flex items-center">
										{downloadMagnets ? (
											<Download className="mr-1.5 h-3.5 w-3.5" />
										) : (
											<Link2 className="mr-1.5 h-3.5 w-3.5" />
										)}
										{downloadMagnets ? 'Download' : 'Copy'}
									</span>
								</button>

								{/* Report btn */}
								<ReportButton
									hash={r.hash}
									imdbId={imdbId!}
									userId={rdKey || adKey || torboxKey || ''}
								/>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default MovieSearchResults;
