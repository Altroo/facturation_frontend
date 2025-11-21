import React from 'react';
import { render, screen, within } from '@testing-library/react';
import UsersViewClient from './usersView';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useGetUserQuery } from '@/store/services/account';
import '@testing-library/jest-dom';
import { AppSession } from '@/types/_initTypes';

// Mock Next.js App Router
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

// Mock RTK Query hook (keep other exports from the real module)
jest.mock('@/store/services/account', () => {
	const actual = jest.requireActual('@/store/services/account');
	return {
		...actual,
		useGetUserQuery: jest.fn(),
	};
});

// Use the real helpers module, but override formatDate to be deterministic for tests.
// This preserves hexToRGB and other helpers used during render.
jest.mock('@/utils/helpers', () => {
	const actual = jest.requireActual('@/utils/helpers');
	return {
		...actual,
		formatDate: () => '01/01/2023',
	};
});

// Mock session
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

// Render helper using your real store
const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={store}>{ui}</Provider>);

// Component props
const defaultProps = {
	session: mockSession,
	id: 123,
};

// Mock user data
const mockUserData = {
	is_active: true,
	date_joined: '2023-01-01T12:00:00Z',
	last_login: '2023-12-01T08:30:00Z',
	companies: [
		{
			membership_id: '123',
			raison_sociale: 'TechCorp',
			role: 'Admin',
		},
		{
			membership_id: '456',
			raison_sociale: 'BizGroup',
			role: 'Manager',
		},
	],
};

describe('UsersViewClient', () => {
	it('renders loading state', () => {
		(useGetUserQuery as jest.Mock).mockReturnValue({
			isLoading: true,
			data: undefined,
			error: undefined,
		});

		renderWithProviders(<UsersViewClient {...defaultProps} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders error state', () => {
		(useGetUserQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			data: undefined,
			error: {
				data: {
					message: 'Erreur serveur',
				},
			},
		});

		renderWithProviders(<UsersViewClient {...defaultProps} />);
		expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
	});

	it('renders user details on success and scopes date checks to correct labels', () => {
		(useGetUserQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockUserData,
		});

		renderWithProviders(<UsersViewClient {...defaultProps} />);

		// Basic presence checks
		expect(screen.getByText('Active')).toBeInTheDocument();
		expect(screen.getByText('Oui')).toBeInTheDocument();
		expect(screen.getByText("Date d'inscription")).toBeInTheDocument();
		expect(screen.getByText('Dernière connexion')).toBeInTheDocument();
		expect(screen.getByText('Sociétés gérées (2)')).toBeInTheDocument();
		expect(screen.getByText('TechCorp')).toBeInTheDocument();
		expect(screen.getByText('BizGroup')).toBeInTheDocument();
		expect(screen.getByText('ID: 123')).toBeInTheDocument();
		expect(screen.getByText('ID: 456')).toBeInTheDocument();
		const adminElements = screen.getAllByText((content, element) => {
			return element?.textContent === 'Admin';
		});
		expect(adminElements.length).toBeGreaterThan(0);

		expect(screen.getByText('Manager')).toBeInTheDocument();

		// There are multiple identical date nodes; scope the assertions to the correct labeled rows.

		// Find the "Date d'inscription" label element, then search within its closest row/container for the date
		const dateJoinedLabel = screen.getByText("Date d'inscription");
		const dateJoinedContainer = dateJoinedLabel.closest('div') ?? dateJoinedLabel.parentElement!;
		expect(within(dateJoinedContainer).getByText('01/01/2023')).toBeInTheDocument();

		// Find the "Dernière connexion" label element, then search within its closest row/container for the date
		const lastLoginLabel = screen.getByText('Dernière connexion');
		const lastLoginContainer = lastLoginLabel.closest('div') ?? lastLoginLabel.parentElement!;
		expect(within(lastLoginContainer).getByText('01/01/2023')).toBeInTheDocument();

		// Additionally assert both date nodes exist somewhere (optional)
		const allDates = screen.getAllByText('01/01/2023');
		expect(allDates.length).toBeGreaterThanOrEqual(2);
	});
});
