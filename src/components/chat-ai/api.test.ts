import { ReadableStream } from 'node:stream/web';
import { TextDecoder } from 'node:util';
import { consumeChatStream, safeNavigation, downloadInvoicePDF } from './api';
import { getSession } from 'next-auth/react';
import {
	FACTURE_PRO_FORMA_LIST,
	FACTURE_PRO_FORMA_VIEW,
	FACTURE_PRO_FORMA_EDIT,
	FACTURE_AVOIR_LIST,
	FACTURE_AVOIR_VIEW,
	FACTURE_AVOIR_EDIT,
	BON_DE_LIVRAISON_LIST,
	BON_DE_LIVRAISON_VIEW,
	BON_DE_LIVRAISON_EDIT,
	ARTICLES_LIST,
	ARTICLES_VIEW,
	REGLEMENTS_LIST,
	REGLEMENTS_VIEW,
	USERS_LIST,
	USERS_VIEW,
	STOCK_LIST,
	STOCK_VIEW,
	STOCK_MOVEMENTS,
	STOCK_MOVEMENT_VIEW,
	STOCK_RECEIPTS,
	STOCK_RECEIPT_VIEW,
	STOCK_INVENTORIES,
	STOCK_INVENTORY_VIEW,
	LOGISTIQUE_LIST,
	LOGISTIQUE_VIEW,
} from '@/utils/routes';
import type { NavigationTarget } from './types';
jest.mock('@/utils/helpers', () => ({ handleUnauthorized: jest.fn() }));
jest.mock('next-auth/react', () => ({ getSession: jest.fn() }));
Object.assign(globalThis, { TextDecoder });
const target: NavigationTarget = {
	application: 'facturation',
	resource: 'invoice',
	identifier: 12,
	company_id: 7,
	path: '/dashboard/facture-client/12/?company_id=7',
};
const response = (...chunks: string[]) =>
	({
		body: new ReadableStream({
			start(controller) {
				for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
				controller.close();
			},
		}),
	}) as unknown as Response;

describe('authorized navigation contract', () => {
	it('accepts an exact approved invoice route', () => expect(safeNavigation(target, 7)).toBe(target.path));
	it.each([
		'javascript:alert(1)',
		'//evil.invalid',
		'https://evil.invalid',
		'/dashboard/facture-client/99/?company_id=7',
		'/dashboard/facture-client/12/?company_id=8',
	])('rejects an unsafe or substituted path %s', (path) => expect(safeNavigation({ ...target, path }, 7)).toBeNull());
	it('rejects another company even with the expected path', () => expect(safeNavigation(target, 8)).toBeNull());
	it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid record ID %s', (identifier) =>
		expect(safeNavigation({ ...target, identifier }, 7)).toBeNull(),
	);
	it('rejects prototype resource names', () =>
		expect(safeNavigation({ ...target, resource: '__proto__' }, 7)).toBeNull());
	it('permits the verified edit path', () =>
		expect(
			safeNavigation(
				{ ...target, resource: 'invoice_edit', path: '/dashboard/facture-client/12/edit/?company_id=7' },
				7,
			),
		).toBe('/dashboard/facture-client/12/edit/?company_id=7'));
});

describe('authenticated fetch stream parser', () => {
	it('handles fragmented unicode data and completion', async () => {
		const receive = jest.fn();
		await consumeChatStream(
			response('event: message.delta\ndata: {"text":"مرحبا"}', '\n\nevent: message.completed\ndata: {"id":"done"}\n\n'),
			receive,
		);
		expect(receive).toHaveBeenNthCalledWith(1, 'message.delta', { text: 'مرحبا' });
		expect(receive).toHaveBeenNthCalledWith(2, 'message.completed', { id: 'done' });
	});
	it('never reports truncated output as complete', async () => {
		await expect(
			consumeChatStream(response('event: message.delta\ndata: {"text":"partial"}\n\n'), jest.fn()),
		).rejects.toMatchObject({ code: 'INCOMPLETE_RESPONSE' });
	});
	it('propagates revocation during a stream', async () => {
		await expect(
			consumeChatStream(response('event: error\ndata: {"code":"PERMISSION_DENIED"}\n\n'), jest.fn()),
		).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	});
	it('bounds the buffered response', async () => {
		await expect(consumeChatStream(response('x'.repeat(100001)), jest.fn())).rejects.toMatchObject({
			code: 'INVALID_MODEL_OUTPUT',
		});
	});
});

