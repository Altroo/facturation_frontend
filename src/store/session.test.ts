import { getAccessTokenFromSession } from './session';
import { AppSession } from '@/types/_initTypes';

describe('getAccessTokenFromSession', () => {
	it('returns undefined when session is undefined', () => {
		const result = getAccessTokenFromSession(undefined);
		expect(result).toBeUndefined();
	});

	it('returns accessToken from root when present and non-empty', () => {
		const session: AppSession = {
			accessToken: 'mock-token',
			refreshToken: 'mock-refresh-token',
			accessTokenExpiration: '2099-12-31T23:59:59Z',
			refreshTokenExpiration: '2099-12-31T23:59:59Z',
			expires: '2099-12-31T23:59:59Z',
			user: {
				accessToken: 'mock-token',
				pk: 1,
				email: 'test@example.com',
				first_name: 'Test',
				last_name: 'User',
				id: 'user-id',
				emailVerified: null,
				name: 'Test User',
			},
		};
		const result = getAccessTokenFromSession(session);
		expect(result).toBe('mock-token');
	});

	it('returns user.accessToken when root accessToken is empty and user.accessToken is present', () => {
		const session: AppSession = {
			accessToken: '',
			refreshToken: 'mock-refresh-token',
			accessTokenExpiration: '2099-12-31T23:59:59Z',
			refreshTokenExpiration: '2099-12-31T23:59:59Z',
			expires: '2099-12-31T23:59:59Z',
			user: {
				accessToken: 'user-mock-token',
				pk: 1,
				email: 'test@example.com',
				first_name: 'Test',
				last_name: 'User',
				id: 'user-id',
				emailVerified: null,
				name: 'Test User',
			},
		};
		const result = getAccessTokenFromSession(session);
		expect(result).toBe('user-mock-token');
	});

	it('returns undefined when both root and user accessToken are empty', () => {
		const session: AppSession = {
			accessToken: '',
			refreshToken: '',
			accessTokenExpiration: '',
			refreshTokenExpiration: '',
			expires: '',
			user: {
				accessToken: '',
				pk: 1,
				email: 'test@example.com',
				first_name: 'Test',
				last_name: 'User',
				id: 'user-id',
				emailVerified: null,
				name: 'Test User',
			},
		};
		const result = getAccessTokenFromSession(session);
		expect(result).toBeUndefined();
	});

	it('handles missing user and returns root accessToken if present', () => {
		const session = {
			accessToken: 'only-root',
			refreshToken: '',
			accessTokenExpiration: '',
			refreshTokenExpiration: '',
			expires: '2099-12-31T23:59:59Z',
		} as AppSession;
		const result = getAccessTokenFromSession(session);
		expect(result).toBe('only-root');
	});
});
