import React from 'react';
import { render, screen } from '@testing-library/react';
import CompaniesViewClient from './CompaniesView';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
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

const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={store}>{ui}</Provider>);

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
