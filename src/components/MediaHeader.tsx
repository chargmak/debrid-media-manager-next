import Poster from '@/components/poster';
import RelatedMedia from '@/components/RelatedMedia';
import TrailerModal from '@/components/TrailerModal';
import { Info, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

interface MediaHeaderProps {
	mediaType: 'movie' | 'tv';
	imdbId: string;
	title: string;
	year?: string;
	seasonNum?: string;
	description: string;
	poster: string;
	backdrop?: string;
	imdbScore: number;
	descLimit: number;
	onDescToggle: () => void;
	actionButtons: React.ReactNode;
	additionalInfo?: React.ReactNode;
	trailer?: string;
}

const MediaHeader: React.FC<MediaHeaderProps> = ({
	mediaType,
	imdbId,
	title,
	year,
	seasonNum,
	description,
	poster,
	backdrop,
	imdbScore,
	descLimit,
	onDescToggle,
	actionButtons,
	additionalInfo,
	trailer,
}) => {
	const [showTrailer, setShowTrailer] = useState(false);
	const backdropStyle = backdrop
		? {
			backgroundImage: `linear-gradient(to bottom, hsl(0, 0%, 12%,0.5) 0%, hsl(0, 0%, 12%,0) 50%, hsl(0, 0%, 12%,0.5) 100%), url(${backdrop})`,
			backgroundPosition: 'center',
			backgroundSize: 'screen',
		}
		: {};

	const displayTitle =
		mediaType === 'movie'
			? `${title} (${year})`
			: seasonNum
				? `${title} - Season ${seasonNum}`
				: title;

	return (
		<>
			{showTrailer && trailer && (
				<TrailerModal
					trailerUrl={trailer}
					onClose={() => setShowTrailer(false)}
					title={title}
				/>
			)}
			<div className="relative overflow-hidden border-b border-divider bg-content1/40 px-4 py-6 shadow-sm sm:px-6 lg:px-8">
				{/* Backdrop Layer */}
				{backdrop && (
					<div
						className="absolute inset-0 z-0 opacity-[0.2]"
						style={{
							backgroundImage: `url(${backdrop})`,
							backgroundPosition: 'center 15%',
							backgroundSize: 'cover',
						}}
					/>
				)}
				{/* Gradient Overlay for legibility */}
				<div className="absolute inset-0 z-0 bg-gradient-to-t md:bg-gradient-to-r from-background via-background/90 to-transparent" />

				<div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
					{/* Poster */}
					<div className="relative shrink-0 overflow-hidden rounded-xl border border-divider/50 shadow-2xl transition-transform hover:scale-[1.02]">
						{(poster && (
							<Image
								width={220}
								height={330}
								src={poster}
								alt={`${mediaType === 'movie' ? 'Movie' : 'Show'} poster`}
								className="h-auto w-[220px] object-cover"
							/>
						)) || <Poster imdbId={imdbId} title={title} />}
					</div>

					{/* Content */}
					<div className="flex w-full flex-col">
						<div className="flex w-full items-start justify-between">
							<div className="flex flex-col gap-3 pb-4">
								<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground drop-shadow-md">
									{displayTitle}
								</h2>
								<div className="flex flex-wrap items-center gap-2">
									<Link
										href={`/${mediaType === 'movie' ? 'movie' : 'show'}/${imdbId}/info`}
										className="inline-flex h-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-3 text-sm font-medium text-primary shadow-sm backdrop-blur-sm transition-all hover:bg-primary/20 hover:border-primary/50"
										title="View detailed information"
									>
										<Info size={16} className="mr-1.5" />
										Info
									</Link>
									{trailer && (
										<button
											onClick={() => setShowTrailer(true)}
											className="inline-flex h-8 items-center justify-center rounded-lg border border-danger/30 bg-danger/10 px-3 text-sm font-medium text-danger shadow-sm backdrop-blur-sm transition-all hover:bg-danger/20 hover:border-danger/50"
											title="Watch trailer"
										>
											<Play size={16} className="mr-1.5" />
											Trailer
										</button>
									)}
									<RelatedMedia
										imdbId={imdbId}
										mediaType={mediaType === 'tv' ? 'show' : 'movie'}
									/>
									{imdbScore > 0 && (
										<Link
											href={`https://www.imdb.com/title/${imdbId}/`}
											target="_blank"
											className="inline-flex h-8 items-center justify-center rounded-lg border border-warning/30 bg-warning/10 px-3 text-sm font-bold text-warning shadow-sm backdrop-blur-sm transition-all hover:bg-warning/20 hover:border-warning/50"
										>
											IMDb {imdbScore < 10 ? imdbScore : imdbScore / 10}
										</Link>
									)}
								</div>
							</div>

							<Link
								href="/"
								className="shrink-0 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/20 hover:border-primary/50 backdrop-blur-sm"
							>
								Home
							</Link>
						</div>

						<div
							className="mb-6 max-w-3xl rounded-xl border border-divider/50 bg-content2/40 p-4 text-sm leading-relaxed text-default-600 shadow-inner backdrop-blur-md cursor-pointer transition-colors hover:bg-content2/60"
							onClick={onDescToggle}
						>
							{descLimit > 0 ? description.substring(0, descLimit) + '...' : description}
						</div>

						{additionalInfo}

						<div className="w-full mt-2">
							{actionButtons}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default MediaHeader;
