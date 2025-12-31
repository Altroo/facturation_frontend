import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';
import path from 'path';

// to add in production
// const isDev = process.env.NODE_ENV === 'development';

type http = 'http' | 'https' | undefined;

const remotePatterns: RemotePattern[] = [
	{
		protocol: process.env.NEXT_PUBLIC_HTTP_PROTOCOLE as http,
		hostname: process.env.NEXT_PUBLIC_API_ROOT_URL as string,
		port: process.env.NEXT_PUBLIC_API_ROOT_PORT,
		pathname: '/media/**',
	},
];

const nextConfig: NextConfig = {
	reactCompiler: true,
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,
	typedRoutes: true,
	// cacheComponents: true,
	experimental: {
		typedEnv: true,
		turbopackFileSystemCacheForDev: true,
		optimizeCss: true,
	},
	sassOptions: {
		includePaths: [path.join(__dirname, 'src', 'styles'), path.join(__dirname, 'public')],
	},

	images: {
		// unoptimized: isDev,
		unoptimized: true,
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		remotePatterns,
	},

	async headers() {
		return [
			// keep Next static cache
			{
				source: '/_next/static/:all*',
				headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
			},

			// manifest: explicit content-type + reasonable cache
			{
				source: '/assets/ico/manifest.json',
				headers: [
					{ key: 'Content-Type', value: 'application/manifest+json' },
					{ key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
				],
			},

			// fonts: long cache + allow cross-origin if fonts are requested from other origins (safe for same-origin)
			{
				source: '/assets/fonts/:all*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
				],
			},

			// images and icons: long cache
			{
				source: '/assets/images/:all*',
				headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
			},
			{
				source: '/assets/ico/:all*',
				headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
			},

			// catch-all for assets (fallback)
			{
				source: '/assets/:all*',
				headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
			},

			// static JS/CSS/maps
			{
				source: '/(.*).(js|css|map)',
				headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
			},
		];
	},
};

export default nextConfig;
