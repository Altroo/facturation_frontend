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

const AUTH_LOGIN = '/login';
const ARTICLES_LIST = '/articles';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
	ARTICLES_LIST,
}));

// mock ArticlesForm
jest.mock('@/components/pages/dashboard/articles/articles-form', () => ({
	__esModule: true,
	default: (props: { session?: Session; company_id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`ARTICLES_FORM_MARKER:${JSON.stringify(props?.session ?? null)}:COMPANY_ID=${props?.company_id ?? ''}`,
		);
	},
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('ArticleNewCompanyIDPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: (props: { searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		await Page!({ searchParams: Promise.resolve({ company_id: '123' }) });
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('redirects to ARTICLES_LIST when company_id is invalid', async () => {
		const sessionValue: Session = { user: { pk: 1, email: 'article@site.com' } };
		mockAuth.mockResolvedValue(sessionValue);

		let Page: (props: { searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		// invalid company_id
		await Page!({ searchParams: Promise.resolve({ company_id: 'abc' }) });
		expect(mockRedirect).toHaveBeenCalledWith(ARTICLES_LIST);
	});

	it('renders ArticlesForm with session and company_id when valid', async () => {
		const sessionValue: Session = { user: { pk: 99, email: 'article@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;
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

		expect(decoded).toContain('"pk":99');
		expect(decoded).toContain('"email":"article@site.com"');
		expect(decoded).toContain('COMPANY_ID=456');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
