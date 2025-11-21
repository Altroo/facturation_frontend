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

// mock UsersViewClient
jest.mock('@/components/pages/dashboard/users/usersView', () => ({
	__esModule: true,
	default: (props: { session?: Session; id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`USERS_VIEW_CLIENT_MARKER:${JSON.stringify(props?.session ?? null)}:ID=${props?.id ?? ''}`,
		);
	},
}));

const AUTH_LOGIN = '/login';
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

describe('UsersViewPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: ({ params }: { params: Promise<{ id: number }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as ({ params }: { params: Promise<{ id: number }> }) => Promise<unknown>;
		});

		await Page!({ params: Promise.resolve({ id: 12 }) });
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('renders UsersViewClient with session and id when session exists', async () => {
		const sessionValue: Session = { user: { pk: 44, email: 'viewer@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: ({ params }: { params: Promise<{ id: number }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as ({ params }: { params: Promise<{ id: number }> }) => Promise<unknown>;
		});

		const result = await Page!({ params: Promise.resolve({ id: 99 }) });
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('"pk":44');
		expect(decoded).toContain('"email":"viewer@site.com"');
		expect(decoded).toContain('ID=99');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
