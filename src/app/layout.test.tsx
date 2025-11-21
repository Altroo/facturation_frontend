import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

// Types
type SessionUser = { pk: number; email: string };
type Session = { user: SessionUser } | null;

// Mock auth
const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

jest.mock('@/providers/sessionProvider', () => ({
	__esModule: true,
	default: (props: { session?: Session; children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, `SESSION_PROVIDER:${JSON.stringify(props.session)}`, props.children);
	},
}));

jest.mock('@/providers/storeProvider', () => ({
	__esModule: true,
	default: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'STORE_PROVIDER', props.children);
	},
}));

jest.mock('@/contexts/InitContext', () => ({
	__esModule: true,
	InitContextProvider: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'INIT_CONTEXT', props.children);
	},
}));

jest.mock('@mui/material-nextjs/v15-appRouter', () => ({
	__esModule: true,
	AppRouterCacheProvider: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'MUI_CACHE', props.children);
	},
}));

jest.mock('@/providers/ThemeProvider', () => ({
	__esModule: true,
	default: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'THEME_PROVIDER', props.children);
	},
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

describe('RootLayout', () => {
	it('renders children wrapped with providers when session exists', async () => {
		const sessionValue: Session = { user: { pk: 1, email: 'test@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let RootLayout: (props: { children: React.ReactNode }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./layout');
			RootLayout = mod.default;
		});

		const result = await RootLayout!({ children: <div>CHILD_CONTENT</div> });
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('SESSION_PROVIDER');
		expect(decoded).toContain('"pk":1');
		expect(decoded).toContain('"email":"test@site.com"');
		expect(decoded).toContain('CHILD_CONTENT');
	});

	it('renders children wrapped with providers when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let RootLayout: (props: { children: React.ReactNode }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./layout');
			RootLayout = mod.default;
		});

		const result = await RootLayout!({ children: <div>CHILD_CONTENT</div> });
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);

		expect(html).toContain('SESSION_PROVIDER:null');
		expect(html).toContain('CHILD_CONTENT');
	});
});
