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

// mock FactureClient list client to return a renderable element
jest.mock('@/components/pages/dashboard/facture-client/facture-client-list', () => ({
	__esModule: true,
	default: (props: { session?: Session }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, `FACTURE_CLIENT_LIST_MARKER:${JSON.stringify(props?.session ?? null)}`);
	},
}));

// mock routes
const AUTH_LOGIN = '/auth/login';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('FactureClientListPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: () => Promise<unknown>;

		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		await Page!();
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('renders list with session when session exists', async () => {
		const sessionValue: Session = { user: { pk: 42, email: 'user@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: () => Promise<unknown>;

		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as typeof Page;
		});

		const result = await Page!();
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('"pk":42');
		expect(decoded).toContain('"email":"user@site.com"');
		expect(decoded).toContain('FACTURE_CLIENT_LIST_MARKER');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
