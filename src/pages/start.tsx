import {
	useAllDebridApiKey,
	useDebridLogin,
	useRealDebridAccessToken,
	useTorBoxAccessToken,
} from '@/hooks/auth';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { Button, Card, CardBody, Divider, Chip } from '@heroui/react';
import { ArrowRight, Shield, Zap, Cloud, ExternalLink, Github } from 'lucide-react';

export default function StartPage() {
	const router = useRouter();
	const { loginWithRealDebrid, loginWithAllDebrid, loginWithTorbox } = useDebridLogin();
	const [rdToken] = useRealDebridAccessToken();
	const adKey = useAllDebridApiKey();
	const tbKey = useTorBoxAccessToken();

	useEffect(() => {
		const isLoggedIn = rdToken || adKey || tbKey;
		if (isLoggedIn) {
			router.push('/');
		}
	}, [rdToken, adKey, tbKey, router]);

	const services = [
		{
			name: 'Real-Debrid',
			description: 'Premium link generator & torrent client',
			onLogin: loginWithRealDebrid,
			signupUrl: 'http://real-debrid.com/?id=11137529',
			color: 'primary' as const,
			icon: <Zap className="h-5 w-5" />,
		},
		{
			name: 'AllDebrid',
			description: 'Fast multi-host downloader',
			onLogin: loginWithAllDebrid,
			signupUrl: 'https://alldebrid.com/?uid=1kk5i&lang=en',
			color: 'secondary' as const,
			icon: <Cloud className="h-5 w-5" />,
		},
		{
			name: 'Torbox',
			description: 'Modern torrent & usenet client',
			onLogin: loginWithTorbox,
			signupUrl: 'https://torbox.app/subscription?referral=74ffa560-7381-4a18-adb1-cef97378c670',
			color: 'success' as const,
			icon: <ArrowRight className="h-5 w-5" />,
		},
	];

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-mesh bg-noise">
			<Head>
				<title>Debrid Media Manager Next (DMM)</title>
				<meta name="description" content="Build your movie and TV show library with unlimited storage size" />
				<meta name="robots" content="index, nofollow" />
			</Head>

			{/* Hero Section */}
			<div className="flex flex-col items-center animate-fade-in mb-10">
				<Logo size="xl" className="mb-6" />

				<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-3">
					<span className="text-gradient">Debrid Media Manager Next</span>
					<br />
					<span className="text-foreground">(DMM)</span>
				</h1>

				<p className="text-default-400 text-center text-lg max-w-md mb-2">
					Build your movie & TV show library with truly unlimited storage
				</p>

				<a
					target="_blank"
					rel="noopener noreferrer"
					href="https://github.com/debridmediamanager/debrid-media-manager"
					className="inline-flex items-center gap-1.5 text-sm text-default-500 hover:text-primary transition-colors mt-1"
				>
					<Github className="h-3.5 w-3.5" />
					Open source — run on your own machine
				</a>
			</div>

			{/* Login Cards */}
			<div className="w-full max-w-md animate-slide-up">
				<div className="flex items-center gap-2 mb-4">
					<div className="h-px flex-1 bg-divider" />
					<span className="text-xs font-medium text-default-400 uppercase tracking-wider">Connect a service</span>
					<div className="h-px flex-1 bg-divider" />
				</div>

				<div className="flex flex-col gap-3 stagger-children">
					{services.map((service) => (
						<Card
							key={service.name}
							className="glass border-glass hover:border-primary/20 transition-all duration-300 group"
							isPressable
							onPress={service.onLogin}
						>
							<CardBody className="flex flex-row items-center gap-4 p-4">
								<div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-${service.color}/10 text-${service.color} group-hover:bg-${service.color}/20 transition-colors`}>
									{service.icon}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<h3 className="font-semibold text-foreground">{service.name}</h3>
									</div>
									<p className="text-xs text-default-400 mt-0.5">{service.description}</p>
								</div>
								<ArrowRight className="h-4 w-4 text-default-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
							</CardBody>
						</Card>
					))}
				</div>

				{/* Signup Links */}
				<div className="mt-4 flex flex-wrap justify-center gap-2">
					{services.map((service) => (
						<Button
							key={service.name}
							as="a"
							href={service.signupUrl}
							target="_blank"
							rel="noopener noreferrer"
							size="sm"
							variant="flat"
							className="text-default-500 hover:text-foreground"
							endContent={<ExternalLink className="h-3 w-3" />}
						>
							Create {service.name}
						</Button>
					))}
				</div>
			</div>

			{/* Trust Badges */}
			<div className="mt-10 animate-fade-in" style={{ animationDelay: '300ms' }}>
				<div className="flex items-center justify-center gap-4 text-default-400">
					<div className="flex items-center gap-1.5 text-xs">
						<Shield className="h-3.5 w-3.5 text-success" />
						<span>No data stored on servers</span>
					</div>
					<Divider orientation="vertical" className="h-3" />
					<div className="flex items-center gap-1.5 text-xs">
						<span>Browser-only storage</span>
					</div>
				</div>
			</div>
		</div>
	);
}
