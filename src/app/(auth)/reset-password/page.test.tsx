import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

// Session shapes
type SessionUser = { pk: number; email: string };
type Session = { user: SessionUser } | null;

// Typed mock for auth: () => Promise<Session>
const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

// Mock next/navigation redirect to throw (mimic Next runtime behavior)
const mockRedirect = jest.fn(() => {
	throw new Error('redirect');
});
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

// Mock ResetPasswordClient to return a small React element with a marker text
jest.mock('@/components/pages/auth/reset-password/resetPassword', () => ({
	__esModule: true,
	default: () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'RESET_PASSWORD_CLIENT_MARKER');
	},
}));

// Mock routes constant
const DASHBOARD = '/dashboard';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	DASHBOARD,
}));

afterEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

describe('ResetPasswordPage server component', () => {
	it('redirects to DASHBOARD when session exists', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 1, email: 'a@b.com' } });

		// require after mocks so module picks them up
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const mod = require('./page'); // adjust path if the file is elsewhere
		const Page = mod.default as () => Promise<unknown>;

		await expect(Page()).rejects.toThrow('redirect');
		expect(mockRedirect).toHaveBeenCalledWith(DASHBOARD);
	});

	it('returns ResetPasswordClient when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const mod = require('./page'); // adjust path if the file is elsewhere
		const Page = mod.default as () => Promise<unknown>;

		const result = await Page();
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		expect(html).toContain('RESET_PASSWORD_CLIENT_MARKER');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
