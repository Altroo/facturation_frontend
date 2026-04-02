import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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
		getDefaultMiddleware({ serializableCheck: false }),
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

// Mock hooks and selectors
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useAppSelector: jest.fn(() => [{ id: 1, role: 'Caissier' }]),
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
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

// Define types for mock hook return values
interface CodeReferenceQueryResult {
	data: { reference: string } | undefined;
	isLoading: boolean;
	refetch: jest.Mock;
}

interface MutationError {
	status: number;
	data: { details: string };
}

interface MutationResult {
	isLoading: boolean;
	error: MutationError | undefined;
}

// Mock article service hooks
const mockUseGetArticleQuery = jest.fn();
const mockAddArticleMutation = jest.fn();
const mockEditArticleMutation = jest.fn();
const mockUseAddArticleMutation = jest.fn((): [jest.Mock, MutationResult] => [mockAddArticleMutation, { isLoading: false, error: undefined }]);
const mockUseEditArticleMutation = jest.fn((): [jest.Mock, MutationResult] => [mockEditArticleMutation, { isLoading: false, error: undefined }]);
const mockUseGetCodeReferenceQuery = jest.fn((): CodeReferenceQueryResult => ({
	data: { reference: 'ART-001' },
	isLoading: false,
	refetch: jest.fn(),
}));

jest.mock('@/store/services/article', () => ({
	__esModule: true,
	useGetArticleQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetArticleQuery(params, options),
	useGetCodeReferenceQuery: () => mockUseGetCodeReferenceQuery(),
	useAddArticleMutation: () => mockUseAddArticleMutation(),
	useEditArticleMutation: () => mockUseEditArticleMutation(),
}));

// Mock parameter service
jest.mock('@/store/services/parameter', () => ({
	__esModule: true,
	useGetCategorieListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useGetEmplacementListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useGetUniteListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useGetMarqueListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useAddCategorieMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
	useAddEmplacementMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
	useAddMarqueMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
	useAddUniteMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

// Mock company service
jest.mock('@/store/services/company', () => ({
	__esModule: true,
	useGetCompanyQuery: jest.fn(() => ({
		data: { uses_foreign_currency: false },
		isFetching: false,
	})),
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

// Mock NoPermission
jest.mock('@/components/shared/noPermission/noPermission', () => ({
	__esModule: true,
	default: () => <div data-testid="no-permission">Accès refusé</div>,
}));

// Mock form subcomponents (interactive)
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label, onChange, onBlur }: { id: string; label: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur?: () => void }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
			<input data-testid={`input-field-${id}`} onChange={onChange} onBlur={() => onBlur?.()} />
		</div>
	),
}));

jest.mock('@/components/formikElements/formattedNumberInput/formattedNumberInput', () => ({
	__esModule: true,
	default: ({ id, label, onChange, onBlur }: { id: string; label: string; onChange?: (values: { floatValue: number | undefined }) => void; onBlur?: () => void }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
			<input data-testid={`input-field-${id}`} onChange={(e) => onChange?.({ floatValue: parseFloat(e.target.value) || undefined })} onBlur={() => onBlur?.()} />
		</div>
	),
}));

jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: ({ id, label, onChange, onBlur }: { id: string; label: string; onChange?: (event: React.SyntheticEvent, value: { id: number; label: string } | null) => void; onBlur?: () => void }) => (
		<div data-testid={`select-${id}`}>
			<label>{label}</label>
			<input data-testid={`select-field-${id}`} onChange={(e) => onChange?.(e, { id: parseInt(e.target.value) || 0, label: e.target.value })} onBlur={() => onBlur?.()} />
		</div>
	),
}));

jest.mock('@/components/formikElements/customDropDownSelect/customDropDownSelect', () => ({
	__esModule: true,
	default: ({ id, label, onChange }: { id: string; label: string; onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void }) => (
		<div data-testid={`dropdown-${id}`}>
			<label>{label}</label>
			<select data-testid={`dropdown-field-${id}`} onChange={onChange}><option value="">-</option><option value="EUR">EUR</option></select>
		</div>
	),
}));

