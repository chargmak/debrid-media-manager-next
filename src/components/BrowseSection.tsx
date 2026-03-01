import { Clock3, Drama, Search, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Button } from '@heroui/react';

interface BrowseSectionProps {
	terms: string[];
}

export function BrowseSection({ terms }: BrowseSectionProps) {
	const router = useRouter();
	const randomTerm = useMemo(() => terms[Math.floor(Math.random() * terms.length)], [terms]);

	const handleCustomSearch = () => {
		const term = prompt('Enter one word to browse:');
		if (term) {
			const cleanTerm = term.trim().replace(/\W/gi, '');
			if (cleanTerm) {
				router.push(`/browse/${cleanTerm}`);
			}
		}
	};

	return (
		<div className="w-full">
			<h2 className="text-xs font-semibold uppercase tracking-wider text-default-400 mb-3 px-1">
				Discover
			</h2>
			<div className="grid grid-cols-4 gap-2">
				<Button
					as={Link}
					href="/browse"
					className="h-14 font-medium bg-content1/40 hover:bg-content2 border border-divider backdrop-blur-sm transition-all"
					variant="flat"
				>
					<div className="flex flex-col items-center gap-1">
						<Drama className="h-4 w-4 text-primary" />
						<span className="text-[10px] text-default-400 uppercase tracking-wide">Genres</span>
					</div>
				</Button>

				<Button
					as={Link}
					href="/browse/recent"
					className="h-14 font-medium bg-content1/40 hover:bg-content2 border border-divider backdrop-blur-sm transition-all"
					variant="flat"
				>
					<div className="flex flex-col items-center gap-1">
						<Clock3 className="h-4 w-4 text-secondary" />
						<span className="text-[10px] text-default-400 uppercase tracking-wide">Recent</span>
					</div>
				</Button>

				<Button
					as={Link}
					href={`/browse/${randomTerm.replace(/\W/gi, '')}`}
					className="h-14 font-medium bg-content1/40 hover:bg-content2 border border-divider backdrop-blur-sm transition-all"
					variant="flat"
				>
					<div className="flex flex-col items-center gap-1 max-w-full">
						<Shuffle className="h-4 w-4 text-warning" />
						<span className="text-[10px] text-default-400 uppercase tracking-wide truncate w-full">{randomTerm}</span>
					</div>
				</Button>

				<Button
					onClick={handleCustomSearch}
					className="h-14 font-medium bg-content1/40 hover:bg-content2 border border-divider backdrop-blur-sm transition-all"
					variant="flat"
				>
					<div className="flex flex-col items-center gap-1">
						<Search className="h-4 w-4 text-success" />
						<span className="text-[10px] text-default-400 uppercase tracking-wide">Browse</span>
					</div>
				</Button>
			</div>
		</div>
	);
}
