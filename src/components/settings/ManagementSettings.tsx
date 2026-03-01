import { useState } from 'react';
import { getLocalStorageItemOrDefault, getLocalStorageBoolean } from '@/utils/browserStorage';
import { defaultDownloadMagnets, defaultAvailabilityCheckLimit } from '@/utils/settings';
import { Card, CardBody, Input, Switch, CardHeader, Divider } from '@heroui/react';

export const ManagementSettings = () => {
    const [downloadMagnets, setDownloadMagnets] = useState(() =>
        getLocalStorageBoolean('settings:downloadMagnets', defaultDownloadMagnets)
    );
    const [availabilityCheckLimit, setAvailabilityCheckLimit] = useState(() =>
        getLocalStorageItemOrDefault(
            'settings:availabilityCheckLimit',
            defaultAvailabilityCheckLimit
        )
    );
    const [includeTrackerStats, setIncludeTrackerStats] = useState(() =>
        getLocalStorageBoolean('settings:includeTrackerStats', false)
    );

    const handleDownloadMagnetsChange = (isSelected: boolean) => {
        setDownloadMagnets(isSelected);
        if (typeof localStorage !== 'undefined')
            localStorage.setItem('settings:downloadMagnets', String(isSelected));
    };

    const handleAvailabilityCheckLimitChange = (value: string) => {
        if (value === '' || /^\d+$/.test(value)) {
            setAvailabilityCheckLimit(value);
            if (typeof localStorage !== 'undefined')
                localStorage.setItem('settings:availabilityCheckLimit', value);
        }
    };

    const handleIncludeTrackerStatsChange = (isSelected: boolean) => {
        setIncludeTrackerStats(isSelected);
        if (typeof localStorage !== 'undefined')
            localStorage.setItem('settings:includeTrackerStats', String(isSelected));
    };

    return (
        <Card className="glass-card" shadow="none">
            <CardHeader className="flex flex-col items-start gap-1 px-6 pt-6 pb-2">
                <h3 className="text-lg font-bold text-foreground">Torrent Management</h3>
                <p className="text-xs text-default-400">Configure how torrents and checks are handled</p>
            </CardHeader>
            <CardBody className="gap-8 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Auto-Download Magnet Files</span>
                        <span className="text-xs text-default-400 text-pretty">Download .magnet files instead of copying to clipboard</span>
                    </div>
                    <Switch
                        isSelected={downloadMagnets}
                        onValueChange={handleDownloadMagnetsChange}
                        size="md"
                        color="primary"
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Availability Check Limit</span>
                        <span className="text-xs text-default-400">Max torrents to check at once (0 = no limit)</span>
                    </div>
                    <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={availabilityCheckLimit}
                        onValueChange={handleAvailabilityCheckLimitChange}
                        variant="flat"
                        radius="lg"
                        classNames={{
                            inputWrapper: "bg-content1/50 rounded-xl",
                        }}
                    />
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Tracker Statistics</span>
                        <span className="text-xs text-default-400 text-pretty">Fetch seeders/leechers during checks (slower but more detailed)</span>
                    </div>
                    <Switch
                        isSelected={includeTrackerStats}
                        onValueChange={handleIncludeTrackerStatsChange}
                        size="md"
                        color="primary"
                    />
                </div>
            </CardBody>
        </Card>
    );
};
