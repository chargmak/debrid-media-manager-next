import { Settings } from 'lucide-react';
import { PerformanceSettings } from './settings/PerformanceSettings';
import { StremioCastSettings } from './settings/StremioCastSettings';
import { PlaybackSettings } from './settings/PlaybackSettings';
import { SearchDiscoverySettings } from './settings/SearchDiscoverySettings';
import { ManagementSettings } from './settings/ManagementSettings';
import { AdvancedSettings } from './settings/AdvancedSettings';

export const SettingsSection = () => {
	return (
		<div className="w-full max-w-xl mx-auto">
			<div className="flex items-center gap-3 text-foreground mb-6 px-2">
				<Settings className="h-6 w-6 text-primary" />
				<h1 className="text-2xl font-bold">Settings</h1>
			</div>

			<div className="flex flex-col gap-6">
				<PerformanceSettings />
				<StremioCastSettings />
				<PlaybackSettings />
				<SearchDiscoverySettings />
				<ManagementSettings />
				<AdvancedSettings />
			</div>
		</div>
	);
};
