import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

// Define the session shape that auth() returns
type SessionUser = { pk: number; email: string };
type Session = { user: SessionUser } | null;

// Create a typed mock for auth: () => Promise<Session>
const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

// Mock next/navigation redirect to throw (mimic Next's runtime behavior)
const mockRedirect = jest.fn(() => {
	throw new Error('redirect');
});
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

// Mock LoginClient to return a real React element so renderToStaticMarkup can render it
jest.mock('@/components/pages/auth/login/login', () => ({
	__esModule: true,
	default: () => {
		// return an element with the marker text
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'LOGIN_CLIENT_MARKER');
	},
}));

// Mock routes to ensure DASHBOARD is stable
const DASHBOARD = '/dashboard';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	DASHBOARD,
}));

afterEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

describe('LoginPage server component', () => {
	it('redirects to DASHBOARD when session exists', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 1, email: 'a@b.com' } });

		// require after mocks so module picks them up
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const mod = require('./page'); // adjust path if the file is elsewhere
		const Page = mod.default as () => Promise<unknown>;

		await expect(Page()).rejects.toThrow('redirect');
		expect(mockRedirect).toHaveBeenCalledWith(DASHBOARD);
	});

	it('returns LoginClient when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const mod = require('./page'); // adjust path if the file is elsewhere
		const Page = mod.default as () => Promise<unknown>;

		const result = await Page();
		// result is a React element; render it to HTML and assert the marker text
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		expect(html).toContain('LOGIN_CLIENT_MARKER');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
