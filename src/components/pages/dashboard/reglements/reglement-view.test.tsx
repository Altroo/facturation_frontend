import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { AppSession } from '@/types/_initTypes';

// Minimal mock store
const mockStore = configureStore({
	reducer: {
		_init: () => ({}),
		account: () => ({}),
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	__esModule: true,
	useRouter: () => ({
		push: mockPush,
		back: jest.fn(),
		replace: jest.fn(),
		refresh: jest.fn(),
		forward: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

// Mock hooks
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useAppSelector: jest.fn(() => [{ id: 1, role: 'Caissier' }]),
	useToast: jest.fn(() => ({ onSuccess: jest.fn(), onError: jest.fn() })),
	useLanguage: () => ({ language: 'fr' as const, setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getUserCompaniesState: jest.fn(),
}));

jest.mock('@/contexts/InitContext', () => ({
	__esModule: true,
	useInitAccessToken: () => 'test-token',
}));

// Mock reglement service hooks
const mockUseGetReglementQuery = jest.fn();

jest.mock('@/store/services/reglement', () => ({
	__esModule: true,
	useGetReglementQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetReglementQuery(params, options),
	useDeleteReglementMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

// Mock NavigationBar
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children, title }: { children: React.ReactNode; title: string }) => (
		<div data-testid="navigation-bar">
			<h1 data-testid="nav-title">{title}</h1>
			{children}
		</div>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: ({ errorDetails }: { errorDetails?: { message?: string[] } }) => (
		<div data-testid="api-alert">{errorDetails?.message?.[0] ?? 'Error'}</div>
	),
}));

// Mock devis-list for getStatutColor
jest.mock('@/components/pages/dashboard/devis/devis-list', () => ({
	__esModule: true,
	getStatutColor: (statut: string) => {
		if (statut === 'Valide') return 'success';
		if (statut === 'Annulé') return 'error';
		return 'default';
	},
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
	formatNumber: (val: number) => (val != null ? val.toFixed(2) : '0.00'),
}));

jest.mock('@/utils/routes', () => ({
	REGLEMENTS_LIST: '/dashboard/reglements',
	REGLEMENTS_EDIT: jest.fn((id: number, companyId: number) => `/dashboard/reglements/${id}/edit?company_id=${companyId}`),
}));

// Import after mocks
import ReglementViewClient from './reglement-view';

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		id: '1',
		pk: 1,
		email: 'test@example.com',
		emailVerified: null,
		name: 'Test User',
		first_name: 'Test',
		last_name: 'User',
		image: null,
	},
};

const mockReglement = {
	id: 123,
	facture_client_numero: 'FC-001',
	client_name: 'Client A',
	mode_reglement_name: 'Virement',
	montant: 500.0,
	devise: 'MAD',
	libelle: 'Paiement test',
	date_reglement: '2025-02-10',
	date_echeance: '2025-03-10',
	date_created: '2025-02-10T10:00:00Z',
	date_updated: '2025-02-11T12:00:00Z',
	statut: 'Valide',
	montant_facture: 1000,
	total_reglements_facture: 500,
	reste_a_payer: 500,
};

const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={mockStore}>{ui}</Provider>);

const defaultProps = { session: mockSession, company_id: 1, id: 123 };

describe('ReglementViewClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders loading state', () => {
		mockUseGetReglementQuery.mockReturnValue({ isLoading: true, data: undefined, error: undefined });

		renderWithProviders(<ReglementViewClient {...defaultProps} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders error state', () => {
		mockUseGetReglementQuery.mockReturnValue({
			isLoading: false,
			data: undefined,
			error: { status: 500, data: { details: { message: ['Erreur serveur'] } } },
		});

		renderWithProviders(<ReglementViewClient {...defaultProps} />);
		expect(screen.getByTestId('api-alert')).toBeInTheDocument();
	});

	it('renders reglement details when data is available', () => {
		mockUseGetReglementQuery.mockReturnValue({ isLoading: false, data: mockReglement, error: undefined });

		renderWithProviders(<ReglementViewClient {...defaultProps} />);

		expect(screen.getByTestId('nav-title')).toHaveTextContent('Détails du règlement');
		expect(screen.getByText('Statut')).toBeInTheDocument();
		expect(screen.getByText('Informations de la facture')).toBeInTheDocument();
		expect(screen.getByText('Facture client *')).toBeInTheDocument();
		expect(screen.getByText('FC-001')).toBeInTheDocument();
		expect(screen.getByText('Client A')).toBeInTheDocument();
		expect(screen.getAllByText('Détails du règlement').length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText('Virement')).toBeInTheDocument();
		expect(screen.getByText('Paiement test')).toBeInTheDocument();
		expect(screen.getByText('Dates')).toBeInTheDocument();
	});

	it('renders financial summary card', () => {
		mockUseGetReglementQuery.mockReturnValue({ isLoading: false, data: mockReglement, error: undefined });

		renderWithProviders(<ReglementViewClient {...defaultProps} />);
		expect(screen.getByText('MONTANT FACTURE')).toBeInTheDocument();
		expect(screen.getByText('TOTAL RÈGLEMENTS')).toBeInTheDocument();
		expect(screen.getByText('RESTE À PAYER')).toBeInTheDocument();
		expect(screen.getByText('CE RÈGLEMENT')).toBeInTheDocument();
	});

	it('renders back button and navigates to list', () => {
		mockUseGetReglementQuery.mockReturnValue({ isLoading: false, data: mockReglement, error: undefined });

		renderWithProviders(<ReglementViewClient {...defaultProps} />);
		const backButton = screen.getByText('Liste des règlements', { selector: 'button' });
		expect(backButton).toBeInTheDocument();
		fireEvent.click(backButton);
		expect(mockPush).toHaveBeenCalled();
	});

	it('shows "Modifier" button when role is Caissier and statut is Valide', () => {
		mockUseGetReglementQuery.mockReturnValue({ isLoading: false, data: mockReglement, error: undefined });

		renderWithProviders(<ReglementViewClient {...defaultProps} />);
		const editBtn = screen.getByText('Modifier', { selector: 'button' });
		expect(editBtn).toBeInTheDocument();
		fireEvent.click(editBtn);
		expect(mockPush).toHaveBeenCalled();
	});

	it('does not show "Modifier" button when role is not Caissier', () => {
		const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
		useAppSelector.mockReturnValueOnce([{ id: 1, role: 'Lecture' }]);
		mockUseGetReglementQuery.mockReturnValue({ isLoading: false, data: mockReglement, error: undefined });

		renderWithProviders(<ReglementViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button when statut is Annulé', () => {
		mockUseGetReglementQuery.mockReturnValue({
			isLoading: false,
			data: { ...mockReglement, statut: 'Annulé' },
			error: undefined,
		});

		renderWithProviders(<ReglementViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button during loading', () => {
		mockUseGetReglementQuery.mockReturnValue({ isLoading: true, data: undefined, error: undefined });

		renderWithProviders(<ReglementViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button on error', () => {
		mockUseGetReglementQuery.mockReturnValue({
			isLoading: false,
			data: undefined,
			error: { status: 500, data: { details: { message: ['Erreur'] } } },
		});

		renderWithProviders(<ReglementViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('calls useGetReglementQuery with correct id', () => {
		mockUseGetReglementQuery.mockReturnValue({ isLoading: false, data: mockReglement, error: undefined });

		renderWithProviders(<ReglementViewClient {...defaultProps} />);
		expect(mockUseGetReglementQuery).toHaveBeenCalledWith({ id: 123 }, expect.any(Object));
	});
});
