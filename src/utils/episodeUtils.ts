export const getColorScale = (expectedEpisodeCount: number) => {
	const scale = [
		{ threshold: 1, color: 'bg-zinc-900/95 text-default-600 border border-divider', label: 'Single' },
		{ threshold: expectedEpisodeCount - 1, color: 'bg-warning/20 text-warning border border-warning/30 bg-zinc-900/40', label: 'Incomplete' },
		{ threshold: expectedEpisodeCount, color: 'bg-success/20 text-success border border-success/30 bg-green-950/40', label: 'Complete' },
		{ threshold: Infinity, color: 'bg-primary/20 text-primary border border-primary/30 bg-blue-950/40', label: 'With extras' },
	];
	return scale;
};

export const getQueryForEpisodeCount = (videoCount: number, expectedEpisodeCount: number) => {
	if (videoCount === 1) return 'videos:1'; // Single episode
	if (videoCount === expectedEpisodeCount) return `videos:${expectedEpisodeCount}`; // Complete
	if (videoCount < expectedEpisodeCount) return `videos:>1 videos:<${expectedEpisodeCount}`; // Incomplete
	return `videos:>${expectedEpisodeCount}`; // With extras
};

export const getEpisodeCountClass = (
	videoCount: number,
	expectedEpisodeCount: number,
	isInstantlyAvailable: boolean
) => {
	if (!isInstantlyAvailable) return ''; // No color for unavailable torrents
	const scale = getColorScale(expectedEpisodeCount);
	for (let i = 0; i < scale.length; i++) {
		if (videoCount <= scale[i].threshold) {
			return scale[i].color;
		}
	}
	return scale[scale.length - 1].color;
};

export const getEpisodeCountLabel = (videoCount: number, expectedEpisodeCount: number) => {
	if (videoCount === 1) return `Single`;
	if (videoCount < expectedEpisodeCount)
		return `Incomplete (${videoCount}/${expectedEpisodeCount})`;
	if (videoCount === expectedEpisodeCount)
		return `Complete (${videoCount}/${expectedEpisodeCount})`;
	return `With extras (${videoCount}/${expectedEpisodeCount})`;
};

export const getExpectedEpisodeCount = (
	seasonNum: string | undefined,
	counts: Record<number, number>
) => {
	if (!seasonNum) return 13;
	const num = parseInt(seasonNum);
	return counts[num] || 13;
};
