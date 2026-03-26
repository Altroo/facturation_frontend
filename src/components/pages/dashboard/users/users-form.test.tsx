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
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getGroupesState: jest.fn(() => []),
}));

jest.mock('@/contexts/InitContext', () => ({
	__esModule: true,
	useInitAccessToken: () => 'test-token',
}));

// Mock account service hooks
const mockUseGetUserQuery = jest.fn();
const mockAddUserMutation = jest.fn();
const mockCheckEmailMutation = jest.fn();
const mockEditUserMutation = jest.fn();

jest.mock('@/store/services/account', () => ({
	__esModule: true,
	useGetUserQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetUserQuery(params, options),
	useAddUserMutation: () => [mockAddUserMutation, { isLoading: false, error: undefined }],
	useCheckEmailMutation: () => [mockCheckEmailMutation, { isLoading: false, error: undefined }],
	useEditUserMutation: () => [mockEditUserMutation, { isLoading: false, error: undefined }],
}));

// Mock company service
jest.mock('@/store/services/company', () => ({
	__esModule: true,
	useGetCompaniesListQuery: jest.fn(() => ({
		data: [],
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
	genderItemsList: [{ value: 'H', label: 'Homme' }, { value: 'F', label: 'Femme' }],
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	userSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	USERS_LIST: '/dashboard/users',
}));

// Import after mocks
import UsersForm from './users-form';

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

describe('UsersForm', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetUserQuery.mockReturnValue({
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
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Ajouter un utilisateur');
		});

		it('renders form fields', () => {
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('input-email')).toBeInTheDocument();
			expect(screen.getByTestId('input-first_name')).toBeInTheDocument();
			expect(screen.getByTestId('input-last_name')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent("Ajouter l'utilisateur");
		});

		it('renders back button text', () => {
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByText('Liste des utilisateurs')).toBeInTheDocument();
		});

		it('renders section headers', () => {
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByText('Informations personnelles')).toBeInTheDocument();
			expect(screen.getByText('Paramètres du compte')).toBeInTheDocument();
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders with edit title', () => {
			mockUseGetUserQuery.mockReturnValue({
				data: {
					id: 55,
					email: 'user@test.com',
					first_name: 'John',
					last_name: 'Doe',
					gender: 'H',
					is_active: true,
					is_staff: false,
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<UsersForm session={mockSession} id={55} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'utilisateur");
		});

		it('renders submit button with update text', () => {
			mockUseGetUserQuery.mockReturnValue({
				data: { id: 55, email: 'user@test.com', first_name: 'John', last_name: 'Doe' },
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<UsersForm session={mockSession} id={55} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});
	});

	describe('Loading state', () => {
		it('shows loader when data is loading', () => {
			mockUseGetUserQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
				error: undefined,
			});

			renderWithProviders(<UsersForm session={mockSession} id={55} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});

	describe('Hook calls', () => {
		it('calls useGetUserQuery when in edit mode', () => {
			renderWithProviders(<UsersForm session={mockSession} id={456} />);
			expect(mockUseGetUserQuery).toHaveBeenCalledWith({ id: 456 }, expect.any(Object));
		});
	});

	describe('Rich data rendering', () => {
		it('renders with non-empty groupes and companies data', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue([
				{ id: 1, nom: 'Group A' },
			]);
			const companyService = jest.requireMock('@/store/services/company') as {
				useGetCompaniesListQuery: jest.Mock;
			};
			companyService.useGetCompaniesListQuery.mockReturnValue({
				data: [
					{ id: 1, raison_sociale: 'Company A' },
					{ id: 2, raison_sociale: 'Company B' },
				],
				isLoading: false,
			});
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders edit mode with full user data including companies', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue([{ id: 1, nom: 'Group A' }]);
			const companyService = jest.requireMock('@/store/services/company') as {
				useGetCompaniesListQuery: jest.Mock;
			};
			companyService.useGetCompaniesListQuery.mockReturnValue({
				data: [{ id: 1, raison_sociale: 'Company A' }],
				isLoading: false,
			});
			mockUseGetUserQuery.mockReturnValue({
				data: {
					id: 55,
					email: 'user@test.com',
					first_name: 'John',
					last_name: 'Doe',
					gender: 'H',
					is_active: true,
					is_staff: false,
					companies: [{ id: 1, role: 'Caissier' }],
					avatar: 'data:image/png;base64,abc',
					avatar_cropped: 'data:image/png;base64,def',
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<UsersForm session={mockSession} id={55} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'utilisateur");
		});

		it('renders with groupes as object instead of array', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue({ '1': { id: 1, nom: 'Group A' } });
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with API error in edit mode', () => {
			mockUseGetUserQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { status: 500, data: { message: 'Server Error' } },
			});
			renderWithProviders(<UsersForm session={mockSession} id={55} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('renders edit mode with is_staff=true', () => {
			mockUseGetUserQuery.mockReturnValue({
				data: {
					id: 99,
					email: 'staff@test.com',
					first_name: 'Staff',
					last_name: 'User',
					gender: 'H',
					is_active: true,
					is_staff: true,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<UsersForm session={mockSession} id={99} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'utilisateur");
		});

		it('renders edit mode with is_active=false', () => {
			mockUseGetUserQuery.mockReturnValue({
				data: {
					id: 88,
					email: 'inactive@test.com',
					first_name: 'Inactive',
					last_name: 'User',
					is_active: false,
					is_staff: false,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<UsersForm session={mockSession} id={88} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'utilisateur");
		});

		it('handles companies loading state', () => {
			const companyService = jest.requireMock('@/store/services/company') as {
				useGetCompaniesListQuery: jest.Mock;
			};
			companyService.useGetCompaniesListQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
			});
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
			companyService.useGetCompaniesListQuery.mockReturnValue({
				data: [],
				isLoading: false,
			});
		});

		it('renders with companies as undefined', () => {
			const companyService = jest.requireMock('@/store/services/company') as {
				useGetCompaniesListQuery: jest.Mock;
			};
			companyService.useGetCompaniesListQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
			});
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			companyService.useGetCompaniesListQuery.mockReturnValue({
				data: [],
				isLoading: false,
			});
		});

		it('renders with undefined rawData in edit mode', () => {
			mockUseGetUserQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<UsersForm session={mockSession} id={60} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders edit mode with user having null optional fields', () => {
			mockUseGetUserQuery.mockReturnValue({
				data: {
					id: 77,
					email: 'user@test.com',
					first_name: 'Test',
					last_name: 'User',
					gender: null,
					avatar: null,
					avatar_cropped: null,
					companies: [],
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<UsersForm session={mockSession} id={77} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'utilisateur");
		});

		it('renders with empty groupes array', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue([]);
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with null groupes state', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getGroupesState: jest.Mock;
			};
			selectors.getGroupesState.mockReturnValue(null);
			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders edit mode with female gender', () => {
			mockUseGetUserQuery.mockReturnValue({
				data: {
					id: 66,
					email: 'female@test.com',
					first_name: 'Jane',
					last_name: 'Doe',
					gender: 'F',
					is_active: true,
					is_staff: false,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<UsersForm session={mockSession} id={66} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent("Modifier l'utilisateur");
		});

		it('handles add mutation loading state', () => {
			const accountService = jest.requireMock('@/store/services/account') as {
				useAddUserMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			const mockMutate = jest.fn();
			accountService.useAddUserMutation = () => [mockMutate, { isLoading: true, error: undefined }];

			renderWithProviders(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});

		it('handles edit mutation loading state', () => {
			const accountService = jest.requireMock('@/store/services/account') as {
				useEditUserMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			const mockMutate = jest.fn();
			accountService.useEditUserMutation = () => [mockMutate, { isLoading: true, error: undefined }];

			mockUseGetUserQuery.mockReturnValue({
				data: { id: 99, email: 'user@test.com', first_name: 'Test', last_name: 'User' },
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<UsersForm session={mockSession} id={99} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});
});