jest.mock('@/components/formikElements/customSquareImageUploading/customSquareImageUploading', () => ({
	__esModule: true,
	default: ({ label, onChange }: { label: string; onChange?: (imageList: { data_url: string }[]) => void }) => (
		<div data-testid="image-upload">
			<span>{label}</span>
			<button data-testid="upload-btn" type="button" onClick={() => onChange?.([{ data_url: 'data:image/png;base64,test' }])}>Upload</button>
		</div>
	),
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, type, onClick }: { buttonText: string; type?: string; onClick?: () => void }) => (
		<button data-testid="submit-button" type={type as 'submit' | 'button'} onClick={onClick}>
			{buttonText}
		</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: () => <div data-testid="api-alert">Error</div>,
}));

jest.mock('@/components/shared/addEntityModal/addEntityModal', () => ({
	__esModule: true,
	default: () => <div data-testid="add-entity-modal" />,
}));

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
	customDropdownTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/helpers', () => ({
	getLabelForKey: jest.fn((labels: Record<string, string>, key: string) => labels[key] || key),
	setFormikAutoErrors: jest.fn(),
	parseNumber: jest.fn((val: string) => {
		const n = parseFloat(val);
		return Number.isNaN(n) ? null : n;
	}),
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	articleSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	ARTICLES_LIST: '/dashboard/articles',
}));

// Import after mocks
import ArticlesForm from './articles-form';

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

const renderWithProviders = (ui: React.ReactElement) => {
	return render(<Provider store={mockStore}>{ui}</Provider>);
};

