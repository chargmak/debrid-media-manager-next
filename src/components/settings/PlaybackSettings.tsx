import { useState } from 'react';
import { getLocalStorageItemOrDefault } from '@/utils/browserStorage';
import { defaultPlayer } from '@/utils/settings';
import { Card, CardBody, Select, SelectItem, SelectSection, CardHeader, Divider } from '@heroui/react';

export const PlaybackSettings = () => {
    const [storedPlayer, setStoredPlayer] = useState(() =>
        getLocalStorageItemOrDefault('settings:player', defaultPlayer)
    );

    const handlePlayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setStoredPlayer(value);
        if (typeof localStorage !== 'undefined') localStorage.setItem('settings:player', value);
    };

    return (
        <Card className="glass-card" shadow="none">
            <CardHeader className="flex flex-col items-start gap-1 px-6 pt-6 pb-2">
                <h3 className="text-lg font-bold text-foreground">Playback</h3>
                <p className="text-xs text-default-400">Choose your preferred video player for streaming</p>
            </CardHeader>
            <CardBody className="gap-4 px-6 py-4">
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">Video player</span>
                    <Select
                        placeholder="Select a player"
                        selectedKeys={[storedPlayer]}
                        onChange={handlePlayerChange}
                        variant="flat"
                        radius="lg"
                        className="w-full"
                        classNames={{
                            base: "max-w-full",
                            mainWrapper: "bg-content1/50 rounded-xl",
                            trigger: "bg-transparent hover:bg-content2/50 transition-colors p-2",
                        }}
                    >
                        <SelectSection title="Web">
                            <SelectItem key="web/rd">Real-Debrid Stream</SelectItem>
                        </SelectSection>
                        <SelectSection title="Android">
                            <SelectItem key="android/chooser">App chooser</SelectItem>
                            <SelectItem key="android/org.videolan.vlc">VLC</SelectItem>
                            <SelectItem key="android/com.mxtech.videoplayer.ad">MX Player</SelectItem>
                            <SelectItem key="android/com.mxtech.videoplayer.pro">MX Player Pro</SelectItem>
                            <SelectItem key="android/com.brouken.player">JustPlayer</SelectItem>
                        </SelectSection>
                        <SelectSection title="iOS">
                            <SelectItem key="ios2/open-vidhub">VidHub</SelectItem>
                            <SelectItem key="ios/infuse">Infuse</SelectItem>
                            <SelectItem key="ios/vlc">VLC</SelectItem>
                            <SelectItem key="ios/outplayer">Outplayer</SelectItem>
                        </SelectSection>
                        <SelectSection title="MacOS">
                            <SelectItem key="mac4/open-vidhub">VidHub</SelectItem>
                            <SelectItem key="mac/infuse">Infuse</SelectItem>
                            <SelectItem key="mac2/iina">IINA</SelectItem>
                            <SelectItem key="mac2/omniplayer">OmniPlayer</SelectItem>
                            <SelectItem key="mac2/figplayer">Fig Player</SelectItem>
                            <SelectItem key="mac3/nplayer-mac">nPlayer</SelectItem>
                        </SelectSection>
                        <SelectSection title="Windows">
                            <SelectItem key="windows/vlc">VLC</SelectItem>
                            <SelectItem key="windows/potplayer">PotPlayer</SelectItem>
                        </SelectSection>
                    </Select>
                </div>
            </CardBody>
        </Card>
    );
};
