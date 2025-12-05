import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import UsersViewClient from './usersView';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useGetUserQuery } from '@/store/services/account';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/utils/hooks';

// 🧩 Mock Next.js App Router
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
	usePathname: () => '/mock-path',
}));

// 🧩 Mock RTK Query hook
jest.mock('@/store/services/account', () => {
	const actual = jest.requireActual('@/store/services/account');
	return { ...actual, useGetUserQuery: jest.fn() };
});

// 🧩 Mock helpers (make formatDate deterministic)
jest.mock('@/utils/helpers', () => {
	const actual = jest.requireActual('@/utils/helpers');
	return { ...actual, formatDate: () => '01/01/2023' };
});

// 🧩 Mock hooks module
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
	usePermission: () => ({ is_staff: true }),
}));

// 🧩 Mock selectors
jest.mock('@/store/selectors', () => ({
	getProfilState: jest.fn(() => ({ is_staff: true })),
}));

// 🧩 Minimal test store
const makeTestStore = () =>
	configureStore({
		reducer: {
			profil: (state = { is_staff: true }) => state,
		},
		middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: true, serializableCheck: false }),
	});

const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={makeTestStore()}>{ui}</Provider>);

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

// Component props
const defaultProps = { session: mockSession, id: 123 };

// Mock user data
const mockUserData = {
	is_active: true,
	date_joined: '2023-01-01T12:00:00Z',
	last_login: '2023-12-01T08:30:00Z',
	companies: [
		{ membership_id: '123', raison_sociale: 'TechCorp', role: 'Admin' },
		{ membership_id: '456', raison_sociale: 'BizGroup', role: 'Manager' },
	],
};

describe('UsersViewClient navigation and permissions', () => {
	const mockPush = jest.fn();

	beforeEach(() => {
		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
			replace: jest.fn(),
			refresh: jest.fn(),
			back: jest.fn(),
			forward: jest.fn(),
			prefetch: jest.fn(),
		});

		// Default: Admin role
		(useAppSelector as jest.Mock).mockReturnValue([{ id: 1, role: 'Admin' }]);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

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
			error: { status: 500, data: { details: { message: ['Erreur serveur'] } } },
		});

		renderWithProviders(<UsersViewClient {...defaultProps} />);
		expect(screen.getByText(/Erreur serveur/)).toBeInTheDocument();
	});

	it('renders user details on success and scopes date checks to correct labels', () => {
		(useGetUserQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockUserData,
		});

		renderWithProviders(<UsersViewClient {...defaultProps} />);

		expect(screen.getByText('Active')).toBeInTheDocument();
		expect(screen.getByText('Oui')).toBeInTheDocument();
		expect(screen.getByText("Date d'inscription")).toBeInTheDocument();
		expect(screen.getByText('Dernière connexion')).toBeInTheDocument();
		expect(screen.getByText('Sociétés gérées (2)')).toBeInTheDocument();
		expect(screen.getByText('TechCorp')).toBeInTheDocument();
		expect(screen.getByText('BizGroup')).toBeInTheDocument();
		expect(screen.getByText('ID: 123')).toBeInTheDocument();
		expect(screen.getByText('ID: 456')).toBeInTheDocument();

		const adminElements = screen.getAllByText((_, element) => element?.textContent === 'Admin');
		expect(adminElements.length).toBeGreaterThan(0);

		expect(screen.getByText('Manager')).toBeInTheDocument();

		const dateJoinedLabel = screen.getByText("Date d'inscription");
		const dateJoinedContainer = dateJoinedLabel.closest('div') ?? dateJoinedLabel.parentElement!;
		expect(within(dateJoinedContainer).getByText('01/01/2023')).toBeInTheDocument();

		const lastLoginLabel = screen.getByText('Dernière connexion');
		const lastLoginContainer = lastLoginLabel.closest('div') ?? lastLoginLabel.parentElement!;
		expect(within(lastLoginContainer).getByText('01/01/2023')).toBeInTheDocument();

		const allDates = screen.getAllByText('01/01/2023');
		expect(allDates.length).toBeGreaterThanOrEqual(2);
	});

	// 🔥 Added navigation + permissions tests
	it('navigates back to list when "Liste des utilisateurs" button is clicked', () => {
		(useGetUserQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockUserData,
		});

		renderWithProviders(<UsersViewClient {...defaultProps} />);
		fireEvent.click(screen.getByText('Liste des utilisateurs', { selector: 'button' }));
		expect(mockPush).toHaveBeenCalled();
	});

	it('shows and navigates with "Modifier" button when role is Admin', () => {
		(useGetUserQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockUserData,
		});

		renderWithProviders(<UsersViewClient {...defaultProps} />);
		const editBtn = screen.getByText('Modifier', { selector: 'button' });
		expect(editBtn).toBeInTheDocument();

		fireEvent.click(editBtn);
		expect(mockPush).toHaveBeenCalled();
	});

	it('renders Modifier button when not loading and no error', () => {
		(useGetUserQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockUserData,
		});

		renderWithProviders(<UsersViewClient {...defaultProps} />);
		expect(screen.getByText('Modifier', { selector: 'button' })).toBeInTheDocument();
	});

	it('does not show "Modifier" button during loading', () => {
		(useGetUserQuery as jest.Mock).mockReturnValue({
			isLoading: true,
			error: undefined,
			data: undefined,
		});

		renderWithProviders(<UsersViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button on error', () => {
		(useGetUserQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: { data: { message: 'Erreur serveur' } },
			data: undefined,
		});

		renderWithProviders(<UsersViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});
});
