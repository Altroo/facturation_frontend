import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
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
	useAppSelector: jest.fn(() => []),
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
	useLanguage: () => ({ language: 'fr' as const, setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getGroupesState: jest.fn(() => []),
	getProfilState: jest.fn(() => ({})),
}));

jest.mock('@/contexts/InitContext', () => ({
	__esModule: true,
	useInitAccessToken: () => 'test-token',
}));

// Mock company service hooks
const mockUseGetCompanyQuery = jest.fn();
const mockAddCompanyMutation = jest.fn();
const mockEditCompanyMutation = jest.fn();

jest.mock('@/store/services/company', () => ({
	__esModule: true,
	useGetCompanyQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetCompanyQuery(params, options),
	useAddCompanyMutation: () => [mockAddCompanyMutation, { isLoading: false, error: undefined }],
	useEditCompanyMutation: () => [mockEditCompanyMutation, { isLoading: false, error: undefined }],
}));

// Mock account service
jest.mock('@/store/services/account', () => ({
	__esModule: true,
	useGetUsersListQuery: jest.fn(() => ({
		data: { results: [] },
		isLoading: false,
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

// Mock Protected
jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

// Mock form sub-components
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/formikElements/customDropDownSelect/customDropDownSelect', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`dropdown-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/formikElements/customSquareImageUploading/customSquareImageUploading', () => ({
	__esModule: true,
	default: ({ label }: { label: string }) => <div data-testid="image-upload">{label}</div>,
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, type }: { buttonText: string; type?: string }) => (
		<button data-testid="submit-button" type={type as 'submit' | 'button'}>
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

jest.mock('@/components/shared/addManagedByTable/addManagedByTable', () => ({
	__esModule: true,
	default: () => <div data-testid="managed-by-table">Managed By Section</div>,
}));

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
	customDropdownTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/helpers', () => ({
	getLabelForKey: jest.fn((labels: Record<string, string>, key: string) => labels[key] || key),
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/utils/rawData', () => ({
	civiliteItemsList: [{ value: 'M.', label: 'M.' }, { value: 'Mme', label: 'Mme' }],
	nbrEmployeItemsList: [{ value: '1 à 5', label: '1 à 5' }],
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	companySchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	COMPANIES_LIST: '/dashboard/companies',
}));

// Import after mocks
import CompaniesForm from './companies-form';

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

describe('CompaniesForm', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetCompanyQuery.mockReturnValue({
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
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Ajouter une entreprise');
		});

		it('renders submit button with add text', () => {
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Ajouter une entreprise');
		});

		it('renders back button text', () => {
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByText('Liste des entreprises')).toBeInTheDocument();
		});

		it('renders form section headers', () => {
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByText('Informations générales')).toBeInTheDocument();
			expect(screen.getByText('Contact')).toBeInTheDocument();
			expect(screen.getByText('Informations administratives')).toBeInTheDocument();
		});

		it('renders form fields', () => {
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('input-raison_sociale')).toBeInTheDocument();
			expect(screen.getByTestId('input-email')).toBeInTheDocument();
			expect(screen.getByTestId('input-ICE')).toBeInTheDocument();
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders with edit title', () => {
			mockUseGetCompanyQuery.mockReturnValue({
				data: {
					id: 77,
					raison_sociale: 'Test Corp',
					email: 'test@corp.com',
					ICE: '000111222333444',
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<CompaniesForm session={mockSession} id={77} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'entreprise");
		});

		it('renders submit button with update text', () => {
			mockUseGetCompanyQuery.mockReturnValue({
				data: { id: 77, raison_sociale: 'Test Corp' },
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<CompaniesForm session={mockSession} id={77} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});
	});

	describe('Loading state', () => {
		it('shows loader when data is loading', () => {
			mockUseGetCompanyQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
				error: undefined,
			});

			renderWithProviders(<CompaniesForm session={mockSession} id={77} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});

	describe('Hook calls', () => {
		it('calls useGetCompanyQuery when in edit mode', () => {
			renderWithProviders(<CompaniesForm session={mockSession} id={456} />);
			expect(mockUseGetCompanyQuery).toHaveBeenCalledWith({ id: 456 }, expect.any(Object));
		});
	});

	describe('Rich data rendering', () => {
		it('renders with non-empty groupes and users data', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue([
				{ id: 1, nom: 'Group A' },
				{ id: 2, nom: 'Group B' },
			]);
			const accountService = jest.requireMock('@/store/services/account') as {
				useGetUsersListQuery: jest.Mock;
			};
			accountService.useGetUsersListQuery.mockReturnValue({
				data: { results: [{ id: 1, email: 'admin@test.com', first_name: 'Admin' }] },
				isLoading: false,
			});
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders edit mode with full company data including admins', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue([{ id: 1, nom: 'Group A' }]);
			mockUseGetCompanyQuery.mockReturnValue({
				data: {
					id: 77,
					raison_sociale: 'Test Corp',
					email: 'test@corp.com',
					ICE: '000111222333444',
					telephone: '0612345678',
					adresse: '123 Test St',
					site_web: 'https://test.com',
					civilite: 'M.',
					nbrEmploye: '1 à 5',
					groupe: 1,
					uses_foreign_currency: true,
					admins: [{ id: 1, email: 'admin@test.com' }],
					logo: 'data:image/png;base64,abc',
					cachet: 'data:image/png;base64,def',
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<CompaniesForm session={mockSession} id={77} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'entreprise");
		});

		it('renders with groupes as object instead of array', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue({ '1': { id: 1, nom: 'Group A' } });
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with API error in edit mode', () => {
			mockUseGetCompanyQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { status: 404, data: { message: 'Not found' } },
			});
			renderWithProviders(<CompaniesForm session={mockSession} id={77} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('renders edit mode with company not using foreign currency', () => {
			mockUseGetCompanyQuery.mockReturnValue({
				data: {
					id: 77,
					raison_sociale: 'Test Ltd',
					email: 'ltd@test.com',
					ICE: '000111222333444',
					uses_foreign_currency: false,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<CompaniesForm session={mockSession} id={77} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'entreprise");
		});

		it('renders with users loading state', () => {
			const accountService = jest.requireMock('@/store/services/account') as {
				useGetUsersListQuery: jest.Mock;
			};
			accountService.useGetUsersListQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
			});
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
			accountService.useGetUsersListQuery.mockReturnValue({
				data: { results: [] },
				isLoading: false,
			});
		});

		it('renders with undefined rawData in edit mode', () => {
			mockUseGetCompanyQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<CompaniesForm session={mockSession} id={55} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders edit mode with null fields', () => {
			mockUseGetCompanyQuery.mockReturnValue({
				data: {
					id: 88,
					raison_sociale: 'NullFields Corp',
					email: null,
					telephone: null,
					adresse: null,
					site_web: null,
					civilite: null,
					nbrEmploye: null,
					groupe: null,
					logo: null,
					cachet: null,
					admins: [],
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<CompaniesForm session={mockSession} id={88} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'entreprise");
		});

		it('renders with empty groupes array', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue([]);
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with null groupes state', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue(null);
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders edit mode company with specific groupe selected', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue([
				{ id: 1, nom: 'Group A' },
				{ id: 2, nom: 'Group B' },
			]);
			mockUseGetCompanyQuery.mockReturnValue({
				data: {
					id: 77,
					raison_sociale: 'Test Corp',
					email: 'test@corp.com',
					groupe: 2,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<CompaniesForm session={mockSession} id={77} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with users as array results', () => {
			const accountService = jest.requireMock('@/store/services/account') as {
				useGetUsersListQuery: jest.Mock;
			};
			accountService.useGetUsersListQuery.mockReturnValue({
				data: {
					results: [
						{ id: 1, email: 'user1@test.com', first_name: 'User', last_name: 'One' },
						{ id: 2, email: 'user2@test.com', first_name: 'User', last_name: 'Two' },
					],
				},
				isLoading: false,
			});
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('managed-by-table')).toBeInTheDocument();
			accountService.useGetUsersListQuery.mockReturnValue({
				data: { results: [] },
				isLoading: false,
			});
		});

		it('renders with users data as direct array', () => {
			const accountService = jest.requireMock('@/store/services/account') as {
				useGetUsersListQuery: jest.Mock;
			};
			accountService.useGetUsersListQuery.mockReturnValue({
				data: [
					{ id: 1, email: 'direct@test.com', first_name: 'Direct', last_name: 'User' },
				],
				isLoading: false,
			});
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			accountService.useGetUsersListQuery.mockReturnValue({
				data: { results: [] },
				isLoading: false,
			});
		});

		it('handles add mutation loading state', () => {
			const companyService = jest.requireMock('@/store/services/company') as {
				useAddCompanyMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			const mockMutate = jest.fn();
			companyService.useAddCompanyMutation = () => [mockMutate, { isLoading: true, error: undefined }];
			
			renderWithProviders(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});

		it('handles update mutation loading state', () => {
			const companyService = jest.requireMock('@/store/services/company') as {
				useEditCompanyMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			const mockMutate = jest.fn();
			companyService.useEditCompanyMutation = () => [mockMutate, { isLoading: true, error: undefined }];
			
			mockUseGetCompanyQuery.mockReturnValue({
				data: { id: 99, raison_sociale: 'Test' },
				isLoading: false,
				error: undefined,
			});
			
			renderWithProviders(<CompaniesForm session={mockSession} id={99} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});
});
