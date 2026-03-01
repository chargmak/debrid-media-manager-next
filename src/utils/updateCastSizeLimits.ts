import { updateAllDebridSizeLimits } from './allDebridCastApiClient';
import { updateTorBoxSizeLimits } from './torboxCastApiClient';

export const updateCastSizeLimits = async (
    movieSize?: string,
    episodeSize?: string,
    streamsLimit?: string,
    hideCast?: boolean
) => {
    if (typeof localStorage === 'undefined') return;

    const updatePromises: Promise<void>[] = [];

    // Update Real-Debrid cast settings
    const castToken = localStorage.getItem('rd:castToken');
    const clientIdRaw = localStorage.getItem('rd:clientId');
    const clientSecretRaw = localStorage.getItem('rd:clientSecret');
    const refreshTokenRaw = localStorage.getItem('rd:refreshToken');

    if (castToken && clientIdRaw && clientSecretRaw) {
        const clientId = JSON.parse(clientIdRaw);
        const clientSecret = JSON.parse(clientSecretRaw);
        const refreshToken = refreshTokenRaw ? JSON.parse(refreshTokenRaw) : null;

        updatePromises.push(
            fetch('/api/stremio/cast/updateSizeLimits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    clientSecret,
                    refreshToken,
                    movieMaxSize: movieSize !== undefined ? Number(movieSize) : undefined,
                    episodeMaxSize: episodeSize !== undefined ? Number(episodeSize) : undefined,
                    otherStreamsLimit:
                        streamsLimit !== undefined ? Number(streamsLimit) : undefined,
                    hideCastOption: hideCast,
                }),
            }).then(() => { })
        );
    }

    // Update TorBox cast settings
    const tbApiKey = localStorage.getItem('tb:apiKey');
    if (tbApiKey) {
        updatePromises.push(
            updateTorBoxSizeLimits(
                tbApiKey,
                movieSize !== undefined ? Number(movieSize) : undefined,
                episodeSize !== undefined ? Number(episodeSize) : undefined,
                streamsLimit !== undefined ? Number(streamsLimit) : undefined,
                hideCast
            )
        );
    }

    // Update AllDebrid cast settings
    const adApiKey = localStorage.getItem('ad:apiKey');
    if (adApiKey) {
        updatePromises.push(
            updateAllDebridSizeLimits(
                adApiKey,
                movieSize !== undefined ? Number(movieSize) : undefined,
                episodeSize !== undefined ? Number(episodeSize) : undefined,
                streamsLimit !== undefined ? Number(streamsLimit) : undefined,
                hideCast
            )
        );
    }

    try {
        await Promise.all(updatePromises);
    } catch (error) {
        console.error('Failed to update size limits on server:', error);
    }
};
