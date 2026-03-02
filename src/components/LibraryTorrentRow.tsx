import { UserTorrent, UserTorrentStatus } from '@/torrent/userTorrent';
import {
	handleReinsertTorrentinRd,
	handleRestartTbTorrent,
	handleRestartTorrent,
} from '@/utils/addMagnet';
import { getAllDebridStatusText } from '@/utils/allDebridStatus';
import { handleCopyOrDownloadMagnet } from '@/utils/copyMagnet';
import {
	handleDeleteAdTorrent,
	handleDeleteRdTorrent,
	handleDeleteTbTorrent,
} from '@/utils/deleteTorrent';
import { handleShare } from '@/utils/hashList';
import { normalize } from '@/utils/mediaId';
import { getRealDebridStatusText } from '@/utils/realDebridStatus';
import { torrentPrefix } from '@/utils/results';
import { shortenNumber } from '@/utils/speed';
import { getTorBoxStatusText } from '@/utils/torBoxStatus';
import {
	Cast,
	Check,
	Film,
	FolderOpen,
	Leaf,
	Link2,
	Plus,
	RefreshCw,
	Share2,
	Trash2,
	Tv,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { memo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CastSearchModal } from './CastSearchModal';

const ONE_GIGABYTE = 1024 * 1024 * 1024;

interface TorrentRowProps {
	torrent: UserTorrent;
	rdKey: string | null;
	adKey: string | null;
	tbKey: string | null;
	shouldDownloadMagnets: boolean;
	hashGrouping: Record<string, number>;
	titleGrouping: Record<string, number>;
	tvGroupingByTitle: Record<string, number>;
	hashFilter?: string;
	titleFilter?: string;
	tvTitleFilter?: string;
	isSelected: boolean;
	onSelect: (id: string) => void;
	onDelete: (id: string) => void;
	onShowInfo: (torrent: UserTorrent) => void;
	onTypeChange: (torrent: UserTorrent) => void;
	onRefreshLibrary?: () => Promise<void>;
}

function TorrentRow({
	torrent,
	rdKey,
	adKey,
	tbKey,
	shouldDownloadMagnets,
	hashGrouping,
	titleGrouping,
	tvGroupingByTitle,
	hashFilter,
	titleFilter,
	tvTitleFilter,
	isSelected,
	onSelect,
	onDelete,
	onShowInfo,
	onTypeChange,
	onRefreshLibrary,
}: TorrentRowProps) {
	const router = useRouter();
	const [showCastModal, setShowCastModal] = useState(false);
	const [castTorrentInfo, setCastTorrentInfo] = useState<any>(null);
	const [isCasting, setIsCasting] = useState(false);

	// Helper function to get user-friendly status text for any service
	const getStatusText = (torrent: UserTorrent): string => {
		if (torrent.id.startsWith('rd:')) {
			return getRealDebridStatusText(torrent.serviceStatus);
		} else if (torrent.id.startsWith('ad:')) {
			return getAllDebridStatusText(torrent.serviceStatus);
		} else if (torrent.id.startsWith('tb:')) {
			return getTorBoxStatusText(torrent.serviceStatus);
		}
		return torrent.serviceStatus; // Fallback to raw status
	};

	// Handler for cast button click
	const handleCastClick = async (imdbId?: string) => {
		if (!rdKey || !torrent.id.startsWith('rd:')) return;

		const rdId = torrent.id.substring(3);
		if (!rdId || !torrent.hash) return;

		setIsCasting(true);
		try {
			const castUrl = `/api/stremio/cast/library/${rdId}:${torrent.hash}?rdToken=${rdKey}${imdbId ? `&imdbId=${imdbId}` : ''}`;
			const response = await fetch(castUrl);
			const data = await response.json();

			if (data.status === 'need_imdb_id') {
				// Show modal for user to search and select IMDB ID
				setCastTorrentInfo(data.torrentInfo);
				setShowCastModal(true);
			} else if (data.status === 'error') {
				// Show error toast
				toast.error(data.errorMessage || 'Failed to cast to Stremio');
			} else if (data.status === 'success') {
				// Success - open Stremio deep link
				window.location.href = data.redirectUrl;
				toast.success('Opening in Stremio...');
			}
		} catch (error) {
			console.error('Cast error:', error);
			toast.error('Failed to cast to Stremio');
		} finally {
			setIsCasting(false);
		}
	};

	// Handler for IMDB ID selection from modal
	const handleSelectImdbId = async (imdbId: string) => {
		setShowCastModal(false);
		await handleCastClick(imdbId);
	};

	// Calculate filter texts
	const hashGroupCount = hashGrouping[torrent.hash];
	const hashFilterText = hashGroupCount > 1 && !hashFilter ? `${hashGroupCount} same hash` : '';

	const titleGroupCount = titleGrouping[normalize(torrent.title)];
	const titleFilterText =
		titleGroupCount > 1 && !titleFilter && !hashFilter ? `${titleGroupCount} same title` : '';

	let tvTitleFilterText = '';
	if (torrent.mediaType === 'tv' && torrent.info?.title) {
		const tvTitleGroupCount = tvGroupingByTitle[normalize(torrent.info.title)];
		if (tvTitleGroupCount > 1 && !tvTitleFilter && titleGroupCount < tvTitleGroupCount) {
			tvTitleFilterText = `${tvTitleGroupCount} same show`;
		}
	}

	return (
		<>
			<tr
				className={`flex flex-col sm:table-row border-b border-divider p-3 sm:p-0 transition-colors ${isSelected ? 'bg-success/10' : 'hover:bg-content2/50 sm:hover:bg-content2'}`}
			>
				<td
					onClick={() => onSelect(torrent.id)}
					className="sm:table-cell relative h-8 w-8 sm:h-auto sm:w-auto px-0.5 py-1 text-center text-sm order-2 sm:order-none"
				>
					<div className="flex items-center gap-2 sm:justify-center">
						{isSelected ? (
							<Check className="h-5 w-5 sm:h-4 sm:w-4 text-green-500" />
						) : (
							<Plus className="h-5 w-5 sm:h-4 sm:w-4 text-gray-500" />
						)}
						<span className="sm:hidden text-xs font-medium text-default-500">Select this torrent</span>
					</div>
				</td>
				<td onClick={() => onShowInfo(torrent)} className="block sm:table-cell px-0.5 py-1 text-sm order-1 sm:order-none mb-2 sm:mb-0">
					{!['Invalid Magnet', 'Magnet', 'noname'].includes(torrent.filename) && (
						<div className="flex flex-col gap-1">
							<div className="flex items-start gap-2">
								<div
									className="mt-0.5 cursor-pointer shrink-0"
									onClick={(e) => {
										e.stopPropagation();
										onTypeChange(torrent);
									}}
								>
									{
										{
											movie: (
												<Film className="h-4 w-4 text-yellow-500" />
											),
											tv: <Tv className="h-4 w-4 text-cyan-500" />,
											other: (
												<FolderOpen className="h-4 w-4 text-orange-500" />
											),
										}[torrent.mediaType]
									}
								</div>
								<div className="flex flex-col min-w-0 flex-1">
									<strong className="text-sm sm:text-base leading-snug break-words">{torrent.title}</strong>
									<div className="flex flex-wrap items-center gap-1.5 mt-1">
										{hashFilterText && (
											<Link
												href={`/library?hash=${torrent.hash}&page=1`}
												className="rounded border border-orange-500/50 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-200"
												onClick={(e) => e.stopPropagation()}
											>
												{hashFilterText}
											</Link>
										)}
										{titleFilterText && (
											<Link
												href={`/library?title=${encodeURIComponent(normalize(torrent.title))}&page=1`}
												className="rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-200"
												onClick={(e) => e.stopPropagation()}
											>
												{titleFilterText}
											</Link>
										)}
										{tvTitleFilterText && torrent.info?.title && (
											<Link
												href={`/library?tvTitle=${encodeURIComponent(normalize(torrent.info.title))}&page=1`}
												className="rounded border border-sky-500/50 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-200"
												onClick={(e) => e.stopPropagation()}
											>
												{tvTitleFilterText}
											</Link>
										)}
										<div className="sm:hidden flex items-center gap-1 text-[11px] font-medium text-default-400 bg-content2 px-1.5 py-0.5 rounded">
											{(torrent.bytes / ONE_GIGABYTE).toFixed(1)} GB
											<span className="opacity-30 mx-0.5">|</span>
											{getStatusText(torrent)}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
					<div className="mt-2 text-[11px] text-default-400 font-mono break-all opacity-70">
						{torrent.filename === torrent.hash ? 'Magnet' : torrent.filename}
					</div>
					{torrent.filename === torrent.hash ||
						torrent.filename === 'Magnet' ||
						torrent.status === UserTorrentStatus.error
						? ` (${getStatusText(torrent)})`
						: ''}
					{/* ── Mobile-only inline action buttons (hidden on sm+) ── */}
					<div className="mt-1.5 flex flex-wrap gap-1 sm:hidden" onClick={(e) => e.stopPropagation()}>
						{rdKey && torrent.id.startsWith('rd:') && (
							<button
								title="Cast (RD)"
								className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-green-400 bg-green-400/10 hover:bg-green-400/20 disabled:opacity-50"
								onClick={(e) => { e.stopPropagation(); handleCastClick(); }}
								disabled={isCasting}
							>
								<Cast className="h-3.5 w-3.5" /> Cast
							</button>
						)}
						<button
							title="Share"
							className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20"
							onClick={async (e) => { e.stopPropagation(); router.push(await handleShare(torrent)); }}
						>
							<Share2 className="h-3.5 w-3.5" /> Share
						</button>
						<button
							title="Delete"
							className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20"
							onClick={async (e) => {
								e.stopPropagation();
								if (rdKey && torrent.id.startsWith('rd:')) await handleDeleteRdTorrent(rdKey, torrent.id);
								if (adKey && torrent.id.startsWith('ad:')) await handleDeleteAdTorrent(adKey, torrent.id);
								if (tbKey && torrent.id.startsWith('tb:')) await handleDeleteTbTorrent(tbKey, torrent.id);
								onDelete(torrent.id);
							}}
						>
							<Trash2 className="h-3.5 w-3.5" /> Delete
						</button>
						<button
							title="Copy magnet"
							className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-teal-400 bg-teal-400/10 hover:bg-teal-400/20"
							onClick={(e) => { e.stopPropagation(); void handleCopyOrDownloadMagnet(torrent.hash, shouldDownloadMagnets); }}
						>
							<Link2 className="h-3.5 w-3.5" /> Magnet
						</button>
						<button
							title="Reinsert"
							className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20"
							onClick={async (e) => {
								e.stopPropagation();
								try {
									if (rdKey && torrent.id.startsWith('rd:')) {
										await handleReinsertTorrentinRd(rdKey, torrent, true);
										onDelete(torrent.id);
										if (onRefreshLibrary) await onRefreshLibrary();
									}
									if (adKey && torrent.id.startsWith('ad:')) {
										await handleRestartTorrent(adKey, torrent.id);
										if (onRefreshLibrary) await onRefreshLibrary();
									}
									if (tbKey && torrent.id.startsWith('tb:')) {
										await handleRestartTbTorrent(tbKey, torrent.id);
										if (onRefreshLibrary) await onRefreshLibrary();
									}
								} catch (error) { console.error(error); }
							}}
						>
							<RefreshCw className="h-3.5 w-3.5" /> Reinsert
						</button>
					</div>
				</td>
				<td onClick={() => onShowInfo(torrent)} className="hidden sm:table-cell px-0.5 py-1 text-center text-xs">
					{(torrent.bytes / ONE_GIGABYTE).toFixed(1)} GB
				</td>
				<td onClick={() => onShowInfo(torrent)} className="px-0.5 py-1 text-center text-xs hidden sm:table-cell">
					{torrent.status !== UserTorrentStatus.finished &&
						torrent.status !== UserTorrentStatus.error ? (
						<>
							<span className="inline-block align-middle">
								{(torrent.progress ?? 0).toFixed(2)}%&nbsp;
							</span>
							<span className="inline-block align-middle">
								<Leaf className="inline-block h-4 w-4 text-green-500" />
							</span>
							<span className="inline-block align-middle">{torrent.seeders}</span>
							<br />
							<span className="inline-block align-middle">
								{shortenNumber(torrent.speed)}B/s
							</span>
						</>
					) : (
						getStatusText(torrent)
					)}
				</td>
				<td onClick={() => onShowInfo(torrent)} className="px-0.5 py-1 text-center text-xs hidden md:table-cell">
					{new Date(torrent.added).toLocaleString(undefined, { timeZone: 'UTC' })}
				</td>
				{/* ── Desktop-only action buttons column (hidden on mobile) ── */}
				<td
					className="block sm:table-cell sm:table-cell sm:flex flex-wrap place-content-center px-0.5 py-1 gap-1 order-3 sm:order-none"
				>
					<div className="flex flex-wrap gap-2 mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
						{rdKey && torrent.id.startsWith('rd:') && (
							<button
								title="Cast (RD)"
								className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-1 rounded bg-green-500/10 sm:bg-transparent text-green-400 hover:bg-green-500/20 sm:hover:bg-green-400/10 disabled:opacity-50 border border-green-500/20 sm:border-transparent transition-colors"
								onClick={(e) => {
									e.stopPropagation();
									handleCastClick();
								}}
								disabled={isCasting}
							>
								<Cast className="h-4 w-4" />
								<span className="sm:hidden text-xs font-bold">Cast</span>
							</button>
						)}
						<button
							title="Share"
							className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-1 rounded bg-indigo-500/10 sm:bg-transparent text-indigo-400 hover:bg-indigo-500/20 sm:hover:bg-indigo-400/10 border border-indigo-500/20 sm:border-transparent transition-colors"
							onClick={async (e) => {
								e.stopPropagation();
								router.push(await handleShare(torrent));
							}}
						>
							<Share2 className="h-4 w-4" />
							<span className="sm:hidden text-xs font-bold">Share</span>
						</button>
						<button
							title="Delete"
							className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-1 rounded bg-red-500/10 sm:bg-transparent text-red-500 hover:bg-red-500/20 sm:hover:bg-red-400/10 border border-red-500/20 sm:border-transparent transition-colors"
							onClick={async (e) => {
								e.stopPropagation();
								if (rdKey && torrent.id.startsWith('rd:')) {
									await handleDeleteRdTorrent(rdKey, torrent.id);
								}
								if (adKey && torrent.id.startsWith('ad:')) {
									await handleDeleteAdTorrent(adKey, torrent.id);
								}
								if (tbKey && torrent.id.startsWith('tb:')) {
									await handleDeleteTbTorrent(tbKey, torrent.id);
								}
								onDelete(torrent.id);
							}}
						>
							<Trash2 className="h-4 w-4" />
							<span className="sm:hidden text-xs font-bold">Delete</span>
						</button>
						<button
							title="Copy magnet url"
							className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-1 rounded bg-teal-500/10 sm:bg-transparent text-teal-500 hover:bg-teal-500/20 sm:hover:bg-teal-400/10 border border-teal-500/20 sm:border-transparent transition-colors"
							onClick={(e) => {
								e.stopPropagation();
								void handleCopyOrDownloadMagnet(torrent.hash, shouldDownloadMagnets);
							}}
						>
							<Link2 className="h-4 w-4" />
							<span className="sm:hidden text-xs font-bold">Magnet</span>
						</button>
						<button
							title="Reinsert"
							className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-1 rounded bg-emerald-500/10 sm:bg-transparent text-emerald-500 hover:bg-emerald-500/20 sm:hover:bg-green-400/10 border border-emerald-500/20 sm:border-transparent transition-colors"
							onClick={async (e) => {
								e.stopPropagation();
								try {
									if (rdKey && torrent.id.startsWith('rd:')) {
										await handleReinsertTorrentinRd(rdKey, torrent, true);
										onDelete(torrent.id);
										if (onRefreshLibrary) await onRefreshLibrary();
									}
									if (adKey && torrent.id.startsWith('ad:')) {
										await handleRestartTorrent(adKey, torrent.id);
										if (onRefreshLibrary) await onRefreshLibrary();
									}
									if (tbKey && torrent.id.startsWith('tb:')) {
										await handleRestartTbTorrent(tbKey, torrent.id);
										if (onRefreshLibrary) await onRefreshLibrary();
									}
								} catch (error) {
									console.error(error);
								}
							}}
						>
							<RefreshCw className="h-4 w-4" />
							<span className="sm:hidden text-xs font-bold">Reinsert</span>
						</button>
					</div>
				</td>
			</tr>
			{/* Cast Search Modal */}
			{showCastModal && castTorrentInfo && (
				<CastSearchModal
					isOpen={showCastModal}
					onClose={() => setShowCastModal(false)}
					torrentInfo={castTorrentInfo}
					onSelectImdbId={handleSelectImdbId}
				/>
			)}
		</>
	);
}

export default memo(TorrentRow);
