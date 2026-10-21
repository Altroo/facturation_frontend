import { getSession } from 'next-auth/react';
import {
	chatErrorCode,
	isAuthenticatedInstance,
	isAppVersion,
	isChatMessage,
	isNewerAppVersion,
} from '@/utils/helpers';
import { APP_UPDATE_PARAM } from '@/utils/rawData';
import type { ChatResult } from '@/types/chatAiTypes';
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

// GET the deployed frontend version, independently of the Django API instance.
export const getAppVersion = async () => {
	const instance = axios.create();
	const response = await instance.get<unknown>('/api/app-version', {
		params: { check: Date.now() },
		timeout: 10_000,
		headers: { 'Cache-Control': 'no-store' },
		responseType: 'json',
		transitional: { silentJSONParsing: false },
	});
	return { status: response.status, data: response.data };
};

// POST Next api/cookies
export const cookiesPoster = async (url: string, body: object) => {
	const instance = axios.create();
	const response = await instance.post(
		url,
		{ ...body, maxAge: 86400 },
		{ headers: { 'Content-Type': 'application/json' } },
	);
	return { status: response.status };
};

// DELETE Next api/cookies
export const cookiesDeleter = async (url: string, body: object) => {
	const instance = axios.create();
	const response = await instance.delete(url, { data: body });
	return { status: response.status };
};

/*** Fetch a PDF blob via GET with Bearer auth token */
export const fetchPdfBlob = async (url: string, accessToken: string): Promise<Blob> => {
	const instance = axios.create();
	const response = await instance.get<Blob>(url, {
		headers: { Authorization: `Bearer ${accessToken}` },
		responseType: 'blob',
	});
	return response.data;
};

/*** Base Axios JSON Api call [POST] */
export const postApi = async (url: string | undefined, instance: AxiosInstance, body?: object) => {
	const response = await instance.post(`${url}`, body);
	return {
		status: response.status,
		data: response.data,
	};
};

/*** Base Axios JSON Api call [GET] */
export const getApi = async (url: string | undefined, instance: AxiosInstance, queryParams?: object) => {
	const response = await instance.get(`${url}`, { params: queryParams });
	return {
		status: response.status,
		data: response.data,
	};
};

type AppUpdateResult = { url: string; error?: never } | { url?: never; error: true };

export const getAppUpdateUrl = async (targetVersion: string, currentUrl: string): Promise<AppUpdateResult> => {
	if (!isAppVersion(targetVersion)) return { error: true };
	try {
		// Do not reload into an old frontend if the backend was published first.
		const { status, data } = await getAppVersion();
		if (status !== 200) return { error: true };
		if (
			!data ||
			typeof data !== 'object' ||
			!('version' in data) ||
			!isAppVersion(data.version) ||
			isNewerAppVersion(targetVersion, data.version)
		)
			return { error: true };
		const url = new URL(currentUrl);
		url.searchParams.set(APP_UPDATE_PARAM, `${targetVersion}-${Date.now()}`);
		return { url: url.href };
	} catch {
		return { error: true };
	}
};

export const chatRequest = async <T = unknown>(
	path: string,
	token: string,
	config: AxiosRequestConfig = {},
): Promise<ChatResult<T>> => {
	try {
		const instance = isAuthenticatedInstance(() => ({ access: token }));
		const response = await instance.request<T>({
			...config,
			url: `/ai/v1/${path}`,
			headers: { 'Cache-Control': 'no-store', ...config.headers },
			// Axios needs its streaming adapter for browser ReadableStream responses.
			...(config.responseType === 'stream' ? { adapter: 'fetch', fetchOptions: { cache: 'no-store' } } : {}),
		});
		return { data: response.data };
	} catch (error) {
		return { error: { code: config.signal?.aborted ? 'ABORTED' : chatErrorCode(error) } };
	}
};

