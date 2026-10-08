import { getSession } from 'next-auth/react';
import { handleUnauthorized } from '@/utils/helpers';
import type { NavigationTarget } from './types';

export class ChatAPIError extends Error {
	constructor(public code: string) {
		super(code);
	}
}

export const chatRequest = async (path: string, token: string, init: RequestInit = {}) => {
	const request = (access: string) =>
		fetch(`${process.env.NEXT_PUBLIC_ROOT_API_URL}/ai/v1/${path}`, {
			...init,
			cache: 'no-store',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}`, ...init.headers },
		});
	let response = await request(token);
	if (response.status === 401) {
		const fresh = await getSession();
		if (fresh?.accessToken && fresh.accessToken !== token) response = await request(fresh.accessToken);
		if (response.status === 401) {
			await handleUnauthorized();
			throw new ChatAPIError('NOT_AUTHENTICATED');
		}
	}
	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new ChatAPIError(
			data.error?.code || (response.status === 403 ? 'PERMISSION_DENIED' : 'APPLICATION_UNAVAILABLE'),
		);
	}
	return response;
};

export const consumeChatStream = async (response: Response, receive: (event: string, data: unknown) => void) => {
	if (!response.body) throw new ChatAPIError('INCOMPLETE_RESPONSE');
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let completed = false;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			if (buffer.length > 100000) throw new ChatAPIError('INVALID_MODEL_OUTPUT');
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
				const payload = JSON.parse(data);
				if (event === 'error') throw new ChatAPIError(payload.code || 'INTERNAL_ERROR');
				receive(event, payload);
				if (event === 'message.completed') completed = true;
			}
		}
		if (!completed) throw new ChatAPIError('INCOMPLETE_RESPONSE');
	} finally {
		reader.releaseLock();
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

export const downloadInvoicePDF = async (id: number, companyId: number, token: string, resource = 'invoice') => {
	const endpoints: Record<string, string> = {
		invoice: 'facture_client',
		quote: 'devi',
		proforma: 'facture_proforma',
		credit_note: 'facture_avoir',
		delivery_note: 'bon_de_livraison',
	};
	if (!Object.hasOwn(endpoints, resource)) throw new ChatAPIError('INVALID_ARGUMENTS');
	if (!Number.isSafeInteger(id) || id < 1) throw new ChatAPIError('INVALID_ARGUMENTS');
	const session = await getSession();
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_ROOT_API_URL}/${endpoints[resource]}/pdf/fr/${id}/?company_id=${companyId}`,
		{
			headers: { Authorization: `Bearer ${session?.accessToken || token}` },
			cache: 'no-store',
		},
	);
	if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf'))
		throw new ChatAPIError(response.status === 403 ? 'PERMISSION_DENIED' : 'APPLICATION_UNAVAILABLE');
	const url = URL.createObjectURL(await response.blob());
	const link = document.createElement('a');
	link.href = url;
	const documentNames: Record<string, string> = { invoice: 'Facture', quote: 'Devis', proforma: 'Facture pro forma', credit_note: 'Facture d’avoir', delivery_note: 'Bon de livraison' };
	link.download = `${documentNames[resource]} ${id}.pdf`;
	link.click();
	window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
