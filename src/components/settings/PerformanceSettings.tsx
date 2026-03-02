import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { getLocalStorageItemOrDefault } from '@/utils/browserStorage';
import { defaultEpisodeSize, defaultMovieSize } from '@/utils/settings';
import { updateCastSizeLimits } from '@/utils/updateCastSizeLimits';
import { Card, CardBody, Select, SelectItem } from '@heroui/react';

export const PerformanceSettings = () => {
    const [movieMaxSize, setMovieMaxSize] = useState(() =>
        getLocalStorageItemOrDefault('settings:movieMaxSize', defaultMovieSize)
    );
    const [episodeMaxSize, setEpisodeMaxSize] = useState(() =>
        getLocalStorageItemOrDefault('settings:episodeMaxSize', defaultEpisodeSize)
    );

    const handleMovieSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setMovieMaxSize(value);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('settings:movieMaxSize', value);
            updateCastSizeLimits(value, undefined, undefined);
        }
    };

    const handleEpisodeSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setEpisodeMaxSize(value);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('settings:episodeMaxSize', value);
            updateCastSizeLimits(undefined, value, undefined);
        }
    };

    return (
        <Card className="glass-card border-warning/20 bg-warning/5" shadow="none">
            <CardBody className="gap-6 p-6">
                <div className="flex items-center gap-3 rounded-lg bg-warning/10 p-3 text-sm font-medium text-warning">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p>Experiencing lag or buffering? Try smaller files</p>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-default-400">
                        <span>Check your connection:</span>
                        <a
                            href="https://real-debrid.com/speedtest"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary transition-colors hover:text-primary-400 hover:underline"
                        >
                            Real-Debrid
                        </a>
                        <span className="text-default-200">|</span>
                        <a
                            href="https://alldebrid.com/speedtest"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary transition-colors hover:text-primary-400 hover:underline"
                        >
                            AllDebrid
                        </a>
                        <span className="text-default-200">|</span>
                        <a
                            href="https://speedtest.torbox.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary transition-colors hover:text-primary-400 hover:underline"
                        >
                            Torbox
                        </a>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-foreground">Biggest movie size</span>
                            <Select
                                className="w-full"
                                placeholder="Select max size"
                                selectedKeys={[movieMaxSize]}
                                onChange={handleMovieSizeChange}
                                variant="flat"
                                radius="lg"
                                classNames={{
                                    base: "max-w-full",
                                    mainWrapper: "bg-content1/50 rounded-xl",
                                    trigger: "bg-transparent hover:bg-content2/50 transition-colors p-2",
                                }}
                            >
                                <SelectItem key="1">1 GB (~1.5 Mbps)</SelectItem>
                                <SelectItem key="3">3 GB (~4.5 Mbps)</SelectItem>
                                <SelectItem key="5">5 GB (~7.5 Mbps)</SelectItem>
                                <SelectItem key="15">15 GB (~22 Mbps)</SelectItem>
                                <SelectItem key="30">30 GB (~45 Mbps)</SelectItem>
                                <SelectItem key="60">60 GB (~90 Mbps)</SelectItem>
                                <SelectItem key="0">Biggest available</SelectItem>
                            </Select>

                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-foreground">Biggest episode size</span>
                                <Select
                                    className="w-full"
                                    placeholder="Select max size"
                                    selectedKeys={[episodeMaxSize]}
                                    onChange={handleEpisodeSizeChange}
                                    variant="flat"
                                    radius="lg"
                                    description="💡 applies to Stremio Cast addon selection"
                                    classNames={{
                                        base: "max-w-full",
                                        mainWrapper: "bg-content1/50 rounded-xl",
                                        trigger: "bg-transparent hover:bg-content2/50 transition-colors p-2",
                                    }}
                                >
                                    <SelectItem key="0.1">100 MB (~0.7 Mbps)</SelectItem>
                                    <SelectItem key="0.3">300 MB (~2 Mbps)</SelectItem>
                                    <SelectItem key="0.5">500 MB (~3.5 Mbps)</SelectItem>
                                    <SelectItem key="1">1 GB (~7 Mbps)</SelectItem>
                                    <SelectItem key="3">3 GB (~21 Mbps)</SelectItem>
                                    <SelectItem key="5">5 GB (~35 Mbps)</SelectItem>
                                    <SelectItem key="0">Biggest available</SelectItem>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};
