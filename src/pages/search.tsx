import Poster from '@/components/poster';
import { withAuth } from '@/utils/withAuth';
import getConfig from 'next/config';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { SearchResult } from './api/search/title';
import { Button, Input, Spinner, Card, CardBody, CardFooter } from '@heroui/react';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

function Search() {
	const { publicRuntimeConfig: config } = getConfig();
	const [query, setQuery] = useState('');
	const [typedQuery, setTypedQuery] = useState('');
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [miscResults, setMiscResults] = useState<Record<string, string[]>>({});

	const router = useRouter();

	const handleSubmit = useCallback(
		(e?: React.FormEvent<HTMLFormElement>) => {
			if (e) e.preventDefault();
			if (!typedQuery) return;
			setErrorMessage('');
			setSearchResults([]);
			setMiscResults({});
			if (/(tt\d{7,})/.test(typedQuery)) {
				setLoading(true);
				const imdbid = typedQuery.match(/(tt\d{7,})/)?.[1];
				router.push(`/x/${imdbid}/`);
				return;
			}
			router.push({
				query: { query: typedQuery },
			});
		},
		[router, typedQuery]
	);

	useEffect(() => {
		if (Object.keys(router.query).length === 0) return;
		const { query: searchQuery } = router.query;
		const decodedQuery = decodeURIComponent(searchQuery as string);
		if (typedQuery !== decodedQuery) setTypedQuery(decodedQuery);
		setQuery(decodedQuery);
		fetchData(decodedQuery);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router.query]);

	const fetchMiscData = async (q: string) => {
		try {
			let path = `api/search/misc?keyword=${q}`;
			if (config.externalSearchApiHostname) {
				path = encodeURIComponent(path);
			}
			let endpoint = `${config.externalSearchApiHostname || ''}/${path}`;
			const res = await fetch(endpoint);
			const data = await res.json();
			if (Object.keys(data).length > 0) setMiscResults(data);
			else fetchMiscData('');
		} catch (error: any) {
			console.error(error);
		}
	};

	const fetchData = async (q: string) => {
		setMiscResults({});
		setErrorMessage('');
		setLoading(true);
		setSearchResults([]);
		try {
			let path = `api/search/title?keyword=${q}`;
			if (config.externalSearchApiHostname) {
				path = encodeURIComponent(path);
			}
			let endpoint = `${config.externalSearchApiHostname || ''}/${path}`;
			const res = await fetch(endpoint);
			const data = await res.json();
			if (data.errorMessage) throw new Error(data.errorMessage);
			setSearchResults(data.results);
		} catch (error: any) {
			setSearchResults([]);
			console.error('[Search] fetchData failed', { query: q, error });
			const fallbackMessage = 'Failed to fetch search results; try again soon.';
			const parsedMessage =
				error instanceof Error && error.message ? error.message : String(error);
			setErrorMessage(
				parsedMessage.includes('Failed to fetch search results')
					? parsedMessage
					: fallbackMessage
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative min-h-screen bg-mesh bg-noise pb-20">
			<Head>
				<title>{`DMM — Search: ${query || 'Media'}`}</title>
			</Head>
			<Toaster position="bottom-right" toastOptions={{
				style: { background: '#18181B', color: '#FAFAFA', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }
			}} />

			{/* Header area */}
			<div className="sticky top-0 z-50 w-full bg-background/60 backdrop-blur-xl border-b border-divider">
				<div className="mx-auto max-w-7xl px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
					<div className="flex items-center gap-4">
						<Button
							as={Link}
							href="/"
							isIconOnly
							variant="light"
							size="sm"
							className="text-default-500 hover:text-foreground hover:bg-default-100"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div className="hidden sm:block">
							<Logo size="sm" />
						</div>
					</div>

					{/* Search Form */}
					<form onSubmit={handleSubmit} className="flex-1 flex w-full max-w-2xl mx-auto">
						<Input
							type="text"
							placeholder="Search movies, shows, or IMDb IDs..."
							value={typedQuery}
							onValueChange={setTypedQuery}
							size="lg"
							classNames={{
								base: "w-full",
								input: "text-base font-medium",
								inputWrapper: "h-12 bg-content1/80 hover:bg-content2 focus-within:bg-content2 border border-divider shadow-sm rounded-r-none border-r-0 transition-colors",
							}}
							startContent={<SearchIcon className="text-primary hidden sm:block mr-1" size={18} />}
						/>
						<Button
							type="submit"
							color="primary"
							variant="shadow"
							className="h-12 px-6 rounded-l-none font-semibold shadow-glow-sm"
							isDisabled={!typedQuery.trim()}
						>
							Search
						</Button>
					</form>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="mx-auto max-w-7xl px-4 pt-8 animate-fade-in">
				{/* Query Header */}
				{query && !loading && searchResults.length > 0 && (
					<div className="mb-6 flex items-center justify-between animate-slide-up">
						<h2 className="text-xl font-bold tracking-tight text-foreground">
							Results for <span className="text-primary">"{query}"</span>
						</h2>
						<span className="text-sm font-medium text-default-400 bg-content2 px-3 py-1 rounded-full border border-divider">
							{searchResults.length} found
						</span>
					</div>
				)}

				{loading && (
					<div className="flex flex-col items-center justify-center py-20 animate-fade-in">
						<Spinner size="lg" color="primary" />
						<p className="mt-4 text-sm font-medium text-default-500 animate-pulse">Searching the database...</p>
					</div>
				)}

				{errorMessage && (
					<Card className="mx-auto max-w-2xl bg-danger/10 border-danger/20 shadow-none animate-slide-up">
						<CardBody className="py-4 px-6">
							<p className="text-danger flex items-center gap-2">
								<span className="font-bold flex-shrink-0">Error:</span> {errorMessage}
							</p>
						</CardBody>
					</Card>
				)}

				{/* Results Grid */}
				{searchResults.length > 0 && !loading && (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 stagger-children">
						{searchResults.map((result: SearchResult) => (
							<Card
								key={result.imdbid}
								isPressable
								as={Link}
								href={result.type === 'movie' ? `/movie/${result.imdbid}` : `/show/${result.imdbid}`}
								className="group bg-content1/20 hover:bg-content2/60 border border-transparent hover:border-divider transition-all overflow-hidden h-full flex flex-col"
								shadow="none"
							>
								{/* Image Container with precise aspect ratio */}
								<div className="relative w-full pb-[150%] bg-default-100 overflow-hidden">
									<div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
										<Poster imdbId={result.imdbid} title={result.title} />
									</div>
									<div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

									<div className="absolute bottom-2 left-2 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
										<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/90 text-white shadow-sm backdrop-blur-md">
											{result.type}
										</span>
									</div>
								</div>

								{/* Info Area */}
								<CardFooter className="flex-col items-start gap-1 p-3 bg-content1/50 backdrop-blur-md border-t border-divider/50 flex-1 justify-start">
									<h3 className="text-sm font-semibold truncate w-full text-foreground group-hover:text-primary transition-colors" title={result.title}>
										{result.title}
									</h3>
									<div className="text-xs font-medium text-default-400">
										{result.year || 'Unknown Year'}
									</div>
								</CardFooter>
							</Card>
						))}
					</div>
				)}

				{!loading && searchResults.length === 0 && Object.keys(router.query).length !== 0 && !errorMessage && (
					<div className="flex flex-col items-center justify-center py-20 text-center animate-slide-up">
						<div className="w-16 h-16 rounded-2xl bg-content2/50 flex items-center justify-center border border-divider mb-4 hidden sm:flex">
							<SearchIcon className="h-6 w-6 text-default-400" />
						</div>
						<h2 className="text-xl font-semibold text-foreground">
							No results for "<span className="text-primary">{query}</span>"
						</h2>
						<p className="mt-2 text-sm text-default-500 max-w-sm">
							Check all spellings, try a more general search term, or paste an exact IMDb ID (e.g. tt1234567).
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default withAuth(Search);
