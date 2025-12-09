import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

// Define session types
type SessionUser = { pk: number; email: string };
type Session = { user: SessionUser } | null;

// mock auth
const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

// mock redirect
const mockRedirect = jest.fn((url: string | URL) => ({ redirectedTo: String(url) }));
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

// mock DevisViewClient
jest.mock('@/components/pages/dashboard/devis/devisView', () => ({
	__esModule: true,
	default: (props: { session?: Session; id?: number; company_id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`DEVIS_VIEW_MARKER:${JSON.stringify(props?.session ?? null)}:ID=${props?.id ?? ''}:COMPANY_ID=${props?.company_id ?? ''}`,
		);
	},
}));

const AUTH_LOGIN = '/login';
const DEVIS_LIST = '/devis';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
	DEVIS_LIST,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('DevisViewPage server component', () => {
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

	it('redirects to DEVIS_LIST when id or company_id is invalid', async () => {
		const sessionValue: Session = { user: { pk: 1, email: 'devis@site.com' } };
		mockAuth.mockResolvedValue(sessionValue);

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
		expect(mockRedirect).toHaveBeenCalledWith(DEVIS_LIST);

		// invalid company_id
		await Page!({ params: Promise.resolve({ id: '123' }), searchParams: Promise.resolve({ company_id: 'xyz' }) });
		expect(mockRedirect).toHaveBeenCalledWith(DEVIS_LIST);
	});

	it('renders DevisViewClient with session, id, and company_id when valid', async () => {
		const sessionValue: Session = { user: { pk: 99, email: 'devis@site.com' } };
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
		expect(decoded).toContain('"email":"devis@site.com"');
		expect(decoded).toContain('ID=123');
		expect(decoded).toContain('COMPANY_ID=456');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
