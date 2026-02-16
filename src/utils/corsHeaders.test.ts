import { getCorsHeaders, addCorsHeaders } from './corsHeaders';

global.Response = class {
	body: string;
	status: number;
	statusText: string;
	headers: Headers;

	constructor(body: string, init: ResponseInit) {
		this.body = body;
		this.status = init.status ?? 200;
		this.statusText = init.statusText ?? 'OK';
		this.headers = new Headers(init.headers);
	}

	async text(): Promise<string> {
		return this.body;
	}
} as unknown as typeof Response;

const baseHeaders = {
	'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Access-Control-Allow-Credentials': 'true',
};

describe('CORS headers', () => {
	test('getCorsHeaders returns origin header for allowed origin', () => {
		const headers = getCorsHeaders('http://localhost:3000');
		expect(headers).toEqual({
			...baseHeaders,
			'Access-Control-Allow-Origin': 'http://localhost:3000',
		});
	});

	test('getCorsHeaders does not return origin for disallowed origin', () => {
		const headers = getCorsHeaders('https://malicious-site.com') as Record<string, string>;
		expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
		expect(headers['Access-Control-Allow-Methods']).toBe(baseHeaders['Access-Control-Allow-Methods']);
	});

	test('addCorsHeaders adds origin to mocked response for allowed origin', async () => {
		const originalResponse = new Response('Hello', {
			status: 200,
			statusText: 'OK',
			headers: { 'Content-Type': 'text/plain' },
		});

		const updatedResponse = addCorsHeaders(originalResponse, 'http://localhost:3000');
		const headers = updatedResponse.headers;

		expect(headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
		expect(headers.get('Access-Control-Allow-Methods')).toBe(baseHeaders['Access-Control-Allow-Methods']);
		expect(headers.get('Access-Control-Allow-Headers')).toBe(baseHeaders['Access-Control-Allow-Headers']);
		expect(headers.get('Access-Control-Allow-Credentials')).toBe(baseHeaders['Access-Control-Allow-Credentials']);
		expect(await updatedResponse.text()).toBe('Hello');
	});

	test('getCorsHeaders with null origin returns no origin header', () => {
		const headers = getCorsHeaders(null) as Record<string, string>;
		expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
		expect(headers['Access-Control-Allow-Methods']).toBe(baseHeaders['Access-Control-Allow-Methods']);
	});

	test('addCorsHeaders preserves response body and status', async () => {
		const originalResponse = new Response('Test Body', {
			status: 201,
			statusText: 'Created',
			headers: { 'Content-Type': 'application/json' },
		});

		const updatedResponse = addCorsHeaders(originalResponse, 'http://localhost:3000');
		expect(updatedResponse.status).toBe(201);
		expect(updatedResponse.statusText).toBe('Created');
		expect(await updatedResponse.text()).toBe('Test Body');
	});
});
