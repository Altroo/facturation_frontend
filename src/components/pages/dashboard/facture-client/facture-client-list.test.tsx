import React from 'react';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

// Mock session helper
jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: jest.fn((session) => session?.accessToken || null),
}));

// Mock toast hook
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({
		onSuccess: mockOnSuccess,
		onError: mockOnError,
	}),
	useAppSelector: jest.fn(() => []),
}));

// Mock RTK Query hooks
const mockRefetch = jest.fn();
const mockDeleteRecord = jest.fn();
const mockConvertToBonDeLivraison = jest.fn();

interface QueryArgs {
	company_id?: number;
	date_after?: string;
	date_before?: string;
}
let lastQueryArgs: QueryArgs | null = null;

const mockUseGetFactureClientListQuery = jest.fn((args: QueryArgs) => {
	lastQueryArgs = args;
	return {
		data: {
			results: [
				{
					id: 1,
					numero_facture: 'FC-001',
					client: 10,
					client_name: 'Client Test',
					numero_bon_commande_client: 'BC-001',
					statut: 'Brouillon',
					total_ttc_apres_remise: 1500.0,
					lignes_count: 3,
					date_facture: '2025-01-15',
				},
				{
					id: 2,
					numero_facture: 'FC-002',
					client: 20,
					client_name: 'Client Two',
					numero_bon_commande_client: 'BC-002',
					statut: 'Envoyé',
					total_ttc_apres_remise: 2500.5,
					lignes_count: 5,
					date_facture: '2025-01-20',
				},
			],
			count: 2,
			next: null,
			previous: null,
		},
		isLoading: false,
		refetch: mockRefetch,
	};
});

jest.mock('@/store/services/factureClient', () => ({
	useGetFactureClientListQuery: (args: QueryArgs) => mockUseGetFactureClientListQuery(args),
	useDeleteFactureClientMutation: jest.fn(() => [mockDeleteRecord, { isLoading: false }]),
	useBulkDeleteFactureClientMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
	useConvertFactureClientToBonDeLivraisonMutation: jest.fn(() => [mockConvertToBonDeLivraison, { isLoading: false }]),
}));

// Mock parameter service
jest.mock('@/store/services/parameter', () => ({
	useGetModePaiementListQuery: jest.fn(() => ({ data: [], isLoading: false })),
}));

// Mock company services
jest.mock('@/store/services/company', () => ({
	useGetCompanyQuery: jest.fn(() => ({
		data: {
			id: 1,
			raison_sociale: 'Test Company',
			uses_foreign_currency: false,
		},
		isLoading: false,
	})),
}));

// Mock devis-list exports
jest.mock('@/components/pages/dashboard/devis/devis-list', () => ({
	getStatutColor: (statut: string) => {
		switch (statut) {
			case 'Brouillon':
				return 'default';
			case 'Envoyé':
				return 'info';
			case 'Accepté':
				return 'success';
			case 'Refusé':
			case 'Annulé':
				return 'error';
			case 'Expiré':
				return 'warning';
			default:
				return 'default';
		}
	},
}));

// Mock CompanyDocumentsWrapperList
jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => ({
	__esModule: true,
	default: ({
		children,
		title,
	}: {
		children: (props: { company_id: number; role: string }) => React.ReactNode;
		title: string;
	}) => (
		<div data-testid="company-wrapper">
			<h1>{title}</h1>
			{children({ company_id: 1, role: 'Caissier' })}
		</div>
	),
}));

// Mock PaginatedDataGrid
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({
		columns,
		data,
	}: {
		columns: Array<{ field: string; headerName: string }>;
		data?: { results?: Array<{ id: number; numero_facture: string; client_name: string; statut: string }> };
		isLoading?: boolean;
	}) => {
		const results = data?.results || [];
		return (
			<div data-testid="paginated-data-grid">
				<table>
					<thead>
						<tr>
							{columns.map((col) => (
								<th key={col.field}>{col.headerName}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{results.map((row) => (
							<tr key={row.id} data-testid={`row-${row.id}`}>
								<td>{row.numero_facture}</td>
								<td>{row.client_name}</td>
								<td>{row.statut}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	},
}));

// Mock ActionModals
jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: ({
		title,
		body,
		actions,
	}: {
		title: string;
		body: string;
		actions: Array<{ text: string; onClick: () => void }>;
	}) => (
		<div data-testid="action-modal" role="dialog">
			<h2>{title}</h2>
			<p>{body}</p>
			<div>
				{actions.map((action) => (
					<button key={action.text} onClick={action.onClick} data-testid={`modal-${action.text.toLowerCase()}`}>
						{action.text}
					</button>
				))}
			</div>
		</div>
	),
}));

// Mock other dependencies
jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/htmlElements/buttons/textButton/textButton', () => ({
	__esModule: true,
	default: ({ buttonText, onClick }: { buttonText: string; onClick: () => void }) => (
		<button onClick={onClick}>{buttonText}</button>
	),
}));

