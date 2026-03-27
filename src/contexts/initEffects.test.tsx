import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { InitEffects } from './initEffects';
import { useSession } from 'next-auth/react';
import { useGetProfilQuery, useGetGroupsQuery } from '@/store/services/account';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { useAppDispatch } from '@/utils/hooks';
import { useInitAccessToken } from './InitContext';

jest.mock('next-auth/react');
jest.mock('@/store/services/account');
jest.mock('@/store/services/company');
jest.mock('@/utils/hooks');
jest.mock('./InitContext', () => ({
	__esModule: true,
	useInitAccessToken: jest.fn(),
}));

// Mock next/navigation hooks
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
	usePathname: jest.fn(),
}));

import { useRouter, usePathname } from 'next/navigation';

const mockDispatch = jest.fn();

describe('InitEffects', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		(useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
		(useInitAccessToken as jest.Mock).mockReturnValue('mock-token');

		// Provide simple router mocks to satisfy next/navigation usage
		(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
		(usePathname as jest.Mock).mockReturnValue('/');

		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetGroupsQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: undefined });
	});

	it('dispatches init tokens when session is authenticated', async () => {
		const mockSession = { user: { name: 'Test' }, accessToken: 'mock-access-token' };
		(useSession as jest.Mock).mockReturnValue({ data: mockSession, status: 'authenticated' });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'INIT_APP' }));
			expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'INIT_APP_SESSION_TOKENS' }));
		});
	});

	it('dispatches profile and group actions when data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockUser = { id: 1, name: 'User' };
		const mockGroups = [{ id: 1, name: 'Group' }];

		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: mockUser });
		(useGetGroupsQuery as jest.Mock).mockReturnValue({ data: mockGroups });

		render(<InitEffects />);

		await waitFor(() => {
			const calls = mockDispatch.mock.calls.map(([action]) => action);

			const normalizedCalls = calls.map((c) => {
				if (c.type === 'ACCOUNT_SET_GROUPES' && !Array.isArray(c.data)) {
					return { ...c, data: Object.values(c.data) };
				}
				return c;
			});

			expect(normalizedCalls).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ type: 'ACCOUNT_SET_PROFIL', data: mockUser }),
					expect.objectContaining({ type: 'ACCOUNT_SET_GROUPES', data: mockGroups }),
				]),
			);
		});
	});

	it('dispatches companies action when companies data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockCompanies = [
			{ id: 1, raison_sociale: 'Alpha Corp', role: 'Caissier' },
			{ id: 2, raison_sociale: 'Beta LLC', role: 'Lecture' },
		];
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: mockCompanies });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'COMPANIES_SET_USER_COMPANIES', data: mockCompanies }),
			);
		});
	});
});
