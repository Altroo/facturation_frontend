import axios from 'axios';
import { cookiesPoster, cookiesDeleter, postApi } from './_initAPI';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API utility functions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('cookiesPoster', () => {
		it('should post to the given URL with body and return status', async () => {
			mockedAxios.post.mockResolvedValueOnce({ status: 200 });

			const result = await cookiesPoster('/api/cookies', { token: 'abc123' });

			expect(mockedAxios.post).toHaveBeenCalledWith(
				'/api/cookies',
				{ token: 'abc123', maxAge: 86400 },
				{ headers: { 'Content-Type': 'application/json' } },
			);
			expect(result).toEqual({ status: 200 });
		});
	});

	describe('cookiesDeleter', () => {
		it('should delete from the given URL with body and return status', async () => {
			mockedAxios.delete.mockResolvedValueOnce({ status: 204 });

			const result = await cookiesDeleter('/api/cookies', { token: 'abc123' });

			expect(mockedAxios.delete).toHaveBeenCalledWith('/api/cookies', {
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
});