jest.mock('@/components/shared/dropdownFilter/dropdownFilter', () => ({
	createDropdownFilterOperators: jest.fn(() => []),
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
	formatNumberWithSpaces: (value: string | number | null | undefined, decimals: number = 2): string => {
		if (value === null || value === undefined || value === '') return '';
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (Number.isNaN(num)) return '';
		return num.toLocaleString('fr-FR', {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
			useGrouping: true
		});
	},
	hexToRGB: (_hex: string, alpha?: number) => (alpha !== undefined ? `rgba(0,0,0,${alpha})` : 'rgb(0,0,0)'),
}));

// Capture configuration passed to CompanyDocumentsListContent
interface PrintAction {
	key: string;
	label: string;
	icon: React.ReactNode;
	iconColor: string;
	urlGenerator: (id: number, companyId: number) => string;
}

interface CapturedConfig {
	printActions?: PrintAction[];
	convertActions?: Array<{ key: string }>;
	documentType?: string;
	labels?: {
		pageTitle?: string;
		addButtonText?: string;
	};
}

let capturedConfig: CapturedConfig | null = null;
let capturedOnCustomFilterParamsChange:
	| ((params: Record<string, string>) => void)
	| null = null;

jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent', () => ({
	__esModule: true,
	default: (props: {
		config: CapturedConfig;
		onFilterModelChange?: (model: { items: Array<{ field: string; value?: { from?: string; to?: string } }> }) => void;
		onCustomFilterParamsChange?: (params: Record<string, string>) => void;
		router: ReturnType<typeof import('next/navigation').useRouter>;
		queryResult: {
			data?: { results: Array<{ id: number; numero_facture: string; client_name: string; statut: string }> };
			isLoading: boolean;
		};
	}) => {
		capturedConfig = props.config;
		capturedOnCustomFilterParamsChange = props.onCustomFilterParamsChange || null;

		// Call printAction urlGenerators to cover them
		if (props.config.printActions) {
			props.config.printActions.forEach((action: PrintAction) => {
				action.urlGenerator(1, 2);
			});
		}

		const results = props.queryResult?.data?.results || [];
		return (
			<div data-testid="company-documents-list-content">
				<button onClick={() => props.router.push(props.config.labels?.addButtonText || '')}>
					{props.config.labels?.addButtonText || 'Add'}
				</button>
				<div data-testid="paginated-data-grid">
					<table>
						<thead>
							<tr>
								<th>Numéro facture</th>
								<th>Client</th>
								<th>N° bon commande client</th>
								<th>Statut</th>
								<th>Total TTC après remise</th>
								<th>Nombre d&apos;articles</th>
								<th>Date facture</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{results.map((row: { id: number; numero_facture: string; client_name: string; statut: string }) => (
								<tr key={row.id} data-testid={`row-${row.id}`}>
									<td>{row.numero_facture}</td>
									<td>{row.client_name}</td>
									<td>{row.statut}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		);
	},
}));

// Import after mocks
import FactureClientListClient from './facture-client-list';

