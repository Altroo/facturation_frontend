import { fireEvent, render, screen, within } from '@testing-library/react';
import type { GridRenderCellParams } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetLogistiqueSuppliersQuery } from '@/store/services/logistique';
import type { CompanyDocumentsListProps } from '@/types/companyDocumentsTypes';
import type { LogistiqueSupplier, LogistiqueSupplierDeleteDialogProps } from '@/types/logistiqueTypes';
import type { PaginatedDataGridProps } from '@/types/uiTypes';
import { LOGISTIQUE_SUPPLIER_ADD, LOGISTIQUE_SUPPLIER_EDIT, LOGISTIQUE_SUPPLIER_VIEW } from '@/utils/routes';
import { translations } from '@/translations';
import LogistiqueSuppliers from './logistique-suppliers-list';

const mockPush = jest.fn();
let mockCompany = { company_id: 12, role: 'Caissier', raison_sociale: 'Société Test' };
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: jest.fn() }));
jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ t: jest.requireActual('@/translations').translations.fr }),
}));
jest.mock('@/store/services/logistique', () => ({ useGetLogistiqueSuppliersQuery: jest.fn() }));
jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => ({
	__esModule: true,
	default: ({ title, children }: CompanyDocumentsListProps) => (
		<>
			<h1>{title}</h1>
			{children(mockCompany)}
		</>
	),
}));
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({
		data,
		isLoading,
		columns,
		searchTerm,
		setSearchTerm,
		onCustomFilterParamsChange,
	}: PaginatedDataGridProps<LogistiqueSupplier>) => (
		<div aria-label="Fournisseurs" aria-busy={isLoading}>
			<input aria-label="Recherche" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
			<button onClick={() => onCustomFilterParamsChange?.({ total_dossiers__gte: '2' })}>Filtrer les dossiers</button>
			{data?.results.map((row) => (
				<div key={row.id} data-testid={`supplier-${row.id}`}>
					{row.nom}
					{columns.find((column) => column.field === 'actions')?.renderCell?.({ row } as GridRenderCellParams)}
				</div>
			))}
		</div>
	),
}));
jest.mock('./logistique-supplier-delete-dialog', () => ({
	__esModule: true,
	default: ({ supplier, onClose, beforeDelete, onDeleted }: LogistiqueSupplierDeleteDialogProps) => (
		<div role="dialog" aria-label={supplier.nom}>
			<button onClick={onClose}>Annuler la suppression</button>
			<button
				onClick={() => {
					beforeDelete?.();
					onDeleted();
				}}
			>
				Confirmer la suppression
			</button>
		</div>
	),
}));

const t = translations.fr;
const supplier = { id: 7, company: 12, nom: 'Fournisseur Test', email: 'supplier@example.com', total_dossiers: 0 };

beforeEach(() => {
	jest.clearAllMocks();
	window.history.replaceState(null, '', '/dashboard/logistique/fournisseurs?company_id=12&page=4&ordering=-nom');
	window.sessionStorage.clear();
	mockCompany = { company_id: 12, role: 'Caissier', raison_sociale: 'Société Test' };
	(useInitAccessToken as jest.Mock).mockReturnValue('token');
	(useGetLogistiqueSuppliersQuery as jest.Mock).mockReturnValue({
		currentData: { count: 1, results: [supplier] },
		isFetching: false,
	});
});

describe('LogistiqueSuppliers', () => {
	it('loads the selected company, URL pagination, and sorting', () => {
		render(<LogistiqueSuppliers />);

		expect(screen.getByRole('heading')).toHaveTextContent(t.navigation.logistiqueSuppliers);
		expect(screen.getByText(supplier.nom)).toBeInTheDocument();
		expect(useGetLogistiqueSuppliersQuery).toHaveBeenLastCalledWith(
			{ company_id: 12, with_pagination: true, page: 4, pageSize: 10, ordering: '-nom', search: '' },
			{ skip: false },
		);
	});

	it('skips requests until the access token is ready', () => {
		(useInitAccessToken as jest.Mock).mockReturnValue(undefined);
		render(<LogistiqueSuppliers />);

		expect(useGetLogistiqueSuppliersQuery).toHaveBeenCalledWith(expect.any(Object), { skip: true });
		expect(screen.getByLabelText('Fournisseurs')).toHaveAttribute('aria-busy', 'true');
	});

	it.each(['Caissier', 'Commercial', 'Logistique'])('allows %s to add and edit suppliers', (role) => {
		mockCompany.role = role;
		render(<LogistiqueSuppliers />);

		fireEvent.click(screen.getByRole('button', { name: t.logistique.supplierNew }));
		expect(mockPush).toHaveBeenLastCalledWith(LOGISTIQUE_SUPPLIER_ADD(12));
		fireEvent.click(screen.getByRole('button', { name: t.common.edit }));
		expect(mockPush).toHaveBeenLastCalledWith(LOGISTIQUE_SUPPLIER_EDIT(7, 12));
		expect(screen.queryByRole('button', { name: t.common.delete }) !== null).toBe(role === 'Caissier');
	});

	it('restricts read-only users to viewing supplier details', () => {
		mockCompany.role = 'Lecture';
		render(<LogistiqueSuppliers />);

		expect(screen.queryByRole('button', { name: t.logistique.supplierNew })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: t.common.edit })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: t.common.delete })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: t.common.view }));
		expect(mockPush).toHaveBeenCalledWith(LOGISTIQUE_SUPPLIER_VIEW(7, 12));
	});

	it('resets pagination when searching and applying filters', () => {
		render(<LogistiqueSuppliers />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Recherche' }), { target: { value: 'Test' } });
		fireEvent.click(screen.getByRole('button', { name: 'Filtrer les dossiers' }));

		expect(useGetLogistiqueSuppliersQuery).toHaveBeenLastCalledWith(
			expect.objectContaining({ company_id: 12, page: 1, search: 'Test', total_dossiers__gte: '2', ordering: '-nom' }),
			{ skip: false },
		);
	});

	it('closes the deletion dialog after confirmation and resets pagination', () => {
		render(<LogistiqueSuppliers />);
		fireEvent.click(screen.getByRole('button', { name: t.common.delete }));
		expect(screen.getByRole('dialog', { name: supplier.nom })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Confirmer la suppression' }));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(useGetLogistiqueSuppliersQuery).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }), {
			skip: false,
		});
	});

	it('clears search, filters, and deletion state when the selected company changes', () => {
		const { rerender } = render(<LogistiqueSuppliers />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Recherche' }), { target: { value: 'Test' } });
		fireEvent.click(screen.getByRole('button', { name: 'Filtrer les dossiers' }));
		fireEvent.click(screen.getByRole('button', { name: t.common.delete }));
		mockCompany = { ...mockCompany, company_id: 34 };
		rerender(<LogistiqueSuppliers />);

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Recherche' })).toHaveValue('');
		const [params] = (useGetLogistiqueSuppliersQuery as jest.Mock).mock.calls.at(-1)!;
		expect(params).toMatchObject({ company_id: 34, search: '' });
		expect(params).not.toHaveProperty('total_dossiers__gte');
	});

	it('shows the API error instead of stale rows', () => {
		(useGetLogistiqueSuppliersQuery as jest.Mock).mockReturnValue({
			currentData: { count: 1, results: [supplier] },
			error: { data: { details: { detail: ['Accès interdit.'] } } },
		});
		render(<LogistiqueSuppliers />);

		expect(within(screen.getByRole('alert')).getByText('Accès interdit.')).toBeInTheDocument();
		expect(screen.queryByText(supplier.nom)).not.toBeInTheDocument();
	});
});
