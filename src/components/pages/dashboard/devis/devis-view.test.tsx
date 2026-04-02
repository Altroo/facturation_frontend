import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DevisViewClient from './devis-view';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/utils/hooks';

// Mock Next.js App Router
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
	usePathname: () => '/mock-path',
}));

// Mock RTK Query hooks - preserve actual module and only mock the hook
jest.mock('@/store/services/devi', () => {
	const actual = jest.requireActual('@/store/services/devi');
	return { ...actual, useGetDeviQuery: jest.fn() };
});
jest.mock('@/store/services/article', () => {
	const actual = jest.requireActual('@/store/services/article');
	return { ...actual, useGetArticlesListQuery: jest.fn() };
});

// Mock InitContext
jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: () => 'test-token',
}));

// Mock selector
jest.mock('@/utils/hooks', () => {
	const { translations } = jest.requireActual('@/translations');
	return {
		useAppSelector: jest.fn(),
		useToast: jest.fn(() => ({ onSuccess: jest.fn(), onError: jest.fn() })),
		useLanguage: () => ({ language: 'fr' as const, setLanguage: jest.fn(), t: translations.fr }),
		useIsClient: () => true,
	};
});

const mockSession = {
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

const defaultProps = { session: mockSession, company_id: 1, id: 123 };

// minimal mock data
const mockArticle = {
	id: 11,
	reference: 'REF-A1',
	designation: 'Produit A',
	prix_achat: 50,
	prix_vente: 100,
	tva: 20,
	categorie_name: 'Cat A',
	marque_name: 'BrandA',
	photo: '/img-a.png',
};

const mockDevis = {
	numero_devis: 'DEV-001',
	date_devis: '2025-01-01',
	statut: 'Envoyé',
	client_name: 'Client X',
	mode_paiement_name: 'Virement',
	numero_demande_prix_client: 'REQ-123',
	remise: 10,
	remise_type: 'Pourcentage',
	remarque: 'Livrer avant fin mois',
	date_created: '2025-01-01T10:00:00Z',
	date_updated: '2025-01-02T12:00:00Z',
	created_by_user_name: 'Caissier User',
	lignes: [
		{
			article: 11,
			designation: 'Produit A',
			prix_vente: 100,
			prix_achat: 50,
			devise_prix_achat: 'MAD',
			quantity: 2,
			remise: 0,
			remise_type: '',
		},
	],
};

const { useGetDeviQuery } = jest.requireMock('@/store/services/devi') as {
	useGetDeviQuery: jest.Mock;
};
const { useGetArticlesListQuery } = jest.requireMock('@/store/services/article') as {
	useGetArticlesListQuery: jest.Mock;
};

describe('DevisViewClient UI and navigation', () => {
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

		// default Caissier role
		(useAppSelector as jest.Mock).mockReturnValue([{ id: 1, role: 'Caissier' }]);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('renders loading state', () => {
		useGetDeviQuery.mockReturnValue({ isLoading: true, data: undefined, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: true, data: undefined, error: undefined });

		renderWithProviders(<DevisViewClient {...defaultProps} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders error state', () => {
		useGetDeviQuery.mockReturnValue({
			isLoading: false,
			data: undefined,
			error: { status: 500, data: { details: { message: ['Erreur serveur'] } } },
		});
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: undefined, error: undefined });

		renderWithProviders(<DevisViewClient {...defaultProps} />);
		expect(screen.getByText(/Erreur serveur/)).toBeInTheDocument();
	});

	it('renders devis details when data is available', () => {
		useGetDeviQuery.mockReturnValue({ isLoading: false, data: mockDevis, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: [mockArticle], error: undefined });

		renderWithProviders(<DevisViewClient {...defaultProps} />);

		// Check document info and totals presence
		expect(screen.getByText('Informations du document')).toBeInTheDocument();
		expect(screen.getByText('Numéro du devis')).toBeInTheDocument();
		expect(screen.getByText('DEV-001')).toBeInTheDocument();

		// Totals header present
		expect(screen.getByText('TOTAL TTC')).toBeInTheDocument();

		// client info and payment
		// Target the header Typography (h6) to avoid ambiguous matches
		expect(screen.getByText('Client', { selector: 'h6' })).toBeInTheDocument();
		expect(screen.getByText('Client X')).toBeInTheDocument();
		expect(screen.getByText('Paiement & Conditions')).toBeInTheDocument();
		expect(screen.getByText('Virement')).toBeInTheDocument();

		// Lines / DataGrid header
		expect(screen.getByText('Lignes du devis')).toBeInTheDocument();

		// Remise and remarque
		expect(screen.getByText('Remise globale')).toBeInTheDocument();
		expect(screen.getByText('Remarque', { selector: 'h6' })).toBeInTheDocument();
		expect(screen.getByText('Livrer avant fin mois')).toBeInTheDocument();
	});

	it('navigates back to list when "Liste des devis" button clicked', () => {
		useGetDeviQuery.mockReturnValue({ isLoading: false, data: mockDevis, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: [mockArticle], error: undefined });

		renderWithProviders(<DevisViewClient {...defaultProps} />);
		fireEvent.click(screen.getByText('Liste des devis', { selector: 'button' }));
		expect(mockPush).toHaveBeenCalled();
	});

	it('shows and navigates with "Modifier" button when role is Caissier', () => {
		useGetDeviQuery.mockReturnValue({ isLoading: false, data: mockDevis, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: [mockArticle], error: undefined });

		renderWithProviders(<DevisViewClient {...defaultProps} />);
		const editBtn = screen.getByText('Modifier', { selector: 'button' });
		expect(editBtn).toBeInTheDocument();

		fireEvent.click(editBtn);
		expect(mockPush).toHaveBeenCalled();
	});

	it('does not show "Modifier" button when role is Lecture', () => {
		(useAppSelector as jest.Mock).mockReturnValue([{ id: 1, role: 'Lecture' }]);

		useGetDeviQuery.mockReturnValue({ isLoading: false, data: mockDevis, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: [mockArticle], error: undefined });

		renderWithProviders(<DevisViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button during loading', () => {
		useGetDeviQuery.mockReturnValue({ isLoading: true, data: undefined, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: true, data: undefined, error: undefined });

		renderWithProviders(<DevisViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button on error', () => {
		useGetDeviQuery.mockReturnValue({
			isLoading: false,
			data: undefined,
			error: { data: { message: 'Erreur serveur' } },
		});
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: undefined, error: undefined });

		renderWithProviders(<DevisViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});
});
