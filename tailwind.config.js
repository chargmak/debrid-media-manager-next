const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./app/**/*.{js,ts,jsx,tsx}',
		'./pages/**/*.{js,ts,jsx,tsx}',
		'./components/**/*.{js,ts,jsx,tsx}',
		'./src/**/*.{js,ts,jsx,tsx}',
		'./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
			},
			boxShadow: {
				glow: '0 0 20px rgba(88, 86, 214, 0.4)',
				'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.3)',
				'glow-sm': '0 0 10px rgba(88, 86, 214, 0.25)',
				glass: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
				'music-lg': '0 10px 25px -5px rgb(0 0 0 / 0.4)',
				'music-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.6)',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'mesh-gradient': 'linear-gradient(135deg, #0F0F11 0%, #1a1025 25%, #0F0F11 50%, #0d1520 75%, #0F0F11 100%)',
			},
			backdropBlur: {
				xs: '2px',
			},
			keyframes: {
				'slide-up': {
					from: { opacity: '0', transform: 'translateY(20px)' },
					to: { opacity: '1', transform: 'translateY(0)' },
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.95)' },
					to: { opacity: '1', transform: 'scale(1)' },
				},
				shimmer: {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' },
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 15px rgba(88, 86, 214, 0.3)' },
					'50%': { boxShadow: '0 0 30px rgba(88, 86, 214, 0.6)' },
				},
			},
			animation: {
				'slide-up': 'slide-up 500ms cubic-bezier(0.16, 1, 0.3, 1)',
				'fade-in': 'fade-in 400ms ease-out',
				'scale-in': 'scale-in 300ms ease-out',
				shimmer: 'shimmer 2s infinite linear',
				'pulse-glow': 'pulse-glow 2s infinite ease-in-out',
			},
		},
	},
	darkMode: "class",
	plugins: [heroui({
		themes: {
			dark: {
				colors: {
					background: "#09090B",
					foreground: "#FAFAFA",
					content1: "#18181B",
					content2: "#27272A",
					content3: "#3F3F46",
					content4: "#52525B",
					divider: "rgba(255,255,255,0.07)",
					focus: "#8B5CF6",
					primary: {
						50: "#EDE9FE",
						100: "#DDD6FE",
						200: "#C4B5FD",
						300: "#A78BFA",
						400: "#8B5CF6",
						500: "#7C3AED",
						600: "#6D28D9",
						700: "#5B21B6",
						800: "#4C1D95",
						900: "#2E1065",
						DEFAULT: "#8B5CF6",
						foreground: "#FFFFFF",
					},
					secondary: {
						50: "#ECFEFF",
						100: "#CFFAFE",
						200: "#A5F3FC",
						300: "#67E8F9",
						400: "#22D3EE",
						500: "#06B6D4",
						600: "#0891B2",
						DEFAULT: "#22D3EE",
						foreground: "#09090B",
					},
					success: {
						DEFAULT: "#10B981",
						foreground: "#FFFFFF",
					},
					warning: {
						DEFAULT: "#F59E0B",
						foreground: "#09090B",
					},
					danger: {
						DEFAULT: "#EF4444",
						foreground: "#FFFFFF",
					},
					default: {
						50: "#18181B",
						100: "#27272A",
						200: "#3F3F46",
						300: "#52525B",
						400: "#71717A",
						500: "#A1A1AA",
						600: "#D4D4D8",
						700: "#E4E4E7",
						800: "#F4F4F5",
						900: "#FAFAFA",
						DEFAULT: "#27272A",
						foreground: "#FAFAFA",
					},
				}
			}
		}
	})],
};
