import { getSession } from 'next-auth/react';
import { handleUnauthorized } from '@/utils/helpers';
import type { ChatMessage, NavigationTarget } from '@/types/chatAiTypes';

export type ChatError = { code: string };
export type ChatResult<T> = { data: T; error?: never } | { data?: never; error: ChatError };

export const chatErrorCode = (error: unknown): string => {
	if (error && typeof error === 'object') {
		if ('name' in error && error.name === 'AbortError') return 'ABORTED';
		if (!(error instanceof Error) && 'code' in error && typeof error.code === 'string') return error.code;
	}
	return 'APPLICATION_UNAVAILABLE';
};

export const chatRequest = async (
	path: string,
	token: string,
	init: RequestInit = {},
): Promise<ChatResult<Response>> => {
	try {
		const request = (access: string) =>
			fetch(`${process.env.NEXT_PUBLIC_ROOT_API_URL}/ai/v1/${path}`, {
				...init,
				cache: 'no-store',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}`, ...init.headers },
			});
		let response = await request(token);
		if (response.status === 401) {
			const fresh = await getSession();
			if (init.signal?.aborted) return { error: { code: 'ABORTED' } };
			if (fresh?.accessToken && fresh.accessToken !== token) response = await request(fresh.accessToken);
			if (response.status === 401) {
				await handleUnauthorized();
				return { error: { code: 'NOT_AUTHENTICATED' } };
			}
		}
		if (!response.ok) {
			const data = await response.json().catch(() => null);
			return {
				error: {
					code:
						typeof data?.error?.code === 'string'
							? data.error.code
							: response.status === 403
								? 'PERMISSION_DENIED'
								: 'APPLICATION_UNAVAILABLE',
				},
			};
		}
		return { data: response };
	} catch (error) {
		return { error: { code: init.signal?.aborted ? 'ABORTED' : chatErrorCode(error) } };
	}
};

export const isChatMessage = (value: unknown): value is ChatMessage => {
	if (!value || typeof value !== 'object') return false;
	return (
		'id' in value &&
		typeof value.id === 'string' &&
		'role' in value &&
		(value.role === 'assistant' || value.role === 'user') &&
		'text' in value &&
		typeof value.text === 'string' &&
		(!('cards' in value) ||
			value.cards === undefined ||
			(Array.isArray(value.cards) &&
				value.cards.every((card) => card && typeof card === 'object' && typeof card.type === 'string')))
	);
};

export const consumeChatStream = async (
	response: Response,
	receive: (event: string, data: unknown) => void,
): Promise<ChatResult<true>> => {
	if (!response.body) return { error: { code: 'INCOMPLETE_RESPONSE' } };
	let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
	try {
		reader = response.body.getReader();
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

export const safeNavigation = (target: NavigationTarget, companyId: number) => {
	if (target.application !== 'facturation' || target.company_id !== companyId) return null;
	const list: Record<string, string> = {
		invoices: 'facture-client/',
		clients: 'clients/',
		payments: 'reglements/',
		dashboard: '',
		quotes: 'devis/',
		proformas: 'facture-pro-forma/',
		credit_notes: 'facture-avoir/',
		delivery_notes: 'bon-de-livraison/',
		articles: 'articles/',
		users: 'users/',
		stock: 'stock/',
		stock_movements: 'stock/movements/',
		stock_receipts: 'stock/receipts/',
		stock_inventories: 'stock/inventories/',
		logistics: 'logistique/',
	};
	const detail: Record<string, string> = {
		invoice: 'facture-client/',
		client: 'clients/',
		invoice_edit: 'facture-client/',
		client_edit: 'clients/',
		quote: 'devis/',
		quote_edit: 'devis/',
		proforma: 'facture-pro-forma/',
		proforma_edit: 'facture-pro-forma/',
		credit_note: 'facture-avoir/',
		credit_note_edit: 'facture-avoir/',
		delivery_note: 'bon-de-livraison/',
		delivery_note_edit: 'bon-de-livraison/',
		article: 'articles/',
		payment: 'reglements/',
		user: 'users/',
		stock_balance: 'stock/',
		stock_movement: 'stock/movements/',
		stock_receipt: 'stock/receipts/',
		stock_inventory: 'stock/inventories/',
		logistics_order: 'logistique/',
	};
	let route: string;
	if (
		Object.hasOwn(detail, target.resource) &&
		Number.isSafeInteger(target.identifier) &&
		(target.identifier ?? 0) > 0
	) {
		route = `/dashboard/${detail[target.resource]}${target.identifier}/${target.resource.endsWith('_edit') ? 'edit/' : ''}`;
	} else if (Object.hasOwn(list, target.resource) && target.identifier === null) {
		route = `/dashboard/${list[target.resource]}`;
	} else return null;
	const expected = ['user', 'users'].includes(target.resource) ? route : `${route}?company_id=${companyId}`;
	return target.path === expected ? expected : null;
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
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_ROOT_API_URL}/${endpoints[resource]}/pdf/fr/${id}/?company_id=${companyId}`,
			{ headers: { Authorization: `Bearer ${session?.accessToken || token}` }, cache: 'no-store' },
		);
		if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf'))
			return { error: { code: response.status === 403 ? 'PERMISSION_DENIED' : 'APPLICATION_UNAVAILABLE' } };
		const url = URL.createObjectURL(await response.blob());
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