const commercialDocumentRoutes = [
	{
		resource: 'proforma',
		listResource: 'proformas',
		list: FACTURE_PRO_FORMA_LIST,
		view: FACTURE_PRO_FORMA_VIEW,
		edit: FACTURE_PRO_FORMA_EDIT,
	},
	{
		resource: 'credit_note',
		listResource: 'credit_notes',
		list: FACTURE_AVOIR_LIST,
		view: FACTURE_AVOIR_VIEW,
		edit: FACTURE_AVOIR_EDIT,
	},
	{
		resource: 'delivery_note',
		listResource: 'delivery_notes',
		list: BON_DE_LIVRAISON_LIST,
		view: BON_DE_LIVRAISON_VIEW,
		edit: BON_DE_LIVRAISON_EDIT,
	},
] as const;

describe('commercial document navigation', () => {
	it.each(commercialDocumentRoutes)(
		'accepts actual $resource detail, edit, and list routes',
		({ resource, listResource, list, view, edit }) => {
			const detail = { ...target, resource, path: view(12, 7) };
			const editTarget = { ...target, resource: `${resource}_edit`, path: edit(12, 7) };
			const listTarget = { ...target, resource: listResource, identifier: null, path: `${list}/?company_id=7` };
			expect(safeNavigation(detail, 7)).toBe(detail.path);
			expect(safeNavigation(editTarget, 7)).toBe(editTarget.path);
			expect(safeNavigation(listTarget, 7)).toBe(listTarget.path);
		},
	);
	it.each(commercialDocumentRoutes)(
		'rejects substituted resource, company, or query in $resource navigation',
		({ resource, view }) => {
			expect(safeNavigation({ ...target, resource }, 7)).toBeNull();
			expect(safeNavigation({ ...target, resource, company_id: 8, path: view(12, 7) }, 7)).toBeNull();
			expect(safeNavigation({ ...target, resource, path: `${view(12, 7)}&next=https://evil.invalid` }, 7)).toBeNull();
		},
	);
});

describe('authenticated PDF downloads use fixed resource endpoints', () => {
	const originalFetch = globalThis.fetch;
	const originalApiRoot = process.env.NEXT_PUBLIC_ROOT_API_URL;
	const createDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
	const revokeDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
	const fetchMock = jest.fn();
	const createObjectURL = jest.fn(() => 'blob:authorized-document');
	const revokeObjectURL = jest.fn();
	let clicked: Array<{ href: string; download: string }>;
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		globalThis.fetch = fetchMock;
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
		fetchMock.mockResolvedValue({
			ok: true,
			status: 200,
			headers: { get: () => 'application/pdf' },
			blob: async () => new Blob(['synthetic PDF'], { type: 'application/pdf' }),
		});
	});
	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
		jest.restoreAllMocks();
		globalThis.fetch = originalFetch;
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
			expect(fetchMock).toHaveBeenCalledWith(`http://facturation.test/api/${endpoint}/pdf/fr/12/?company_id=7`, {
				headers: { Authorization: 'Bearer fresh-session-token' },
				cache: 'no-store',
			});
			expect(fetchMock.mock.calls[0][0]).not.toContain('token');
			expect(clicked).toEqual([{ href: 'blob:authorized-document', download: `${documentName} 12.pdf` }]);
			jest.advanceTimersByTime(1000);
			expect(revokeObjectURL).toHaveBeenCalledWith('blob:authorized-document');
		},
	);
	it('uses the trusted caller token when session refresh supplies no token', async () => {
		jest.mocked(getSession).mockResolvedValue(null);
		await downloadInvoicePDF(12, 7, 'caller-token', 'proforma');
		expect(fetchMock).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ headers: { Authorization: 'Bearer caller-token' } }),
		);
	});
	it.each(['__proto__', 'constructor', '../account', 'https://evil.invalid'])(
		'rejects unsupported PDF resource %s before network access',
		async (resource) => {
			await expect(downloadInvoicePDF(12, 7, 'token', resource)).rejects.toMatchObject({ code: 'INVALID_ARGUMENTS' });
			expect(fetchMock).not.toHaveBeenCalled();
			expect(getSession).not.toHaveBeenCalled();
		},
	);
	it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
		'rejects invalid PDF identifier %s before network access',
		async (id) => {
			await expect(downloadInvoicePDF(id, 7, 'token', 'delivery_note')).rejects.toMatchObject({
				code: 'INVALID_ARGUMENTS',
			});
			expect(fetchMock).not.toHaveBeenCalled();
		},
	);
	it.each([
		{ status: 403, ok: false, type: 'application/json', code: 'PERMISSION_DENIED' },
		{ status: 200, ok: true, type: 'text/html', code: 'APPLICATION_UNAVAILABLE' },
	])('does not download denied or non-PDF responses ($status $type)', async ({ status, ok, type, code }) => {
		const blob = jest.fn();
		fetchMock.mockResolvedValue({ status, ok, headers: { get: () => type }, blob });
		await expect(downloadInvoicePDF(12, 7, 'token', 'credit_note')).rejects.toMatchObject({ code });
		expect(blob).not.toHaveBeenCalled();
		expect(createObjectURL).not.toHaveBeenCalled();
		expect(clicked).toEqual([]);
	});
});

