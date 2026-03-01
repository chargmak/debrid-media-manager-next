import { ReactNode } from 'react';
import { Button } from '@heroui/react';

type ButtonVariant =
	| 'orange'
	| 'green'
	| 'indigo'
	| 'red'
	| 'teal'
	| 'yellow'
	| 'amber'
	| 'slate'
	| 'cyan';

interface LibraryButtonProps {
	variant: ButtonVariant;
	children: ReactNode;
	size?: 'xs' | 'sm';
	showCount?: number;
	className?: string;
	disabled?: boolean;
	onClick?: (e: any) => void;
}

const variantStyles: Record<ButtonVariant, string> = {
	orange: 'border-warning/20 bg-warning/10 text-warning hover:bg-warning/20',
	green: 'border-success/20 bg-success/10 text-success hover:bg-success/20',
	indigo: 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20',
	red: 'border-danger/20 bg-danger/10 text-danger hover:bg-danger/20',
	teal: 'border-secondary/20 bg-secondary/10 text-secondary hover:bg-secondary/20',
	yellow: 'border-[#FCD34D]/20 bg-[#FCD34D]/10 text-[#FCD34D] hover:bg-[#FCD34D]/20',
	amber: 'border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20',
	slate: 'border-default-400/20 bg-default-400/10 text-default-400 hover:bg-default-400/20 hover:text-foreground',
	cyan: 'border-[#22D3EE]/20 bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20',
};

export default function LibraryButton({
	variant,
	children,
	size = 'sm',
	showCount,
	className = '',
	disabled,
	...props
}: LibraryButtonProps) {
	const sizeClasses = size === 'xs' ? 'h-7 text-xs px-3 min-w-0' : 'h-9 text-xs font-semibold px-4 min-w-0';

	return (
		<Button
			className={`mb-2 mr-2 border backdrop-blur-sm transition-all ${sizeClasses} ${variantStyles[variant]} ${className}`}
			isDisabled={disabled}
			variant="flat"
			radius="md"
			{...props}
		>
			<span className="flex items-center gap-1.5 whitespace-nowrap">
				{children}
				{showCount !== undefined && showCount > 0 && ` (${showCount})`}
			</span>
		</Button>
	);
}
