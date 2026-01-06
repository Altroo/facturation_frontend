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

jest.mock('@/store/services/bonDeLivraison', () => ({
	useGetBonDeLivraisonListQuery: jest.fn(() => ({
		data: {
			results: [
				{
					id: 1,
					numero_bon_livraison: 'BL-001',
					client: 10,
					client_name: 'Client A',
					numero_bon_commande_client: 'BC-100',
					statut: 'Brouillon',
					total_ttc_apres_remise: 500.0,
					lignes_count: 2,
					date_bon_livraison: '2025-02-10',
				},
				{
					id: 2,
					numero_bon_livraison: 'BL-002',
					client: 20,
					client_name: 'Client B',
					numero_bon_commande_client: 'BC-200',
					statut: 'Envoyé',
					total_ttc_apres_remise: 1200.25,
					lignes_count: 4,
					date_bon_livraison: '2025-02-12',
				},
			],
			count: 2,
			next: null,
			previous: null,
		},
		isLoading: false,
		refetch: mockRefetch,
	})),
	useDeleteBonDeLivraisonMutation: jest.fn(() => [mockDeleteRecord, { isLoading: false }]),
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
		data?: unknown;
		isLoading?: boolean;
	}) => {
		const results =
			(data as { results?: Array<{ id: number; numero_bon_livraison: string; client_name: string; statut: string }> })
				?.results || [];
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
								<td>{row.numero_bon_livraison}</td>
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
import BonDeLivraisonListClient from './bon-de-livraison-list';

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

describe('BonDeLivraisonListClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	describe('Rendering', () => {
		it('renders the component wrapper', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		});

		it('renders the title from wrapper', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText('Liste des Bons de Livraison')).toBeInTheDocument();
		});

		it('renders the paginated data grid', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders "Nouveau bon de livraison" button for Admin role', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText('Nouveau bon de livraison')).toBeInTheDocument();
		});

		it('renders data rows from query', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByTestId('row-1')).toBeInTheDocument();
			expect(screen.getByTestId('row-2')).toBeInTheDocument();
		});

		it('displays bon de livraison numbers and client names', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText('BL-001')).toBeInTheDocument();
			expect(screen.getByText('BL-002')).toBeInTheDocument();
			expect(screen.getByText('Client A')).toBeInTheDocument();
			expect(screen.getByText('Client B')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('navigates to add page when clicking "Nouveau bon de livraison" button', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			const addButton = screen.getByText('Nouveau bon de livraison');
			fireEvent.click(addButton);
			expect(mockPush).toHaveBeenCalled();
		});
	});

	describe('Column headers', () => {
		it('renders Numéro bon livraison header', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText('Numéro bon livraison')).toBeInTheDocument();
		});

		it('renders Client header', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText('Client')).toBeInTheDocument();
		});

		it('renders N° bon commande client header', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText('N° bon commande client')).toBeInTheDocument();
		});

		it('renders Statut header', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText('Statut')).toBeInTheDocument();
		});

		it('renders Total TTC après remise header', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText('Total TTC après remise')).toBeInTheDocument();
		});

		it("renders Nombre d'articles header", () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText("Nombre d'articles")).toBeInTheDocument();
		});

		it('renders Date bon livraison header', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText('Date bon livraison')).toBeInTheDocument();
		});

		it('renders Actions header', () => {
			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByText('Actions')).toBeInTheDocument();
		});
	});

	describe('Loading state', () => {
		it('renders when data is loading', () => {
			const { useGetBonDeLivraisonListQuery } = jest.requireMock('@/store/services/bonDeLivraison');
			useGetBonDeLivraisonListQuery.mockReturnValueOnce({
				data: undefined,
				isLoading: true,
				refetch: mockRefetch,
			});

			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('renders when no data is available', () => {
			const { useGetBonDeLivraisonListQuery } = jest.requireMock('@/store/services/bonDeLivraison');
			useGetBonDeLivraisonListQuery.mockReturnValueOnce({
				data: { results: [], count: 0 },
				isLoading: false,
				refetch: mockRefetch,
			});

			render(<BonDeLivraisonListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});
});
