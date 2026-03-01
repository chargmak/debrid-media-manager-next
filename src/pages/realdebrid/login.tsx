import useLocalStorage from '@/hooks/localStorage';
import { getCredentials, getDeviceCode, getToken } from '@/services/realDebrid';
import { clearRdKeys } from '@/utils/clearLocalStorage';
import { getSafeRedirectPath } from '@/utils/router';
import { Logo } from '@/components/Logo';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, CardBody, Spinner, Chip, Divider } from '@heroui/react';
import { Copy, Check, ExternalLink, Loader2, ArrowLeft } from 'lucide-react';

export default function RealDebridLoginPage() {
	const [verificationUrl, setVerificationUrl] = useState('');
	const intervalId = useRef<number | null>(null);
	const [userCode, setUserCode] = useState('');
	const router = useRouter();
	const [clientId, setClientId] = useLocalStorage<string>('rd:clientId');
	const [clientSecret, setClientSecret] = useLocalStorage<string>('rd:clientSecret');
	const [refreshToken, setRefreshToken] = useLocalStorage<string>('rd:refreshToken');
	const [accessToken, setAccessToken] = useLocalStorage<string>('rd:accessToken');
	const [isCopied, setIsCopied] = useState(false);
	const { isReady, query, replace } = router;
	const redirectPath = useMemo(() => getSafeRedirectPath(query.redirect, '/'), [query.redirect]);

	useEffect(() => {
		const fetchDeviceCode = async () => {
			const deviceCodeResponse = await getDeviceCode();
			if (deviceCodeResponse) {
				setVerificationUrl(deviceCodeResponse.verification_url);
				setUserCode(deviceCodeResponse.user_code);

				try {
					await navigator.clipboard.writeText(deviceCodeResponse.user_code);
					setIsCopied(true);
					setTimeout(() => setIsCopied(false), 3000);
				} catch (error) {
					console.error('Error saving user code to clipboard:', (error as any).message);
				}

				const interval = deviceCodeResponse.interval * 1000;
				setRefreshToken(deviceCodeResponse.device_code);

				const checkAuthorization = async () => {
					const credentialsResponse = await getCredentials(
						deviceCodeResponse.device_code
					);
					if (credentialsResponse) {
						setClientId(credentialsResponse.client_id);
						setClientSecret(credentialsResponse.client_secret);
						clearInterval(intervalId.current!);
					}
				};

				const id = setInterval(checkAuthorization, interval) as any as number;
				intervalId.current = id;
			}
		};
		if (!clientId || !clientSecret || !refreshToken) fetchDeviceCode();

		return () => {
			clearInterval(intervalId.current!);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router]);

	useEffect(() => {
		const fetchAccessToken = async () => {
			try {
				const response = await getToken(clientId!, clientSecret!, refreshToken!);
				if (response) {
					const { access_token, expires_in } = response;
					setAccessToken(access_token, expires_in);
				} else {
					throw new Error('Unable to get proper response');
				}
			} catch (error) {
				clearRdKeys();
			}
		};
		if (!accessToken && refreshToken && clientId && clientSecret) fetchAccessToken();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clientId, clientSecret, refreshToken]);

	useEffect(() => {
		if (!isReady || !accessToken) return;
		void replace(redirectPath);
	}, [accessToken, isReady, redirectPath, replace]);

	const handleCopyCode = async () => {
		if (userCode) {
			await navigator.clipboard.writeText(userCode);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		}
	};

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-mesh bg-noise">
			<Head>
				<title>DMM — Real-Debrid Login</title>
			</Head>

			<div className="w-full max-w-md animate-slide-up">
				{/* Back link */}
				<Button
					variant="light"
					size="sm"
					startContent={<ArrowLeft className="h-4 w-4" />}
					className="mb-6 text-default-400 hover:text-foreground"
					onPress={() => router.push('/start')}
				>
					Back
				</Button>

				<div className="flex flex-col items-center mb-8">
					<Logo size="md" className="mb-4" />
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						Connect Real-Debrid
					</h1>
					<p className="text-sm text-default-400 mt-1">
						Authorize DMM to access your account
					</p>
				</div>

				{userCode ? (
					<Card className="glass border-glass">
						<CardBody className="gap-6 p-6">
							{/* Step 1: Copy Code */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<Chip size="sm" color="primary" variant="flat">Step 1</Chip>
									<span className="text-sm text-default-400">Copy your authorization code</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="flex-1 rounded-xl bg-content1 border border-default-200 px-4 py-3 text-center">
										<span className="text-2xl font-mono font-bold tracking-[0.3em] text-foreground">
											{userCode}
										</span>
									</div>
									<Button
										isIconOnly
										variant="flat"
										color={isCopied ? "success" : "default"}
										onPress={handleCopyCode}
										className="h-[52px] w-[52px]"
									>
										{isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
									</Button>
								</div>
								{isCopied && (
									<p className="text-xs text-success mt-2 text-center animate-fade-in">
										Copied to clipboard!
									</p>
								)}
							</div>

							<Divider />

							{/* Step 2: Authorize */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<Chip size="sm" color="secondary" variant="flat">Step 2</Chip>
									<span className="text-sm text-default-400">Authorize on Real-Debrid</span>
								</div>
								<form method="post" action={verificationUrl}>
									<input type="hidden" name="usercode" value={userCode} />
									<input type="hidden" name="action" value="Continue" />
									<Button
										type="submit"
										formTarget="_blank"
										color="primary"
										variant="shadow"
										className="w-full font-semibold"
										size="lg"
										endContent={<ExternalLink className="h-4 w-4" />}
									>
										Open Real-Debrid
									</Button>
								</form>
							</div>

							<Divider />

							{/* Step 3: Waiting */}
							<div className="flex items-center justify-center gap-3 py-2">
								<Loader2 className="h-4 w-4 text-primary animate-spin" />
								<span className="text-sm text-default-400">
									Waiting for authorization...
								</span>
							</div>
						</CardBody>
					</Card>
				) : (
					<div className="flex flex-col items-center justify-center py-16">
						<Spinner size="lg" color="primary" />
						<p className="text-sm text-default-400 mt-4">Requesting device code...</p>
					</div>
				)}
			</div>
		</div>
	);
}
