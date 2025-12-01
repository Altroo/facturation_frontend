import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { InitEffects } from './initEffects';
import { useSession } from 'next-auth/react';
import { useGetProfilQuery, useGetGroupsQuery } from '@/store/services/account';
import { useGetCitiesListQuery } from '@/store/services/parameter';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { getInitStateToken } from '@/store/selectors';

jest.mock('next-auth/react');
jest.mock('@/store/services/account');
jest.mock('@/store/services/parameter');
jest.mock('@/store/services/company');
jest.mock('@/utils/hooks');
jest.mock('@/store/selectors');

const mockDispatch = jest.fn();

describe('InitEffects', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		(useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
		(useAppSelector as jest.Mock).mockImplementation((selector) => {
			if (selector === getInitStateToken) return { access: 'mock-token' };
			return undefined;
		});

		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetGroupsQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetCitiesListQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: undefined });
	});

	it('dispatches init tokens when session is authenticated', async () => {
		const mockSession = { user: { name: 'Test' } };
		(useSession as jest.Mock).mockReturnValue({ data: mockSession, status: 'authenticated' });

		render(<InitEffects />);

		await waitFor(() => {
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

	it('dispatches cities action when cities data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockCities = [
			{ id: 1, nom: 'Tanger' },
			{ id: 2, nom: 'Tetouan' },
		];
		(useGetCitiesListQuery as jest.Mock).mockReturnValue({ data: mockCities });

		render(<InitEffects />);

		await waitFor(() => {
			const calls = mockDispatch.mock.calls.map(([action]) => action);

			const normalizedCalls = calls.map((c) => {
				if (c.type === 'PARAMETER_SET_CITIES' && !Array.isArray(c.data)) {
					return { ...c, data: Object.values(c.data) };
				}
				return c;
			});

			expect(normalizedCalls).toEqual(
				expect.arrayContaining([expect.objectContaining({ type: 'PARAMETER_SET_CITIES', data: mockCities })]),
			);
		});
	});

	it('dispatches companies action when companies data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockCompanies = [
			{ id: 1, raison_sociale: 'Alpha Corp', role: 'Admin' },
			{ id: 2, raison_sociale: 'Beta LLC', role: 'Manager' },
		];
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: mockCompanies });

		render(<InitEffects />);

		await waitFor(() => {
			const calls = mockDispatch.mock.calls.map(([action]) => action);
			const companiesAction = calls.find((a) => a.type === 'COMPANIES_SET_USER_COMPANIES');

			expect(companiesAction).toBeDefined();
			expect(companiesAction!.data).toEqual(mockCompanies);
		});
	});
});
