import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

type http = 'http' | 'https' | undefined;

// Define remote patterns for production API
const remotePatterns: RemotePattern[] = [
	{
		protocol: 'https',
		hostname: 'api.elbouazzatiholding.ma',
		pathname: '/media/**',
	},
	{
		protocol: 'http',
		hostname: 'api.elbouazzatiholding.ma',
		pathname: '/media/**',
	},
];

// Add localhost for development
if (isDev && process.env.NEXT_PUBLIC_API_ROOT_URL) {
	const port = process.env.NEXT_PUBLIC_API_ROOT_PORT;
	const shouldIncludePort = port && port !== '80' && port !== '443';

	remotePatterns.push({
		protocol: process.env.NEXT_PUBLIC_HTTP_PROTOCOLE as http,
		hostname: process.env.NEXT_PUBLIC_API_ROOT_URL as string,
		...(shouldIncludePort && { port }),
		pathname: '/media/**',
	});
}

const nextConfig: NextConfig = {
	reactCompiler: true,
	reactStrictMode: true,
	poweredByHeader: false,
	compress: false,
	typedRoutes: true,

	experimental: {
		typedEnv: true,
		turbopackFileSystemCacheForDev: true,
		optimizeCss: isProd,
	},

	sassOptions: {
		includePaths: [path.join(__dirname, 'src', 'styles'), path.join(__dirname, 'public')],
	},

	images: {
		unoptimized: isDev,
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 60,
		remotePatterns,
	},

	async headers() {
		return [
			// Security headers for all routes
			{
				source: '/(.*)',
				headers: [
					{
						key: 'Content-Security-Policy',
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
							"style-src 'self' 'unsafe-inline'",
							`img-src 'self' data: blob: https://api.elbouazzatiholding.ma${isDev ? ' http://localhost:8000 http://127.0.0.1:8000' : ''}`,
							"font-src 'self'",
							`connect-src 'self' https://api.elbouazzatiholding.ma wss://api.elbouazzatiholding.ma${isDev ? ' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:8000 ws://127.0.0.1:8000' : ''}`,
							"frame-ancestors 'self'",
							"base-uri 'self'",
							"form-action 'self'",
						].join('; '),
					},
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
					{ key: 'X-XSS-Protection', value: '1; mode=block' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
					{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
				],
			},

			// Next.js static files - long cache
			{
				source: '/_next/static/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
				],
			},

			// Manifest file
			{
				source: '/assets/ico/manifest.json',
				headers: [
					{ key: 'Content-Type', value: 'application/manifest+json' },
					{ key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
				],
			},

			// Fonts - long cache + CORS
			{
				source: '/assets/fonts/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
				],
			},

			// Images and icons - long cache
			{
				source: '/assets/images/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
				],
			},
			{
				source: '/assets/ico/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
				],
			},

			// Catch-all for other assets
			{
				source: '/assets/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
				],
			},
		];
	},
};

export default nextConfig;
