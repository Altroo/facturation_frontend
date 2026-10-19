import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { GridRenderCellParams } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useGetLogistiqueListQuery,
	useDeleteLogistiqueMutation,
	useBulkDeleteLogistiqueMutation,
} from '@/store/services/logistique';
import type { CompanyDocumentsListProps } from '@/types/companyDocumentsTypes';
import type { LogistiqueOrder } from '@/types/logistiqueTypes';
import type { PaginatedDataGridProps, ChipSelectFilterBarProps } from '@/types/uiTypes';
import { LOGISTIQUE_ADD, LOGISTIQUE_EDIT, LOGISTIQUE_VIEW } from '@/utils/routes';
import { translations } from '@/translations';
import LogistiqueListClient from './logistique-list';

const mockPush = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
let mockRole = 'Caissier';
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: jest.fn() }));
jest.mock('@/store/selectors', () => ({ getInitStateToken: jest.fn() }));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: () => ({ user: { pk: 27 } }),
	useLanguage: () => ({ t: jest.requireActual('@/translations').translations.fr }),
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));
jest.mock('@/store/services/logistique', () => ({
	useGetLogistiqueListQuery: jest.fn(),
	useDeleteLogistiqueMutation: jest.fn(),
	useBulkDeleteLogistiqueMutation: jest.fn(),
}));
jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => ({
	__esModule: true,
	default: ({ children }: CompanyDocumentsListProps) =>
		children({ company_id: 12, role: mockRole, raison_sociale: 'Test' }),
}));
jest.mock('@/components/shared/chipSelectFilter/chipSelectFilterBar', () => ({
	__esModule: true,
	default: ({ onFilterChange }: ChipSelectFilterBarProps) => (
		<button onClick={() => onFilterChange({ statut_global: 'En retard' })}>Dossiers en retard</button>
	),
}));
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({
		data,
		columns,
		searchTerm,
		setSearchTerm,
		onSelectionChange,
		checkboxSelection,
	}: PaginatedDataGridProps<LogistiqueOrder>) => (
		<div>
			<input aria-label="Recherche" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
			{checkboxSelection && <button onClick={() => onSelectionChange?.([7, 8])}>Sélectionner deux dossiers</button>}
			{data?.results.map((row) => (
				<div key={row.id}>
					{columns.find((column) => column.field === 'actions')?.renderCell?.({ row } as GridRenderCellParams)}
				</div>
			))}
		</div>
	),
}));

const t = translations.fr;
const row = { id: 7, responsable: 28, statut_paiement: 'Non demandé', statut_global: 'En cours' };
const listData = { count: 1, results: [row], stats: { fournisseurs: [], kpi_fournisseurs: [] } };
const mockRefetch = jest.fn();
const mockUnwrap = jest.fn();
const mockDelete = jest.fn(() => ({ unwrap: mockUnwrap }));
const mockBulkDelete = jest.fn(() => ({ unwrap: mockUnwrap }));

beforeEach(() => {
	jest.clearAllMocks();
	mockRole = 'Caissier';
	window.history.replaceState(null, '', '/dashboard/logistique?company_id=12&page=3&ordering=-date_created');
	(useInitAccessToken as jest.Mock).mockReturnValue('token');
	(useGetLogistiqueListQuery as jest.Mock).mockReturnValue({ data: listData, refetch: mockRefetch });
	(useDeleteLogistiqueMutation as jest.Mock).mockReturnValue([mockDelete]);
	(useBulkDeleteLogistiqueMutation as jest.Mock).mockReturnValue([mockBulkDelete]);
	mockUnwrap.mockResolvedValue(undefined);
});

