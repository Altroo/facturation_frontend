import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FactureProFormaViewClient from './facture-pro-forma-view';
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
jest.mock('@/store/services/factureProForma', () => {
	const actual = jest.requireActual('@/store/services/factureProForma');
	return { ...actual, useGetFactureProFormaQuery: jest.fn() };
});
jest.mock('@/store/services/article', () => {
	const actual = jest.requireActual('@/store/services/article');
	return { ...actual, useGetArticlesListQuery: jest.fn() };
});

// Mock InitContext
jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: () => 'test-token',
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children?: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>,
}));

// Mock selector
jest.mock('@/utils/hooks', () => {
	const { translations } = jest.requireActual('@/translations');
	return {
		useAppDispatch: () => jest.fn(),
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

const mockProForma = {
	numero_facture: 'PF-001',
	date_facture: '2025-01-01',
	statut: 'Envoyé',
	client_name: 'Client X',
	mode_paiement_name: 'Virement',
	numero_bon_commande_client: 'BC-123',
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

const { useGetFactureProFormaQuery } = jest.requireMock('@/store/services/factureProForma') as {
	useGetFactureProFormaQuery: jest.Mock;
};
const { useGetArticlesListQuery } = jest.requireMock('@/store/services/article') as {
	useGetArticlesListQuery: jest.Mock;
};

describe('ProFormaViewClient UI and navigation', () => {
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
		useGetFactureProFormaQuery.mockReturnValue({ isLoading: true, data: undefined, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: true, data: undefined, error: undefined });

		renderWithProviders(<FactureProFormaViewClient {...defaultProps} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders error state', () => {
		useGetFactureProFormaQuery.mockReturnValue({
			isLoading: false,
			data: undefined,
			error: { status: 500, data: { details: { message: ['Erreur serveur'] } } },
		});
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: undefined, error: undefined });

		renderWithProviders(<FactureProFormaViewClient {...defaultProps} />);
		expect(screen.getByText(/Erreur serveur/)).toBeInTheDocument();
	});

	it('renders pro-forma details when data is available', () => {
		useGetFactureProFormaQuery.mockReturnValue({ isLoading: false, data: mockProForma, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: [mockArticle], error: undefined });

		renderWithProviders(<FactureProFormaViewClient {...defaultProps} />);

		// Check document info and totals presence
		expect(screen.getByText('Informations du document')).toBeInTheDocument();
		expect(screen.getByText('Numéro de la facture')).toBeInTheDocument();
		expect(screen.getByText('PF-001')).toBeInTheDocument();

		// Totals header present
		expect(screen.getByText('TOTAL TTC')).toBeInTheDocument();

		// client info and payment
		expect(screen.getByText('Client', { selector: 'h6' })).toBeInTheDocument();
		expect(screen.getByText('Client X')).toBeInTheDocument();
		expect(screen.getByText('Paiement & Conditions')).toBeInTheDocument();
		expect(screen.getByText('Virement')).toBeInTheDocument();

		// Lines / DataGrid header
		expect(screen.getByText('Lignes de la facture')).toBeInTheDocument();

		// Remise and remarque
		expect(screen.getByText('Remise globale')).toBeInTheDocument();
		expect(screen.getByText('Remarque', { selector: 'h6' })).toBeInTheDocument();
		expect(screen.getByText('Livrer avant fin mois')).toBeInTheDocument();
	});

	it('navigates back to list when back button clicked', () => {
		useGetFactureProFormaQuery.mockReturnValue({ isLoading: false, data: mockProForma, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: [mockArticle], error: undefined });

		renderWithProviders(<FactureProFormaViewClient {...defaultProps} />);
		fireEvent.click(screen.getByText('Liste des factures pro-forma', { selector: 'button' }));
		expect(mockPush).toHaveBeenCalled();
	});

	it('shows and navigates with "Modifier" button when role is Admin', () => {
		useGetFactureProFormaQuery.mockReturnValue({ isLoading: false, data: mockProForma, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: [mockArticle], error: undefined });

		renderWithProviders(<FactureProFormaViewClient {...defaultProps} />);
		const editBtn = screen.getByText('Modifier', { selector: 'button' });
		expect(editBtn).toBeInTheDocument();

		fireEvent.click(editBtn);
		expect(mockPush).toHaveBeenCalled();
	});

	it('does not show "Modifier" button when role is not Admin', () => {
		(useAppSelector as jest.Mock).mockReturnValue([{ id: 1, role: 'Lecture' }]);

		useGetFactureProFormaQuery.mockReturnValue({ isLoading: false, data: mockProForma, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: [mockArticle], error: undefined });

		renderWithProviders(<FactureProFormaViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button during loading', () => {
		useGetFactureProFormaQuery.mockReturnValue({ isLoading: true, data: undefined, error: undefined });
		useGetArticlesListQuery.mockReturnValue({ isLoading: true, data: undefined, error: undefined });

		renderWithProviders(<FactureProFormaViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button on error', () => {
		useGetFactureProFormaQuery.mockReturnValue({
			isLoading: false,
			data: undefined,
			error: { data: { message: 'Erreur serveur' } },
		});
		useGetArticlesListQuery.mockReturnValue({ isLoading: false, data: undefined, error: undefined });

		renderWithProviders(<FactureProFormaViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});
});
