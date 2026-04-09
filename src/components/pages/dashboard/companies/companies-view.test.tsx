import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CompaniesViewClient from './companies-view';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useGetCompanyQuery } from '@/store/services/company';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/utils/hooks';

// Mock Next.js App Router as jest.fn so we can control return values
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
	usePathname: jest.fn(() => '/mock-path'),
}));

// Mock RTK Query hook
jest.mock('@/store/services/company', () => {
	const actual = jest.requireActual('@/store/services/company');
	return {
		...actual,
		useGetCompanyQuery: jest.fn(),
	};
});

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children?: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>,
}));

// Mock hooks module
jest.mock('@/utils/hooks', () => {
	const { translations } = jest.requireActual('@/translations');
	return {
		useAppDispatch: () => jest.fn(),
		useAppSelector: jest.fn(),
		usePermission: () => ({ is_staff: true }),
		useToast: jest.fn(() => ({ onSuccess: jest.fn(), onError: jest.fn() })),
		useLanguage: () => ({ language: 'fr' as const, setLanguage: jest.fn(), t: translations.fr }),
		useIsClient: () => true,
	};
});

// Mock selectors
jest.mock('@/store/selectors', () => ({
	getProfilState: jest.fn(() => ({ id: 1, is_staff: true })),
}));

// Minimal test store
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
	const defaultProps = { session: mockSession, id: 123 };
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

		// Default: user is staff/admin so "Modifier" can render when not loading/error
		(useAppSelector as jest.Mock).mockImplementation((selector) =>
			selector({ account: { profil: { id: 1, is_staff: true } } }),
		);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

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
			error: { status: 500, data: { details: { message: ['Erreur serveur'] } } },
		});

		renderWithProviders(<CompaniesViewClient {...defaultProps} />);
		expect(screen.getByText(/Erreur serveur/)).toBeInTheDocument();
	});

	it('renders company details on success', () => {
		(useGetCompanyQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: {
				id: 123,
				raison_sociale: 'Entreprise Test',
				logo_cropped: '/logo.png',
				admins: [{ id: 1, first_name: 'Alice', last_name: 'Doe', role: 'Caissier' }],
			},
		});

		renderWithProviders(<CompaniesViewClient {...defaultProps} />);
		expect(screen.getByText('Entreprise Test')).toBeInTheDocument();
		expect(screen.getByText('ICE: 123')).toBeInTheDocument();
		expect(screen.getByText('Alice Doe')).toBeInTheDocument();
		expect(screen.getByText('Caissier')).toBeInTheDocument();
	});

	it('navigates back to list when "Liste des entreprises" button is clicked', () => {
		(useGetCompanyQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: {
				id: 123,
				raison_sociale: 'Entreprise Test',
				logo_cropped: '/logo.png',
				admins: [],
			},
		});

		renderWithProviders(<CompaniesViewClient {...defaultProps} />);
		fireEvent.click(screen.getByText('Liste des entreprises', { selector: 'button' }));
		expect(mockPush).toHaveBeenCalled();
	});

	it('shows and navigates with "Modifier" button when not loading and no error', () => {
		(useGetCompanyQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: {
				id: 123,
				raison_sociale: 'Entreprise Test',
				logo_cropped: '/logo.png',
				admins: [],
			},
		});

		renderWithProviders(<CompaniesViewClient {...defaultProps} />);
		const editBtn = screen.getByText('Modifier', { selector: 'button' });
		expect(editBtn).toBeInTheDocument();

		fireEvent.click(editBtn);
		expect(mockPush).toHaveBeenCalled();
	});

	it('does not show "Modifier" button during loading', () => {
		(useGetCompanyQuery as jest.Mock).mockReturnValue({
			isLoading: true,
			error: undefined,
			data: undefined,
		});

		renderWithProviders(<CompaniesViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button on error', () => {
		(useGetCompanyQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: { data: { message: 'Erreur serveur' } },
			data: undefined,
		});

		renderWithProviders(<CompaniesViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});
});
