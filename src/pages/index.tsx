import { BrowseSection } from '@/components/BrowseSection';
import { InfoSection } from '@/components/InfoSection';
import { Logo } from '@/components/Logo';
import { MainActions } from '@/components/MainActions';
import { SearchBar } from '@/components/SearchBar';
import { ServiceCard } from '@/components/ServiceCard';
import { TraktSection } from '@/components/TraktSection';
import { useCurrentUser, useDebridLogin } from '@/hooks/auth';
import { useCastToken } from '@/hooks/castToken';
import { getTerms } from '@/utils/browseTerms';
import { handleLogout } from '@/utils/logout';
import { checkPremiumStatus } from '@/utils/premiumCheck';
import { genericToastOptions } from '@/utils/toastOptions';
import { withAuth } from '@/utils/withAuth';
import { Settings, RefreshCw, Database, LogOut, ChevronRight } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Button, Spinner, Card, CardBody, Divider, Tooltip } from '@heroui/react';

function IndexPage() {
	const router = useRouter();
	const {
		rdUser,
		adUser,
		tbUser,
		rdError,
		adError,
		tbError,
		traktUser,
		traktError,
		hasRDAuth,
		hasADAuth,
		hasTBAuth,
		hasTraktAuth,
		isLoading,
	} = useCurrentUser();
	const { loginWithRealDebrid, loginWithAllDebrid, loginWithTorbox } = useDebridLogin();
	const [browseTerms] = useState(getTerms(2));

	useCastToken();

	useEffect(() => {
		if (typeof window !== 'undefined') {
			(window as any).registerMagnetHandler = () => {
				if ('registerProtocolHandler' in navigator) {
					try {
						navigator.registerProtocolHandler(
							'magnet',
							`${window.location.origin}/library?addMagnet=%s`
						);
					} catch (error) {
						console.error('Error registering protocol handler:', error);
					}
				}
			};
		}
	}, []);

	useEffect(() => {
		if (rdError) toast.error('RD load failed. Clear site data and sign in again.');
		if (adError) toast.error('AllDebrid fetch failed. Confirm your DMM login email.');
		if (tbError) toast.error('Torbox profile failed. Verify the API key in Settings.');
		if (traktError) toast.error('Trakt profile fetch failed.');
		if (localStorage.getItem('next_action') === 'clear_cache') {
			localStorage.removeItem('next_action');
			const request = window.indexedDB.deleteDatabase('DMMDB');
			request.onsuccess = function () { window.location.assign('/'); };
			request.onerror = function () { toast.error('Failed to delete local cache.', genericToastOptions); };
			request.onblocked = function () { toast('Local DB still open. Refresh and retry.', genericToastOptions); };
		}
	}, [rdError, adError, tbError, traktError]);

	useEffect(() => {
		if (rdUser) {
			checkPremiumStatus(rdUser).then(async ({ shouldLogout }) => {
				if (shouldLogout) await handleLogout('rd:', router);
			});
		}
	}, [rdUser, router]);

	const loginWithTrakt = async () => {
		const authUrl = `/api/trakt/auth?redirect=${window.location.origin}`;
		router.push(authUrl);
	};

	const handleClearCache = async () => {
		localStorage.setItem('next_action', 'clear_cache');
		window.location.assign('/');
	};

	const handleClearLocalStorage = () => {
		localStorage.clear();
		window.dispatchEvent(new Event('logout'));
		window.location.reload();
	};

	const isReady = !isLoading &&
		(rdUser || !hasRDAuth) &&
		(adUser || !hasADAuth) &&
		(tbUser || !hasTBAuth) &&
		(traktUser || !hasTraktAuth);

	return (
		<div className="relative min-h-screen bg-mesh bg-noise">
			<Head>
				<title>DMM — Debrid Media Manager</title>
				<meta name="robots" content="index, nofollow" />
			</Head>

			<Toaster position="bottom-right" toastOptions={{
				style: {
					background: '#18181B',
					color: '#FAFAFA',
					borderRadius: '12px',
					border: '1px solid rgba(255,255,255,0.06)',
					fontSize: '14px',
				}
			}} />

			{isReady ? (
				<div className="mx-auto max-w-lg px-4 pb-16 pt-8 animate-fade-in">
					{/* Header */}
					<div className="flex items-center justify-between mb-8">
						<Logo size="md" showText />
						<div className="flex items-center gap-1">
							<Tooltip content="Settings" placement="bottom">
								<Button
									as={Link}
									href="/settings"
									isIconOnly
									variant="light"
									radius="full"
									className="text-default-400 hover:text-foreground"
								>
									<Settings className="h-5 w-5" />
								</Button>
							</Tooltip>
						</div>
					</div>

					{/* Search */}
					<div className="mb-8">
						<SearchBar />
					</div>

					{/* Quick Actions */}
					<div className="mb-8 stagger-children">
						<MainActions
							rdUser={rdUser}
							tbUser={tbUser}
							adUser={!!adUser}
							isLoading={isLoading}
						/>
					</div>

					{/* Browse & Trakt */}
					<div className="flex flex-col gap-6 mb-8 stagger-children">
						<BrowseSection terms={browseTerms} />
						<TraktSection traktUser={traktUser} />
					</div>

					{/* Services */}
					<div className="mb-8">
						<h2 className="text-xs font-semibold uppercase tracking-wider text-default-400 mb-3 px-1">
							Connected Services
						</h2>
						<div className="flex flex-col gap-2.5 stagger-children">
							<ServiceCard
								service="rd"
								user={rdUser}
								onTraktLogin={loginWithRealDebrid}
								onLogout={async (prefix) => await handleLogout(prefix, router)}
							/>
							<ServiceCard
								service="ad"
								user={adUser}
								onTraktLogin={loginWithAllDebrid}
								onLogout={async (prefix) => await handleLogout(prefix, router)}
							/>
							<ServiceCard
								service="tb"
								user={tbUser}
								onTraktLogin={loginWithTorbox}
								onLogout={async (prefix) => await handleLogout(prefix, router)}
							/>
							<ServiceCard
								service="trakt"
								user={traktUser}
								onTraktLogin={loginWithTrakt}
								onLogout={async (prefix) => await handleLogout(prefix, router)}
							/>
						</div>
					</div>

					{/* Info */}
					<InfoSection />

					{/* Footer Actions */}
					<Divider className="my-6" />
					<div className="grid grid-cols-3 gap-3">
						<button
							onClick={() => window.location.reload()}
							className="glass-card flex h-12 flex-col items-center justify-center gap-1 transition-all hover:bg-white/5 active:scale-95"
						>
							<RefreshCw className="h-4 w-4 text-default-400" />
							<span className="text-[8px] font-black uppercase tracking-widest text-default-500">Refresh</span>
						</button>
						<button
							onClick={() => handleClearCache()}
							className="glass-card flex h-12 flex-col items-center justify-center gap-1 transition-all hover:bg-white/5 active:scale-95"
						>
							<Database className="h-4 w-4 text-default-400" />
							<span className="text-[8px] font-black uppercase tracking-widest text-default-500">Clear Cache</span>
						</button>
						<button
							onClick={async () => await handleLogout(undefined, router)}
							className="glass-card flex h-12 flex-col items-center justify-center gap-1 bg-danger/5 transition-all hover:bg-danger/10 active:scale-95 border-danger/20"
						>
							<LogOut className="h-4 w-4 text-danger" />
							<span className="text-[8px] font-black uppercase tracking-widest text-danger/80">Logout</span>
						</button>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center min-h-screen gap-6">
					<Logo size="lg" />
					<Spinner size="lg" color="primary" />
					<p className="text-sm text-default-400 animate-pulse">Loading your library...</p>
					<Button
						variant="flat"
						color="warning"
						size="sm"
						onClick={handleClearLocalStorage}
						className="mt-4 font-medium"
					>
						Clear Data & Reload
					</Button>
				</div>
			)}
		</div>
	);
}

export default withAuth(IndexPage);
