import { TraktSearchResult } from '@/services/trakt';
import axios from 'axios';
import { Film, Loader2, Search, Tv, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Poster from './poster';
import { Modal, ModalContent, ModalHeader, ModalBody, Input } from '@heroui/react';

interface CastSearchModalProps {
	isOpen: boolean;
	onClose: () => void;
	torrentInfo: {
		title: string;
		filename: string;
		hash: string;
		files: Array<{ path: string; bytes: number }>;
	};
	onSelectImdbId: (imdbId: string) => void;
}

function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

export function CastSearchModal({
	isOpen,
	onClose,
	torrentInfo,
	onSelectImdbId,
}: CastSearchModalProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [suggestions, setSuggestions] = useState<TraktSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const debouncedQuery = useDebounce(searchQuery, 300);

	// Initialize search query with torrent title
	useEffect(() => {
		if (isOpen && !searchQuery) {
			// Clean up the title for search
			const cleanTitle = torrentInfo.title
				.replace(/\.(mkv|mp4|avi|mov)$/i, '')
				.replace(/\d{3,4}p/gi, '')
				.replace(/\b(BluRay|WEB-DL|WEBRip|HDTV|x264|x265|HEVC)\b/gi, '')
				.trim();
			setSearchQuery(cleanTitle);
		}
	}, [isOpen, torrentInfo.title, searchQuery]);

	useEffect(() => {
		const fetchSuggestions = async () => {
			if (debouncedQuery.length < 2) {
				setSuggestions([]);
				return;
			}

			setIsLoading(true);
			try {
				const response = await axios.get<TraktSearchResult[]>(
					`/api/trakt/search?query=${encodeURIComponent(debouncedQuery)}&types=movie,show`
				);
				setSuggestions(response.data.slice(0, 10));
			} catch (error) {
				console.error('Error fetching suggestions:', error);
				setSuggestions([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSuggestions();
	}, [debouncedQuery]);

	const handleSuggestionClick = (suggestion: TraktSearchResult) => {
		const media = suggestion.movie || suggestion.show;
		if (media?.ids?.imdb) {
			onSelectImdbId(media.ids.imdb);
		}
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="2xl" backdrop="blur" classNames={{
			base: "bg-background text-foreground",
		}}>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="flex flex-col gap-1">Cast to Stremio</ModalHeader>
						<ModalBody className="pb-6">
							{/* Torrent Info */}
							<div className="mb-2 rounded-md bg-default-100 p-4">
								<p className="mb-1 text-sm text-default-500">Torrent:</p>
								<p className="mb-2 font-medium text-foreground">{torrentInfo.filename}</p>
								<p className="text-xs text-default-400">
									{torrentInfo.files.length} file{torrentInfo.files.length !== 1 ? 's' : ''} •
									Hash: {torrentInfo.hash.substring(0, 8)}...
								</p>
							</div>

							{/* Search Input */}
							<div className="mb-2">
								<label className="mb-2 block text-sm font-medium text-default-600">
									Search for the movie or show:
								</label>
								<Input
									value={searchQuery}
									onValueChange={setSearchQuery}
									placeholder="Type to search..."
									startContent={<Search className="text-default-400" size={18} />}
									autoFocus
									variant="bordered"
								/>
							</div>

							{/* Loading State */}
							{isLoading && (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
								</div>
							)}

							{/* Results */}
							{!isLoading && suggestions.length > 0 && (
								<div className="max-h-96 space-y-2 overflow-y-auto pr-2">
									{suggestions.map((suggestion, index) => {
										const media = suggestion.movie || suggestion.show;
										if (!media?.ids?.imdb) return null;

										return (
											<button
												key={index}
												onClick={() => handleSuggestionClick(suggestion)}
												className="flex w-full items-center gap-4 rounded-md bg-default-50 p-3 text-left transition-colors hover:bg-default-200"
											>
												{/* Poster */}
												<div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded">
													<Poster imdbId={media.ids.imdb} title={media.title} />
												</div>

												{/* Info */}
												<div className="flex-1">
													<div className="flex items-center gap-2">
														{suggestion.type === 'movie' ? (
															<Film className="h-4 w-4 text-warning" />
														) : (
															<Tv className="h-4 w-4 text-primary" />
														)}
														<h3 className="font-semibold text-foreground">
															{media.title}
														</h3>
													</div>
													<p className="text-sm text-default-500">
														{media.year} •{' '}
														{suggestion.type === 'movie' ? 'Movie' : 'TV Show'}
													</p>
													{media.ids.imdb && (
														<p className="text-xs text-default-400">
															{media.ids.imdb}
														</p>
													)}
												</div>
											</button>
										);
									})}
								</div>
							)}

							{/* No Results */}
							{!isLoading && debouncedQuery.length >= 2 && suggestions.length === 0 && (
								<div className="py-8 text-center text-default-400">
									No results found. Try a different search term.
								</div>
							)}

							{/* Help Text */}
							{!isLoading && debouncedQuery.length < 2 && (
								<div className="py-8 text-center text-sm text-default-400">
									Type at least 2 characters to search
								</div>
							)}
						</ModalBody>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