describe('ArticlesForm', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetArticleQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: undefined,
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Add Mode (no id)', () => {
		it('renders the navigation bar with add title', () => {
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Ajouter un article');
		});

		it('renders form fields', () => {
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('input-reference')).toBeInTheDocument();
			expect(screen.getByTestId('input-designation')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent("Ajouter l'article");
		});

		it('renders back button text', () => {
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByText('Liste des articles')).toBeInTheDocument();
		});

		it('renders section headers', () => {
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByText("Identité de l'article")).toBeInTheDocument();
			expect(screen.getByText('Prix et TVA')).toBeInTheDocument();
			expect(screen.getByText('Classification')).toBeInTheDocument();
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders with edit title', () => {
			mockUseGetArticleQuery.mockReturnValue({
				data: {
					id: 42,
					reference: 'ART-042',
					designation: 'Widget A',
					type_article: 'Produit',
					prix_achat: 100,
					prix_vente: 150,
					tva: 20,
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'article");
		});

		it('renders submit button with update text', () => {
			mockUseGetArticleQuery.mockReturnValue({
				data: { id: 42, reference: 'ART-042', designation: 'Widget A' },
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});
	});

	describe('Loading state', () => {
		it('shows loader when data is loading', () => {
			mockUseGetArticleQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
				error: undefined,
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});

	describe('Permission check', () => {
		it('shows NoPermission for non-Caissier/Commercial role', () => {
			const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
			useAppSelector.mockReturnValue([{ id: 1, role: 'Lecture' }]);

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('no-permission')).toBeInTheDocument();

			useAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		});
	});

	describe('Hook calls', () => {
		it('calls useGetArticleQuery when in edit mode', () => {
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={456} />);
			expect(mockUseGetArticleQuery).toHaveBeenCalledWith({ id: 456 }, expect.any(Object));
		});
	});

	describe('Rich data rendering', () => {
		beforeEach(() => {
			const paramService = jest.requireMock('@/store/services/parameter') as {
				useGetCategorieListQuery: jest.Mock;
				useGetEmplacementListQuery: jest.Mock;
				useGetUniteListQuery: jest.Mock;
				useGetMarqueListQuery: jest.Mock;
			};
			paramService.useGetCategorieListQuery.mockReturnValue({
				data: [
					{ id: 10, nom: 'Cat-A' },
					{ id: 20, nom: 'Cat-B' },
				],
				isLoading: false,
			});
			paramService.useGetEmplacementListQuery.mockReturnValue({
				data: [{ id: 30, nom: 'Emp-A' }],
				isLoading: false,
			});
			paramService.useGetUniteListQuery.mockReturnValue({
				data: [{ id: 40, nom: 'Un-A' }],
				isLoading: false,
			});
			paramService.useGetMarqueListQuery.mockReturnValue({
				data: [{ id: 50, nom: 'Mar-A' }],
				isLoading: false,
			});
		});

		it('renders with non-empty category, emplacement, unite, marque items', () => {
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('select-categorie')).toBeInTheDocument();
			expect(screen.getByTestId('select-emplacement')).toBeInTheDocument();
			expect(screen.getByTestId('select-unite')).toBeInTheDocument();
			expect(screen.getByTestId('select-marque')).toBeInTheDocument();
		});

		it('renders in edit mode with matching selectors to compute selected items', () => {
			mockUseGetArticleQuery.mockReturnValue({
				data: {
					id: 42,
					reference: 'ART-042',
					designation: 'Widget A',
					type_article: 'Produit',
					prix_achat: 100,
					prix_vente: 150,
					tva: 20,
					categorie: 10,
					emplacement: 30,
					unite: 40,
					marque: 50,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'article");
			expect(screen.getByTestId('select-categorie')).toBeInTheDocument();
		});

		it('renders with usesForeignCurrency true showing currency dropdowns', () => {
			const { useGetCompanyQuery } = jest.requireMock('@/store/services/company') as {
				useGetCompanyQuery: jest.Mock;
			};
			useGetCompanyQuery.mockReturnValue({
				data: { uses_foreign_currency: true },
				isFetching: false,
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with selectors returning object instead of array', () => {
			const paramService = jest.requireMock('@/store/services/parameter') as {
				useGetCategorieListQuery: jest.Mock;
				useGetEmplacementListQuery: jest.Mock;
				useGetUniteListQuery: jest.Mock;
				useGetMarqueListQuery: jest.Mock;
			};
			paramService.useGetCategorieListQuery.mockReturnValue({ data: [{ id: 10, nom: 'Cat-A' }], isLoading: false });
			paramService.useGetEmplacementListQuery.mockReturnValue({ data: [{ id: 30, nom: 'Emp-A' }], isLoading: false });
			paramService.useGetUniteListQuery.mockReturnValue({ data: [{ id: 40, nom: 'Un-A' }], isLoading: false });
			paramService.useGetMarqueListQuery.mockReturnValue({ data: [{ id: 50, nom: 'Mar-A' }], isLoading: false });

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('select-categorie')).toBeInTheDocument();
		});

		it('renders with null/undefined selector values', () => {
			const paramService = jest.requireMock('@/store/services/parameter') as {
				useGetCategorieListQuery: jest.Mock;
				useGetEmplacementListQuery: jest.Mock;
				useGetUniteListQuery: jest.Mock;
				useGetMarqueListQuery: jest.Mock;
			};
			paramService.useGetCategorieListQuery.mockReturnValue({ data: null, isLoading: false });
			paramService.useGetEmplacementListQuery.mockReturnValue({ data: undefined, isLoading: false });
			paramService.useGetUniteListQuery.mockReturnValue({ data: null, isLoading: false });
			paramService.useGetMarqueListQuery.mockReturnValue({ data: undefined, isLoading: false });

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('select-categorie')).toBeInTheDocument();
		});

		it('renders with API error', () => {
			mockUseGetArticleQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { status: 500, data: { message: 'Server Error' } },
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('renders with code loading state', () => {
			mockUseGetCodeReferenceQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
				refetch: jest.fn(),
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});

		it('renders with commercial role', () => {
			const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
			useAppSelector.mockReturnValue([{ id: 1, role: 'Commercial' }]);
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.queryByTestId('no-permission')).not.toBeInTheDocument();
		});
	});

	describe('Field interactions', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			mockUseGetArticleQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: undefined,
			});
			// Restore factory mock values that may have been overridden by prior tests
			mockUseGetCodeReferenceQuery.mockReturnValue({
				data: { reference: 'ART-001' },
				isLoading: false,
				refetch: jest.fn(),
			});
			const companyMocks = jest.requireMock('@/store/services/company') as {
				useGetCompanyQuery: jest.Mock;
			};
			companyMocks.useGetCompanyQuery.mockReturnValue({
				data: { uses_foreign_currency: false },
				isFetching: false,
			});
			const hooksMocks = jest.requireMock('@/utils/hooks') as {
				useAppSelector: jest.Mock;
			};
			hooksMocks.useAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		});

		it('text and number field change events', () => {
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			fireEvent.change(screen.getByTestId('input-field-reference'), { target: { value: 'REF-001' } });
			fireEvent.change(screen.getByTestId('input-field-designation'), { target: { value: 'Test' } });
			fireEvent.change(screen.getByTestId('input-field-remarque'), { target: { value: 'Remark' } });
			// Price fields have complex onChange signatures - just verify they render
			expect(screen.getByTestId('input-prix_achat')).toBeInTheDocument();
			expect(screen.getByTestId('input-prix_vente')).toBeInTheDocument();
			expect(screen.getByTestId('input-tva')).toBeInTheDocument();
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('autocomplete select change events', () => {
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			fireEvent.change(screen.getByTestId('select-field-categorie'), { target: { value: '1' } });
			fireEvent.change(screen.getByTestId('select-field-emplacement'), { target: { value: '2' } });
			fireEvent.change(screen.getByTestId('select-field-unite'), { target: { value: '3' } });
			fireEvent.change(screen.getByTestId('select-field-marque'), { target: { value: '4' } });
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('image upload interaction', () => {
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			fireEvent.click(screen.getByTestId('upload-btn'));
			expect(screen.getByTestId('image-upload')).toBeInTheDocument();
		});

		it('currency dropdown interactions with foreign currency', () => {
			const { useGetCompanyQuery } = jest.requireMock('@/store/services/company') as {
				useGetCompanyQuery: jest.Mock;
			};
			useGetCompanyQuery.mockReturnValue({
				data: { uses_foreign_currency: true },
				isFetching: false,
			});
			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			fireEvent.change(screen.getByTestId('dropdown-field-devise_prix_achat'), { target: { value: 'EUR' } });
			fireEvent.change(screen.getByTestId('dropdown-field-devise_prix_vente'), { target: { value: 'EUR' } });
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});
	});

	describe('Edit mode with full data', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			mockUseGetCodeReferenceQuery.mockReturnValue({
				data: { reference: 'ART-001' },
				isLoading: false,
				refetch: jest.fn(),
			});
			const companyMocks = jest.requireMock('@/store/services/company') as {
				useGetCompanyQuery: jest.Mock;
			};
			companyMocks.useGetCompanyQuery.mockReturnValue({
				data: { uses_foreign_currency: false },
				isFetching: false,
			});
			const hooksMocks = jest.requireMock('@/utils/hooks') as {
				useAppSelector: jest.Mock;
			};
			hooksMocks.useAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		});

		it('renders with Service type article', () => {
			mockUseGetArticleQuery.mockReturnValue({
				data: {
					id: 42,
					reference: 'SRV-001',
					designation: 'Service A',
					type_article: 'Service',
					prix_achat: 0,
					prix_vente: 200,
					tva: 20,
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'article");
		});

		it('renders with photo data', () => {
			mockUseGetArticleQuery.mockReturnValue({
				data: {
					id: 42,
					reference: 'ART-042',
					designation: 'Widget A',
					type_article: 'Produit',
					prix_achat: 100,
					prix_vente: 150,
					tva: 20,
					photo: 'https://example.com/photo.jpg',
					remarque: 'Test remarque',
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('image-upload')).toBeInTheDocument();
		});

		it('renders with currency values', () => {
			const companyMocks = jest.requireMock('@/store/services/company') as {
				useGetCompanyQuery: jest.Mock;
			};
			companyMocks.useGetCompanyQuery.mockReturnValue({
				data: { uses_foreign_currency: true },
				isFetching: false,
			});

			mockUseGetArticleQuery.mockReturnValue({
				data: {
					id: 42,
					reference: 'ART-042',
					designation: 'Widget A',
					type_article: 'Produit',
					prix_achat: 100,
					prix_vente: 150,
					devise_prix_achat: 'EUR',
					devise_prix_vente: 'USD',
					tva: 20,
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('dropdown-devise_prix_achat')).toBeInTheDocument();
			expect(screen.getByTestId('dropdown-devise_prix_vente')).toBeInTheDocument();
		});

		it('renders with null optional fields', () => {
			mockUseGetArticleQuery.mockReturnValue({
				data: {
					id: 42,
					reference: 'ART-042',
					designation: 'Widget A',
					type_article: 'Produit',
					prix_achat: null,
					prix_vente: null,
					tva: null,
					categorie: null,
					emplacement: null,
					unite: null,
					marque: null,
					remarque: null,
					photo: null,
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'article");
		});
	});

	describe('Company fetching state', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			mockUseGetArticleQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: undefined,
			});
		});

		it('renders when company is still fetching', () => {
			const companyMocks = jest.requireMock('@/store/services/company') as {
				useGetCompanyQuery: jest.Mock;
			};
			companyMocks.useGetCompanyQuery.mockReturnValue({
				data: undefined,
				isFetching: true,
			});

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();

			companyMocks.useGetCompanyQuery.mockReturnValue({
				data: { uses_foreign_currency: false },
				isFetching: false,
			});
		});
	});

	describe('Mutation loading states', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			mockUseGetArticleQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: undefined,
			});
			mockUseGetCodeReferenceQuery.mockReturnValue({
				data: { reference: 'ART-001' },
				isLoading: false,
				refetch: jest.fn(),
			});
			mockUseAddArticleMutation.mockReturnValue([jest.fn(), { isLoading: false, error: undefined }]);
			mockUseEditArticleMutation.mockReturnValue([jest.fn(), { isLoading: false, error: undefined }]);
			const companyMocks = jest.requireMock('@/store/services/company') as {
				useGetCompanyQuery: jest.Mock;
			};
			companyMocks.useGetCompanyQuery.mockReturnValue({
				data: { uses_foreign_currency: false },
				isFetching: false,
			});
			const hooksMocks = jest.requireMock('@/utils/hooks') as {
				useAppSelector: jest.Mock;
			};
			hooksMocks.useAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		});

		it('shows loader when add mutation is loading', () => {
			mockUseAddArticleMutation.mockReturnValue([jest.fn(), { isLoading: true, error: undefined }]);

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});

		it('shows loader when edit mutation is loading', () => {
			mockUseGetArticleQuery.mockReturnValue({
				data: { id: 42, reference: 'ART-042', designation: 'Widget A' },
				isLoading: false,
				error: undefined,
			});
			mockUseEditArticleMutation.mockReturnValue([jest.fn(), { isLoading: true, error: undefined }]);

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});

		it('shows error when add mutation errors with status > 400', () => {
			mockUseAddArticleMutation.mockReturnValue([
				jest.fn(),
				{ isLoading: false, error: { status: 500, data: { details: 'Server Error' } } },
			]);

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('shows error when edit mutation errors with status > 400', () => {
			mockUseGetArticleQuery.mockReturnValue({
				data: { id: 42, reference: 'ART-042', designation: 'Widget A' },
				isLoading: false,
				error: undefined,
			});
			mockUseEditArticleMutation.mockReturnValue([
				jest.fn(),
				{ isLoading: false, error: { status: 500, data: { details: 'Error' } } },
			]);

			renderWithProviders(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});
	});
});
