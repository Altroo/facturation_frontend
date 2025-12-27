import type { NextRequest } from 'next/server';

// Mock cookies store
const mockCookieStore = {
	set: jest.fn(),
	delete: jest.fn(),
};

// Mock functions
const mockAddCorsHeaders = jest.fn((response: unknown) => response);
const mockNextResponseJson = jest.fn((data: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
	json: () => Promise.resolve(data),
	data,
	status: init?.status || 200,
	headers: init?.headers || {},
})) as jest.Mock;

jest.mock('next/headers', () => {
	return {
		get cookies() {
			return () => Promise.resolve(mockCookieStore);
		},
	};
});

jest.mock('@/utils/corsHeaders', () => {
	return {
		get addCorsHeaders() {
			return mockAddCorsHeaders;
		},
	};
});

jest.mock('next/server', () => {
	return {
		get NextResponse() {
			return {
				json: mockNextResponseJson,
			};
		},
	};
});

import { OPTIONS, POST, GET, DELETE } from './route';

// Helper to create mock NextRequest
const createMockRequest = (
	method: string,
	body?: Record<string, unknown>,
	origin?: string,
	cookies?: Record<string, string>,
): NextRequest => {
	return {
		method,
		headers: {
			get: jest.fn((name: string) => {
				if (name === 'origin') return origin || null;
				return null;
			}),
		},
		json: body ? jest.fn().mockResolvedValue(body) : jest.fn().mockRejectedValue(new Error('Invalid JSON')),
		cookies: cookies || {},
	} as unknown as NextRequest;
};

describe('Cookies Route Handlers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCookieStore.set.mockClear();
		mockCookieStore.delete.mockClear();
	});

	describe('OPTIONS handler', () => {
		it('should return 200 with CORS headers', async () => {
			const mockResponse = { data: {}, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('OPTIONS', undefined, 'http://localhost:3000');

			const result = await OPTIONS(mockRequest);

			expect(mockNextResponseJson).toHaveBeenCalledWith({}, { status: 200 });
			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, 'http://localhost:3000');
			expect(result).toBe(mockResponse);
		});
	});

	describe('POST handler', () => {
		it('should set new_email cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest(
				'POST',
				{ new_email: 'test@example.com', maxAge: 3600 },
				'http://localhost:3000',
			);

			const result = await POST(mockRequest);

			expect(mockCookieStore.set).toHaveBeenCalledWith('@new_email', 'test@example.com', {
				maxAge: 3600,
				httpOnly: true,
				secure: expect.any(Boolean),
				path: '/',
				sameSite: 'lax',
			});
			expect((result as unknown as { data: unknown }).data).toEqual({ success: true });
		});

		it('should set code cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('POST', { code: '123456', maxAge: 300 }, 'http://localhost:3000');

			await POST(mockRequest);

			expect(mockCookieStore.set).toHaveBeenCalledWith('@code', '123456', expect.objectContaining({
				maxAge: 300,
				httpOnly: true,
				path: '/',
				sameSite: 'lax',
			}));
		});

		it('should set pass_updated cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('POST', { pass_updated: 'true', maxAge: 60 }, 'http://localhost:3000');

			await POST(mockRequest);

			expect(mockCookieStore.set).toHaveBeenCalledWith('@pass_updated', 'true', expect.objectContaining({
				maxAge: 60,
			}));
		});

		it('should set multiple cookies at once', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest(
				'POST',
				{ new_email: 'test@example.com', code: '123456', maxAge: 3600 },
				'http://localhost:3000',
			);

			await POST(mockRequest);

			expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
			expect(mockCookieStore.set).toHaveBeenCalledWith('@new_email', 'test@example.com', expect.any(Object));
			expect(mockCookieStore.set).toHaveBeenCalledWith('@code', '123456', expect.any(Object));
		});

		it('should return 400 for invalid payload (no allowed keys)', async () => {
			const mockResponse = { data: { success: false, error: 'Invalid payload' }, status: 400 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('POST', { invalid_key: 'value' }, 'http://localhost:3000');

			const result = await POST(mockRequest);

			expect(mockCookieStore.set).not.toHaveBeenCalled();
			expect(mockNextResponseJson).toHaveBeenCalledWith(
				{ success: false, error: 'Invalid payload' },
				{ status: 400 },
			);
			expect(result.status).toBe(400);
		});

		it('should return 400 for invalid JSON', async () => {
			const mockResponse = { data: { success: false, error: 'Invalid JSON' }, status: 400 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('POST', undefined, 'http://localhost:3000');

			const result = await POST(mockRequest);

			expect(result.status).toBe(400);
			expect(mockNextResponseJson).toHaveBeenCalledWith(
				{ success: false, error: 'Invalid JSON' },
				{ status: 400 },
			);
		});
	});

	describe('GET handler', () => {
		it('should return cookies from request', async () => {
			const mockCookies = { '@new_email': 'test@example.com' };
			const mockResponse = { data: { cookies: mockCookies }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('GET', undefined, 'http://localhost:3000', mockCookies);

			const result = await GET(mockRequest);

			expect(mockNextResponseJson).toHaveBeenCalledWith({ cookies: mockCookies }, { status: 200 });
			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, 'http://localhost:3000');
			expect(result.status).toBe(200);
		});

		it('should handle request without origin', async () => {
			const mockCookies = {};
			const mockResponse = { data: { cookies: mockCookies }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('GET', undefined, undefined, mockCookies);

			await GET(mockRequest);

			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, null);
		});
	});

	describe('DELETE handler', () => {
		it('should delete @new_email cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('DELETE', { new_email: true }, 'http://localhost:3000');

			const result = await DELETE(mockRequest);

			expect(mockCookieStore.delete).toHaveBeenCalledWith('@new_email');
			expect((result as unknown as { data: unknown }).data).toEqual({ success: true });
		});

		it('should delete @code cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('DELETE', { code: true }, 'http://localhost:3000');

			await DELETE(mockRequest);

			expect(mockCookieStore.delete).toHaveBeenCalledWith('@code');
		});

		it('should delete @pass_updated cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('DELETE', { pass_updated: true }, 'http://localhost:3000');

			await DELETE(mockRequest);

			expect(mockCookieStore.delete).toHaveBeenCalledWith('@pass_updated');
		});

		it('should delete multiple cookies at once', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest(
				'DELETE',
				{ new_email: true, code: true },
				'http://localhost:3000',
			);

			await DELETE(mockRequest);

			expect(mockCookieStore.delete).toHaveBeenCalledTimes(2);
			expect(mockCookieStore.delete).toHaveBeenCalledWith('@new_email');
			expect(mockCookieStore.delete).toHaveBeenCalledWith('@code');
		});

		it('should return 400 when no valid keys to delete', async () => {
			const mockResponse = { data: { success: false }, status: 400 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('DELETE', { invalid_key: true }, 'http://localhost:3000');

			const result = await DELETE(mockRequest);

			expect(mockCookieStore.delete).not.toHaveBeenCalled();
			expect(result.status).toBe(400);
		});

		it('should return 400 for invalid JSON', async () => {
			const mockResponse = { data: { success: false, error: 'Invalid JSON' }, status: 400 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('DELETE', undefined, 'http://localhost:3000');

			const result = await DELETE(mockRequest);

			expect(result.status).toBe(400);
			expect(mockNextResponseJson).toHaveBeenCalledWith(
				{ success: false, error: 'Invalid JSON' },
				{ status: 400 },
			);
		});
	});
});
