import { Check, Link2 } from 'lucide-react';
import { useState } from 'react';
import { getLocalStorageBoolean } from '@/utils/browserStorage';
import {
    defaultMagnetHandlerEnabled,
    defaultShowCalendarAddButtonsApple,
    defaultShowCalendarAddButtonsGoogle,
} from '@/utils/settings';
import { Card, CardBody, Switch, CardHeader, Divider, Button, Input } from '@heroui/react';

export const AdvancedSettings = () => {
    const [isMagnetHandlerEnabled, setIsMagnetHandlerEnabled] = useState(() =>
        getLocalStorageBoolean('settings:magnetHandlerEnabled', defaultMagnetHandlerEnabled)
    );
    const [showCalendarAddButtonsGoogle, setShowCalendarAddButtonsGoogle] = useState(() =>
        getLocalStorageBoolean(
            'settings:showCalendarAddButtonsGoogle',
            defaultShowCalendarAddButtonsGoogle
        )
    );
    const [showCalendarAddButtonsApple, setShowCalendarAddButtonsApple] = useState(() =>
        getLocalStorageBoolean(
            'settings:showCalendarAddButtonsApple',
            defaultShowCalendarAddButtonsApple
        )
    );
    const [showMassReportButtons, setShowMassReportButtons] = useState(() =>
        getLocalStorageBoolean('settings:showMassReportButtons', false)
    );

    const handleShowCalendarAddButtonsGoogleChange = (isSelected: boolean) => {
        setShowCalendarAddButtonsGoogle(isSelected);
        if (typeof localStorage !== 'undefined')
            localStorage.setItem('settings:showCalendarAddButtonsGoogle', String(isSelected));
    };

    const handleShowCalendarAddButtonsAppleChange = (isSelected: boolean) => {
        setShowCalendarAddButtonsApple(isSelected);
        if (typeof localStorage !== 'undefined')
            localStorage.setItem('settings:showCalendarAddButtonsApple', String(isSelected));
    };

    const handleMassReportButtonsChange = (isSelected: boolean) => {
        setShowMassReportButtons(isSelected);
        if (typeof localStorage !== 'undefined')
            localStorage.setItem('settings:showMassReportButtons', String(isSelected));
    };

    const getBrowserSettingsInfo = () => {
        if (typeof navigator === 'undefined') {
            return { text: 'Browser protocol handler settings:', url: '' };
        }
        const ua = navigator.userAgent;
        if (ua.includes('Chrome') && !ua.includes('Edg')) {
            return {
                text: 'Chrome protocol handler settings:',
                url: 'chrome://settings/handlers',
            };
        } else if (ua.includes('Firefox')) {
            return {
                text: 'Firefox protocol handler settings:',
                url: 'about:preferences#general',
            };
        } else if (ua.includes('Edg')) {
            return {
                text: 'Edge protocol handler settings:',
                url: 'edge://settings/content/handlers',
            };
        }
        return {
            text: 'Browser protocol handler settings:',
            url: '',
        };
    };

    return (
        <Card className="glass-card" shadow="none">
            <CardHeader className="flex flex-col items-start gap-1 px-6 pt-6 pb-2">
                <h3 className="text-lg font-bold text-foreground">Advanced</h3>
                <p className="text-xs text-default-400">Low-level overrides and browser integration</p>
            </CardHeader>
            <CardBody className="gap-8 px-6 py-4">
                <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <span className="text-sm font-bold text-primary">Episode Calendar</span>
                    <div className="flex flex-col gap-3">
                        <Switch
                            isSelected={showCalendarAddButtonsGoogle}
                            onValueChange={handleShowCalendarAddButtonsGoogleChange}
                            size="sm"
                            color="primary"
                        >
                            Google Calendar buttons
                        </Switch>
                        <Switch
                            isSelected={showCalendarAddButtonsApple}
                            onValueChange={handleShowCalendarAddButtonsAppleChange}
                            size="sm"
                            color="primary"
                        >
                            Apple / .ics buttons
                        </Switch>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Mass Report Buttons</span>
                        <span className="text-xs text-default-400">Show extra actions for bulk reporting</span>
                    </div>
                    <Switch
                        isSelected={showMassReportButtons}
                        onValueChange={handleMassReportButtonsChange}
                        size="md"
                        color="secondary"
                    />
                </div>

                <div className="flex flex-col gap-6 pt-4">
                    <Button
                        color={isMagnetHandlerEnabled ? "success" : "primary"}
                        variant="flat"
                        className={`h-12 w-full font-bold transition-all ${isMagnetHandlerEnabled ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}
                        onPress={() => {
                            if (
                                typeof navigator !== 'undefined' &&
                                'registerProtocolHandler' in navigator
                            ) {
                                try {
                                    navigator.registerProtocolHandler(
                                        'magnet',
                                        `${(typeof location !== 'undefined' && location.origin) || ''}/library?addMagnet=%s`
                                    );
                                    if (typeof localStorage !== 'undefined')
                                        localStorage.setItem(
                                            'settings:magnetHandlerEnabled',
                                            'true'
                                        );
                                    setIsMagnetHandlerEnabled(true);
                                } catch (error) {
                                    console.error('Error registering protocol handler:', error);
                                }
                            }
                        }}
                        startContent={
                            isMagnetHandlerEnabled ? (
                                <Check className="h-5 w-5" />
                            ) : (
                                <Link2 className="h-5 w-5" />
                            )
                        }
                    >
                        {isMagnetHandlerEnabled
                            ? 'DMM is your default magnet handler'
                            : 'Set DMM as default magnet handler'}
                    </Button>

                    <div className="flex flex-col gap-3 rounded-lg bg-content1/30 p-4">
                        <p className="text-xs font-medium text-default-500">{getBrowserSettingsInfo().text}</p>
                        <Input
                            isReadOnly
                            value={getBrowserSettingsInfo().url}
                            variant="flat"
                            size="sm"
                            radius="lg"
                            classNames={{
                                input: "text-[10px]",
                                inputWrapper: "bg-content2/50",
                            }}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};
