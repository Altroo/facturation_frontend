import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

type Session = { user: { pk: number; email: string } } | null;

const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

const mockRedirect = jest.fn((url: string | URL) => ({ redirectedTo: String(url) }));
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

jest.mock('@/components/pages/dashboard/facture-avoir/facture-avoir-view', () => ({
	__esModule: true,
	default: (props: { id?: number; company_id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, `FACTURE_AVOIR_VIEW:${props.id}:${props.company_id}`);
	},
}));

const AUTH_LOGIN = '/login';
const FACTURE_AVOIR_LIST = '/dashboard/facture-avoir';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
	FACTURE_AVOIR_LIST,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

const validProps = {
	params: Promise.resolve({ id: '12' }),
	searchParams: Promise.resolve({ company_id: '9' }),
};

describe('FactureAvoirViewPage server component', () => {
	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as (props: typeof validProps) => Promise<unknown>;

		await Page(validProps);
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('redirects to list when params are invalid', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 4, email: 'user@example.com' } });

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as (props: typeof validProps) => Promise<unknown>;

		await Page({ params: Promise.resolve({ id: 'bad' }), searchParams: Promise.resolve({ company_id: '9' }) });
		expect(mockRedirect).toHaveBeenCalledWith(FACTURE_AVOIR_LIST);
	});

	it('renders view with numeric params', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 4, email: 'user@example.com' } });

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as (props: typeof validProps) => Promise<unknown>;

		const result = await Page(validProps);
		expect(renderToStaticMarkup(result as React.ReactElement)).toContain('FACTURE_AVOIR_VIEW:12:9');
	});
});
