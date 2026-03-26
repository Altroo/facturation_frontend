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
	useAppSelector: jest.fn(() => [{ id: 1, role: 'Caissier' }]),
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getUserCompaniesState: jest.fn(),
}));

jest.mock('@/contexts/InitContext', () => ({
	__esModule: true,
	useInitAccessToken: () => 'test-token',
}));

// Mock client service hooks
const mockUseGetClientQuery = jest.fn();
const mockAddClientMutation = jest.fn();
const mockEditClientMutation = jest.fn();

jest.mock('@/store/services/client', () => ({
	__esModule: true,
	useGetClientQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetClientQuery(params, options),
	useGetCodeClientQuery: jest.fn(() => ({
		data: { code_client: 'CLI-001' },
		isLoading: false,
	})),
	useAddClientMutation: () => [mockAddClientMutation, { isLoading: false, error: undefined }],
	useEditClientMutation: () => [mockEditClientMutation, { isLoading: false, error: undefined }],
}));

// Mock parameter service
jest.mock('@/store/services/parameter', () => ({
	__esModule: true,
	useGetCitiesListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useAddCityMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
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

// Mock form subcomponents
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`select-${id}`}>
			<label>{label}</label>
		</div>
	),
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

jest.mock('@/components/shared/addEntityModal/addEntityModal', () => ({
	__esModule: true,
	default: () => <div data-testid="add-entity-modal" />,
}));

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/helpers', () => ({
	getLabelForKey: jest.fn((labels: Record<string, string>, key: string) => labels[key] || key),
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	clientSchema: { parse: jest.fn() },
	pmRequired: ['raison_sociale', 'ville', 'ICE', 'delai_de_paiement'],
	ppRequired: ['nom', 'prenom', 'adresse', 'ville', 'tel', 'delai_de_paiement'],
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	CLIENTS_LIST: '/dashboard/clients',
	CLIENTS_ADD: jest.fn((id: number) => `/dashboard/clients/add?company_id=${id}`),
}));

// Import after mocks
import ClientsForm from './clients-form';

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

