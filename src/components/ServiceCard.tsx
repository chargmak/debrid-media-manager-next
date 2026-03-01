import { AllDebridUser, RealDebridUser } from '@/hooks/auth';
import { TraktUser } from '@/services/trakt';
import { TorBoxUser } from '@/services/types';
import { Check, X, ArrowRight, Zap, Cloud, Play, Database } from 'lucide-react';
import Modal from '../components/modals/modal';
import { Button } from '@heroui/react';

interface ServiceCardProps {
	service: 'rd' | 'ad' | 'tb' | 'trakt';
	user: RealDebridUser | AllDebridUser | TraktUser | any | null;
	onTraktLogin: () => void;
	onLogout: (prefix: string) => void;
}

export function ServiceCard({ service, user, onTraktLogin, onLogout }: ServiceCardProps) {
	const showUserInfo = (service: string) => {
		let title = '';
		let html = '';
		let prefix = '';

		if (service === 'rd' && user && 'premium' in user) {
			const rdUser = user as RealDebridUser;
			const daysRemaining = rdUser.premium
				? Math.floor(rdUser.premium / (24 * 60 * 60))
				: Math.floor(
					(new Date(rdUser.expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
				);

			title = 'Real-Debrid';
			prefix = 'rd:';
			html = `
        <div class="text-left text-foreground">
          <p><strong>Username:</strong> ${rdUser.username}</p>
          <p><strong>Email:</strong> ${rdUser.email}</p>
          <p><strong>Points:</strong> ${rdUser.points}</p>
          <p><strong>Type:</strong> ${rdUser.type}</p>
          <p><strong>Days Remaining:</strong> ${daysRemaining}</p>
        </div>
      `;
		} else if (service === 'ad' && user && 'isPremium' in user) {
			const adUser = user as AllDebridUser;
			title = 'AllDebrid';
			prefix = 'ad:';
			html = `
        <div class="text-left text-foreground">
          <p><strong>Username:</strong> ${adUser.username}</p>
          <p><strong>Email:</strong> ${adUser.email}</p>
          <p><strong>Type:</strong> ${adUser.isPremium ? 'premium' : 'free'}</p>
          <p><strong>Premium Until:</strong> ${new Date(adUser.premiumUntil * 1000).toLocaleDateString()}</p>
		  <p><strong>Points:</strong> ${adUser.fidelityPoints}</p>
        </div>
      `;
		} else if (service === 'tb' && user) {
			const tbUser = user as TorBoxUser;
			title = 'Torbox';
			prefix = 'tb:';
			const premiumExpiry = new Date(tbUser.premium_expires_at);
			const isPremiumActive = premiumExpiry > new Date();

			html = `
        <div class="text-left text-foreground">
          <p><strong>Email:</strong> ${tbUser.email}</p>
          <p><strong>Created:</strong> ${tbUser.created_at ? new Date(tbUser.created_at).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Plan:</strong> ${tbUser.plan === 2 ? 'Pro' : tbUser.plan === 1 ? 'Standard' : tbUser.plan === 0 ? 'Essential' : `Free`}</p>
          <p><strong>Premium Status:</strong> ${isPremiumActive ? 'Active' : 'Inactive'}</p>
          <p><strong>Premium Expires:</strong> ${tbUser.premium_expires_at ? new Date(tbUser.premium_expires_at).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Downloads:</strong> ${tbUser.total_downloaded} torrents</p>
        </div>
      `;
		} else if (service === 'trakt' && user && 'user' in user) {
			const traktUser = user as TraktUser;
			title = 'Trakt';
			prefix = 'trakt:';
			html = `
        <div class="text-left text-foreground">
          <p><strong>Username:</strong> ${traktUser.user.username}</p>
          <p><strong>Joined:</strong> ${new Date(traktUser.user.joined_at).toLocaleDateString()}</p>
          <p><strong>VIP:</strong> ${traktUser.user.vip ? 'Yes' : 'No'}</p>
        </div>
      `;
		}

		Modal.fire({
			title,
			html,
			showCancelButton: true,
			confirmButtonText: 'Close',
			cancelButtonText: 'Logout',
			confirmButtonColor: '#8B5CF6',
			cancelButtonColor: '#EF4444',
			background: '#18181b',
			color: '#fff',
		}).then((result) => {
			if (result.isDismissed && result.dismiss === Modal.DismissReason.cancel) {
				Modal.fire({
					title: 'Confirm Logout',
					text: `Are you sure you want to logout from ${title}?`,
					icon: 'warning',
					showCancelButton: true,
					confirmButtonText: 'Yes, logout',
					cancelButtonText: 'No, cancel',
					confirmButtonColor: '#EF4444',
					cancelButtonColor: '#8B5CF6',
					background: '#18181b',
					color: '#fff',
				}).then((confirmResult) => {
					if (confirmResult.isConfirmed) {
						onLogout(prefix);
					}
				});
			}
		});
	};

	const getServiceConfig = () => {
		switch (service) {
			case 'rd': return { name: 'Real-Debrid', icon: <Zap className="h-4 w-4" />, color: 'primary' };
			case 'ad': return { name: 'AllDebrid', icon: <Cloud className="h-4 w-4" />, color: 'secondary' };
			case 'tb': return { name: 'Torbox', icon: <Database className="h-4 w-4" />, color: 'success' };
			case 'trakt': return { name: 'Trakt', icon: <Play className="h-4 w-4" />, color: 'danger' };
		}
	};

	const config = getServiceConfig();

	if (!user) {
		return (
			<button
				onClick={onTraktLogin}
				className="glass-card flex h-14 w-full items-center justify-between px-4 transition-all hover:bg-white/5 active:scale-[0.98]"
			>
				<div className="flex items-center gap-3">
					<div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${config.color}/10 text-${config.color}`}>
						{config.icon}
					</div>
					<div className="flex flex-col items-start">
						<span className="text-[10px] font-black uppercase tracking-wider text-default-400">Connect</span>
						<span className="text-sm font-bold text-white">{config.name}</span>
					</div>
				</div>
				<ArrowRight className="h-5 w-5 text-default-600" />
			</button>
		);
	}

	const renderUserInfo = () => {
		if (service === 'rd') {
			const rdUser = user as RealDebridUser;
			return (
				<div className="flex items-center gap-1.5">
					<span className="text-sm font-bold text-white">{rdUser.username}</span>
					{rdUser.premium ? <div className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(25,213,125,0.8)]" /> : <div className="h-1.5 w-1.5 rounded-full bg-danger" />}
				</div>
			);
		}
		if (service === 'ad') {
			const adUser = user as AllDebridUser;
			return (
				<div className="flex items-center gap-1.5">
					<span className="text-sm font-bold text-white">{adUser.username}</span>
					{adUser.isPremium ? <div className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(25,213,125,0.8)]" /> : <div className="h-1.5 w-1.5 rounded-full bg-danger" />}
				</div>
			);
		}
		if (service === 'tb') {
			const tbUser = user as TorBoxUser;
			const isPremium = tbUser?.premium_expires_at ? new Date(tbUser.premium_expires_at) > new Date() : false;
			return (
				<div className="flex items-center gap-1.5">
					<span className="text-sm font-bold text-white">{tbUser.email.split('@')[0]}</span>
					{isPremium ? <div className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(25,213,125,0.8)]" /> : <div className="h-1.5 w-1.5 rounded-full bg-danger" />}
				</div>
			);
		}
		if (service === 'trakt') {
			const traktUser = user as TraktUser;
			return (
				<div className="flex items-center gap-1.5">
					<span className="text-sm font-bold text-white">{traktUser.user.username}</span>
					<div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,112,243,0.8)]" />
				</div>
			);
		}
	};

	return (
		<button
			onClick={() => showUserInfo(service)}
			className="glass-card flex h-14 w-full items-center justify-between px-4 transition-all hover:bg-white/5 active:scale-[0.98]"
		>
			<div className="flex items-center gap-3">
				<div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${config.color}/10 text-${config.color}`}>
					{config.icon}
				</div>
				<div className="flex flex-col items-start">
					<span className="text-[10px] font-black uppercase tracking-wider text-default-400">Account</span>
					<span className="text-sm font-bold text-white">{config.name}</span>
				</div>
			</div>
			{renderUserInfo()}
		</button>
	);
}