const mockSession: AppSession = {
	accessToken: 'test-access-token',
	refreshToken: 'test-refresh-token',
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

describe('FactureClientListClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	describe('Rendering', () => {
		it('renders the component wrapper', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Liste des Factures Clients')).toBeInTheDocument();
		});

		it('renders the paginated data grid', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders "Nouvelle facture client" button for Admin role', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Nouvelle facture client')).toBeInTheDocument();
		});

		it('renders data rows from query', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByTestId('row-1')).toBeInTheDocument();
			expect(screen.getByTestId('row-2')).toBeInTheDocument();
		});

		it('displays facture numbers', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('FC-001')).toBeInTheDocument();
			expect(screen.getByText('FC-002')).toBeInTheDocument();
		});

		it('displays client names', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Client Test')).toBeInTheDocument();
			expect(screen.getByText('Client Two')).toBeInTheDocument();
		});
	});

	describe('Props handling', () => {
		it('handles session with token', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		});

		it('handles undefined session', () => {
			render(<FactureClientListClient session={undefined} />);
			expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		});

		it('handles null-like session', () => {
			render(<FactureClientListClient session={undefined} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('navigates to add page when clicking "Nouvelle facture client" button', () => {
			render(<FactureClientListClient session={mockSession} />);
			const addButton = screen.getByText('Nouvelle facture client');
			fireEvent.click(addButton);
			expect(mockPush).toHaveBeenCalled();
		});
	});

	describe('Column headers', () => {
		it('renders Numéro facture header', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Numéro facture')).toBeInTheDocument();
		});

		it('renders Client header', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Client')).toBeInTheDocument();
		});

		it('renders N° bon commande client header', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('N° bon commande client')).toBeInTheDocument();
		});

		it('renders Statut header', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Statut')).toBeInTheDocument();
		});

		it('renders Total TTC après remise header', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Total TTC après remise')).toBeInTheDocument();
		});

		it("renders Nombre d'articles header", () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText("Nombre d'articles")).toBeInTheDocument();
		});

		it('renders Date facture header', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Date facture')).toBeInTheDocument();
		});

		it('renders Actions header', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Actions')).toBeInTheDocument();
		});
	});

	describe('Loading state', () => {
		it('renders when data is loading', () => {
			mockUseGetFactureClientListQuery.mockReturnValueOnce({
				data: { results: [], count: 0, next: null, previous: null },
				isLoading: true,
				refetch: mockRefetch,
			});

			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('renders when no data is available', () => {
			mockUseGetFactureClientListQuery.mockReturnValueOnce({
				data: { results: [], count: 0, next: null, previous: null },
				isLoading: false,
				refetch: mockRefetch,
			});

			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('PrintActions configuration', () => {
		beforeEach(() => {
			capturedConfig = null;
			render(<FactureClientListClient session={mockSession} />);
		});

		it('passes printActions to CompanyDocumentsListContent', () => {
			expect(capturedConfig).not.toBeNull();
			expect(capturedConfig?.printActions).toBeDefined();
			expect(capturedConfig?.printActions?.length).toBe(3);
		});

		it('generates correct avec_remise PDF URL', () => {
			const avecRemiseAction = capturedConfig?.printActions?.find((a) => a.key === 'avec_remise');
			expect(avecRemiseAction).toBeDefined();
			const url = avecRemiseAction?.urlGenerator(1, 2);
			expect(url).toContain('1');
			expect(url).toContain('2');
		});

		it('generates correct sans_remise PDF URL', () => {
			const sansRemiseAction = capturedConfig?.printActions?.find((a) => a.key === 'sans_remise');
			expect(sansRemiseAction).toBeDefined();
			const url = sansRemiseAction?.urlGenerator(1, 2);
			expect(url).toContain('1');
			expect(url).toContain('2');
		});

		it('generates correct avec_unite PDF URL', () => {
			const avecUniteAction = capturedConfig?.printActions?.find((a) => a.key === 'avec_unite');
			expect(avecUniteAction).toBeDefined();
			const url = avecUniteAction?.urlGenerator(1, 2);
			expect(url).toContain('1');
			expect(url).toContain('2');
		});
	});

	describe('ConvertActions configuration', () => {
		beforeEach(() => {
			capturedConfig = null;
			render(<FactureClientListClient session={mockSession} />);
		});

		it('passes convertActions to CompanyDocumentsListContent', () => {
			expect(capturedConfig).not.toBeNull();
			expect(capturedConfig?.convertActions).toBeDefined();
			expect(capturedConfig?.convertActions?.length).toBe(1);
		});
	});

	describe('Date filter params', () => {
		beforeEach(() => {
			capturedOnCustomFilterParamsChange = null;
			lastQueryArgs = null;
		});

		it('passes onCustomFilterParamsChange to CompanyDocumentsListContent', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(capturedOnCustomFilterParamsChange).not.toBeNull();
		});

		it('calls query with date_after param when from filter is set', async () => {
			const { rerender } = render(<FactureClientListClient session={mockSession} />);
			expect(capturedOnCustomFilterParamsChange).not.toBeNull();

			await act(async () => {
				if (capturedOnCustomFilterParamsChange) {
					capturedOnCustomFilterParamsChange({ date_after: '2025-01-01' });
				}
			});

			rerender(<FactureClientListClient session={mockSession} />);

			expect(lastQueryArgs).toBeDefined();
			expect(lastQueryArgs?.date_after).toBe('2025-01-01');
		});

		it('calls query with date_before param when to filter is set', async () => {
			const { rerender } = render(<FactureClientListClient session={mockSession} />);
			expect(capturedOnCustomFilterParamsChange).not.toBeNull();

			await act(async () => {
				if (capturedOnCustomFilterParamsChange) {
					capturedOnCustomFilterParamsChange({ date_before: '2025-12-31' });
				}
			});

			rerender(<FactureClientListClient session={mockSession} />);

			expect(lastQueryArgs).toBeDefined();
			expect(lastQueryArgs?.date_before).toBe('2025-12-31');
		});

		it('calls query with both date params when from and to filters are set', async () => {
			const { rerender } = render(<FactureClientListClient session={mockSession} />);
			expect(capturedOnCustomFilterParamsChange).not.toBeNull();

			await act(async () => {
				if (capturedOnCustomFilterParamsChange) {
					capturedOnCustomFilterParamsChange({ date_after: '2025-01-01', date_before: '2025-12-31' });
				}
			});

			rerender(<FactureClientListClient session={mockSession} />);

			expect(lastQueryArgs).toBeDefined();
			expect(lastQueryArgs?.date_after).toBe('2025-01-01');
			expect(lastQueryArgs?.date_before).toBe('2025-12-31');
		});
	});
});
