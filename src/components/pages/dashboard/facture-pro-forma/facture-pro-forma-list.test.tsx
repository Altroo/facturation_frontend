import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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
}));

// Mock RTK Query hooks
const mockRefetch = jest.fn();
const mockDeleteRecord = jest.fn();
const mockConvertToClient = jest.fn();

jest.mock('@/store/services/factureProForma', () => ({
	useGetFactureProFormaListQuery: jest.fn(() => ({
		data: {
			results: [
				{
					id: 1,
					numero_facture: 'FPF-001',
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
					numero_facture: 'FPF-002',
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
	})),
	useDeleteFactureProFormaMutation: jest.fn(() => [mockDeleteRecord, { isLoading: false }]),
	useConvertFactureProFormaToFactureMutation: jest.fn(() => [mockConvertToClient, { isLoading: false }]),
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
	statutFilterOptions: [
		{ value: 'Brouillon', label: 'Brouillon', color: 'default' },
		{ value: 'Envoyé', label: 'Envoyé', color: 'info' },
		{ value: 'Accepté', label: 'Accepté', color: 'success' },
		{ value: 'Refusé', label: 'Refusé', color: 'error' },
		{ value: 'Annulé', label: 'Annulé', color: 'error' },
		{ value: 'Expiré', label: 'Expiré', color: 'warning' },
	],
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
			{children({ company_id: 1, role: 'Admin' })}
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
}));

// Import after mocks
import FactureProformaListClient from './facture-pro-forma-list';

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

describe('FactureProformaListClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	describe('Rendering', () => {
		it('renders the component wrapper', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Liste des Factures Proforma')).toBeInTheDocument();
		});

		it('renders the paginated data grid', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders "Nouvelle facture proforma" button for Admin role', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Nouvelle facture proforma')).toBeInTheDocument();
		});

		it('renders data rows from query', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByTestId('row-1')).toBeInTheDocument();
			expect(screen.getByTestId('row-2')).toBeInTheDocument();
		});

		it('displays facture numbers', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('FPF-001')).toBeInTheDocument();
			expect(screen.getByText('FPF-002')).toBeInTheDocument();
		});

		it('displays client names', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Client Test')).toBeInTheDocument();
			expect(screen.getByText('Client Two')).toBeInTheDocument();
		});
	});

	describe('Props handling', () => {
		it('handles session with token', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		});

		it('handles undefined session', () => {
			render(<FactureProformaListClient session={undefined} />);
			expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		});

		it('handles null-like session', () => {
			render(<FactureProformaListClient session={undefined} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('navigates to add page when clicking "Nouvelle facture proforma" button', () => {
			render(<FactureProformaListClient session={mockSession} />);
			const addButton = screen.getByText('Nouvelle facture proforma');
			fireEvent.click(addButton);
			expect(mockPush).toHaveBeenCalled();
		});
	});

	describe('Column headers', () => {
		it('renders Numéro facture header', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Numéro facture')).toBeInTheDocument();
		});

		it('renders Client header', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Client')).toBeInTheDocument();
		});

		it('renders N° bon commande client header', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('N° bon commande client')).toBeInTheDocument();
		});

		it('renders Statut header', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Statut')).toBeInTheDocument();
		});

		it('renders Total TTC après remise header', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Total TTC après remise')).toBeInTheDocument();
		});

		it("renders Nombre d'articles header", () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText("Nombre d'articles")).toBeInTheDocument();
		});

		it('renders Date facture header', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Date facture')).toBeInTheDocument();
		});

		it('renders Actions header', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Actions')).toBeInTheDocument();
		});
	});

	describe('Loading state', () => {
		it('renders when data is loading', () => {
			const { useGetFactureProFormaListQuery } = jest.requireMock('@/store/services/factureProForma');
			useGetFactureProFormaListQuery.mockReturnValueOnce({
				data: undefined,
				isLoading: true,
				refetch: mockRefetch,
			});

			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('renders when no data is available', () => {
			const { useGetFactureProFormaListQuery } = jest.requireMock('@/store/services/factureProForma');
			useGetFactureProFormaListQuery.mockReturnValueOnce({
				data: { results: [], count: 0 },
				isLoading: false,
				refetch: mockRefetch,
			});

			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});
});
