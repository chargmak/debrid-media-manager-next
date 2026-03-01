import SearchTokens from '@/components/SearchTokens';
import { RotateCcw, Search } from 'lucide-react';
import React from 'react';

interface SearchControlsProps {
	query: string;
	onQueryChange: (query: string) => void;
	filteredCount: number;
	totalCount: number;
	showMassReportButtons: boolean;
	rdKey: string | null;
	onMassReport: (type: 'porn' | 'wrong_imdb' | 'wrong_season') => void;
	mediaType: 'movie' | 'tv';
	title: string;
	year: string;
	isShow?: boolean;
	colorScales?: Array<{ threshold: number; color: string; label: string }>;
	getQueryForScale?: (threshold: number) => string;
}

const SearchControls: React.FC<SearchControlsProps> = ({
	query,
	onQueryChange,
	filteredCount,
	totalCount,
	showMassReportButtons,
	rdKey,
	onMassReport,
	mediaType,
	title,
	year,
	isShow,
	colorScales,
	getQueryForScale,
}) => {
	return (
		<>
			<div className="flex flex-col gap-2">
				<div className="mb-4 flex items-center border border-divider bg-content1/50 rounded-xl px-2 py-1 focus-within:border-primary/50 focus-within:bg-content2 transition-colors max-w-2xl mt-4">
					<Search className="h-4 w-4 text-default-400 ml-2 mr-1" />
					<input
						className="w-full appearance-none border-none bg-transparent px-2 py-2 text-sm font-medium leading-tight text-foreground focus:outline-none placeholder:text-default-400"
						type="text"
						id="query"
						placeholder="Filter results, supports regex"
						value={query}
						onChange={(e) => onQueryChange(e.target.value.toLocaleLowerCase())}
					/>
					<button
						className="mx-1 inline-flex cursor-pointer items-center justify-center rounded-lg bg-content2 px-3 py-1.5 text-xs font-semibold text-default-600 transition-colors hover:bg-content3 hover:text-foreground"
						onClick={() => onQueryChange('')}
						title="Reset search"
					>
						<RotateCcw className="h-3.5 w-3.5 mr-1" />
						<span className="hidden sm:inline">Reset</span>
					</button>
					<div className="flex items-center gap-1.5 px-3 py-1 bg-content2 rounded-lg text-xs font-semibold text-default-500 mr-1 whitespace-nowrap">
						<span className="text-secondary">{filteredCount}</span>
						<span>/</span>
						<span>{totalCount}</span>
					</div>
					{query && totalCount > 0 && rdKey && showMassReportButtons && (
						<div className="ml-2 flex gap-2">
							<button
								className="cursor-pointer whitespace-nowrap rounded-lg border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
								onClick={() => onMassReport('porn')}
								title="Report all filtered torrents as pornographic content"
							>
								Report as Porn ({totalCount})
							</button>
							<button
								className="cursor-pointer whitespace-nowrap rounded-lg border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
								onClick={() => onMassReport('wrong_imdb')}
								title="Report all filtered torrents as wrong IMDB ID"
							>
								Report Wrong IMDB ({totalCount})
							</button>
							{mediaType === 'tv' && (
								<button
									className="cursor-pointer whitespace-nowrap rounded-lg border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
									onClick={() => onMassReport('wrong_season')}
									title="Report all filtered torrents as wrong season"
								>
									Report Wrong Season ({totalCount})
								</button>
							)}
						</div>
					)}
				</div>

				<div className="mb-2 flex items-center gap-2 overflow-x-auto p-2">
					<SearchTokens
						title={title}
						year={year}
						isShow={isShow}
						onTokenClick={(token) => onQueryChange(query ? `${query} ${token}` : token)}
					/>
					{colorScales &&
						getQueryForScale &&
						colorScales.map((scale, idx) => (
							<span
								key={idx}
								className={`${scale.color} cursor-pointer whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold backdrop-blur-sm`}
								onClick={() => {
									const queryText = getQueryForScale(scale.threshold);
									const cleanedPrev = query.replace(/\bvideos:[^\s]+/g, '').trim();
									onQueryChange(
										cleanedPrev ? `${cleanedPrev} ${queryText}` : queryText
									);
								}}
							>
								{scale.label}
							</span>
						))}
				</div>
			</div>
		</>
	);
};

export default SearchControls;
