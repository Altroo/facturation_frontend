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

jest.mock('@/components/pages/dashboard/facture-avoir/facture-avoir-form', () => ({
	__esModule: true,
	default: (props: { company_id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, `FACTURE_AVOIR_FORM:${props.company_id}`);
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

describe('FactureAvoirNewPage server component', () => {
	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as (props: { searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;

		await Page({ searchParams: Promise.resolve({ company_id: '4' }) });
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('redirects to list when company id is invalid', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 3, email: 'user@example.com' } });

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as (props: { searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;

		await Page({ searchParams: Promise.resolve({ company_id: 'bad' }) });
		expect(mockRedirect).toHaveBeenCalledWith(FACTURE_AVOIR_LIST);
	});

	it('renders form with company id', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 3, email: 'user@example.com' } });

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as (props: { searchParams: Promise<{ company_id: string }> }) => Promise<unknown>;

		const result = await Page({ searchParams: Promise.resolve({ company_id: '8' }) });
		expect(renderToStaticMarkup(result as React.ReactElement)).toContain('FACTURE_AVOIR_FORM:8');
	});
});
