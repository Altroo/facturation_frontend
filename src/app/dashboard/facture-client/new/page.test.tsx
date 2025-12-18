import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

// session shape
type SessionUser = { pk: number; email: string };
type Session = { user: SessionUser } | null;

// typed mock for auth
const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

// mock next/navigation redirect (returns sentinel)
const mockRedirect = jest.fn((url: string | URL) => ({ redirectedTo: String(url) }));
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

// mock FactureClientForm to return a renderable element
jest.mock('@/components/pages/dashboard/facture-client/facture-client-form', () => ({
	__esModule: true,
	default: (props: { session?: Session; company_id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`FACTURE_CLIENT_FORM_MARKER:${JSON.stringify(props?.session ?? null)}:COMPANY_ID=${props?.company_id ?? ''}`,
		);
	},
}));

// mock routes
const AUTH_LOGIN = '/auth/login';
const FACTURE_CLIENT_LIST = '/dashboard/facture-client';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
	FACTURE_CLIENT_LIST,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('FactureClientNewPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: (props: { searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;

		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		await Page!({ searchParams: Promise.resolve({ company_id: '456' }) });
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('redirects to FACTURE_CLIENT_LIST when company_id is missing or invalid', async () => {
		const sessionValue: Session = { user: { pk: 1, email: 'user@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;

		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		// missing company_id
		await Page!({ searchParams: Promise.resolve({ company_id: '' }) });
		expect(mockRedirect).toHaveBeenCalledWith(FACTURE_CLIENT_LIST);

		// non-numeric company_id
		await Page!({ searchParams: Promise.resolve({ company_id: 'abc' }) });
		expect(mockRedirect).toHaveBeenCalledWith(FACTURE_CLIENT_LIST);
	});

	it('renders form with session and company_id when valid', async () => {
		const sessionValue: Session = { user: { pk: 99, email: 'client@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;

		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		const result = await Page!({ searchParams: Promise.resolve({ company_id: '456' }) });
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('"pk":99');
		expect(decoded).toContain('"email":"client@site.com"');
		expect(decoded).toContain('COMPANY_ID=456');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
