import React from 'react';

interface LogoProps {
	size?: 'sm' | 'md' | 'lg' | 'xl';
	showText?: boolean;
	className?: string;
}

const sizes = {
	sm: { icon: 'h-8 w-8', text: 'text-lg' },
	md: { icon: 'h-12 w-12', text: 'text-xl' },
	lg: { icon: 'h-16 w-16', text: 'text-2xl' },
	xl: { icon: 'h-24 w-24', text: 'text-3xl' },
};

export const Logo: React.FC<LogoProps> = ({ size = 'lg', showText = false, className = '' }) => {
	const s = sizes[size];

	return (
		<div className={`flex items-center gap-4 ${className}`}>
			<div className={`relative ${s.icon}`}>
				<svg
					viewBox="0 0 100 100"
					className="h-full w-full drop-shadow-[0_0_15px_rgba(0,112,243,0.5)]"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<defs>
						<linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor="#0070F3" />
							<stop offset="100%" stopColor="#7928CA" />
						</linearGradient>
						<filter id="glow">
							<feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
							<feMerge>
								<feMergeNode in="coloredBlur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					{/* Background Shape */}
					<rect x="10" y="10" width="80" height="80" rx="20" fill="url(#logo-gradient)" fillOpacity="0.1" stroke="url(#logo-gradient)" strokeWidth="2" />

					{/* Inner Symbol */}
					<path
						d="M30 35C30 32.2386 32.2386 30 35 30H65C67.7614 30 70 32.2386 70 35V65C70 67.7614 67.7614 70 65 70H35C32.2386 70 30 67.7614 30 65V35Z"
						stroke="url(#logo-gradient)"
						strokeWidth="4"
						strokeLinecap="round"
					/>
					<path
						d="M45 42H55M42 50H58M45 58H55"
						stroke="url(#logo-gradient)"
						strokeWidth="4"
						strokeLinecap="round"
					/>
				</svg>
			</div>
			{showText && (
				<div className="flex flex-col">
					<span className={`${s.text} font-black tracking-tighter text-white uppercase`}>
						DMM<span className="text-primary italic ml-1">NEXT</span>
					</span>
					<span className="text-[10px] font-black uppercase tracking-[0.2em] text-default-400">
						Debrid Media Manager Next
					</span>
				</div>
			)}
		</div>
	);
};
