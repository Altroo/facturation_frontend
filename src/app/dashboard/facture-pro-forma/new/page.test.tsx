import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { AUTH_LOGIN, FACTURE_PRO_FORMA_LIST } from '@/utils/routes';

type SessionUser = { pk: number; email: string };
type Session = { user: SessionUser } | null;

// mock auth
const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

// mock redirect (returns sentinel)
const REDIRECT_SENTINEL = (to: string) => ({ redirectedTo: to });
const mockRedirect = jest.fn((url: string | URL) => REDIRECT_SENTINEL(String(url)));
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

// mock ProForma form component
jest.mock('@/components/pages/dashboard/facture-pro-forma/facture-pro-forma-form', () => ({
	__esModule: true,
	default: (props: { session?: Session; company_id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`PRO_FORMA_NEW_FORM_MARKER:${JSON.stringify(props?.session ?? null)}:COMPANY_ID=${props?.company_id ?? ''}`,
		);
	},
}));

jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
	FACTURE_PRO_FORMA_LIST,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('ProFormaNewPage server component', () => {
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

	it('redirects to PRO_FORMA_LIST when company_id is invalid', async () => {
		const sessionValue: Session = { user: { pk: 1, email: 'user@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		// missing / empty company_id
		await Page!({ searchParams: Promise.resolve({ company_id: '' }) });
		expect(mockRedirect).toHaveBeenCalledWith(FACTURE_PRO_FORMA_LIST);

		// non-numeric company_id
		await Page!({ searchParams: Promise.resolve({ company_id: 'abc' }) });
		expect(mockRedirect).toHaveBeenCalledWith(FACTURE_PRO_FORMA_LIST);
	});

	it('renders ProFormaForm with session and company_id when valid', async () => {
		const sessionValue: Session = { user: { pk: 99, email: 'proforma@site.com' } };
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
		expect(decoded).toContain('"email":"proforma@site.com"');
		expect(decoded).toContain('COMPANY_ID=456');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
