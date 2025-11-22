import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { InitContextProvider } from './InitContext';
import { useSession } from 'next-auth/react';
import { useGetProfilQuery, useGetGroupsQuery } from '@/store/services/account';
import { useGetCitiesListQuery } from '@/store/services/parameter';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { getInitStateToken } from '@/store/selectors';

jest.mock('next-auth/react');
jest.mock('@/store/services/account');
jest.mock('@/store/services/parameter');
jest.mock('@/utils/hooks');
jest.mock('@/store/selectors');

const mockDispatch = jest.fn();

describe('InitContextProvider', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		(useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
		(useAppSelector as jest.Mock).mockImplementation((selector) => {
			if (selector === getInitStateToken) return 'mock-token';
			return undefined;
		});

		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetGroupsQuery as jest.Mock).mockReturnValue({ data: undefined });
		(useGetCitiesListQuery as jest.Mock).mockReturnValue({ data: undefined });
	});

	it('does not render children while session is loading', () => {
		(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' });

		render(
			<InitContextProvider>
				<div data-testid="child">Child</div>
			</InitContextProvider>,
		);

		expect(screen.queryByTestId('child')).not.toBeInTheDocument();
	});

	it('renders children when session is unauthenticated', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });

		render(
			<InitContextProvider>
				<div data-testid="child">Child</div>
			</InitContextProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId('child')).toBeInTheDocument();
		});
	});

	it('dispatches init actions when session is authenticated', async () => {
		const mockSession = { user: { name: 'Test' } };
		(useSession as jest.Mock).mockReturnValue({ data: mockSession, status: 'authenticated' });

		render(
			<InitContextProvider>
				<div data-testid="child">Child</div>
			</InitContextProvider>,
		);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'INIT_APP_SESSION_TOKENS' }));
			// expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'INIT_APP' }));
		});
	});

	it('dispatches profile and group actions when data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockUser = { id: 1, name: 'User' };
		const mockGroups = [{ id: 1, name: 'Group' }];

		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: mockUser });
		(useGetGroupsQuery as jest.Mock).mockReturnValue({ data: mockGroups });

		render(
			<InitContextProvider>
				<div data-testid="child">Child</div>
			</InitContextProvider>,
		);

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

		render(
			<InitContextProvider>
				<div data-testid="child">Child</div>
			</InitContextProvider>,
		);

		await waitFor(() => {
			const calls = mockDispatch.mock.calls.map(([action]) => action);
			const cityAction = calls.find((a) => a.type === 'PARAMETER_SET_CITIES');

			expect(cityAction).toBeDefined();

			const normalizedCities = Array.isArray(cityAction!.data) ? cityAction!.data : Object.values(cityAction!.data);

			expect(normalizedCities).toEqual(mockCities);
		});
	});
});
