import type { NextRequest } from 'next/server';

// Mock handlers
const mockHandlersGET = jest.fn();
const mockHandlersPOST = jest.fn();
const mockAddCorsHeaders = jest.fn((response: unknown) => response);
const mockGetCorsHeaders = jest.fn((origin: string | null) => ({
	'Access-Control-Allow-Origin': origin || '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})) as jest.Mock;
const mockNextResponseJson = jest.fn((data: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
	data,
	status: init?.status || 200,
	headers: init?.headers || {},
}));

jest.mock('@/auth', () => {
	return {
		get handlers() {
			return {
				GET: mockHandlersGET,
				POST: mockHandlersPOST,
			};
		},
	};
});

jest.mock('@/utils/corsHeaders', () => {
	return {
		get addCorsHeaders() {
			return mockAddCorsHeaders;
		},
		get getCorsHeaders() {
			return mockGetCorsHeaders;
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

import { GET, POST, OPTIONS } from './route';

// Helper to create mock NextRequest
const createMockRequest = (method: string, origin?: string): NextRequest => {
	return {
		method,
		headers: {
			get: jest.fn((name: string) => {
				if (name === 'origin') return origin || null;
				return null;
			}),
		},
	} as unknown as NextRequest;
};

describe('NextAuth Route Handlers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('GET handler', () => {
		it('should call handlers.GET and add CORS headers', async () => {
			const mockResponse = { status: 200, body: JSON.stringify({ success: true }) };
			mockHandlersGET.mockResolvedValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('GET', 'http://localhost:3000');

			const result = await GET(mockRequest);

			expect(mockHandlersGET).toHaveBeenCalledWith(mockRequest);
			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, 'http://localhost:3000');
			expect(result).toBe(mockResponse);
		});

		it('should handle request without origin header', async () => {
			const mockResponse = { status: 200, body: JSON.stringify({ success: true }) };
			mockHandlersGET.mockResolvedValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('GET');

			await GET(mockRequest);

			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, null);
		});
	});

	describe('POST handler', () => {
		it('should call handlers.POST and add CORS headers', async () => {
			const mockResponse = { status: 200, body: JSON.stringify({ token: 'abc123' }) };
			mockHandlersPOST.mockResolvedValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('POST', 'http://localhost:3000');

			const result = await POST(mockRequest);

			expect(mockHandlersPOST).toHaveBeenCalledWith(mockRequest);
			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, 'http://localhost:3000');
			expect(result).toBe(mockResponse);
		});

		it('should handle request without origin header', async () => {
			const mockResponse = { status: 200, body: JSON.stringify({ token: 'abc123' }) };
			mockHandlersPOST.mockResolvedValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const mockRequest = createMockRequest('POST');

			await POST(mockRequest);

			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, null);
		});
	});

	describe('OPTIONS handler', () => {
		it('should return 200 with CORS headers', async () => {
			const mockCorsHeaders = {
				'Access-Control-Allow-Origin': 'http://localhost:3000',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			};
			mockGetCorsHeaders.mockReturnValueOnce(mockCorsHeaders);
			mockNextResponseJson.mockReturnValueOnce({
				data: {},
				status: 200,
				headers: mockCorsHeaders,
			});

			const mockRequest = createMockRequest('OPTIONS', 'http://localhost:3000');

			const result = await OPTIONS(mockRequest);

			expect(mockGetCorsHeaders).toHaveBeenCalledWith('http://localhost:3000');
			expect(mockNextResponseJson).toHaveBeenCalledWith(
				{},
				{
					status: 200,
					headers: mockCorsHeaders,
				},
			);
			expect(result).toEqual({
				data: {},
				status: 200,
				headers: mockCorsHeaders,
			});
		});

		it('should handle request without origin header', async () => {
			const mockCorsHeaders = {
				'Access-Control-Allow-Origin': '*',
			};
			mockGetCorsHeaders.mockReturnValueOnce(mockCorsHeaders);

			const mockRequest = createMockRequest('OPTIONS');

			await OPTIONS(mockRequest);

			expect(mockGetCorsHeaders).toHaveBeenCalledWith(null);
		});
	});
});
