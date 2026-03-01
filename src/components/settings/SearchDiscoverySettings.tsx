import { useState } from 'react';
import { getLocalStorageItemOrDefault, getLocalStorageBoolean } from '@/utils/browserStorage';
import { defaultTorrentsFilter } from '@/utils/settings';
import { Card, CardBody, Input, Switch, CardHeader, Divider } from '@heroui/react';

export const SearchDiscoverySettings = () => {
    const [onlyTrustedTorrents, setOnlyTrustedTorrents] = useState(() =>
        getLocalStorageBoolean('settings:onlyTrustedTorrents', false)
    );
    const [defaultTorrentsFilterValue, setDefaultTorrentsFilterValue] = useState(() =>
        getLocalStorageItemOrDefault('settings:defaultTorrentsFilter', defaultTorrentsFilter)
    );
    const [enableTorrentio, setEnableTorrentio] = useState(() =>
        getLocalStorageBoolean('settings:enableTorrentio', true)
    );
    const [enableComet, setEnableComet] = useState(() =>
        getLocalStorageBoolean('settings:enableComet', true)
    );
    const [enableMediaFusion, setEnableMediaFusion] = useState(() =>
        getLocalStorageBoolean('settings:enableMediaFusion', true)
    );
    const [enablePeerflix, setEnablePeerflix] = useState(() =>
        getLocalStorageBoolean('settings:enablePeerflix', true)
    );
    const [enableTorrentsDB, setEnableTorrentsDB] = useState(() =>
        getLocalStorageBoolean('settings:enableTorrentsDB', true)
    );
    const [enableTorrentioTor, setEnableTorrentioTor] = useState(() =>
        getLocalStorageBoolean('settings:enableTorrentioTor', false)
    );
    const [enableCometTor, setEnableCometTor] = useState(() =>
        getLocalStorageBoolean('settings:enableCometTor', false)
    );
    const [enableMediaFusionTor, setEnableMediaFusionTor] = useState(() =>
        getLocalStorageBoolean('settings:enableMediaFusionTor', false)
    );
    const [enablePeerflixTor, setEnablePeerflixTor] = useState(() =>
        getLocalStorageBoolean('settings:enablePeerflixTor', false)
    );
    const [enableTorrentsDBTor, setEnableTorrentsDBTor] = useState(() =>
        getLocalStorageBoolean('settings:enableTorrentsDBTor', false)
    );

    const handleTorrentsFilterChange = (value: string) => {
        setDefaultTorrentsFilterValue(value);
        if (typeof localStorage !== 'undefined')
            localStorage.setItem('settings:defaultTorrentsFilter', value);
    };

    const createCheckboxHandler = (setter: React.Dispatch<React.SetStateAction<boolean>>, key: string) => (isSelected: boolean) => {
        setter(isSelected);
        if (typeof localStorage !== 'undefined')
            localStorage.setItem(`settings:${key}`, String(isSelected));
    };

    return (
        <Card className="glass-card" shadow="none">
            <CardHeader className="flex flex-col items-start gap-1 px-6 pt-6 pb-2">
                <h3 className="text-lg font-bold text-foreground">Search & Discovery</h3>
                <p className="text-xs text-default-400">Manage external scrapers and search filters</p>
            </CardHeader>
            <CardBody className="gap-8 px-6 py-4">
                <div className="space-y-4">
                    <Input
                        label="Default results filter"
                        placeholder="e.g. 2160p|1080p, supports regex"
                        value={defaultTorrentsFilterValue}
                        onValueChange={handleTorrentsFilterChange}
                        variant="flat"
                        radius="lg"
                        classNames={{
                            inputWrapper: "bg-content1/50 rounded-xl",
                        }}
                    />

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Trusted Sources Only</span>
                            <span className="text-xs text-default-400">Only show torrents from trusted uploaders</span>
                        </div>
                        <Switch
                            isSelected={onlyTrustedTorrents}
                            onValueChange={createCheckboxHandler(setOnlyTrustedTorrents, 'onlyTrustedTorrents')}
                            size="md"
                            color="primary"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">External Scrapers</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <Switch isSelected={enableTorrentio} onValueChange={createCheckboxHandler(setEnableTorrentio, 'enableTorrentio')} size="sm" color="primary">Torrentio</Switch>
                        <Switch isSelected={enableComet} onValueChange={createCheckboxHandler(setEnableComet, 'enableComet')} size="sm" color="primary">Comet</Switch>
                        <Switch isSelected={enableMediaFusion} onValueChange={createCheckboxHandler(setEnableMediaFusion, 'enableMediaFusion')} size="sm" color="primary">MediaFusion</Switch>
                        <Switch isSelected={enablePeerflix} onValueChange={createCheckboxHandler(setEnablePeerflix, 'enablePeerflix')} size="sm" color="primary">Peerflix</Switch>
                        <Switch isSelected={enableTorrentsDB} onValueChange={createCheckboxHandler(setEnableTorrentsDB, 'enableTorrentsDB')} size="sm" color="primary">TorrentsDB</Switch>
                    </div>

                    <p className="text-[11px] leading-relaxed text-default-400">
                        External sources provide additional cached links. Disable to use only DMM&apos;s internal index.
                    </p>
                </div>

                <div className="flex flex-col gap-4 rounded-xl border border-warning/20 bg-warning/5 p-4">
                    <span className="text-sm font-bold text-warning">Tor Proxy Options</span>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-warning">
                        <Switch isSelected={enableTorrentioTor} onValueChange={createCheckboxHandler(setEnableTorrentioTor, 'enableTorrentioTor')} size="sm" color="warning">Torrentio</Switch>
                        <Switch isSelected={enableCometTor} onValueChange={createCheckboxHandler(setEnableCometTor, 'enableCometTor')} size="sm" color="warning">Comet</Switch>
                        <Switch isSelected={enableMediaFusionTor} onValueChange={createCheckboxHandler(setEnableMediaFusionTor, 'enableMediaFusionTor')} size="sm" color="warning">MediaFusion</Switch>
                        <Switch isSelected={enablePeerflixTor} onValueChange={createCheckboxHandler(setEnablePeerflixTor, 'enablePeerflixTor')} size="sm" color="warning">Peerflix</Switch>
                        <Switch isSelected={enableTorrentsDBTor} onValueChange={createCheckboxHandler(setEnableTorrentsDBTor, 'enableTorrentsDBTor')} size="sm" color="warning">TorrentsDB</Switch>
                    </div>

                    <p className="text-[11px] leading-relaxed text-default-400">
                        Use Tor network to bypass rate limits (experimental, may be slower).
                    </p>
                </div>
            </CardBody>
        </Card>
    );
};