const readOnlyModuleRoutes = [
	{ resource: 'article', listResource: 'articles', list: ARTICLES_LIST, view: ARTICLES_VIEW },
	{ resource: 'payment', listResource: 'payments', list: REGLEMENTS_LIST, view: REGLEMENTS_VIEW },
	{ resource: 'stock_balance', listResource: 'stock', list: STOCK_LIST, view: STOCK_VIEW },
	{ resource: 'stock_movement', listResource: 'stock_movements', list: STOCK_MOVEMENTS, view: STOCK_MOVEMENT_VIEW },
	{ resource: 'stock_receipt', listResource: 'stock_receipts', list: STOCK_RECEIPTS, view: STOCK_RECEIPT_VIEW },
	{
		resource: 'stock_inventory',
		listResource: 'stock_inventories',
		list: STOCK_INVENTORIES,
		view: STOCK_INVENTORY_VIEW,
	},
	{ resource: 'logistics_order', listResource: 'logistics', list: LOGISTIQUE_LIST, view: LOGISTIQUE_VIEW },
] as const;
describe('read-only module navigation', () => {
	it.each(readOnlyModuleRoutes)(
		'accepts verified $resource detail/list and rejects changed context or edit routes',
		({ resource, listResource, list, view }) => {
			const detail = { ...target, resource, path: view(12, 7) };
			const listing = { ...target, resource: listResource, identifier: null, path: `${list}/?company_id=7` };
			expect(safeNavigation(detail, 7)).toBe(detail.path);
			expect(safeNavigation(listing, 7)).toBe(listing.path);
			expect(safeNavigation({ ...detail, path: view(12, 8) }, 7)).toBeNull();
			expect(safeNavigation({ ...detail, path: view(99, 7) }, 7)).toBeNull();
			expect(safeNavigation({ ...detail, application: 'reservation' } as unknown as NavigationTarget, 7)).toBeNull();
			expect(safeNavigation({ ...detail, path: detail.path + '&next=https://evil.invalid' }, 7)).toBeNull();
			expect(
				safeNavigation({ ...detail, resource: resource + '_edit', path: detail.path.replace('/?', '/edit/?') }, 7),
			).toBeNull();
		},
	);
	it.each([
		{ resource: 'user', identifier: 12, path: `${USERS_VIEW(12)}/` },
		{ resource: 'users', identifier: null, path: `${USERS_LIST}/` },
	])('keeps native $resource navigation global without a company query', (route) => {
		const destination = { ...target, ...route };
		expect(safeNavigation(destination, 7)).toBe(route.path);
		expect(safeNavigation({ ...destination, path: route.path + '?company_id=7' }, 7)).toBeNull();
		expect(safeNavigation({ ...destination, company_id: 8 }, 7)).toBeNull();
		expect(safeNavigation({ ...destination, resource: 'user_edit', path: `${USERS_VIEW(12)}/edit/` }, 7)).toBeNull();
	});
});
