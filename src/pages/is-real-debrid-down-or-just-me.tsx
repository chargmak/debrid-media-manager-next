import { useConnectivity } from '@/hooks/useConnectivity';
import type { RealDebridObservabilityStats } from '@/lib/observability/getRealDebridObservabilityStats';
import type { LucideIcon } from 'lucide-react';
import {
	Activity,
	AlertTriangle,
	CheckCircle2,
	Clock,
	ChevronRight,
	Globe,
	Loader2,
	RefreshCw,
	Wifi,
	WifiOff,
} from 'lucide-react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Dynamic imports with ssr: false to avoid Recharts SSR compatibility issues
const HistoryCharts = dynamic(
	() => import('@/components/observability/HistoryCharts').then((mod) => mod.HistoryCharts),
	{ ssr: false }
);

const FIXED_LOCALE = 'en-US';

function formatDateTime(timestamp: number): string {
	return new Date(timestamp).toLocaleString(FIXED_LOCALE, {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
}

type StatusState = 'idle' | 'up' | 'down';

function isRealDebridObservabilityPayload(value: unknown): value is RealDebridObservabilityStats {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const candidate = value as Record<string, unknown>;
	// Only need workingStream for stream health checks
	if (!candidate.workingStream || typeof candidate.workingStream !== 'object') {
		return false;
	}
	return true;
}

const RealDebridStatusPage: NextPage & { disableLibraryProvider?: boolean } = () => {
	const [stats, setStats] = useState<RealDebridObservabilityStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [lastChecked, setLastChecked] = useState<number>(Date.now());
	const isOnline = useConnectivity();

	const loadStats = async () => {
		try {
			const cacheBuster = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
			const params = new URLSearchParams({ _t: cacheBuster, verbose: 'true' });
			const origin = window.location.origin;
			const requestUrl = new URL('/api/observability/real-debrid', origin);
			requestUrl.search = params.toString();
			const response = await fetch(requestUrl.toString(), {
				cache: 'no-store',
			});
			if (!response.ok) {
				console.error('Real-Debrid stats fetch failed with status', response.status);
				return;
			}
			const payload: unknown = await response.json();
			if (!isRealDebridObservabilityPayload(payload)) {
				console.error('Received invalid Real-Debrid stats payload', payload);
				return;
			}
			setStats(payload);
			setLastChecked(Date.now());
		} catch (error) {
			console.error('Failed to fetch Real-Debrid stats', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadStats();
		const interval = setInterval(loadStats, 60000); // Auto-refresh every 60s
		return () => clearInterval(interval);
	}, []);

	const pageTitle = 'Is Real-Debrid Down Or Just Me?';
	const canonicalUrl = 'https://debridmediamanager.com/is-real-debrid-down-or-just-me';
	const defaultDescription =
		'Live Real-Debrid availability dashboard covering account, torrent, and unrestrict endpoints.';

	// Loading State
	if (loading || !stats) {
		return (
			<>
				<Head>
					<title>{pageTitle}</title>
					<link rel="canonical" href={canonicalUrl} />
					<meta name="description" content={defaultDescription} />
				</Head>
				<main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
					<div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 py-32">
						<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
						<p className="text-slate-400">Checking Real-Debrid status...</p>
					</div>
				</main>
			</>
		);
	}

	// Stream Health Logic - determines overall status
	const workingStream = stats.workingStream;
	const workingServers = workingStream?.workingServers ?? [];
	const failedServers = workingStream?.failedServers ?? [];
	// Use the actual server rate (working/total) for status determination
	const streamPct = workingStream.total > 0 ? Math.round(workingStream.rate * 100) : null;

	// RD API Health
	const rdApi = stats.rdApi;
	const rdApiPct = rdApi && rdApi.totalCount > 0 ? Math.round(rdApi.successRate * 100) : null;
	const rdApiConsidered = rdApi ? rdApi.successCount + rdApi.failureCount : 0;

	// Torrentio Health
	const torrentio = stats.torrentio;
	const torrentioChecks = torrentio?.recentChecks ?? [];
	const torrentioPassedCount = torrentioChecks.filter((c) => c.ok).length;
	const torrentioTotalChecks = torrentioChecks.length;
	const torrentioPct =
		torrentioTotalChecks > 0
			? Math.round((torrentioPassedCount / torrentioTotalChecks) * 100)
			: null;

	// Determine status based on stream health (working servers / total servers)
	const state: StatusState =
		workingStream.total === 0 ? 'idle' : streamPct !== null && streamPct < 50 ? 'down' : 'up';

	const statusMeta: Record<
		StatusState,
		{
			label: string;
			description: string;
			colorClass: string;
			bgColorClass: string;
			borderColorClass: string;
			icon: LucideIcon;
		}
	> = {
		idle: {
			label: 'Waiting for data',
			description: 'Collecting initial samples...',
			colorClass: 'text-slate-400',
			bgColorClass: 'bg-slate-500/10',
			borderColorClass: 'border-slate-500/20',
			icon: Clock,
		},
		up: {
			label: 'Real-Debrid is Operational',
			description: 'Stream servers responding',
			colorClass: 'text-emerald-400',
			bgColorClass: 'bg-emerald-500/10',
			borderColorClass: 'border-emerald-500/20',
			icon: CheckCircle2,
		},
		down: {
			label: 'Real-Debrid is Down',
			description: 'Stream servers not responding',
			colorClass: 'text-rose-500',
			bgColorClass: 'bg-rose-500/10',
			borderColorClass: 'border-rose-500/20',
			icon: AlertTriangle,
		},
	};

	const currentStatus = statusMeta[state];

	return (
		<>
			<Head>
				<title>{pageTitle}</title>
				<link rel="canonical" href={canonicalUrl} />
				<meta name="description" content={defaultDescription} />
			</Head>

			<main className="min-h-screen bg-black text-foreground selection:bg-emerald-500/30">
				{/* Connectivity Banner */}
				{!isOnline && (
					<div className="bg-danger/10 px-4 py-2 text-center text-sm font-medium text-danger backdrop-blur-md">
						<div className="mx-auto flex max-w-5xl items-center justify-center gap-2">
							<WifiOff className="h-4 w-4" />
							<span>You are currently offline</span>
						</div>
					</div>
				)}

				<div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12">
					{/* Header / Hero */}
					<header className="flex flex-col items-center gap-8 text-center">
						<div
							className={`glass-card flex items-center gap-3 px-6 py-2 ${currentStatus.borderColorClass}`}
						>
							<div className="relative flex h-3 w-3">
								<span
									className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${state === 'up' ? 'bg-emerald-400' : state === 'down' ? 'bg-rose-500' : 'bg-default-400'}`}
								></span>
								<span
									className={`relative inline-flex h-3 w-3 rounded-full ${state === 'up' ? 'bg-emerald-500' : state === 'down' ? 'bg-rose-600' : 'bg-default-500'}`}
								></span>
							</div>
							<span className={`text-sm font-bold uppercase tracking-widest ${currentStatus.colorClass}`}>
								{state === 'up' ? 'Operational' : state === 'down' ? 'Major Outage' : 'Investigating'}
							</span>
						</div>

						<div className="space-y-4">
							<h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
								{currentStatus.label}
							</h1>
							<p className="mx-auto max-w-2xl text-lg text-default-400">
								Real-time monitor of Real-Debrid stream servers and API endpoints
							</p>
						</div>

						<div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-default-500">
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4" />
								<span>Updated: {formatDateTime(lastChecked)}</span>
							</div>
							<button
								onClick={() => loadStats()}
								className="group flex items-center gap-2 transition-colors hover:text-white"
							>
								<RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
								<span>Refresh</span>
							</button>
						</div>

						<div className="grid w-full gap-4 md:grid-cols-2">
							<div className="glass-card flex flex-col items-start gap-2 p-6 text-left">
								<h3 className="text-lg font-bold text-white">About DMM Status</h3>
								<p className="text-sm leading-relaxed text-default-400">
									This dashboard is provided by <Link href="/" className="text-primary hover:underline">Debrid Media Manager</Link>.
									Our automated systems perform health checks every 5 minutes from multiple global locations.
								</p>
							</div>

							<div className="glass-card flex flex-col items-start gap-2 p-6 text-left">
								<h3 className="flex items-center gap-2 text-lg font-bold text-white">
									<Activity className="h-5 w-5 text-emerald-500" />
									Connectivity Check
								</h3>
								<p className="text-sm leading-relaxed text-default-400">
									If this page shows "Operational" but you're experiencing issues, check your local ISP or VPN configuration.
									Real-Debrid occasionally blacklists specific IP ranges.
								</p>
							</div>
						</div>
					</header>

					{/* Metrics Grid */}
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						<div className="glass-card flex flex-col gap-6 p-6">
							<div className="flex items-center justify-between">
								<h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-default-400">
									<Wifi className="h-4 w-4" />
									Server Health
								</h3>
								{workingStream.total > 0 && (
									<span className={`text-2xl font-black ${workingStream.rate >= 0.8 ? 'text-emerald-400' : 'text-danger'}`}>
										{Math.round(workingStream.rate * 100)}%
									</span>
								)}
							</div>

							<div className="space-y-4">
								<div className="space-y-1">
									<div className="flex justify-between text-xs font-bold text-default-500">
										<span>AVAILABILITY</span>
										<span>{workingStream.working}/{workingStream.total} ONLINE</span>
									</div>
									<div className="h-1.5 w-full rounded-full bg-default-100 overflow-hidden">
										<div
											className={`h-full transition-all duration-1000 ${workingStream.rate >= 0.8 ? 'bg-emerald-500' : 'bg-danger'}`}
											style={{ width: `${workingStream.rate * 100}%` }}
										/>
									</div>
								</div>

								{workingServers.length > 0 && (
									<div className="space-y-2 pt-2">
										<div className="text-[10px] font-bold text-emerald-500 uppercase">Working Regions</div>
										<div className="flex flex-wrap gap-1.5">
											{workingServers.map((s) => (
												<div
													key={s.server}
													className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20"
												>
													{s.server.split('.')[0].toUpperCase()}
													<span className="opacity-50">{s.latencyMs ? Math.round(s.latencyMs) : '—'}ms</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						<div className="glass-card flex flex-col gap-6 p-6">
							<div className="flex items-center justify-between">
								<h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-default-400">
									<Activity className="h-4 w-4" />
									API Success
								</h3>
								{rdApiPct !== null && (
									<span className={`text-2xl font-black ${Number(rdApiPct) >= 95 ? 'text-emerald-400' : 'text-warning'}`}>
										{rdApiPct}%
									</span>
								)}
							</div>

							<div className="space-y-3">
								{rdApi && Object.values(rdApi.byOperation)
									.filter((op) => op.totalCount > 0)
									.sort((a, b) => b.totalCount - a.totalCount)
									.slice(0, 5)
									.map((op) => {
										const pct = Math.round(op.successRate * 100);
										return (
											<div key={op.operation} className="flex items-center justify-between">
												<span className="text-xs font-medium text-default-500 truncate max-w-[140px]">
													{op.operation.split(' ').pop()?.replace('/', '')}
												</span>
												<div className="flex items-center gap-3">
													{op.failureCount > 0 && (
														<span className="text-[10px] font-bold text-danger">-{op.failureCount}</span>
													)}
													<span className={`text-xs font-bold ${pct >= 95 ? 'text-emerald-400' : 'text-warning'}`}>
														{pct}%
													</span>
												</div>
											</div>
										);
									})}
							</div>
						</div>

						<div className="glass-card flex flex-col gap-6 p-6">
							<div className="flex items-center justify-between">
								<h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-default-400">
									<Globe className="h-4 w-4" />
									Torrentio
								</h3>
								{torrentioPct !== null && (
									<span className={`text-2xl font-black ${torrentioPct >= 80 ? 'text-emerald-400' : 'text-danger'}`}>
										{torrentioPct}%
									</span>
								)}
							</div>

							<div className="grid grid-cols-5 gap-1.5">
								{torrentioChecks.slice(0, 15).map((check, i) => (
									<div
										key={i}
										className={`h-2 rounded-sm ${check.ok ? 'bg-emerald-500' : 'bg-danger'}`}
										title={`${new Date(check.checkedAt).toLocaleTimeString()} - ${check.latencyMs}ms`}
									/>
								))}
							</div>

							<div className="mt-auto">
								<Link href="/stremio" className="group flex items-center justify-between rounded-xl bg-primary/10 p-3 transition-colors hover:bg-primary/20">
									<div className="flex flex-col gap-0.5">
										<span className="text-[10px] font-bold text-primary uppercase">Alternative</span>
										<span className="text-xs font-bold text-white">DMM Cast Addon</span>
									</div>
									<ChevronRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
								</Link>
							</div>
						</div>
					</div>

					{/* Charts Section */}
					<div className="glass-card p-6">
						<div className="mb-6 flex items-center justify-between">
							<h3 className="text-lg font-bold text-white font-mono uppercase tracking-tight">Status History</h3>
							<span className="text-xs font-bold text-default-400 uppercase tracking-widest">Global Samples</span>
						</div>
						<div className="w-full overflow-hidden rounded-xl bg-content1/30 p-4">
							<HistoryCharts />
						</div>
					</div>

					<footer className="flex flex-col items-center gap-4 pt-12 text-center border-t border-white/5">
						<p className="text-sm font-medium text-default-400">
							Maintained by the Debrid Media Manager Community
						</p>
						<Link href="/" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
							Return to Home
						</Link>
					</footer>
				</div>
			</main>
		</>
	);
};

RealDebridStatusPage.disableLibraryProvider = true;

export default RealDebridStatusPage;
