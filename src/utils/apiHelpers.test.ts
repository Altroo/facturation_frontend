import { ReadableStream } from 'node:stream/web';
import { TextDecoder } from 'node:util';
import { getSession, signOut } from 'next-auth/react';
import axios, { AxiosError, AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import {
	chatRequest,
	consumeChatStream,
	downloadInvoicePDF,
	getAppUpdateUrl,
	getCorsHeaders,
	addCorsHeaders,
	cookiesDeleter,
	cookiesPoster,
	getApi,
	getAppVersion,
	postApi,
} from '@/utils/apiHelpers';
import { APP_UPDATE_PARAM } from '@/utils/rawData';

jest.mock('next-auth/react', () => ({ getSession: jest.fn(), signOut: jest.fn() }));

jest.mock('axios', () => {
	const actual = jest.requireActual('axios');
	return { ...actual, __esModule: true, default: { ...actual.default, create: jest.fn() } };
});
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

describe('Chat API', () => {
	Object.assign(globalThis, { TextDecoder });

	const response = (...chunks: string[]) =>
		new ReadableStream<Uint8Array>({
			start(controller) {
				for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
				controller.close();
			},
		}) as unknown as globalThis.ReadableStream<Uint8Array>;

	describe('Axios response stream parser', () => {
		it('handles fragmented unicode data and completion', async () => {
			const receive = jest.fn();
			await consumeChatStream(
				response(
					'event: message.delta\ndata: {"text":"مرحبا"}',
					'\n\nevent: message.completed\ndata: {"id":"done","role":"assistant","text":"Terminé"}\n\n',
				),
				receive,
			);
			expect(receive).toHaveBeenNthCalledWith(1, 'message.delta', { text: 'مرحبا' });
			expect(receive).toHaveBeenNthCalledWith(2, 'message.completed', {
				id: 'done',
				role: 'assistant',
				text: 'Terminé',
			});
		});
		it('never reports truncated output as complete', async () => {
			await expect(
				consumeChatStream(response('event: message.delta\ndata: {"text":"partial"}\n\n'), jest.fn()),
			).resolves.toEqual({ error: { code: 'INCOMPLETE_RESPONSE' } });
		});
		it('propagates revocation during a stream', async () => {
			await expect(
				consumeChatStream(response('event: error\ndata: {"code":"PERMISSION_DENIED"}\n\n'), jest.fn()),
			).resolves.toEqual({ error: { code: 'PERMISSION_DENIED' } });
		});
		it('bounds the buffered response', async () => {
			await expect(consumeChatStream(response('x'.repeat(100001)), jest.fn())).resolves.toEqual({
				error: { code: 'INVALID_MODEL_OUTPUT' },
			});
		});
	});

	describe('authenticated PDF downloads use fixed resource endpoints', () => {
		const originalApiRoot = process.env.NEXT_PUBLIC_ROOT_API_URL;
		const createDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
		const revokeDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
		const getMock = jest.fn();
		const createObjectURL = jest.fn(() => 'blob:authorized-document');
		const revokeObjectURL = jest.fn();
		let clicked: Array<{ href: string; download: string }>;
		beforeEach(() => {
			jest.useFakeTimers();
			jest.clearAllMocks();
			mockedAxios.create.mockReturnValue({ get: getMock } as unknown as AxiosInstance);
			process.env.NEXT_PUBLIC_ROOT_API_URL = 'http://facturation.test/api';
			Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
			Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
			clicked = [];
			jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
				clicked.push({ href: this.href, download: this.download });
			});
			jest
				.mocked(getSession)
				.mockResolvedValue({ accessToken: 'fresh-session-token', expires: '2099-01-01' } as Awaited<
					ReturnType<typeof getSession>
				>);
			getMock.mockResolvedValue({ data: new Blob(['synthetic PDF'], { type: 'application/pdf' }) });
		});
		afterEach(() => {
			jest.runOnlyPendingTimers();
			jest.useRealTimers();
			jest.restoreAllMocks();
			if (originalApiRoot === undefined) Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_ROOT_API_URL');
			else process.env.NEXT_PUBLIC_ROOT_API_URL = originalApiRoot;
			if (createDescriptor) Object.defineProperty(URL, 'createObjectURL', createDescriptor);
			else Reflect.deleteProperty(URL, 'createObjectURL');
			if (revokeDescriptor) Object.defineProperty(URL, 'revokeObjectURL', revokeDescriptor);
			else Reflect.deleteProperty(URL, 'revokeObjectURL');
		});
		it.each([
			['invoice', 'facture_client', 'Facture'],
			['quote', 'devi', 'Devis'],
			['proforma', 'facture_proforma', 'Facture pro forma'],
			['credit_note', 'facture_avoir', 'Facture d’avoir'],
			['delivery_note', 'bon_de_livraison', 'Bon de livraison'],
		])(
			'downloads %s using bearer authentication and its verified Django endpoint',
			async (resource, endpoint, documentName) => {
				await downloadInvoicePDF(12, 7, 'old-token', resource);
				expect(getMock).toHaveBeenCalledWith(`http://facturation.test/api/${endpoint}/pdf/fr/12/?company_id=7`, {
					headers: { Authorization: 'Bearer fresh-session-token' },
					responseType: 'blob',
				});
				expect(getMock.mock.calls[0][0]).not.toContain('token');
				expect(clicked).toEqual([{ href: 'blob:authorized-document', download: `${documentName} 12.pdf` }]);
				jest.advanceTimersByTime(1000);
				expect(revokeObjectURL).toHaveBeenCalledWith('blob:authorized-document');
			},
		);
		it('uses the trusted caller token when session refresh supplies no token', async () => {
			jest.mocked(getSession).mockResolvedValue(null);
			await downloadInvoicePDF(12, 7, 'caller-token', 'proforma');
			expect(getMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ headers: { Authorization: 'Bearer caller-token' } }),
			);
		});
		it.each(['__proto__', 'constructor', '../account', 'https://evil.invalid'])(
			'rejects unsupported PDF resource %s before network access',
			async (resource) => {
				await expect(downloadInvoicePDF(12, 7, 'token', resource)).resolves.toEqual({
					error: { code: 'INVALID_ARGUMENTS' },
				});
				expect(getMock).not.toHaveBeenCalled();
				expect(getSession).not.toHaveBeenCalled();
			},
		);
		it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
			'rejects invalid PDF identifier %s before network access',
			async (id) => {
				await expect(downloadInvoicePDF(id, 7, 'token', 'delivery_note')).resolves.toEqual({
					error: { code: 'INVALID_ARGUMENTS' },
				});
				expect(getMock).not.toHaveBeenCalled();
			},
		);
		it.each([
			{ status: 403, ok: false, type: 'application/json', code: 'PERMISSION_DENIED' },
			{ status: 200, ok: true, type: 'text/html', code: 'APPLICATION_UNAVAILABLE' },
		])('does not download denied or non-PDF responses ($status $type)', async ({ status, ok, type, code }) => {
			if (!ok)
				getMock.mockRejectedValue(
					new AxiosError('Denied', 'ERR_BAD_REQUEST', undefined, undefined, {
						status,
						statusText: 'Forbidden',
						headers: {},
						data: {},
						config: { headers: new AxiosHeaders() },
					}),
				);
			else getMock.mockResolvedValue({ data: new Blob(['not PDF'], { type }) });
			await expect(downloadInvoicePDF(12, 7, 'token', 'credit_note')).resolves.toEqual({ error: { code } });
			expect(createObjectURL).not.toHaveBeenCalled();
			expect(clicked).toEqual([]);
		});
	});

	describe('chat transport uses the authenticated Axios instance', () => {
		const adapter = jest.fn();
		const requestedAdapters: unknown[] = [];
		const actualAxios = jest.requireActual<typeof import('axios')>('axios').default;
		const originalResponse = globalThis.Response;
		const originalReadableStream = globalThis.ReadableStream;
		beforeAll(() => {
			globalThis.ReadableStream = ReadableStream as unknown as typeof globalThis.ReadableStream;
			globalThis.Response = jest.requireActual('next/dist/compiled/@edge-runtime/primitives/fetch').Response;
		});
		afterAll(() => {
			globalThis.Response = originalResponse;
			globalThis.ReadableStream = originalReadableStream;
		});
		const httpResponse = (config: InternalAxiosRequestConfig, status: number, data: unknown) => {
			const result = { status, data, statusText: String(status), headers: {}, config };
			if (status >= 400) throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, result);
			return result;
		};
		beforeEach(() => {
			jest.clearAllMocks();
			adapter.mockReset();
			requestedAdapters.length = 0;
			jest.mocked(getSession).mockResolvedValue(null);
			mockedAxios.create.mockImplementation((config) => {
				const instance = actualAxios.create(config);
				instance.interceptors.request.use((request) => {
					requestedAdapters.push(request.adapter);
					request.adapter = adapter;
					return request;
				});
				return instance;
			});
		});
		it('uses the application base URL, bearer token, and Axios data for JSON requests', async () => {
			adapter.mockImplementation(async (config) => httpResponse(config, 200, { id: 'conversation' }));
			await expect(
				chatRequest('conversations/', 'token', { method: 'POST', data: { company_id: 7 } }),
			).resolves.toEqual({ data: { id: 'conversation' } });
			const config = adapter.mock.calls[0][0];
			expect(config.baseURL).toBe(process.env.NEXT_PUBLIC_ROOT_API_URL);
			expect(config.url).toBe('/ai/v1/conversations/');
			expect(config.headers.get('Authorization')).toBe('Bearer token');
			expect(JSON.parse(config.data)).toEqual({ company_id: 7 });
		});
		it('uses Axios streaming support and passes the readable body to the stream parser', async () => {
			const body = response('event: message.completed\ndata: {"id":"done","role":"assistant","text":"ok"}\n\n');
			adapter.mockImplementation(async (config) => httpResponse(config, 200, body));
			const result = await chatRequest<globalThis.ReadableStream<Uint8Array>>('conversations/id/messages/', 'token', {
				method: 'POST',
				responseType: 'stream',
				data: { text: 'Hello' },
			});
			expect(requestedAdapters).toEqual(['fetch']);
			expect(adapter.mock.calls[0][0].fetchOptions).toEqual({ cache: 'no-store' });
			expect(result.data).toBe(body);
			const receive = jest.fn();
			await expect(consumeChatStream(result.data!, receive)).resolves.toEqual({ data: true });
			expect(receive).toHaveBeenCalledWith('message.completed', { id: 'done', role: 'assistant', text: 'ok' });
		});
		it.each([
			{ status: 403, data: {}, code: 'PERMISSION_DENIED' },
			{ status: 503, data: '<html>unavailable</html>', code: 'APPLICATION_UNAVAILABLE' },
			{ status: 400, data: { error: { code: 'INVALID_ARGUMENTS' } }, code: 'INVALID_ARGUMENTS' },
		])('handles HTTP $status without throwing', async ({ status, data, code }) => {
			adapter.mockImplementation(async (config) => httpResponse(config, status, data));
			await expect(chatRequest('capabilities/', 'token')).resolves.toEqual({ error: { code } });
		});
		it.each([
			['{"error":{"code":"PERMISSION_DENIED"}}', 'PERMISSION_DENIED'],
			['<html>Unavailable</html>', 'APPLICATION_UNAVAILABLE'],
		])('reads HTTP error bodies from streaming requests: %s', async (body, code) => {
			const stream = response(body);
			adapter.mockImplementation(async (config) => httpResponse(config, 400, stream));
			await expect(
				chatRequest('conversations/id/messages/', 'token', { method: 'POST', responseType: 'stream' }),
			).resolves.toEqual({ error: { code } });
		});
		it('refreshes authentication after a streamed HTTP 401 error', async () => {
			const body = response('event: message.completed\ndata: {"id":"done","role":"assistant","text":"ok"}\n\n');
			adapter
				.mockImplementationOnce(async (config) => httpResponse(config, 401, response('{"detail":"Expired"}')))
				.mockImplementationOnce(async (config) => httpResponse(config, 200, body));
			jest.mocked(getSession).mockResolvedValue({
				accessToken: 'fresh',
				expires: '2099-01-01',
			} as Awaited<ReturnType<typeof getSession>>);
			await expect(
				chatRequest('conversations/id/messages/', 'old', { method: 'POST', responseType: 'stream' }),
			).resolves.toEqual({ data: body });
			expect(adapter).toHaveBeenCalledTimes(2);
			expect(adapter.mock.calls[1][0].headers.get('Authorization')).toBe('Bearer fresh');
		});
		it('handles network failures and intentional cancellation', async () => {
			adapter.mockRejectedValue(new TypeError('Network unavailable'));
			await expect(chatRequest('capabilities/', 'token')).resolves.toEqual({
				error: { code: 'APPLICATION_UNAVAILABLE' },
			});
			const controller = new AbortController();
			controller.abort();
			await expect(chatRequest('capabilities/', 'token', { signal: controller.signal })).resolves.toEqual({
				error: { code: 'ABORTED' },
			});
			expect(adapter).toHaveBeenCalledTimes(1);
		});
		it('refreshes expired authentication once and preserves the fresh token on retry', async () => {
			adapter
				.mockImplementationOnce(async (config) => httpResponse(config, 401, {}))
				.mockImplementationOnce(async (config) => httpResponse(config, 200, { authorized: true }));
			jest
				.mocked(getSession)
				.mockResolvedValue({ accessToken: 'fresh', expires: '2099-01-01' } as Awaited<ReturnType<typeof getSession>>);
			await expect(chatRequest('capabilities/', 'old')).resolves.toEqual({ data: { authorized: true } });
			expect(adapter).toHaveBeenCalledTimes(2);
			expect(adapter.mock.calls[1][0].headers.get('Authorization')).toBe('Bearer fresh');
			expect(signOut).not.toHaveBeenCalled();
		});
		it('ends an expired session instead of retrying indefinitely', async () => {
			adapter.mockImplementation(async (config) => httpResponse(config, 401, {}));
			await expect(chatRequest('capabilities/', 'old')).resolves.toEqual({ error: { code: 'NOT_AUTHENTICATED' } });
			expect(signOut).toHaveBeenCalledTimes(1);
			expect(adapter).toHaveBeenCalledTimes(1);
		});
		it('stops after the refreshed token is also rejected', async () => {
			adapter.mockImplementation(async (config) => httpResponse(config, 401, {}));
			jest
				.mocked(getSession)
				.mockResolvedValue({ accessToken: 'fresh', expires: '2099-01-01' } as Awaited<ReturnType<typeof getSession>>);
			await expect(chatRequest('capabilities/', 'old')).resolves.toEqual({ error: { code: 'NOT_AUTHENTICATED' } });
			expect(adapter).toHaveBeenCalledTimes(2);
			expect(getSession).toHaveBeenCalledTimes(1);
			expect(signOut).toHaveBeenCalledTimes(1);
		});
		it('does not retry or sign out if cancelled during token refresh', async () => {
			const controller = new AbortController();
			adapter.mockImplementation(async (config) => httpResponse(config, 401, {}));
			jest.mocked(getSession).mockImplementation(async () => {
				controller.abort();
				return { accessToken: 'fresh', expires: '2099-01-01' } as Awaited<ReturnType<typeof getSession>>;
			});
			await expect(chatRequest('capabilities/', 'old', { signal: controller.signal })).resolves.toEqual({
				error: { code: 'ABORTED' },
			});
			expect(adapter).toHaveBeenCalledTimes(1);
			expect(signOut).not.toHaveBeenCalled();
		});
		it('handles malformed stream JSON and absent bodies', async () => {
			await expect(
				consumeChatStream(response('event: message.completed\ndata: {bad}\n\n'), jest.fn()),
			).resolves.toEqual({
				error: { code: 'INVALID_MODEL_OUTPUT' },
			});
			await expect(consumeChatStream(null, jest.fn())).resolves.toEqual({
				error: { code: 'INCOMPLETE_RESPONSE' },
			});
		});
		it('handles reader errors without a rejected promise', async () => {
			const stream = new ReadableStream({
				start(controller) {
					controller.error(new TypeError('Disconnected'));
				},
			});
			await expect(
				consumeChatStream(stream as unknown as globalThis.ReadableStream<Uint8Array>, jest.fn()),
			).resolves.toEqual({
				error: { code: 'INCOMPLETE_RESPONSE' },
			});
		});
	});

	it.each(['{}', '{"text":3}', '{"id":"x","role":"assistant","text":"ok","cards":[null]}'])(
		'handles invalid completed message %s without calling the renderer',
		async (payload) => {
			const receive = jest.fn();
			await expect(
				consumeChatStream(response(`event: message.completed\ndata: ${payload}\n\n`), receive),
			).resolves.toEqual({ error: { code: 'INVALID_MODEL_OUTPUT' } });
			expect(receive).not.toHaveBeenCalled();
		},
	);

	it('handles an already locked stream', async () => {
		const value = response();
		const reader = value.getReader();
		await expect(consumeChatStream(value, jest.fn())).resolves.toEqual({ error: { code: 'INCOMPLETE_RESPONSE' } });
		reader.releaseLock();
	});
});

