import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { InitEffects } from './initEffects';
import { useSession } from 'next-auth/react';
import { useGetProfilQuery, useGetGroupsQuery } from '@/store/services/account';
import {
	useGetCitiesListQuery,
	useGetCategorieListQuery,
	useGetEmplacementListQuery,
	useGetUniteListQuery,
	useGetMarqueListQuery,
	useGetModePaiementListQuery,
	useGetModeReglementListQuery,
	useGetLivreParListQuery,
} from '@/store/services/parameter';
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
		(useGetCategorieListQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetEmplacementListQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetUniteListQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetMarqueListQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetModePaiementListQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetModeReglementListQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetLivreParListQuery as jest.Mock).mockReturnValue({ data: undefined });
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
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'PARAMETER_SET_CITIES', data: mockCities }),
			);
		});
	});

	it('dispatches categories action when categories data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockCategories = [{ id: 1, nom: 'Electronics' }];
		(useGetCategorieListQuery as jest.Mock).mockReturnValue({ data: mockCategories });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'PARAMETER_SET_CATEGORIES', data: mockCategories }),
			);
		});
	});

	it('dispatches emplacements action when emplacements data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockEmplacements = [{ id: 1, nom: 'Warehouse A' }];
		(useGetEmplacementListQuery as jest.Mock).mockReturnValue({ data: mockEmplacements });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'PARAMETER_SET_EMPLACEMENTS', data: mockEmplacements }),
			);
		});
	});

	it('dispatches unites action when unites data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockUnites = [{ id: 1, nom: 'Kg' }];
		(useGetUniteListQuery as jest.Mock).mockReturnValue({ data: mockUnites });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'PARAMETER_SET_UNITES', data: mockUnites }),
			);
		});
	});

	it('dispatches marques action when marques data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockMarques = [{ id: 1, nom: 'Brand A' }];
		(useGetMarqueListQuery as jest.Mock).mockReturnValue({ data: mockMarques });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'PARAMETER_SET_MARQUES', data: mockMarques }),
			);
		});
	});

	it('dispatches modePaiement action when data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockModePaiement = [{ id: 1, nom: 'Cash' }];
		(useGetModePaiementListQuery as jest.Mock).mockReturnValue({ data: mockModePaiement });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'PARAMETER_SET_MODE_PAIEMENT', data: mockModePaiement }),
			);
		});
	});

	it('dispatches modeReglement action when data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockModeReglement = [{ id: 1, nom: 'Monthly' }];
		(useGetModeReglementListQuery as jest.Mock).mockReturnValue({ data: mockModeReglement });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'PARAMETER_SET_MODE_REGLEMENT', data: mockModeReglement }),
			);
		});
	});

	it('dispatches livrePar action when livrePar data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockLivrePar = [{ id: 1, nom: 'Driver A' }];
		(useGetLivreParListQuery as jest.Mock).mockReturnValue({ data: mockLivrePar });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'PARAMETER_SET_LIVRE_PAR', data: mockLivrePar }),
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
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'COMPANIES_SET_USER_COMPANIES', data: mockCompanies }),
			);
		});
	});
});
