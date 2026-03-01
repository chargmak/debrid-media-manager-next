import { RealDebridUser } from '@/hooks/auth';
import { TorBoxUser } from '@/services/types';
import { BookOpen, Music2, Rocket, Cast, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@heroui/react';

interface MainActionsProps {
	rdUser: RealDebridUser | null;
	tbUser: TorBoxUser | null;
	adUser: boolean;
	isLoading: boolean;
}

const isLocalDev = process.env.NODE_ENV === 'development';

export function MainActions({ rdUser, tbUser, adUser }: MainActionsProps) {
	const castButtons = [
		rdUser && {
			href: '/stremio',
			label: 'Cast for RD',
			colorClass: 'text-success hover:bg-success/10',
		},
		tbUser && {
			href: '/stremio-torbox',
			label: 'Cast for TB',
			colorClass: 'text-warning hover:bg-warning/10',
		},
		adUser && {
			href: '/stremio-alldebrid',
			label: 'Cast for AD',
			colorClass: 'text-secondary hover:bg-secondary/10',
		},
	].filter(Boolean) as { href: string; label: string; colorClass: string }[];

	const castGridCols =
		castButtons.length === 1
			? 'grid-cols-1'
			: castButtons.length === 2
				? 'grid-cols-2'
				: 'grid-cols-3';

	return (
		<div className="flex w-full flex-col gap-4">
			{/* Main Three Actions */}
			<div className="grid w-full grid-cols-3 gap-4">
				<Link
					href="/library"
					className="glass-card group flex h-24 flex-col items-center justify-center gap-2 transition-all hover:bg-white/10 hover:shadow-primary/10"
				>
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
						<BookOpen className="h-6 w-6" />
					</div>
					<span className="text-[10px] font-black uppercase tracking-widest text-default-400 group-hover:text-white">Library</span>
				</Link>

				<Link
					href="/hashlists"
					target={undefined}
					className="glass-card group flex h-24 flex-col items-center justify-center gap-2 transition-all hover:bg-white/10 hover:shadow-secondary/10"
				>
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-transform group-hover:-translate-y-1">
						<Rocket className="h-6 w-6" />
					</div>
					<span className="text-[10px] font-black uppercase tracking-widest text-default-400 group-hover:text-white">Hash lists</span>
				</Link>

				<Link
					href="/albums"
					className="glass-card group flex h-24 flex-col items-center justify-center gap-2 transition-all hover:bg-white/10 hover:shadow-success/10"
				>
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success transition-transform group-hover:rotate-12">
						<Music2 className="h-6 w-6" />
					</div>
					<span className="text-[10px] font-black uppercase tracking-widest text-default-400 group-hover:text-white">Music</span>
				</Link>
			</div>

			{/* Cast Buttons Row */}
			{castButtons.length > 0 && (
				<div className={`grid w-full gap-2 ${castGridCols}`}>
					{castButtons.map((button) => (
						<Link
							key={button.href}
							href={button.href}
							className="glass-card flex h-12 items-center justify-center gap-2 text-xs font-bold transition-all hover:bg-white/5"
						>
							<Cast className="h-4 w-4" />
							<span className={button.colorClass.split(' ')[0]}>{button.label}</span>
						</Link>
					))}
				</div>
			)}

			{/* RD Status */}
			{rdUser && (
				<Link
					href="/is-real-debrid-down-or-just-me"
					className="glass-card flex h-12 items-center justify-center gap-3 bg-danger/5 transition-all hover:bg-danger/10 group"
				>
					<div className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
						<span className="relative inline-flex h-2 w-2 rounded-full bg-danger"></span>
					</div>
					<span className="text-[10px] font-black uppercase tracking-[0.2em] text-danger group-hover:text-danger-500">
						Service Status Monitor
					</span>
					<Activity className="h-4 w-4 text-danger opacity-50 transition-transform group-hover:scale-110" />
				</Link>
			)}
		</div>
	);
}
