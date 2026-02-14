import React from 'react';
import { render, screen, cleanup, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: jest.fn((session: AppSession) => session?.accessToken || null),
}));

const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
	useAppSelector: jest.fn(() => []),
}));

const mockRefetch = jest.fn();
const mockDeleteClient = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockPatchArchive = jest.fn(() => ({ unwrap: () => Promise.resolve() }));

const mockUseGetClientsListQuery = jest.fn(() => ({
	data: {
		results: [
			{ id: 1, code_client: 'CLI-001', client_type: 'Personne morale', raison_sociale: 'Entreprise A', nom: 'Doe', prenom: 'John', ville: 1, ville_name: 'Casablanca', date_created: '2025-01-10' },
			{ id: 2, code_client: 'CLI-002', client_type: 'Personne physique', raison_sociale: null, nom: 'Smith', prenom: 'Jane', ville: 2, ville_name: 'Rabat', date_created: null },
		],
		count: 2,
		next: null,
		previous: null,
	},
	isLoading: false,
	refetch: mockRefetch,
}));

jest.mock('@/store/services/client', () => ({
	useGetClientsListQuery: () => mockUseGetClientsListQuery(),
	useDeleteClientMutation: jest.fn(() => [mockDeleteClient, { isLoading: false }]),
	usePatchArchiveMutation: jest.fn(() => [mockPatchArchive, { isLoading: false }]),
}));

jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => ({
	__esModule: true,
	default: ({ children, title }: { children: (props: { company_id: number; role: string }) => React.ReactNode; title: string }) => (
		<div data-testid="company-wrapper"><h1>{title}</h1>{children({ company_id: 1, role: 'Caissier' })}</div>
	),
}));

// Enhanced PaginatedDataGrid mock that calls renderCell
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({ columns, data }: { columns: Array<{ field: string; headerName: string; renderCell?: (params: { value: unknown; row: Record<string, unknown>; field: string }) => React.ReactNode }>; data?: { results?: Array<Record<string, unknown>> }; isLoading?: boolean; onCustomFilterParamsChange?: unknown }) => {
		const results = data?.results || [];
		return (
			<div data-testid="paginated-data-grid">
				<table>
					<thead><tr>{columns.map((col) => <th key={col.field}>{col.headerName}</th>)}</tr></thead>
					<tbody>{results.map((row) => (
						<tr key={row.id as number} data-testid={`row-${row.id}`}>
							{columns.map((col) => <td key={col.field}>{col.renderCell ? col.renderCell({ value: row[col.field], row, field: col.field }) : String(row[col.field] ?? '')}</td>)}
						</tr>
					))}</tbody>
				</table>
			</div>
		);
	},
}));

jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: ({ title, body, actions }: { title: string; body: string; actions: Array<{ text: string; onClick: () => void }> }) => (
		<div data-testid="action-modal" role="dialog">
			<h2>{title}</h2><p>{body}</p>
			<div>{actions.map((a) => <button key={a.text} onClick={a.onClick}>{a.text}</button>)}</div>
		</div>
	),
}));

jest.mock('@/components/shared/mobileActionsMenu/mobileActionsMenu', () => ({
	__esModule: true,
	default: ({ actions }: { actions: Array<{ label: string; onClick: () => void }> }) => (
		<div data-testid="mobile-actions-menu">{actions.map((a) => <button key={a.label} onClick={a.onClick}>{a.label}</button>)}</div>
	),
}));

jest.mock('@/components/shared/chipSelectFilter/chipSelectFilterBar', () => ({
	__esModule: true,
	default: () => <div data-testid="chip-filter-bar" />,
}));

jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/shared/dropdownFilter/dropdownFilter', () => ({ createDropdownFilterOperators: jest.fn(() => []) }));
jest.mock('@/components/shared/dateRangeFilter/dateRangeFilterOperator', () => ({ createDateRangeFilterOperator: jest.fn(() => []) }));
jest.mock('@/store/services/parameter', () => ({
	useGetCitiesListQuery: jest.fn(() => ({ data: [], isLoading: false })),
}));
jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
}));

import ClientsListClient, { typeFilterOptions } from './clients-list';

const mockSession: AppSession = {
	accessToken: 'test-access-token', refreshToken: 'test-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z', refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: { id: '1', pk: 1, email: 'test@example.com', emailVerified: null, name: 'Test User', first_name: 'Test', last_name: 'User', image: null },
};

