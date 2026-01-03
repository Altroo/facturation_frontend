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

// mock ReglementForm
jest.mock('@/components/pages/dashboard/reglements/reglement-form', () => ({
	__esModule: true,
	default: (props: { session?: Session; company_id?: number; facture_client_id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`REGLEMENT_FORM_MARKER:${JSON.stringify(props?.session ?? null)}:COMPANY=${props?.company_id}:FACTURE=${props?.facture_client_id ?? 'undefined'}`,
		);
	},
}));

const AUTH_LOGIN = '/login';
const REGLEMENTS_LIST = '/dashboard/reglements';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
	REGLEMENTS_LIST,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('ReglementNewPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: (props: { searchParams: Promise<{ company_id: string; facture_client_id?: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		await Page!({
			searchParams: Promise.resolve({ company_id: '456' }),
		});
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('redirects to REGLEMENTS_LIST when company_id is invalid', async () => {
		const sessionValue: Session = { user: { pk: 77, email: 'test@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { searchParams: Promise<{ company_id: string; facture_client_id?: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		await Page!({
			searchParams: Promise.resolve({ company_id: 'invalid' }),
		});
		expect(mockRedirect).toHaveBeenCalledWith(REGLEMENTS_LIST);
	});

	it('redirects to REGLEMENTS_LIST when company_id is missing', async () => {
		const sessionValue: Session = { user: { pk: 77, email: 'test@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { searchParams: Promise<{ company_id: string; facture_client_id?: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		await Page!({
			searchParams: Promise.resolve({ company_id: '' }),
		});
		expect(mockRedirect).toHaveBeenCalledWith(REGLEMENTS_LIST);
	});

	it('renders ReglementForm with valid company_id', async () => {
		const sessionValue: Session = { user: { pk: 77, email: 'reglement@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { searchParams: Promise<{ company_id: string; facture_client_id?: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		const result = await Page!({
			searchParams: Promise.resolve({ company_id: '456' }),
		});
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('"pk":77');
		expect(decoded).toContain('COMPANY=456');
		expect(decoded).toContain('FACTURE=undefined');
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	it('renders ReglementForm with facture_client_id when provided', async () => {
		const sessionValue: Session = { user: { pk: 77, email: 'reglement@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { searchParams: Promise<{ company_id: string; facture_client_id?: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		const result = await Page!({
			searchParams: Promise.resolve({ company_id: '456', facture_client_id: '789' }),
		});
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('"pk":77');
		expect(decoded).toContain('COMPANY=456');
		expect(decoded).toContain('FACTURE=789');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