describe('App updates', () => {
	const getVersion = jest.fn();
	beforeEach(() => {
		getVersion.mockReset();
		mockedAxios.create.mockReturnValue({ get: getVersion } as unknown as AxiosInstance);
	});

	it('verifies the deployed frontend before a cache-busted navigation preserving route, filters and hash', async () => {
		getVersion.mockResolvedValue({ status: 200, data: { version: '1.10.0' } });
		const result = await getAppUpdateUrl('1.9.0', 'https://app.test/dashboard/board?project=2#card');
		expect(result.error).toBeUndefined();
		const url = new URL(result.url!);
		expect(url.pathname).toBe('/dashboard/board');
		expect(url.searchParams.get('project')).toBe('2');
		expect(url.searchParams.get(APP_UPDATE_PARAM)).toMatch(/^1\.9\.0-\d+$/);
		expect(url.hash).toBe('#card');
		expect(getVersion).toHaveBeenCalledWith('/api/app-version', expect.any(Object));
	});

	it.each([{ version: '1.0.0' }, { version: 'invalid' }, {}, null])(
		'rejects unavailable or invalid releases: %s',
		async (data) => {
			getVersion.mockResolvedValue({ status: 200, data });
			await expect(getAppUpdateUrl('2.0.0', 'https://app.test/')).resolves.toEqual({ error: true });
		},
	);
	it('does not navigate after an offline/HTTP failure', async () => {
		getVersion.mockRejectedValueOnce(new Error('offline'));
		await expect(getAppUpdateUrl('2.0.0', 'https://app.test/')).resolves.toEqual({ error: true });
		getVersion.mockResolvedValueOnce({ status: 503, data: null });
		await expect(getAppUpdateUrl('2.0.0', 'https://app.test/')).resolves.toEqual({ error: true });
	});
	it('does not request an invalid target', async () => {
		await expect(getAppUpdateUrl('bad', 'https://app.test/')).resolves.toEqual({ error: true });
		expect(getVersion).not.toHaveBeenCalled();
	});

	it.each(['json', 'url'])('returns a handled failure for invalid %s', async (failure) => {
		if (failure === 'json') getVersion.mockRejectedValueOnce(new SyntaxError('bad JSON'));
		else getVersion.mockResolvedValueOnce({ status: 200, data: { version: '2.0.0' } });
		await expect(getAppUpdateUrl('2.0.0', failure === 'url' ? 'bad-url' : 'https://app.test/')).resolves.toEqual({
			error: true,
		});
	});

	it('handles an Axios timeout without navigating', async () => {
		getVersion.mockRejectedValueOnce(new Error('timeout of 10000ms exceeded'));
		await expect(getAppUpdateUrl('2.0.0', 'https://app.test/')).resolves.toEqual({ error: true });
	});
});

describe('CORS response helpers', () => {
	const originalResponse = global.Response;
	beforeAll(() => {
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
	});
	afterAll(() => {
		global.Response = originalResponse;
	});

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
});