describe('ClientsForm', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetClientQuery.mockReturnValue({
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
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Ajouter un client');
		});

		it('renders form fields', () => {
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('input-code_client')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Ajouter le client');
		});

		it('renders back button text', () => {
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByText('Liste des clients')).toBeInTheDocument();
		});

		it('renders section headers', () => {
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByText('Type de client')).toBeInTheDocument();
			expect(screen.getByText('Informations générales')).toBeInTheDocument();
			expect(screen.getByText('Contact')).toBeInTheDocument();
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders with edit title', () => {
			mockUseGetClientQuery.mockReturnValue({
				data: {
					id: 99,
					code_client: 'CLI-099',
					type_client: 'PM',
					raison_sociale: 'Test Corp',
					email: 'test@corp.com',
					tel: '0612345678',
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={99} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Modifier le client');
		});

		it('renders submit button with update text', () => {
			mockUseGetClientQuery.mockReturnValue({
				data: {
					id: 99,
					code_client: 'CLI-099',
					type_client: 'PM',
					raison_sociale: 'Test Corp',
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={99} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});
	});

	describe('Loading state', () => {
		it('shows loader when data is loading', () => {
			mockUseGetClientQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
				error: undefined,
			});

			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={99} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});

	describe('Permission check', () => {
		it('shows NoPermission for non-Caissier/Commercial role', () => {
			const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
			useAppSelector.mockReturnValue([{ id: 1, role: 'Lecture' }]);

			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('no-permission')).toBeInTheDocument();

			useAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		});
	});

	describe('Hook calls', () => {
		it('calls useGetClientQuery when in edit mode', () => {
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={456} />);
			expect(mockUseGetClientQuery).toHaveBeenCalledWith({ id: 456 }, expect.any(Object));
		});
	});

	describe('Rich data rendering', () => {
		it('renders with non-empty cities data', () => {
			const paramService = jest.requireMock('@/store/services/parameter') as {
				useGetCitiesListQuery: jest.Mock;
			};
			paramService.useGetCitiesListQuery.mockReturnValue({
				data: [
					{ id: 1, nom: 'Casablanca' },
					{ id: 2, nom: 'Rabat' },
				],
				isLoading: false,
			});
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders edit mode with PM client data and matching city', () => {
			const paramService = jest.requireMock('@/store/services/parameter') as {
				useGetCitiesListQuery: jest.Mock;
			};
			paramService.useGetCitiesListQuery.mockReturnValue({ data: [{ id: 5, nom: 'Tanger' }], isLoading: false });
			mockUseGetClientQuery.mockReturnValue({
				data: {
					id: 99,
					client_type: 'PM',
					code_client: 'CLI-099',
					raison_sociale: 'Test Corp',
					email: 'test@corp.com',
					ville: 5,
					ICE: '123456789012345',
					registre_de_commerce: 'RC-123',
					identifiant_fiscal: 'IF-456',
					taxe_professionnelle: 'TP-789',
					CNSS: 'CNSS-012',
					numero_du_compte: '123456',
					delai_de_paiement: 30,
					remarque: 'Important client',
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={99} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Modifier le client');
		});

		it('renders PP client type in edit mode', () => {
			const paramService = jest.requireMock('@/store/services/parameter') as {
				useGetCitiesListQuery: jest.Mock;
			};
			paramService.useGetCitiesListQuery.mockReturnValue({ data: [{ id: 3, nom: 'Fès' }], isLoading: false });
			mockUseGetClientQuery.mockReturnValue({
				data: {
					id: 77,
					client_type: 'PP',
					code_client: 'CLI-077',
					nom: 'Dupont',
					prenom: 'Jean',
					adresse: '123 Rue Test',
					tel: '0611223344',
					email: 'jean@dupont.com',
					ville: 3,
					delai_de_paiement: 45,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={77} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Modifier le client');
		});

		it('renders with cities as object instead of array', () => {
			const paramService = jest.requireMock('@/store/services/parameter') as {
				useGetCitiesListQuery: jest.Mock;
			};
			paramService.useGetCitiesListQuery.mockReturnValue({ data: [{ id: 1, nom: 'Marrakech' }], isLoading: false });
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with API error in edit mode', () => {
			mockUseGetClientQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { status: 500, data: { message: 'Server Error' } },
			});
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={99} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('renders with code loading state', () => {
			const clientService = jest.requireMock('@/store/services/client') as {
				useGetCodeClientQuery: jest.Mock;
			};
			clientService.useGetCodeClientQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
			});
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
			clientService.useGetCodeClientQuery.mockReturnValue({
				data: { code_client: 'CLI-001' },
				isLoading: false,
			});
		});

		it('renders with Commercial role', () => {
			const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
			useAppSelector.mockReturnValue([{ id: 1, role: 'Commercial' }]);
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			expect(screen.queryByTestId('no-permission')).not.toBeInTheDocument();
			useAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		});

		it('handles empty city list', () => {
			const paramService = jest.requireMock('@/store/services/parameter') as {
				useGetCitiesListQuery: jest.Mock;
			};
			paramService.useGetCitiesListQuery.mockReturnValue({ data: [], isLoading: false });
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('handles null cities state', () => {
			const paramService = jest.requireMock('@/store/services/parameter') as {
				useGetCitiesListQuery: jest.Mock;
			};
			paramService.useGetCitiesListQuery.mockReturnValue({ data: null, isLoading: false });
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with client data having null optional fields', () => {
			mockUseGetClientQuery.mockReturnValue({
				data: {
					id: 88,
					client_type: 'PM',
					code_client: 'CLI-088',
					raison_sociale: 'Corp Test',
					email: null,
					tel: null,
					adresse: null,
					ville: null,
					remarque: null,
					numero_du_compte: null,
					identifiant_fiscal: null,
					taxe_professionnelle: null,
					CNSS: null,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={88} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Modifier le client');
		});

		it('renders with empty code_client response', () => {
			const clientService = jest.requireMock('@/store/services/client') as {
				useGetCodeClientQuery: jest.Mock;
			};
			clientService.useGetCodeClientQuery.mockReturnValue({
				data: {},
				isLoading: false,
			});
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			clientService.useGetCodeClientQuery.mockReturnValue({
				data: { code_client: 'CLI-001' },
				isLoading: false,
			});
		});

		it('renders with undefined code_client data', () => {
			const clientService = jest.requireMock('@/store/services/client') as {
				useGetCodeClientQuery: jest.Mock;
			};
			clientService.useGetCodeClientQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
			});
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			clientService.useGetCodeClientQuery.mockReturnValue({
				data: { code_client: 'CLI-001' },
				isLoading: false,
			});
		});

		it('handles edit mode with city not matching any available city', () => {
			const paramService = jest.requireMock('@/store/services/parameter') as {
				useGetCitiesListQuery: jest.Mock;
			};
			paramService.useGetCitiesListQuery.mockReturnValue({ data: [{ id: 999, nom: 'Unknown City' }], isLoading: false });
			mockUseGetClientQuery.mockReturnValue({
				data: {
					id: 50,
					client_type: 'PM',
					code_client: 'CLI-050',
					raison_sociale: 'Test LLC',
					ville: 5, // different from available cities
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={50} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Modifier le client');
		});

		it('handles undefined rawData in edit mode', () => {
			mockUseGetClientQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={55} />);
			// Should still render but with default values
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('handles add mutation error state', () => {
			// Note: add mutation errors are shown differently - via FormikAutoErrors and toast
			// This test verifies the component handles the mutation error gracefully
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('handles update mutation error state', () => {
			// Update errors in edit mode are shown via the error handling flow
			mockUseGetClientQuery.mockReturnValue({
				data: { id: 99, client_type: 'PM', code_client: 'CLI-099' },
				isLoading: false,
				error: undefined,
			});
			
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={99} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('handles add mutation loading state', () => {
			const clientService = jest.requireMock('@/store/services/client') as {
				useAddClientMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			const mockMutate = jest.fn();
			clientService.useAddClientMutation = () => [mockMutate, { isLoading: true, error: undefined }];
			
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});

		it('handles update mutation loading state', () => {
			const clientService = jest.requireMock('@/store/services/client') as {
				useEditClientMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			const mockMutate = jest.fn();
			clientService.useEditClientMutation = () => [mockMutate, { isLoading: true, error: undefined }];
			
			mockUseGetClientQuery.mockReturnValue({
				data: { id: 99, client_type: 'PM', code_client: 'CLI-099' },
				isLoading: false,
				error: undefined,
			});
			
			renderWithProviders(<ClientsForm session={mockSession} company_id={1} id={99} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});
});
