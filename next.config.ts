import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

type http = 'http' | 'https' | undefined;

const remotePatterns: RemotePattern[] = [
	{
		protocol: process.env.NEXT_PUBLIC_HTTP_PROTOCOLE as http,
		hostname: process.env.NEXT_PUBLIC_API_ROOT_URL as string,
		port: process.env.NEXT_PUBLIC_API_ROOT_PORT,
		pathname: '/media/user_avatars/**',
	},
];

const nextConfig: NextConfig = {
	reactCompiler: true,

	sassOptions: {
		includePaths: [path.join(__dirname, 'src', 'styles'), path.join(__dirname, 'public')],
	},

	images: {
		unoptimized: isDev,
		remotePatterns,
	},
};

export default nextConfig;
