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

// mock ReglementViewClient
jest.mock('@/components/pages/dashboard/reglements/reglement-view', () => ({
	__esModule: true,
	default: (props: { session?: Session; id?: number; company_id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`REGLEMENT_VIEW_MARKER:${JSON.stringify(props?.session ?? null)}:ID=${props?.id}:COMPANY=${props?.company_id}`,
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

describe('ReglementViewPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: (props: { params: Promise<{ id: string }>; searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		await Page!({
			params: Promise.resolve({ id: '123' }),
			searchParams: Promise.resolve({ company_id: '456' }),
		});
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('redirects to REGLEMENTS_LIST when id is invalid', async () => {
		const sessionValue: Session = { user: { pk: 77, email: 'test@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { params: Promise<{ id: string }>; searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		await Page!({
			params: Promise.resolve({ id: 'invalid' }),
			searchParams: Promise.resolve({ company_id: '456' }),
		});
		expect(mockRedirect).toHaveBeenCalledWith(REGLEMENTS_LIST);
	});

	it('renders ReglementViewClient with valid params', async () => {
		const sessionValue: Session = { user: { pk: 77, email: 'reglement@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { params: Promise<{ id: string }>; searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;
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

		expect(decoded).toContain('"pk":77');
		expect(decoded).toContain('ID=123');
		expect(decoded).toContain('COMPANY=456');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
