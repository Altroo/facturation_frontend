import React from 'react';
import type { Metadata } from 'next';
import '@/styles/globals.sass';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import SessionProvider from '@/providers/sessionProvider';
import StoreProvider from '@/providers/storeProvider';
import { AppProps } from 'next/app';
import { InitContextProvider } from '@/contexts/InitContext';
import { auth } from '@/auth';
import type { Viewport } from 'next';
import ThemeProvider from '@/providers/themeProvider';
import { InitEffects } from '@/contexts/initEffects';

export const metadata: Metadata = {
	title: 'Facturation - Casa Di Lusso',
	applicationName: 'Facturation - Casa Di Lusso',
	authors: [{ name: 'Casa Di Lusso' }],
	robots: {
		index: false,
		follow: false,
	},
	manifest: '/assets/ico/manifest.json',
	icons: {
		icon: [
			{ url: '/assets/ico/favicon.ico', rel: 'shortcut icon' },
			{ url: '/assets/ico/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
			{ url: '/assets/ico/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
			{ url: '/assets/ico/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
			{ url: '/assets/ico/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
		],
		apple: [
			{ url: '/assets/ico/apple-icon-57x57.png', sizes: '57x57' },
			{ url: '/assets/ico/apple-icon-60x60.png', sizes: '60x60' },
			{ url: '/assets/ico/apple-icon-72x72.png', sizes: '72x72' },
			{ url: '/assets/ico/apple-icon-76x76.png', sizes: '76x76' },
			{ url: '/assets/ico/apple-icon-114x114.png', sizes: '114x114' },
			{ url: '/assets/ico/apple-icon-120x120.png', sizes: '120x120' },
			{ url: '/assets/ico/apple-icon-144x144.png', sizes: '144x144' },
			{ url: '/assets/ico/apple-icon-152x152.png', sizes: '152x152' },
			{ url: '/assets/ico/apple-icon-180x180.png', sizes: '180x180' },
		],
	},
	other: {
		'msapplication-TileColor': '#ffffff',
		'msapplication-TileImage': '/assets/ico/ms-icon-144x144.png',
		copyright: 'Copyright - Casa Di Lusso © 2025',
		rating: 'general',
		expires: 'never',
	},
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1.0,
	themeColor: '#ffffff',
};

interface EntryPointProps extends AppProps {
	children: React.ReactNode;
}

const RootLayout: React.FC<EntryPointProps> = async (props) => {
	const session = await auth();
	return (
		<html lang="fr" data-scroll-behavior="smooth">
			<body>
				<SessionProvider session={session}>
					<StoreProvider>
						<InitContextProvider>
							<InitEffects />
							<AppRouterCacheProvider>
								<ThemeProvider>{props.children}</ThemeProvider>
							</AppRouterCacheProvider>
						</InitContextProvider>
					</StoreProvider>
				</SessionProvider>
			</body>
		</html>
	);
};

export default RootLayout;
