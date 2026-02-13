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

// Mock hooks and selectors
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useAppSelector: jest.fn(() => [{ id: 1, role: 'Caissier' }]),
	useToast: () => ({
		onSuccess: jest.fn(),
		onError: jest.fn(),
	}),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getUserCompaniesState: jest.fn(),
	getModePaiementState: jest.fn(() => []),
}));

jest.mock('@/store/session', () => ({
	__esModule: true,
	getAccessTokenFromSession: () => 'mock-token',
}));

// Mock reglement service hooks
const mockUseGetReglementQuery = jest.fn();
const mockAddReglementMutation = jest.fn();
const mockEditReglementMutation = jest.fn();

jest.mock('@/store/services/reglement', () => ({
	__esModule: true,
	useGetReglementQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetReglementQuery(params, options),
	useAddReglementMutation: () => [mockAddReglementMutation, { isLoading: false, error: undefined }],
	useEditReglementMutation: () => [mockEditReglementMutation, { isLoading: false, error: undefined }],
}));

// Mock facture client service
jest.mock('@/store/services/factureClient', () => ({
	__esModule: true,
	useGetFactureClientForPaymentQuery: jest.fn(() => ({
		data: [
			{
				id: 100,
				numero_facture: 'FC-100',
				client_name: 'Client Test',
				remaining_amount: '500.00',
				devise: 'MAD',
			},
		],
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

// Mock NoPermission
jest.mock('@/components/shared/noPermission/noPermission', () => ({
	__esModule: true,
	default: () => <div data-testid="no-permission">Accès refusé</div>,
}));

// Mock form sub-components
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label, value, ...rest }: { id: string; label: string; value: string; [_key: string]: unknown }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
			<input id={id} value={value ?? ''} onChange={rest.onChange as React.ChangeEventHandler} readOnly={!rest.onChange} />
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
	default: ({ buttonText, onClick, type }: { buttonText: string; onClick?: () => void; type?: string }) => (
		<button data-testid="submit-button" onClick={onClick} type={type as 'submit' | 'button'}>
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

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/helpers', () => ({
	getLabelForKey: jest.fn((labels: Record<string, string>, key: string) => labels[key] || key),
	setFormikAutoErrors: jest.fn(),
	parseNumber: jest.fn((val: string) => {
		const n = parseFloat(val);
		return Number.isNaN(n) ? null : n;
	}),
	formatNumber: jest.fn((val: number) => val?.toFixed(2) ?? '0.00'),
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	reglementSchema: {
		parse: jest.fn(),
	},
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	REGLEMENTS_LIST: '/dashboard/reglements',
	REGLEMENTS_ADD: jest.fn((id: number) => `/dashboard/reglements/add?company_id=${id}`),
	REGLEMENTS_EDIT: jest.fn((id: number, companyId: number) => `/dashboard/reglements/${id}/edit?company_id=${companyId}`),
	FACTURE_CLIENT_ADD: jest.fn((id: number) => `/dashboard/facture-client/add?company_id=${id}`),
}));

// Import after mocks
import ReglementForm from './reglement-form';

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

describe('ReglementForm', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetReglementQuery.mockReturnValue({
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
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Ajouter un règlement');
		});

		it('renders form fields for adding a reglement', () => {
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('select-facture_client')).toBeInTheDocument();
			expect(screen.getByTestId('select-mode_reglement')).toBeInTheDocument();
			expect(screen.getByTestId('input-montant')).toBeInTheDocument();
			expect(screen.getByTestId('input-libelle')).toBeInTheDocument();
			expect(screen.getByTestId('input-date_reglement')).toBeInTheDocument();
			expect(screen.getByTestId('input-date_echeance')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Ajouter le règlement');
		});

		it('renders back button', () => {
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByText('Liste des règlements')).toBeInTheDocument();
		});

		it('renders form section headers', () => {
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByText('Facture client')).toBeInTheDocument();
			expect(screen.getByText('Détails du règlement')).toBeInTheDocument();
			expect(screen.getByText('Dates')).toBeInTheDocument();
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders with edit title', () => {
			mockUseGetReglementQuery.mockReturnValue({
				data: {
					id: 123,
					facture_client: 100,
					facture_client_numero: 'FC-100',
					client_name: 'Client Test',
					mode_reglement: 1,
					libelle: 'Test libelle',
					montant: 500,
					date_reglement: '2025-01-15',
					date_echeance: '2025-02-15',
					devise: 'MAD',
					montant_facture: 1000,
					total_reglements_facture: 500,
					reste_a_payer: 500,
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={123} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Modifier le règlement');
		});

		it('renders submit button with update text', () => {
			mockUseGetReglementQuery.mockReturnValue({
				data: {
					id: 123,
					facture_client: 100,
					mode_reglement: 1,
					montant: 500,
					date_reglement: '2025-01-15',
					date_echeance: '2025-02-15',
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={123} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});

		it('renders financial info card in edit mode', () => {
			mockUseGetReglementQuery.mockReturnValue({
				data: {
					id: 123,
					facture_client: 100,
					facture_client_numero: 'FC-100',
					client_name: 'Client Test',
					mode_reglement: 1,
					montant: 500,
					date_reglement: '2025-01-15',
					date_echeance: '2025-02-15',
					devise: 'MAD',
					montant_facture: 1000,
					total_reglements_facture: 500,
					reste_a_payer: 500,
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={123} />);
			expect(screen.getByText('Informations financières')).toBeInTheDocument();
			expect(screen.getByText('Montant de la facture')).toBeInTheDocument();
			expect(screen.getByText('Total règlements')).toBeInTheDocument();
			expect(screen.getByText('Reste à payer')).toBeInTheDocument();
		});
	});

	describe('Loading state', () => {
		it('shows loader when data is loading', () => {
			mockUseGetReglementQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
				error: undefined,
			});

			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={123} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});

	describe('Permission check', () => {
		it('shows NoPermission for non-Caissier/Commercial role', () => {
			const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
			useAppSelector.mockReturnValueOnce([{ id: 1, role: 'Lecture' }]);

			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('no-permission')).toBeInTheDocument();
		});
	});

	describe('Hook calls', () => {
		it('calls useGetReglementQuery when in edit mode', () => {
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={456} />);
			expect(mockUseGetReglementQuery).toHaveBeenCalledWith({ id: 456 }, expect.any(Object));
		});
	});

	describe('Rich data rendering', () => {
		it('renders with non-empty mode paiement data', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getModePaiementState: jest.Mock;
			};
			selectors.getModePaiementState.mockReturnValue([
				{ id: 1, nom: 'Chèque' },
				{ id: 2, nom: 'Virement' },
				{ id: 3, nom: 'Espèces' },
			]);
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders edit mode with full reglement data and matching mode', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getModePaiementState: jest.Mock;
			};
			selectors.getModePaiementState.mockReturnValue([
				{ id: 1, nom: 'Chèque' },
				{ id: 2, nom: 'Virement' },
			]);
			mockUseGetReglementQuery.mockReturnValue({
				data: {
					id: 200,
					facture_client: 100,
					facture_client_numero: 'FC-100',
					client_name: 'Client Test',
					mode_reglement: 2,
					libelle: 'Paiement Q1',
					montant: 750,
					date_reglement: '2025-03-01',
					date_echeance: '2025-04-01',
					devise: 'EUR',
					montant_facture: 2000,
					total_reglements_facture: 750,
					reste_a_payer: 1250,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={200} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Modifier le règlement');
			expect(screen.getByText('Informations financières')).toBeInTheDocument();
		});

		it('renders with mode paiement as object instead of array', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getModePaiementState: jest.Mock;
			};
			selectors.getModePaiementState.mockReturnValue({ '1': { id: 1, nom: 'Espèces' } });
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with facture_client_id prop', () => {
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} facture_client_id={100} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with API error in edit mode', () => {
			mockUseGetReglementQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { status: 500, data: { message: 'Server Error' } },
			});
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={200} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('renders with factures loading state', () => {
			const factureService = jest.requireMock('@/store/services/factureClient') as {
				useGetFactureClientForPaymentQuery: jest.Mock;
			};
			factureService.useGetFactureClientForPaymentQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
			});
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
			factureService.useGetFactureClientForPaymentQuery.mockReturnValue({
				data: [{ id: 100, numero_facture: 'FC-100', client_name: 'Client Test', remaining_amount: '500.00', devise: 'MAD' }],
				isLoading: false,
			});
		});

		it('renders with Commercial role', () => {
			const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
			useAppSelector.mockReturnValueOnce([{ id: 1, role: 'Commercial' }]);
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			expect(screen.queryByTestId('no-permission')).not.toBeInTheDocument();
		});

		it('renders with empty mode paiement list', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getModePaiementState: jest.Mock;
			};
			selectors.getModePaiementState.mockReturnValue([]);
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with null mode paiement state', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getModePaiementState: jest.Mock;
			};
			selectors.getModePaiementState.mockReturnValue(null);
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders with factures as empty array', () => {
			const factureService = jest.requireMock('@/store/services/factureClient') as {
				useGetFactureClientForPaymentQuery: jest.Mock;
			};
			factureService.useGetFactureClientForPaymentQuery.mockReturnValue({
				data: [],
				isLoading: false,
			});
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
			factureService.useGetFactureClientForPaymentQuery.mockReturnValue({
				data: [{ id: 100, numero_facture: 'FC-100', client_name: 'Client Test', remaining_amount: '500.00', devise: 'MAD' }],
				isLoading: false,
			});
		});

		it('renders with undefined rawData in edit mode', () => {
			mockUseGetReglementQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={250} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders edit mode with null optional fields', () => {
			mockUseGetReglementQuery.mockReturnValue({
				data: {
					id: 300,
					facture_client: 100,
					mode_reglement: null,
					libelle: null,
					montant: 0,
					date_reglement: null,
					date_echeance: null,
					devise: null,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={300} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Modifier le règlement');
		});

		it('handles add mutation loading state', () => {
			const reglementService = jest.requireMock('@/store/services/reglement') as {
				useAddReglementMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			const mockMutate = jest.fn();
			reglementService.useAddReglementMutation = () => [mockMutate, { isLoading: true, error: undefined }];

			renderWithProviders(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});

		it('handles edit mutation loading state', () => {
			const reglementService = jest.requireMock('@/store/services/reglement') as {
				useEditReglementMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			const mockMutate = jest.fn();
			reglementService.useEditReglementMutation = () => [mockMutate, { isLoading: true, error: undefined }];

			mockUseGetReglementQuery.mockReturnValue({
				data: { id: 99, facture_client: 100, mode_reglement: 1, montant: 500 },
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={99} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});

		it('renders with mode paiement not matching selected value', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getModePaiementState: jest.Mock;
			};
			selectors.getModePaiementState.mockReturnValue([{ id: 99, nom: 'Other Mode' }]);
			mockUseGetReglementQuery.mockReturnValue({
				data: {
					id: 400,
					facture_client: 100,
					mode_reglement: 1, // Different from available modes
					montant: 500,
				},
				isLoading: false,
				error: undefined,
			});
			renderWithProviders(<ReglementForm session={mockSession} company_id={1} id={400} />);
			expect(screen.getByTestId('nav-title')).toHaveTextContent('Modifier le règlement');
		});
	});
});
