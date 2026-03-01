import { TraktUser } from '@/services/trakt';
import { Archive, CalendarDays, Eye, Film, List, Tv } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@heroui/react';

interface TraktSectionProps {
	traktUser: TraktUser | null;
}

export function TraktSection({ traktUser }: TraktSectionProps) {
	const iconProps = { size: 16, strokeWidth: 2 };
	const btnClass = "h-14 font-medium flex-col gap-1 items-center bg-content1/40 hover:bg-content2 border border-divider backdrop-blur-sm transition-all";

	return (
		<div className="w-full">
			<h2 className="text-xs font-semibold uppercase tracking-wider text-default-400 mb-3 px-1">
				Trakt
			</h2>
			<div className="grid w-full grid-cols-3 gap-2">
				<Button
					as={Link}
					href="/trakt/movies"
					className={btnClass}
					variant="flat"
				>
					<Film {...iconProps} className="text-warning" />
					<span className="text-[10px] text-default-400 uppercase tracking-wide">Movies</span>
				</Button>
				<Button
					as={Link}
					href="/trakt/shows"
					className={btnClass}
					variant="flat"
				>
					<Tv {...iconProps} className="text-primary" />
					<span className="text-[10px] text-default-400 uppercase tracking-wide">Shows</span>
				</Button>
				<Button
					as={Link}
					href="/calendar"
					className={btnClass}
					variant="flat"
				>
					<CalendarDays {...iconProps} className="text-secondary" />
					<span className="text-[10px] text-default-400 uppercase tracking-wide">Calendar</span>
				</Button>

				{traktUser && (
					<>
						<Button
							as={Link}
							href="/trakt/watchlist"
							className={btnClass}
							variant="flat"
						>
							<Eye {...iconProps} className="text-danger" />
							<span className="text-[10px] text-default-400 uppercase tracking-wide">Watchlist</span>
						</Button>
						<Button
							as={Link}
							href="/trakt/collection"
							className={btnClass}
							variant="flat"
						>
							<Archive {...iconProps} className="text-success" />
							<span className="text-[10px] text-default-400 uppercase tracking-wide">Collection</span>
						</Button>
						<Button
							as={Link}
							href="/trakt/mylists"
							className={btnClass}
							variant="flat"
						>
							<List {...iconProps} className="text-[#06B6D4]" />
							<span className="text-[10px] text-default-400 uppercase tracking-wide">Lists</span>
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
