import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ArticlesViewClient from './articles-view';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useGetArticleQuery } from '@/store/services/article';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/utils/hooks';

// Mock Next.js App Router
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
	usePathname: () => '/mock-path',
}));

// Mock RTK Query hook
jest.mock('@/store/services/article', () => {
	const actual = jest.requireActual('@/store/services/article');
	return { ...actual, useGetArticleQuery: jest.fn() };
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

const defaultProps = { session: mockSession, company_id: 1, id: 123 };

const mockArticle = {
	reference: 'REF001',
	type_article: 'Electronics',
	designation: 'Smartphone',
	prix_achat: 100,
	devise_prix_achat: 'MAD',
	prix_vente: 150,
	devise_prix_vente: 'MAD',
	tva: 20,
	categorie_name: 'Phones',
	marque_name: 'BrandX',
	unite_name: 'Piece',
	emplacement_name: 'Warehouse A',
	remarque: 'Top seller',
	photo: '/test.png',
};

describe('ArticlesViewClient navigation and permissions', () => {
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

		// Default: Caissier role
		(useAppSelector as jest.Mock).mockReturnValue([{ id: 1, role: 'Caissier' }]);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('renders loading state', () => {
		(useGetArticleQuery as jest.Mock).mockReturnValue({
			isLoading: true,
			data: undefined,
			error: undefined,
		});

		renderWithProviders(<ArticlesViewClient {...defaultProps} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders error state', () => {
		(useGetArticleQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			data: undefined,
			error: { status: 500, data: { details: { message: ['Erreur serveur'] } } },
		});

		renderWithProviders(<ArticlesViewClient {...defaultProps} />);
		expect(screen.getByText(/Erreur serveur/)).toBeInTheDocument();
	});

	it('renders article details when data is available', () => {
		(useGetArticleQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockArticle,
		});

		renderWithProviders(<ArticlesViewClient {...defaultProps} />);
		expect(screen.getByText("Identité de l'article")).toBeInTheDocument();
		expect(screen.getByText('Référence')).toBeInTheDocument();
		expect(screen.getByText('REF001')).toBeInTheDocument();
		expect(screen.getByText('Prix de vente')).toBeInTheDocument();
		expect(screen.getByText('150 MAD')).toBeInTheDocument();
		expect(screen.getByText('Marque')).toBeInTheDocument();
		expect(screen.getByText('BrandX')).toBeInTheDocument();
		expect(screen.getByText('Remarque', { selector: 'p' })).toBeInTheDocument();
		expect(screen.getByText('Top seller')).toBeInTheDocument();
	});

	it('navigates back to list when "Liste des articles" button clicked', () => {
		(useGetArticleQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockArticle,
		});

		renderWithProviders(<ArticlesViewClient {...defaultProps} />);
		fireEvent.click(screen.getByText('Liste des articles', { selector: 'button' }));
		expect(mockPush).toHaveBeenCalled();
	});

	it('shows and navigates with "Modifier" button when role is Caissier', () => {
		(useGetArticleQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockArticle,
		});

		renderWithProviders(<ArticlesViewClient {...defaultProps} />);
		const editBtn = screen.getByText('Modifier', { selector: 'button' });
		expect(editBtn).toBeInTheDocument();

		fireEvent.click(editBtn);
		expect(mockPush).toHaveBeenCalled();
	});

	it('does not show "Modifier" button when role is not Admin', () => {
		(useAppSelector as jest.Mock).mockReturnValueOnce([{ id: 1, role: 'Lecture' }]);

		(useGetArticleQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockArticle,
		});

		renderWithProviders(<ArticlesViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button during loading', () => {
		(useGetArticleQuery as jest.Mock).mockReturnValue({
			isLoading: true,
			error: undefined,
			data: undefined,
		});

		renderWithProviders(<ArticlesViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button on error', () => {
		(useGetArticleQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: { data: { message: 'Erreur serveur' } },
			data: undefined,
		});

		renderWithProviders(<ArticlesViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});
});
