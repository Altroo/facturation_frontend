import type { tokenUser } from './_initTypes';
import type { ProviderType } from 'next-auth/providers';
import type { DefaultSession } from 'next-auth';

// Extend the NextAuth types to include your custom types
declare module 'next-auth' {
	/**
	 * Extends the default session with additional properties.
	 */
	export interface Session extends DefaultSession {
		user: tokenUser;
		accessToken: string;
		refreshToken: string;
		accessTokenExpiration: string;
		refreshTokenExpiration: string;
	}

	/**
	 * Represents the user object returned by the `authorize` function
	 * or included in the JWT token.
	 */
	export interface User {
		name: string;
		email: string;
		user: tokenUser;
		access: string;
		refresh: string;
		access_expiration: string;
		refresh_expiration: string;
	}

	/**
	 * Represents an account returned by the OAuth providers.
	 */
	export interface Account {
		providerAccountId: string | undefined;
		type: ProviderType;
		provider: string;
		user: tokenUser;
		access: string;
		refresh: string;
		access_expiration: string;
		refresh_expiration: string;
	}
}

declare module 'next-auth/jwt' {
	/**
	 * Extends the JWT object with additional properties.
	 */
	export interface JWT {
		user: tokenUser;
		access: string;
		refresh: string;
		access_expiration: string;
		refresh_expiration: string;
	}
}

export interface AuthInterface {
	user: tokenUser;
	access: string;
	refresh: string;
	access_expiration: string;
	refresh_expiration: string;
}