export const consumeChatStream = async (
	stream: ReadableStream<Uint8Array> | null,
	receive: (event: string, data: unknown) => void,
): Promise<ChatResult<true>> => {
	if (!stream) return { error: { code: 'INCOMPLETE_RESPONSE' } };
	let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
	try {
		reader = stream.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		while (true) {
			const { done, value } = await reader.read();
			if (done) return { error: { code: 'INCOMPLETE_RESPONSE' } };
			buffer += decoder.decode(value, { stream: true });
			if (buffer.length > 100000) return { error: { code: 'INVALID_MODEL_OUTPUT' } };
			let boundary: number;
			while ((boundary = buffer.indexOf('\n\n')) !== -1) {
				const block = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + 2);
				const event = block
					.split('\n')
					.find((line) => line.startsWith('event: '))
					?.slice(7);
				const data = block
					.split('\n')
					.filter((line) => line.startsWith('data: '))
					.map((line) => line.slice(6))
					.join('\n');
				if (!event || !data) continue;
				let payload: unknown;
				try {
					payload = JSON.parse(data);
				} catch {
					return { error: { code: 'INVALID_MODEL_OUTPUT' } };
				}
				if (!payload || typeof payload !== 'object') return { error: { code: 'INVALID_MODEL_OUTPUT' } };
				if (event === 'error')
					return {
						error: { code: 'code' in payload && typeof payload.code === 'string' ? payload.code : 'INTERNAL_ERROR' },
					};
				if (
					(event === 'message.completed' && !isChatMessage(payload)) ||
					(event === 'message.delta' && (!('text' in payload) || typeof payload.text !== 'string'))
				)
					return { error: { code: 'INVALID_MODEL_OUTPUT' } };
				receive(event, payload);
				if (event === 'message.completed') return { data: true };
			}
		}
	} catch (error) {
		return { error: { code: chatErrorCode(error) === 'ABORTED' ? 'ABORTED' : 'INCOMPLETE_RESPONSE' } };
	} finally {
		// Stop a failed or completed stream rather than leaving its connection open.
		if (reader) {
			await reader.cancel().catch(() => {});
			reader.releaseLock();
		}
	}
};

export const downloadInvoicePDF = async (
	id: number,
	companyId: number,
	token: string,
	resource = 'invoice',
): Promise<ChatResult<true>> => {
	const endpoints: Record<string, string> = {
		invoice: 'facture_client',
		quote: 'devi',
		proforma: 'facture_proforma',
		credit_note: 'facture_avoir',
		delivery_note: 'bon_de_livraison',
	};
	if (
		!Object.hasOwn(endpoints, resource) ||
		!Number.isSafeInteger(id) ||
		id < 1 ||
		!Number.isSafeInteger(companyId) ||
		companyId < 1
	)
		return { error: { code: 'INVALID_ARGUMENTS' } };
	try {
		const session = await getSession();
		const blob = await fetchPdfBlob(
			`${process.env.NEXT_PUBLIC_ROOT_API_URL}/${endpoints[resource]}/pdf/fr/${id}/?company_id=${companyId}`,
			session?.accessToken || token,
		);
		if (!blob.type.includes('application/pdf')) return { error: { code: 'APPLICATION_UNAVAILABLE' } };
		const url = URL.createObjectURL(blob);
		try {
			const link = document.createElement('a');
			link.href = url;
			const documentNames: Record<string, string> = {
				invoice: 'Facture',
				quote: 'Devis',
				proforma: 'Facture pro forma',
				credit_note: 'Facture d’avoir',
				delivery_note: 'Bon de livraison',
			};
			link.download = `${documentNames[resource]} ${id}.pdf`;
			link.click();
		} finally {
			window.setTimeout(() => URL.revokeObjectURL(url), 1000);
		}
		return { data: true };
	} catch (error) {
		return { error: { code: chatErrorCode(error) } };
	}
};

// change on production to specific domains
const allowedOrigins: string[] =
	process.env.ALLOWED_ORIGINS?.split(',')
		.map((o) => o.trim())
		.filter(Boolean) ||
	(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : ['https://facturation.elbouazzatiholding.ma']);

export const getCorsHeaders = (origin: string | null): HeadersInit => {
	const headers: HeadersInit = {
		'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true',
	};

	if (origin && allowedOrigins.includes(origin)) {
		headers['Access-Control-Allow-Origin'] = origin;
	}

	return headers;
};

export function addCorsHeaders(response: Response, origin: string | null): Response {
	const corsHeaders = getCorsHeaders(origin);
	const headers = new Headers(response.headers);

	Object.entries(corsHeaders).forEach(([key, value]) => {
		headers.set(key, value as string);
	});

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
