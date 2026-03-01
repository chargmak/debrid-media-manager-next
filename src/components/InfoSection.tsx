import { Heart, Github, Code, ExternalLink, HelpCircle, MonitorPlay, MessageSquare } from 'lucide-react';
import { Card, CardBody, Divider } from '@heroui/react';
import Link from 'next/link';

export function InfoSection() {
	return (
		<Card className="w-full bg-content1/30 border border-divider backdrop-blur-md shadow-sm" shadow="none">
			<CardBody className="p-5 flex flex-col gap-4">

				{/* Top Links */}
				<div className="flex flex-col gap-3">
					<a href="https://github.com/debridmediamanager/zurg-testing" target="_blank" className="flex items-center justify-between group">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
								<MonitorPlay className="h-4 w-4" />
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Zurg Local Mount</span>
								<span className="text-xs text-default-400">Play files directly from computer or Plex</span>
							</div>
						</div>
						<ExternalLink className="h-3 w-3 text-default-300 group-hover:text-primary" />
					</a>

					<div className="flex items-center justify-between group">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-secondary/10 text-secondary group-hover:bg-secondary/20 transition-colors">
								<Code className="h-4 w-4" />
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors">Browser Extensions</span>
								<div className="flex items-center gap-2 text-xs text-default-400 mt-0.5">
									<a href="https://chromewebstore.google.com/detail/Debrid%20Media%20Manager/oeojlegjfhgefhnbjdnaebgdfkbipghm" target="_blank" className="hover:text-secondary hover:underline">Chrome</a> •
									<a href="https://addons.mozilla.org/en-US/firefox/addon/debrid-media-manager/" target="_blank" className="hover:text-secondary hover:underline">Firefox</a> •
									<a href="https://apps.apple.com/us/app/userscripts/id1463298887" target="_blank" className="hover:text-secondary hover:underline">Safari</a> •
									<a href="https://greasyfork.org/en/scripts/463268-debrid-media-manager" target="_blank" className="hover:text-secondary hover:underline">Userscript</a>
								</div>
							</div>
						</div>
					</div>
				</div>

				<Divider className="opacity-50" />

				{/* Community Links */}
				<div className="grid grid-cols-2 gap-2">
					<a href="https://www.reddit.com/r/debridmediamanager/" target="_blank" className="flex items-center gap-2 p-2 rounded-md hover:bg-content2 transition-colors group">
						<MessageSquare className="h-3.5 w-3.5 text-[#FF4500]" />
						<span className="text-xs font-medium text-default-500 group-hover:text-foreground">Reddit Community</span>
					</a>
					<a href="https://discord.gg/7u4YjMThXP" target="_blank" className="flex items-center gap-2 p-2 rounded-md hover:bg-content2 transition-colors group">
						<MessageSquare className="h-3.5 w-3.5 text-[#5865F2]" />
						<span className="text-xs font-medium text-default-500 group-hover:text-foreground">Discord Server</span>
					</a>
					<a href="https://github.com/debridmediamanager/debrid-media-manager/wiki" target="_blank" className="flex items-center gap-2 p-2 rounded-md hover:bg-content2 transition-colors group">
						<HelpCircle className="h-3.5 w-3.5 text-default-400" />
						<span className="text-xs font-medium text-default-500 group-hover:text-foreground">Documentation</span>
					</a>
					<a href="https://github.com/debridmediamanager/debrid-media-manager" target="_blank" className="flex items-center gap-2 p-2 rounded-md hover:bg-content2 transition-colors group">
						<Github className="h-3.5 w-3.5 text-default-400 group-hover:text-foreground" />
						<span className="text-xs font-medium text-default-500 group-hover:text-foreground">Source Code</span>
					</a>
				</div>

				{/* Support */}
				<div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-xs text-default-400 bg-content2/30 py-2 rounded-lg border border-divider">
					<div className="flex items-center gap-1.5 font-medium text-default-500 mr-2">
						<Heart className="h-3.5 w-3.5 text-danger fill-danger/20" /> Support:
					</div>
					<a href="https://github.com/sponsors/debridmediamanager" target="_blank" className="hover:text-foreground transition-colors">GitHub</a>
					<a href="https://www.patreon.com/debridmediamanager" target="_blank" className="hover:text-foreground transition-colors">Patreon</a>
					<a href="https://paypal.me/yowmamasita" target="_blank" className="hover:text-foreground transition-colors">PayPal</a>
				</div>
			</CardBody>
		</Card>
	);
}
