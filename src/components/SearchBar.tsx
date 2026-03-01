import { TraktSearchResult } from '@/services/trakt';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Poster from './poster';
import { Input, Button, Card } from '@heroui/react';
import { Search } from 'lucide-react';

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

interface SearchBarProps {
	className?: string;
	placeholder?: string;
}

export function SearchBar({
	className = '',
	placeholder = 'Search movies & shows...',
}: SearchBarProps) {
	const router = useRouter();
	const [typedQuery, setTypedQuery] = useState('');
	const [suggestions, setSuggestions] = useState<TraktSearchResult[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const debouncedQuery = useDebounce(typedQuery, 300);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	useEffect(() => {
		const fetchSuggestions = async () => {
			if (debouncedQuery.length < 2) {
				setSuggestions([]);
				return;
			}

			try {
				const response = await axios.get<TraktSearchResult[]>(
					`/api/trakt/search?query=${encodeURIComponent(debouncedQuery)}&types=movie,show`
				);
				setSuggestions(response.data.slice(0, 6));
				setShowSuggestions(true);
			} catch (error) {
				console.error('Error fetching suggestions:', error);
			}
		};

		fetchSuggestions();
	}, [debouncedQuery]);

	const handleSuggestionClick = (suggestion: TraktSearchResult) => {
		const media = suggestion.movie || suggestion.show;
		if (media?.ids?.imdb) {
			setShowSuggestions(false);
			router.push(`/${suggestion.type}/${media.ids.imdb}`);
		} else {
			setTypedQuery(media?.title || '');
			router.push(`/search?query=${encodeURIComponent(media?.title || '')}`);
		}
	};

	const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!typedQuery) return;
		setShowSuggestions(false);
		if (/(tt\d{7,})/.test(typedQuery)) {
			const imdbid = typedQuery.match(/(tt\d{7,})/)?.[1];
			router.push(`/x/${imdbid}/`);
			return;
		}
		router.push(`/search?query=${encodeURIComponent(typedQuery)}`);
	};

	return (
		<div className={`relative ${className}`}>
			<form onSubmit={handleSearch} className="flex gap-2 w-full">
				<Input
					classNames={{
						base: "w-full",
						input: "text-base font-medium placeholder:text-default-400",
						inputWrapper: "h-14 bg-content2/50 backdrop-blur-xl border-white/5 transition-all hover:bg-content2/80 focus-within:bg-content2/80 group-data-[focus=true]:border-primary",
					}}
					placeholder={placeholder}
					value={typedQuery}
					onValueChange={setTypedQuery}
					onFocus={() => setShowSuggestions(true)}
					startContent={<Search className="text-primary min-w-5 min-h-5" />}
					radius="lg"
					variant="bordered"
					isClearable
					onClear={() => setTypedQuery('')}
				/>
				<Button
					type="submit"
					color="primary"
					className="h-14 px-8 text-base font-black uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
					radius="lg"
				>
					Search
				</Button>
			</form>

			{showSuggestions && suggestions.length > 0 && (
				<div
					ref={suggestionsRef as any}
					className="absolute z-50 mt-4 w-full overflow-hidden glass-card shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300"
				>
					<div className="flex flex-col">
						{suggestions.map((suggestion, index) => {
							const media = suggestion.movie || suggestion.show;
							if (!media) return null;
							return (
								<div
									key={`${media.ids?.trakt}-${index}`}
									className="group flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 first:rounded-t-3xl last:rounded-b-3xl"
									onClick={() => handleSuggestionClick(suggestion)}
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-sm font-bold text-white transition-colors group-hover:text-primary truncate">
												{media.title}
											</span>
											<span className="text-[10px] font-bold text-default-400">
												{media.year}
											</span>
										</div>
										<div className="flex items-center gap-2 mt-1">
											<span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${suggestion.type === 'movie' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
												{suggestion.type}
											</span>
										</div>
									</div>

									{media.ids?.imdb && (
										<div className="h-12 w-8 shrink-0 overflow-hidden rounded-md bg-content3/50 shadow-lg">
											<Poster
												imdbId={media.ids.imdb}
												title={media.title}
												className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
											/>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
