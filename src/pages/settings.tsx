import { Logo } from '@/components/Logo';
import { SettingsSection } from '@/components/SettingsSection';
import { withAuth } from '@/utils/withAuth';
import { ArrowLeft } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';

function SettingsPage() {
	return (
		<div className="flex min-h-screen flex-col items-center bg-black p-4 selection:bg-primary/30">
			<Head>
				<title>Settings | Debrid Media Manager</title>
				<meta name="robots" content="noindex, nofollow" />
			</Head>
			<Logo />
			<Toaster position="bottom-right" />
			<div className="mt-8 flex w-full max-w-lg flex-col gap-6">
				<Link
					href="/"
					className="group inline-flex items-center gap-2 self-start text-sm text-default-400 transition-all hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
					<span>Back to dashboard</span>
				</Link>
				<SettingsSection />
			</div>
		</div>
	);
}

export default withAuth(SettingsPage);