describe('ClientsListClient', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders wrapper', () => { render(<ClientsListClient session={mockSession} archived={false} />); expect(screen.getByTestId('company-wrapper')).toBeInTheDocument(); });
		it('renders title non-archived', () => { render(<ClientsListClient session={mockSession} archived={false} />); expect(screen.getByText('Liste des Clients')).toBeInTheDocument(); });
		it('renders title archived', () => { render(<ClientsListClient session={mockSession} archived={true} />); expect(screen.getByText('Clients Archivés')).toBeInTheDocument(); });
		it('renders data grid', () => { render(<ClientsListClient session={mockSession} archived={false} />); expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument(); });
		it('renders Nouveau client button', () => { render(<ClientsListClient session={mockSession} archived={false} />); expect(screen.getByText('Nouveau client')).toBeInTheDocument(); });
		it('hides Nouveau client button when archived', () => { render(<ClientsListClient session={mockSession} archived={true} />); expect(screen.queryByText('Nouveau client')).toBeNull(); });
		it('renders chip filter bar', () => { render(<ClientsListClient session={mockSession} archived={false} />); expect(screen.getByTestId('chip-filter-bar')).toBeInTheDocument(); });
		it('renders data rows', () => { render(<ClientsListClient session={mockSession} archived={false} />); expect(screen.getByTestId('row-1')).toBeInTheDocument(); expect(screen.getByTestId('row-2')).toBeInTheDocument(); });
	});

	describe('Column renderCell', () => {
		it('renders code_client values', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByText('CLI-001')).toBeInTheDocument();
			expect(screen.getByText('CLI-002')).toBeInTheDocument();
		});

		it('renders client_type as Chip', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByText('Personne morale')).toBeInTheDocument();
			expect(screen.getByText('Personne physique')).toBeInTheDocument();
		});

		it('renders nom and prenom', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByText('Doe')).toBeInTheDocument();
			expect(screen.getByText('Smith')).toBeInTheDocument();
		});

		it('renders ville_name', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByText('Casablanca')).toBeInTheDocument();
			expect(screen.getByText('Rabat')).toBeInTheDocument();
		});

		it('renders date_created (null shows dash)', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByText('—')).toBeInTheDocument();
		});

		it('renders actions for Caissier role', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getAllByText('Voir').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Modifier').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Supprimer').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Archiver').length).toBeGreaterThanOrEqual(2);
		});

		it('renders Désarchiver when archived=true', () => {
			render(<ClientsListClient session={mockSession} archived={true} />);
			expect(screen.getAllByText('Désarchiver').length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Action handlers', () => {
		it('navigates to add page', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			fireEvent.click(screen.getByText('Nouveau client'));
			expect(mockPush).toHaveBeenCalled();
		});

		it('navigates to view page', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			fireEvent.click(screen.getAllByText('Voir')[0]);
			expect(mockPush).toHaveBeenCalled();
		});

		it('navigates to edit page', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			fireEvent.click(screen.getAllByText('Modifier')[0]);
			expect(mockPush).toHaveBeenCalled();
		});

		it('opens delete modal', async () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Supprimer ce client ?')).toBeInTheDocument();
		});

		it('closes delete modal on Annuler', async () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			await act(async () => { fireEvent.click(screen.getByText('Annuler')); });
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});

		it('deletes client on confirm', async () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			const btns = screen.getAllByText('Supprimer');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockDeleteClient).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Client supprimé avec succès');
			});
		});

		it('handles delete error', async () => {
			mockDeleteClient.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ClientsListClient session={mockSession} archived={false} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			const btns = screen.getAllByText('Supprimer');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => { expect(mockOnError).toHaveBeenCalledWith('Erreur lors de la suppression du client'); });
		});

		it('opens archive modal', async () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Archiver')[0]); });
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Archiver ce client ?')).toBeInTheDocument();
		});

		it('archives client on confirm', async () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Archiver')[0]); });
			const btns = screen.getAllByText('Archiver');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockPatchArchive).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Client archivé avec succès');
			});
		});

		it('unarchives client on confirm', async () => {
			render(<ClientsListClient session={mockSession} archived={true} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Désarchiver')[0]); });
			const btns = screen.getAllByText('Désarchiver');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockPatchArchive).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Client désarchivé avec succès');
			});
		});

		it('handles archive error', async () => {
			mockPatchArchive.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ClientsListClient session={mockSession} archived={false} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Archiver')[0]); });
			const btns = screen.getAllByText('Archiver');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => { expect(mockOnError).toHaveBeenCalledWith("Erreur lors de l\u2019archivage du client"); });
		});

		it('handles unarchive error', async () => {
			mockPatchArchive.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ClientsListClient session={mockSession} archived={true} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Désarchiver')[0]); });
			const btns = screen.getAllByText('Désarchiver');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => { expect(mockOnError).toHaveBeenCalledWith('Erreur lors de la désarchivation du client'); });
		});

		it('cancels archive modal on Annuler', async () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Archiver')[0]); });
			await act(async () => { fireEvent.click(screen.getByText('Annuler')); });
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});
	});

	describe('Column headers', () => {
		it('renders all expected column headers', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			for (const h of ['Code Client', 'Type', 'Raison Sociale', 'Nom', 'Prénom', 'Ville', 'Date de création', 'Actions']) {
				expect(screen.getByText(h)).toBeInTheDocument();
			}
		});
	});

	describe('Loading and empty states', () => {
		it('renders when loading', () => {
			mockUseGetClientsListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null }, isLoading: true, refetch: mockRefetch });
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders when empty', () => {
			mockUseGetClientsListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null }, isLoading: false, refetch: mockRefetch });
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Exports', () => {
		it('exports typeFilterOptions', () => {
			expect(typeFilterOptions).toHaveLength(2);
			expect(typeFilterOptions[0].value).toBe('Personne physique');
			expect(typeFilterOptions[1].value).toBe('Personne morale');
		});
	});
});
