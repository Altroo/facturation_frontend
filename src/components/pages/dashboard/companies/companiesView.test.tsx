import React from 'react';
import { render, screen } from '@testing-library/react';
import CompaniesViewClient from './companiesView';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useGetCompanyQuery } from '@/store/services/company';
import '@testing-library/jest-dom';
import { AppSession } from '@/types/_initTypes';

// 🧩 Mock Next.js App Router
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		refresh: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
		prefetch: jest.fn(),
	}),
	usePathname: () => '/mock-path',
}));

// 🧩 Mock RTK Query hook
jest.mock('@/store/services/company', () => {
	const actual = jest.requireActual('@/store/services/company');
	return {
		...actual,
		useGetCompanyQuery: jest.fn(),
	};
});

// 🧩 Mock hooks module
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn().mockImplementation((selector) =>
		selector({
			profil: { is_staff: true },
		}),
	),
	usePermission: () => ({ is_staff: true }),
}));

// 🧩 Mock selectors
jest.mock('@/store/selectors', () => ({
	getProfilState: jest.fn(() => ({ is_staff: true })),
}));

// 🧩 Minimal test store (no sagas, avoids DOMException noise)
const makeTestStore = () =>
	configureStore({
		reducer: {
			profil: (state = { is_staff: true }) => state,
		},
		middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: true, serializableCheck: false }),
	});

const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={makeTestStore()}>{ui}</Provider>);

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		accessToken: 'mock-token',
		pk: 1,
		email: 'test@example.com',
		first_name: 'Test',
		last_name: 'User',
		id: '',
		emailVerified: null,
		name: '',
	},
};

describe('CompaniesViewClient', () => {
	const defaultProps = {
		session: mockSession,
		id: 123,
	};

	it('renders loading state', () => {
		(useGetCompanyQuery as jest.Mock).mockReturnValue({
			isLoading: true,
			data: undefined,
			error: undefined,
		});

		renderWithProviders(<CompaniesViewClient {...defaultProps} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders error state', () => {
		(useGetCompanyQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			data: undefined,
			error: {
				data: {
					message: 'Erreur serveur',
				},
			},
		});

		renderWithProviders(<CompaniesViewClient {...defaultProps} />);
		expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
	});

	it('renders company details on success', () => {
		(useGetCompanyQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: {
				id: 123,
				raison_sociale: 'Entreprise Test',
				logo_cropped: '/logo.png',
				admins: [
					{
						id: 1,
						first_name: 'Alice',
						last_name: 'Doe',
						role: 'Admin',
					},
				],
			},
		});

		renderWithProviders(<CompaniesViewClient {...defaultProps} />);
		expect(screen.getByText('Entreprise Test')).toBeInTheDocument();
		expect(screen.getByText('ID: 123')).toBeInTheDocument();
		expect(screen.getByText('Alice Doe')).toBeInTheDocument();
		expect(screen.getByText('Admin')).toBeInTheDocument();
	});
});
