import { useState } from 'react';
import { getLocalStorageItemOrDefault, getLocalStorageBoolean } from '@/utils/browserStorage';
import { defaultOtherStreamsLimit } from '@/utils/settings';
import { updateCastSizeLimits } from '@/utils/updateCastSizeLimits';
import { Card, CardBody, Select, SelectItem, Switch, CardHeader, Divider } from '@heroui/react';

export const StremioCastSettings = () => {
    const [otherStreamsLimit, setOtherStreamsLimit] = useState(() =>
        getLocalStorageItemOrDefault('settings:otherStreamsLimit', defaultOtherStreamsLimit)
    );
    const [hideCastOption, setHideCastOption] = useState(() =>
        getLocalStorageBoolean('settings:hideCastOption', false)
    );

    const handleOtherStreamsLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setOtherStreamsLimit(value);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('settings:otherStreamsLimit', value);
            updateCastSizeLimits(undefined, undefined, value);
        }
    };

    const handleHideCastOptionChange = (isSelected: boolean) => {
        setHideCastOption(isSelected);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('settings:hideCastOption', String(isSelected));
            updateCastSizeLimits(undefined, undefined, undefined, isSelected);
        }
    };

    return (
        <Card className="glass-card border-secondary/20 bg-secondary/5" shadow="none">
            <CardHeader className="flex flex-col items-start gap-1 px-6 pt-6 pb-2">
                <h3 className="text-lg font-bold text-secondary">Stremio Cast</h3>
                <p className="text-xs text-default-400">Configure how your content appears in Stremio</p>
            </CardHeader>
            <CardBody className="gap-8 px-6 py-4">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Community Streams Limit</span>
                        <span className="text-xs text-default-400">How many community streams to show in the addon</span>
                    </div>
                    <Select
                        placeholder="Select limit"
                        selectedKeys={[otherStreamsLimit]}
                        onChange={handleOtherStreamsLimitChange}
                        variant="flat"
                        radius="lg"
                        classNames={{
                            base: "max-w-full",
                            mainWrapper: "bg-content1/50 rounded-xl",
                            trigger: "bg-transparent hover:bg-content2/50 transition-colors",
                        }}
                    >
                        <SelectItem key="0">Don&apos;t show other streams</SelectItem>
                        <SelectItem key="1">1 stream</SelectItem>
                        <SelectItem key="2">2 streams</SelectItem>
                        <SelectItem key="3">3 streams</SelectItem>
                        <SelectItem key="4">4 streams</SelectItem>
                        <SelectItem key="5">5 streams</SelectItem>
                    </Select>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Hide Casting Option</span>
                        <span className="text-xs text-default-400 text-pretty">Remove the &quot;Cast a file&quot; option from Stremio streams</span>
                    </div>
                    <Switch
                        isSelected={hideCastOption}
                        onValueChange={handleHideCastOptionChange}
                        size="md"
                        color="secondary"
                    />
                </div>
            </CardBody>
        </Card>
    );
};
