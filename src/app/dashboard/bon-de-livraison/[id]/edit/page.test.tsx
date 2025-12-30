import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

type SessionUser = { pk: number; email: string };
type Session = { user: SessionUser } | null;

// mock auth
const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

// mock redirect
const REDIRECT_SENTINEL = (to: string) => ({ redirectedTo: to });
const mockRedirect = jest.fn((url: string | URL) => REDIRECT_SENTINEL(String(url)));
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

// mock BonDeLivraisonForm
jest.mock('@/components/pages/dashboard/bon-de-livraison/bon-de-livraison-form', () => ({
	__esModule: true,
	default: (props: { session?: Session; id?: number; company_id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`BON_DE_LIVRAISON_EDIT_FORM_MARKER:${JSON.stringify(props?.session ?? null)}:ID=${props?.id ?? ''}:COMPANY_ID=${props?.company_id ?? ''}`,
		);
	},
}));

const AUTH_LOGIN = '/login';
const BON_DE_LIVRAISON_LIST = '/bon-de-livraison';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
	BON_DE_LIVRAISON_LIST,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('BonDeLivraisonEditPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: (props: {
			params: Promise<{ id: string }>;
			searchParams: Promise<{ company_id: string }>;
		}) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		await Page!({ params: Promise.resolve({ id: '123' }), searchParams: Promise.resolve({ company_id: '456' }) });
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('redirects to BON_DE_LIVRAISON_LIST when id or company_id is invalid', async () => {
		const sessionValue: Session = { user: { pk: 1, email: 'dev@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: {
			params: Promise<{ id: string }>;
			searchParams: Promise<{ company_id: string }>;
		}) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		// invalid id
		await Page!({ params: Promise.resolve({ id: 'abc' }), searchParams: Promise.resolve({ company_id: '456' }) });
		expect(mockRedirect).toHaveBeenCalledWith(BON_DE_LIVRAISON_LIST);

		// invalid company_id
		await Page!({ params: Promise.resolve({ id: '123' }), searchParams: Promise.resolve({ company_id: 'xyz' }) });
		expect(mockRedirect).toHaveBeenCalledWith(BON_DE_LIVRAISON_LIST);
	});

	it('renders BonDeLivraisonEditForm with session, id, and company_id when valid', async () => {
		const sessionValue: Session = { user: { pk: 99, email: 'dev@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: {
			params: Promise<{ id: string }>;
			searchParams: Promise<{ company_id: string }>;
		}) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		const result = await Page!({
			params: Promise.resolve({ id: '123' }),
			searchParams: Promise.resolve({ company_id: '456' }),
		});

		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('"pk":99');
		expect(decoded).toContain('"email":"dev@site.com"');
		expect(decoded).toContain('ID=123');
		expect(decoded).toContain('COMPANY_ID=456');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
