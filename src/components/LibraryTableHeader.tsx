interface LibraryTableHeaderProps {
	sortBy: {
		column: 'id' | 'filename' | 'title' | 'bytes' | 'progress' | 'status' | 'added';
		direction: 'asc' | 'desc';
	};
	onSort: (
		column: 'id' | 'filename' | 'title' | 'bytes' | 'progress' | 'status' | 'added'
	) => void;
	filteredListLength: number;
	selectedTorrentsSize: number;
}

export default function LibraryTableHeader({
	sortBy,
	onSort,
	filteredListLength,
	selectedTorrentsSize,
}: LibraryTableHeaderProps) {
	return (
		<tr className="whitespace-nowrap border-b border-divider text-xs bg-content1/80 backdrop-blur-md shadow-sm">
			<th
				className="w-6 min-w-6 max-w-6 px-1 py-3 text-default-500 font-medium cursor-pointer hover:text-default-700 transition-colors"
				onClick={() => onSort('id')}
			>
				<span className="hidden sm:inline">Select{selectedTorrentsSize ? ` (${selectedTorrentsSize})` : ''} </span>
				<span className="sm:hidden">✓</span>
				{sortBy.column === 'id' && (sortBy.direction === 'asc' ? '↑' : '↓')}
			</th>
			<th
				className="min-w-0 flex-1 px-2 py-3 text-default-500 font-medium text-left cursor-pointer hover:text-default-700 transition-colors"
				onClick={() => onSort('title')}
			>
				Title ({filteredListLength}){' '}
				{sortBy.column === 'title' && (sortBy.direction === 'asc' ? '↑' : '↓')}
			</th>
			<th
				className="w-14 min-w-14 max-w-14 px-1 py-3 text-default-500 font-medium text-center cursor-pointer hover:text-default-700 transition-colors"
				onClick={() => onSort('bytes')}
			>
				<span className="hidden sm:inline">Size </span>
				<span className="sm:hidden">GB</span>
				{sortBy.column === 'bytes' && (sortBy.direction === 'asc' ? '↑' : '↓')}
			</th>
			<th
				className="w-16 min-w-16 max-w-16 px-1 py-3 text-default-500 font-medium text-center cursor-pointer hover:text-default-700 transition-colors hidden sm:table-cell"
				onClick={() => onSort('progress')}
			>
				Status {sortBy.column === 'progress' && (sortBy.direction === 'asc' ? '↑' : '↓')}
			</th>
			<th
				className="w-20 min-w-20 max-w-20 px-1 py-3 text-default-500 font-medium text-center cursor-pointer hover:text-default-700 transition-colors hidden md:table-cell"
				onClick={() => onSort('added')}
			>
				Added {sortBy.column === 'added' && (sortBy.direction === 'asc' ? '↑' : '↓')}
			</th>
			<th className="w-20 min-w-20 max-w-28 px-1 py-3 text-default-500 font-medium text-center hidden sm:table-cell">
				<span className="hidden sm:inline">Actions</span>
				<span className="sm:hidden">…</span>
			</th>
		</tr>
	);
}
