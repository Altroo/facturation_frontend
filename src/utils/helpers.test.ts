import {
	isAuthenticatedInstance,
	allowAnyInstance,
	handleUnauthorized,
	setFormikAutoErrors,
	hexToRGB,
	formatDate,
} from './helpers';
import { signOut } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
	signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/utils/routes', () => ({
	SITE_ROOT: '/mock-root',
}));

const mockedSignOut = signOut as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
});

describe('API Utilities', () => {
	describe('hexToRGB', () => {
		it('converts hex to rgb', () => {
			expect(hexToRGB('#ff0000')).toBe('rgb(255, 0, 0)');
		});

		it('converts hex to rgba with alpha', () => {
			expect(hexToRGB('#00ff00', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
		});
	});

	describe('formatDate', () => {
		it('formats valid date string', () => {
			expect(formatDate('2025-11-20T16:03:00')).toMatch(/20 nov\. 2025/);
		});

		it('returns placeholder for null', () => {
			expect(formatDate(null)).toBe('—');
		});

		it('returns placeholder for invalid date', () => {
			expect(formatDate('invalid')).toBe('—');
		});
	});

	describe('setFormikAutoErrors', () => {
		it('maps error fields to Formik', () => {
			const mockSetFieldError = jest.fn();
			const errorPayload = {
				error: {
					status_code: 400,
					message: 'Invalid',
					details: {
						email: ['Invalid email'],
						error: ['Something went wrong'],
					},
				},
			};

			setFormikAutoErrors({ e: errorPayload, setFieldError: mockSetFieldError });

			expect(mockSetFieldError).toHaveBeenCalledWith('email', 'Invalid email');
			expect(mockSetFieldError).toHaveBeenCalledWith('globalError', 'Something went wrong');
		});
	});

	describe('allowAnyInstance', () => {
		it('handles structured error response', async () => {
			const instance = allowAnyInstance();

			// Mock the adapter on THIS instance (no global axios mocking to avoid recursion)
			instance.defaults.adapter = jest.fn(() =>
				Promise.reject({
					response: {
						status: 400,
						data: {
							status_code: 400,
							message: 'Bad Request',
							details: { field: ['Invalid'] },
						},
					},
				}),
			);

			await expect(instance.get('/test')).rejects.toMatchObject({
				error: {
					status_code: 400,
					message: 'Bad Request',
					details: { field: ['Invalid'] },
				},
			});
		});

		it('handles network error fallback', async () => {
			const instance = allowAnyInstance();

			instance.defaults.adapter = jest.fn(() => Promise.reject(new Error('Erreur réseau')));

			await expect(instance.get('/test')).rejects.toMatchObject({
				error: {
					status_code: 0,
					message: 'Erreur réseau',
					details: { error: ['Impossible de se connecter au serveur'] },
				},
			});
		});
	});

	describe('isAuthenticatedInstance', () => {
		const mockToken = {
			access: 'abc123',
			refresh: 'def456',
			access_expiration: '2025-12-01T00:00:00Z',
			refresh_expiration: '2025-12-15T00:00:00Z',
			user: {
				pk: 1,
				email: 'user@example.com',
				first_name: 'Al',
				last_name: 'User',
			},
		};

		it('adds Authorization header if token exists', async () => {
			const getToken = () => mockToken;
			const instance = isAuthenticatedInstance(getToken);

			instance.defaults.adapter = jest.fn((config) =>
				Promise.resolve({
					data: { success: true },
					status: 200,
					statusText: 'OK',
					headers: config.headers,
					config,
				}),
			);

			const res = await instance.get('/secure');
			expect(res.data).toEqual({ success: true });

			const call = (instance.defaults.adapter as jest.Mock).mock.calls[0][0];
			expect(call.headers?.Authorization).toBe('Bearer abc123');
		});

		it('handles 401 and calls handleUnauthorized', async () => {
			const getToken = () => mockToken;
			const onUnauthorized = jest.fn();
			const instance = isAuthenticatedInstance(getToken, onUnauthorized);

			instance.defaults.adapter = jest.fn(() =>
				Promise.reject({
					response: {
						status: 401,
						data: {
							status_code: 401,
							message: 'Unauthorized',
							details: { error: ['Token expired'] },
						},
					},
				}),
			);

			await expect(instance.get('/secure')).rejects.toMatchObject({
				error: {
					status_code: 401,
					message: 'Unauthorized',
					details: { error: ['Token expired'] },
				},
			});

			expect(onUnauthorized).toHaveBeenCalled();
		});

		it('handles 500 and returns friendly server error', async () => {
			const getToken = () => mockToken;
			const instance = isAuthenticatedInstance(getToken);

			instance.defaults.adapter = jest.fn(() =>
				Promise.reject({
					response: {
						status: 500,
						data: {
							message: 'Internal Error',
							details: {},
						},
					},
				}),
			);

			await expect(instance.get('/secure')).rejects.toMatchObject({
				error: {
					status_code: 500,
					message: 'Erreur serveur.',
					details: {
						error: [
							'Il semble que nous ne puissions pas nous connecter. Veuillez vérifier votre connexion réseau et réessayer.',
						],
					},
				},
			});
		});

		it('handles structured API error payload', async () => {
			const getToken = () => mockToken;
			const instance = isAuthenticatedInstance(getToken);

			instance.defaults.adapter = jest.fn(() =>
				Promise.reject({
					response: {
						status: 400,
						data: {
							status_code: 400,
							message: 'Invalid data',
							details: { name: ['Required'] },
						},
					},
				}),
			);

			await expect(instance.get('/secure')).rejects.toMatchObject({
				error: {
					status_code: 400,
					message: 'Invalid data',
					details: { name: ['Required'] },
				},
			});
		});

		it('handles network error fallback when no response', async () => {
			const getToken = () => mockToken;
			const instance = isAuthenticatedInstance(getToken);

			instance.defaults.adapter = jest.fn(() => Promise.reject(new Error('Erreur réseau')));

			await expect(instance.get('/secure')).rejects.toMatchObject({
				error: {
					status_code: 0,
					message: 'Erreur réseau',
					details: { error: ['Impossible de se connecter au serveur'] },
				},
			});
		});
	});

	describe('handleUnauthorized', () => {
		it('calls signOut and resets token', async () => {
			const onResetToken = jest.fn();

			await handleUnauthorized(onResetToken);

			expect(mockedSignOut).toHaveBeenCalledWith({ redirect: false, redirectTo: '/mock-root' });
			expect(onResetToken).toHaveBeenCalled();
		});

		it('does not fail without onResetToken', async () => {
			await expect(handleUnauthorized()).resolves.toBeUndefined();
			expect(mockedSignOut).toHaveBeenCalledWith({ redirect: false, redirectTo: '/mock-root' });
		});
	});
});
