import { ChevronLeft, ChevronRight, Home, Shuffle, X } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

interface GitHubFile {
	name: string;
	download_url: string;
}

interface HashlistNavState {
	files: string[]; // download_urls
	names: string[]; // file names
	currentIndex: number;
}

export default function HashlistsPage() {
	const router = useRouter();
	const [files, setFiles] = useState<GitHubFile[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingHash, setLoadingHash] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchHashlists() {
			try {
				const response = await fetch(
					'https://api.github.com/repos/debridmediamanager/hashlists/contents'
				);
				if (!response.ok) {
					throw new Error('Failed to fetch hashlists');
				}
				const data = await response.json();
				const htmlFiles = data.filter(
					(file: GitHubFile) => file.name.endsWith('.html') && file.name !== 'index.html'
				);
				setFiles(htmlFiles);
				if (htmlFiles.length > 0) {
					// Start with a random file
					const randomIndex = Math.floor(Math.random() * htmlFiles.length);
					setCurrentIndex(randomIndex);
					loadHashlist(htmlFiles, randomIndex);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load hashlists');
			} finally {
				setLoading(false);
			}
		}
		fetchHashlists();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function loadHashlist(fileList: GitHubFile[], index: number) {
		const file = fileList[index];
		if (!file) return;

		setLoadingHash(true);
		try {
			const response = await fetch(file.download_url);
			const html = await response.text();
			// Extract the hash from the iframe src
			const match = html.match(/src="https:\/\/debridmediamanager\.com\/hashlist#([^"]+)"/);
			if (match && match[1]) {
				// Store navigation state in sessionStorage
				const navState: HashlistNavState = {
					files: fileList.map((f) => f.download_url),
					names: fileList.map((f) => f.name),
					currentIndex: index,
				};
				sessionStorage.setItem('hashlistNav', JSON.stringify(navState));
				router.push(`/hashlist#${match[1]}`);
			} else {
				setError('Could not extract hashlist data');
				setLoadingHash(false);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load hashlist');
			setLoadingHash(false);
		}
	}

	const handlePrevious = useCallback(() => {
		const newIndex = Math.max(0, currentIndex - 1);
		setCurrentIndex(newIndex);
		loadHashlist(files, newIndex);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentIndex, files]);

	const handleNext = useCallback(() => {
		const newIndex = Math.min(files.length - 1, currentIndex + 1);
		setCurrentIndex(newIndex);
		loadHashlist(files, newIndex);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentIndex, files]);

	const handleRandom = useCallback(() => {
		if (files.length <= 1) return;
		let newIndex;
		do {
			newIndex = Math.floor(Math.random() * files.length);
		} while (newIndex === currentIndex);
		setCurrentIndex(newIndex);
		loadHashlist(files, newIndex);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [files, currentIndex]);

	const currentFile = files[currentIndex];

	return (
		<div className="flex h-screen flex-col items-center justify-center bg-black selection:bg-primary/30">
			<Head>
				<title>Hash Lists | Debrid Media Manager</title>
			</Head>

			{/* Control Panel */}
			<div className="flex w-full max-w-md flex-col items-center gap-8 p-6 text-center">
				<div className="flex flex-col items-center gap-4">
					<Home className="h-12 w-12 text-primary animate-pulse" />
					<h1 className="text-3xl font-bold tracking-tight text-white">Hash Lists Browser</h1>
					<p className="text-sm text-default-400">Discover and browse shared community lists</p>
				</div>

				<div className="glass-card flex items-center justify-center gap-3 p-4">
					<Link
						href="/"
						className="group flex h-10 w-10 items-center justify-center rounded-xl bg-content2/50 text-default-400 transition-all hover:bg-primary/20 hover:text-primary"
						title="Go Home"
					>
						<Home className="h-5 w-5 transition-transform group-hover:scale-110" />
					</Link>
					<button
						onClick={handlePrevious}
						disabled={currentIndex <= 0 || loading || loadingHash}
						className="flex h-10 w-10 items-center justify-center rounded-xl bg-content2/50 text-default-400 transition-all hover:bg-secondary/20 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
						title="Previous"
					>
						<ChevronLeft className="h-6 w-6" />
					</button>
					<button
						onClick={handleRandom}
						disabled={files.length <= 1 || loading || loadingHash}
						className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
						title="Random"
					>
						<Shuffle className="h-6 w-6" />
					</button>
					<button
						onClick={handleNext}
						disabled={currentIndex >= files.length - 1 || loading || loadingHash}
						className="flex h-10 w-10 items-center justify-center rounded-xl bg-content2/50 text-default-400 transition-all hover:bg-secondary/20 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
						title="Next"
					>
						<ChevronRight className="h-6 w-6" />
					</button>
					<Link
						href="/"
						className="group flex h-10 w-10 items-center justify-center rounded-xl bg-content2/50 text-default-400 transition-all hover:bg-danger/20 hover:text-danger"
						title="Close"
					>
						<X className="h-5 w-5 transition-transform group-hover:rotate-90" />
					</Link>
				</div>

				<div className="flex h-12 items-center justify-center px-4">
					{loading ? (
						<div className="flex items-center gap-2 text-primary">
							<div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
							<div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0.2s]" />
							<div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0.4s]" />
						</div>
					) : loadingHash ? (
						<p className="animate-pulse text-sm font-medium text-secondary">Switching list...</p>
					) : error ? (
						<p className="text-sm font-medium text-danger">{error}</p>
					) : currentFile ? (
						<div className="flex flex-col gap-1">
							<p className="text-sm font-bold text-white line-clamp-1">{currentFile.name}</p>
							<p className="text-xs text-default-400">
								{currentIndex + 1} of {files.length} lists
							</p>
						</div>
					) : (
						<p className="text-sm text-default-400">No hashlists found</p>
					)}
				</div>
			</div>
		</div>
	);
}
