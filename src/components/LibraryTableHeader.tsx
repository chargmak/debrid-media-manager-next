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
				className="w-8 min-w-8 max-w-8 px-1 py-3 text-default-500 font-medium cursor-pointer hover:text-default-700 transition-colors"
				onClick={() => onSort('id')}
			>
				Select
				{selectedTorrentsSize ? ` (${selectedTorrentsSize})` : ''}{' '}
				{sortBy.column === 'id' && (sortBy.direction === 'asc' ? '↑' : '↓')}
			</th>
			<th
				className="w-[500px] min-w-96 max-w-[500px] px-2 py-3 text-default-500 font-medium text-left cursor-pointer hover:text-default-700 transition-colors"
				onClick={() => onSort('title')}
			>
				Title ({filteredListLength}){' '}
				{sortBy.column === 'title' && (sortBy.direction === 'asc' ? '↑' : '↓')}
			</th>
			<th
				className="w-20 min-w-20 max-w-20 px-2 py-3 text-default-500 font-medium text-center cursor-pointer hover:text-default-700 transition-colors"
				onClick={() => onSort('bytes')}
			>
				Size {sortBy.column === 'bytes' && (sortBy.direction === 'asc' ? '↑' : '↓')}
			</th>
			<th
				className="w-20 min-w-20 max-w-20 px-2 py-3 text-default-500 font-medium text-center cursor-pointer hover:text-default-700 transition-colors"
				onClick={() => onSort('progress')}
			>
				Status {sortBy.column === 'progress' && (sortBy.direction === 'asc' ? '↑' : '↓')}
			</th>
			<th
				className="w-24 min-w-24 max-w-28 px-2 py-3 text-default-500 font-medium text-center cursor-pointer hover:text-default-700 transition-colors"
				onClick={() => onSort('added')}
			>
				Added {sortBy.column === 'added' && (sortBy.direction === 'asc' ? '↑' : '↓')}
			</th>
			<th className="w-24 min-w-24 max-w-28 px-2 py-3 text-default-500 font-medium text-center">Actions</th>
		</tr>
	);
}