describe('LogistiqueListClient', () => {
	it('sends company, pagination, ordering, search, and status filters to the API', () => {
		render(<LogistiqueListClient />);
		expect(useGetLogistiqueListQuery).toHaveBeenCalledWith(
			expect.objectContaining({ company_id: 12, page: 3, ordering: '-date_created' }),
			{ skip: false },
		);
		fireEvent.change(screen.getByRole('textbox', { name: 'Recherche' }), { target: { value: 'LOG' } });
		fireEvent.click(screen.getByRole('button', { name: 'Dossiers en retard' }));
		expect(useGetLogistiqueListQuery).toHaveBeenLastCalledWith(
			expect.objectContaining({ search: 'LOG', statut_global: 'En retard' }),
			{ skip: false },
		);
	});

	it('skips list requests before authentication is ready', () => {
		(useInitAccessToken as jest.Mock).mockReturnValue(undefined);
		render(<LogistiqueListClient />);
		expect(useGetLogistiqueListQuery).toHaveBeenCalledWith(expect.any(Object), { skip: true });
	});

	it('preserves company scope for create, edit, and view navigation', () => {
		render(<LogistiqueListClient />);
		fireEvent.click(screen.getByRole('button', { name: t.logistique.newOrder }));
		expect(mockPush).toHaveBeenLastCalledWith(LOGISTIQUE_ADD(12));
		fireEvent.click(screen.getByRole('button', { name: t.common.edit }));
		expect(mockPush).toHaveBeenLastCalledWith(LOGISTIQUE_EDIT(7, 12));
		fireEvent.click(screen.getByRole('button', { name: t.common.view }));
		expect(mockPush).toHaveBeenLastCalledWith(LOGISTIQUE_VIEW(7, 12));
	});

	it('restricts ordinary readers and retains the responsible user exception before payment', () => {
		mockRole = 'Lecture';
		const { rerender } = render(<LogistiqueListClient />);
		expect(screen.queryByRole('button', { name: t.common.edit })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: t.common.delete })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: t.logistique.newOrder })).not.toBeInTheDocument();
		(useGetLogistiqueListQuery as jest.Mock).mockReturnValue({
			data: { ...listData, results: [{ ...row, responsable: 27 }] },
		});
		rerender(<LogistiqueListClient />);
		expect(screen.getByRole('button', { name: t.common.edit })).toBeInTheDocument();
	});

	it('prevents editing cancelled dossiers even for managers', () => {
		(useGetLogistiqueListQuery as jest.Mock).mockReturnValue({
			data: { ...listData, results: [{ ...row, statut_global: 'Annulé' }] },
		});
		render(<LogistiqueListClient />);
		expect(screen.queryByRole('button', { name: t.common.edit })).not.toBeInTheDocument();
	});

	it('requires confirmation before deleting and refreshes the list after success', async () => {
		render(<LogistiqueListClient />);
		fireEvent.click(screen.getByRole('button', { name: t.common.delete }));
		expect(mockDelete).not.toHaveBeenCalled();
		fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: t.common.delete }));
		await waitFor(() => expect(mockRefetch).toHaveBeenCalledTimes(1));
		expect(mockDelete).toHaveBeenCalledWith({ id: 7 });
		expect(mockOnSuccess).toHaveBeenCalledWith(t.logistique.deleteSuccess);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('reports deletion failures and clears the confirmation without reporting success', async () => {
		mockUnwrap.mockRejectedValueOnce({ data: { details: { detail: ['Suppression refusée.'] } } });
		render(<LogistiqueListClient />);
		fireEvent.click(screen.getByRole('button', { name: t.common.delete }));
		fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: t.common.delete }));
		await waitFor(() => expect(mockOnError).toHaveBeenCalledWith('Suppression refusée.'));
		expect(mockRefetch).not.toHaveBeenCalled();
		expect(mockOnSuccess).not.toHaveBeenCalled();
	});

	it('submits only selected dossier ids for confirmed bulk deletion', async () => {
		render(<LogistiqueListClient />);
		fireEvent.click(screen.getByRole('button', { name: 'Sélectionner deux dossiers' }));
		fireEvent.click(screen.getByRole('button', { name: t.logistique.bulkDeleteBtn(2) }));
		fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: t.logistique.bulkDeleteBtn(2) }));
		await waitFor(() => expect(mockBulkDelete).toHaveBeenCalledWith({ ids: [7, 8] }));
		expect(mockOnSuccess).toHaveBeenCalledWith(t.logistique.bulkDeleteSuccess(2));
	});
});
