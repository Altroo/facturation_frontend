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
const mockConvertToProForma = jest.fn();
const mockConvertToClient = jest.fn();

jest.mock('@/store/services/devi', () => ({
	useGetDevisListQuery: jest.fn(() => ({
		data: {
			results: [
				{
					id: 1,
					numero_devis: 'DEV-001',
					client: 10,
					client_name: 'Client Test',
					numero_demande_prix_client: 'DDP-001',
					statut: 'Brouillon',
					total_ttc_apres_remise: 1500.0,
					lignes_count: 3,
					date_devis: '2025-01-15',
				},
				{
					id: 2,
					numero_devis: 'DEV-002',
					client: 20,
					client_name: 'Client Two',
					numero_demande_prix_client: 'DDP-002',
					statut: 'Envoyé',
					total_ttc_apres_remise: 2500.5,
					lignes_count: 5,
					date_devis: '2025-01-20',
				},
			],
			count: 2,
			next: null,
			previous: null,
		},
		isLoading: false,
		refetch: mockRefetch,
	})),
	useDeleteDeviMutation: jest.fn(() => [mockDeleteRecord, { isLoading: false }]),
	useConvertDeviToFactureProFormaMutation: jest.fn(() => [mockConvertToProForma, { isLoading: false }]),
	useConvertDeviToFactureClientMutation: jest.fn(() => [mockConvertToClient, { isLoading: false }]),
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
		queryHook,
	}: {
		columns: Array<{ field: string; headerName: string }>;
		queryHook: () => { data: unknown; isLoading: boolean };
	}) => {
		const { data } = queryHook();
		const results =
			(data as { results?: Array<{ id: number; numero_devis: string; client_name: string; statut: string }> })
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
								<td>{row.numero_devis}</td>
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
import DevisListClient, { getStatutColor, statutFilterOptions } from './devis-list';

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

describe('DevisListClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	describe('getStatutColor', () => {
		it('returns "default" for Brouillon', () => {
			expect(getStatutColor('Brouillon')).toBe('default');
		});

		it('returns "info" for Envoyé', () => {
			expect(getStatutColor('Envoyé')).toBe('info');
		});

		it('returns "success" for Accepté', () => {
			expect(getStatutColor('Accepté')).toBe('success');
		});

		it('returns "error" for Refusé', () => {
			expect(getStatutColor('Refusé')).toBe('error');
		});

		it('returns "error" for Annulé', () => {
			expect(getStatutColor('Annulé')).toBe('error');
		});

		it('returns "warning" for Expiré', () => {
			expect(getStatutColor('Expiré')).toBe('warning');
		});

		it('returns "default" for unknown status', () => {
			expect(getStatutColor('Unknown')).toBe('default');
			expect(getStatutColor('')).toBe('default');
			expect(getStatutColor('InvalidStatus')).toBe('default');
		});
	});

	describe('statutFilterOptions', () => {
		it('has correct length', () => {
			expect(statutFilterOptions).toHaveLength(6);
		});

		it('contains Brouillon option', () => {
			expect(statutFilterOptions).toContainEqual({
				value: 'Brouillon',
				label: 'Brouillon',
				color: 'default',
			});
		});

		it('contains Envoyé option', () => {
			expect(statutFilterOptions).toContainEqual({
				value: 'Envoyé',
				label: 'Envoyé',
				color: 'info',
			});
		});

		it('contains Accepté option', () => {
			expect(statutFilterOptions).toContainEqual({
				value: 'Accepté',
				label: 'Accepté',
				color: 'success',
			});
		});

		it('contains Refusé option', () => {
			expect(statutFilterOptions).toContainEqual({
				value: 'Refusé',
				label: 'Refusé',
				color: 'error',
			});
		});

		it('contains Annulé option', () => {
			expect(statutFilterOptions).toContainEqual({
				value: 'Annulé',
				label: 'Annulé',
				color: 'error',
			});
		});

		it('contains Expiré option', () => {
			expect(statutFilterOptions).toContainEqual({
				value: 'Expiré',
				label: 'Expiré',
				color: 'warning',
			});
		});

		it('has value and label matching for each option', () => {
			statutFilterOptions.forEach((option) => {
				expect(option.value).toBe(option.label);
			});
		});
	});

	describe('Rendering', () => {
		it('renders the component wrapper', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Liste des Devis')).toBeInTheDocument();
		});

		it('renders the paginated data grid', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders "Nouveau devi" button for Admin role', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Nouveau devi')).toBeInTheDocument();
		});

		it('renders data rows from query', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByTestId('row-1')).toBeInTheDocument();
			expect(screen.getByTestId('row-2')).toBeInTheDocument();
		});

		it('displays devis numbers', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('DEV-001')).toBeInTheDocument();
			expect(screen.getByText('DEV-002')).toBeInTheDocument();
		});

		it('displays client names', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Client Test')).toBeInTheDocument();
			expect(screen.getByText('Client Two')).toBeInTheDocument();
		});
	});

	describe('Props handling', () => {
		it('handles session with token', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		});

		it('handles undefined session', () => {
			render(<DevisListClient session={undefined} />);
			expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		});

		it('handles null-like session', () => {
			render(<DevisListClient session={undefined} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('navigates to add page when clicking "Nouveau devi" button', () => {
			render(<DevisListClient session={mockSession} />);
			const addButton = screen.getByText('Nouveau devi');
			fireEvent.click(addButton);
			expect(mockPush).toHaveBeenCalled();
		});
	});

	describe('Column headers', () => {
		it('renders Numéro devi header', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Numéro devi')).toBeInTheDocument();
		});

		it('renders Client header', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Client')).toBeInTheDocument();
		});

		it('renders N° Dde de prix header', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('N° Dde de prix')).toBeInTheDocument();
		});

		it('renders Statut header', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Statut')).toBeInTheDocument();
		});

		it('renders Total TTC après remise header', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Total TTC après remise')).toBeInTheDocument();
		});

		it("renders Nombre d'articles header", () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText("Nombre d'articles")).toBeInTheDocument();
		});

		it('renders Date devi header', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Date devi')).toBeInTheDocument();
		});

		it('renders Actions header', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Actions')).toBeInTheDocument();
		});
	});

	describe('Loading state', () => {
		it('renders when data is loading', () => {
			const { useGetDevisListQuery } = jest.requireMock('@/store/services/devi');
			useGetDevisListQuery.mockReturnValueOnce({
				data: undefined,
				isLoading: true,
				refetch: mockRefetch,
			});

			render(<DevisListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('renders when no data is available', () => {
			const { useGetDevisListQuery } = jest.requireMock('@/store/services/devi');
			useGetDevisListQuery.mockReturnValueOnce({
				data: { results: [], count: 0 },
				isLoading: false,
				refetch: mockRefetch,
			});

			render(<DevisListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});
});
