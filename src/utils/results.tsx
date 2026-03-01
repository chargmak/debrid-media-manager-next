import { SearchResult } from '@/services/mediasearch';
import { Download, Zap } from 'lucide-react';

export const borderColor = (downloaded: boolean, downloading: boolean) =>
	downloaded
		? 'border-success shadow-[0_0_15px_rgba(23,201,100,0.15)] ring-1 ring-success'
		: downloading
			? 'border-warning shadow-[0_0_15px_rgba(245,165,36,0.15)] ring-1 ring-warning'
			: 'border-divider';

export const fileSize = (size: number) => (size / 1024).toFixed(2);

export const getBtnClasses = (avail: boolean, noVideos: boolean) => {
	if (avail) {
		return 'border-success/30 bg-success/10 text-success hover:bg-success/20';
	}
	if (noVideos) {
		return 'border-default-400/30 bg-default-400/10 text-default-400 hover:bg-default-400/20';
	}
	return 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20';
};

export const btnColor = (avail: boolean, noVideos: boolean) =>
	avail ? 'success' : noVideos ? 'default' : 'primary';

export const torrentPrefix = (id: string) =>
	id.startsWith('rd:') ? (
		<span className="rounded-md bg-success/20 px-1 py-0.5 text-[10px] font-bold text-success border border-success/30">RD</span>
	) : id.startsWith('tb:') ? (
		<span className="rounded-md bg-secondary/20 px-1 py-0.5 text-[10px] font-bold text-secondary border border-secondary/30">TB</span>
	) : (
		<span className="rounded-md bg-warning/20 px-1 py-0.5 text-[10px] font-bold text-warning border border-warning/30">AD</span>
	);

export const btnIcon = (avail: boolean) =>
	avail ? (
		<Zap className="mr-1.5 inline h-3.5 w-3.5 text-warning" />
	) : (
		<Download className="mr-1.5 inline h-3.5 w-3.5" />
	);

export const btnLabel = (avail: boolean, debridService: string) =>
	avail ? <span className="font-bold">Instant {debridService}</span> : `DL with ${debridService}`;

export const sortByMedian = (searchResults: SearchResult[]): SearchResult[] => {
	searchResults.sort((a, b) => {
		// First compare availability
		const aAvailable = a.rdAvailable || a.adAvailable;
		const bAvailable = b.rdAvailable || b.adAvailable;
		if (aAvailable !== bAvailable) {
			return bAvailable ? 1 : -1;
		}

		// Sort by medianFileSize
		const aSort = a.videoCount > 0 ? a.medianFileSize : a.fileSize / 1024;
		const bSort = b.videoCount > 0 ? b.medianFileSize : b.fileSize / 1024;
		if (aSort !== bSort) {
			return bSort - aSort;
		}

		// If median sizes are equal, sort by video count
		if (a.videoCount !== b.videoCount) {
			return b.videoCount - a.videoCount;
		}

		// If video counts are equal, sort alphabetically
		const titleA = a.title || '';
		const titleB = b.title || '';
		return titleA.localeCompare(titleB);
	});
	return searchResults;
};

export const sortByBiggest = (searchResults: SearchResult[]): SearchResult[] => {
	searchResults.sort((a, b) => {
		// First compare availability
		const aAvailable = a.rdAvailable || a.adAvailable;
		const bAvailable = b.rdAvailable || b.adAvailable;
		if (aAvailable !== bAvailable) {
			return bAvailable ? 1 : -1;
		}

		// If both have same availability, then sort by size
		const aSort = a.videoCount > 0 ? a.biggestFileSize * 1_000_000 : a.fileSize;
		const bSort = b.videoCount > 0 ? b.biggestFileSize * 1_000_000 : b.fileSize;
		if (aSort !== bSort) {
			return bSort - aSort;
		}

		// Third priority: hash (alphabetically)
		return a.hash.localeCompare(b.hash);
	});
	return searchResults;
};
