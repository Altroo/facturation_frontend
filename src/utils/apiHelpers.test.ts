import axios, { type AxiosInstance } from 'axios';
import { cookiesDeleter, cookiesPoster, getApi, getAppVersion, postApi } from './apiHelpers';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API utility functions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getAppVersion', () => {
		it('uses an independent Axios instance, bypasses caching and bounds the request to ten seconds', async () => {
			const data = { version: '1.10.0' };
			const get = jest.fn().mockResolvedValueOnce({ status: 200, data });
			mockedAxios.create.mockReturnValueOnce({ get } as unknown as AxiosInstance);

			await expect(getAppVersion()).resolves.toEqual({ status: 200, data });
			expect(mockedAxios.create).toHaveBeenCalledWith();
			expect(get).toHaveBeenCalledWith('/api/app-version', {
				params: { check: expect.any(Number) },
				timeout: 10_000,
				headers: { 'Cache-Control': 'no-store' },
				responseType: 'json',
				transitional: { silentJSONParsing: false },
			});
		});

		it.each(['offline', 'HTTP 503', 'invalid JSON', 'timeout'])(
			'preserves %s failures for the caller',
			async (message) => {
				const failure = new Error(message);
				const get = jest.fn().mockRejectedValueOnce(failure);
				mockedAxios.create.mockReturnValueOnce({ get } as unknown as AxiosInstance);
				await expect(getAppVersion()).rejects.toBe(failure);
			},
		);
	});

	describe('cookiesPoster', () => {
		it('should post to the given URL with body and return status', async () => {
			const mockInstance = {
				post: jest.fn().mockResolvedValueOnce({ status: 200 }),
			} satisfies Partial<AxiosInstance>;
			mockedAxios.create.mockReturnValueOnce(mockInstance as unknown as AxiosInstance);

			const result = await cookiesPoster('/api/cookies', { token: 'abc123' });

			expect(mockedAxios.create).toHaveBeenCalledWith();
			expect(mockInstance.post).toHaveBeenCalledWith(
				'/api/cookies',
				{ token: 'abc123', maxAge: 86400 },
				{ headers: { 'Content-Type': 'application/json' } },
			);
			expect(result).toEqual({ status: 200 });
		});
	});

	describe('cookiesDeleter', () => {
		it('should delete from the given URL with body and return status', async () => {
			const mockInstance = {
				delete: jest.fn().mockResolvedValueOnce({ status: 204 }),
			} satisfies Partial<AxiosInstance>;
			mockedAxios.create.mockReturnValueOnce(mockInstance as unknown as AxiosInstance);

			const result = await cookiesDeleter('/api/cookies', { token: 'abc123' });

			expect(mockedAxios.create).toHaveBeenCalledWith();
			expect(mockInstance.delete).toHaveBeenCalledWith('/api/cookies', {
				data: { token: 'abc123' },
			});
			expect(result).toEqual({ status: 204 });
		});
	});

	describe('postApi', () => {
		it('should post using the provided Axios instance and return status and data', async () => {
			const mockInstance = {
				post: jest.fn().mockResolvedValue({
					status: 201,
					data: { success: true },
				}),
			} as unknown as typeof axios;

			const result = await postApi('/submit', mockInstance, { name: 'Al' });

			expect(mockInstance.post).toHaveBeenCalledWith('/submit', { name: 'Al' });
			expect(result).toEqual({ status: 201, data: { success: true } });
		});
	});

	describe('getApi', () => {
		it('should get using the provided Axios instance and return status and data', async () => {
			const mockInstance = {
				get: jest.fn().mockResolvedValue({
					status: 200,
					data: { maintenance: true },
				}),
			} as unknown as typeof axios;

			const result = await getApi('/ws/maintenance/', mockInstance);

			expect(mockInstance.get).toHaveBeenCalledWith('/ws/maintenance/', { params: undefined });
			expect(result).toEqual({ status: 200, data: { maintenance: true } });
		});
	});
});
