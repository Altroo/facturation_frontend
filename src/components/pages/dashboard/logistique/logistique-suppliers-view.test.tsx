import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { GridRenderCellParams } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetLogistiqueListQuery, useGetLogistiqueSupplierQuery } from '@/store/services/logistique';
import type { LogistiqueOrder, LogistiqueSupplierDeleteDialogProps } from '@/types/logistiqueTypes';
import type { PaginatedDataGridProps } from '@/types/uiTypes';
import { useAppSelector } from '@/utils/hooks';
import { LOGISTIQUE_SUPPLIERS, LOGISTIQUE_SUPPLIER_EDIT, LOGISTIQUE_VIEW } from '@/utils/routes';
import { translations } from '@/translations';
import LogistiqueSuppliersView from './logistique-suppliers-view';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, replace: mockReplace }),
	useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: jest.fn() }));
jest.mock('@/store/selectors', () => ({ getUserCompaniesState: jest.fn() }));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
	useLanguage: () => ({ t: jest.requireActual('@/translations').translations.fr }),
}));
jest.mock('@/store/services/logistique', () => ({
	useGetLogistiqueSupplierQuery: jest.fn(),
	useGetLogistiqueListQuery: jest.fn(),
}));
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ title, children }: { title: string; children: ReactNode }) => (
		<>
			<h1>{title}</h1>
			{children}
		</>
	),
}));
jest.mock('@/components/shared/noPermission/noPermission', () => ({
	__esModule: true,
	default: () => <p>Accès refusé</p>,
}));
jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div role="progressbar" />,
}));
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({ data, columns, searchTerm, setSearchTerm }: PaginatedDataGridProps<LogistiqueOrder>) => (
		<div>
			<input
				aria-label="Recherche de dossiers"
				value={searchTerm}
				onChange={(event) => setSearchTerm(event.target.value)}
			/>
			{data?.results.map((row) => (
				<div key={row.id}>
					{row.numero_commande}
					{columns.find((column) => column.field === 'actions')?.renderCell?.({ row } as GridRenderCellParams)}
				</div>
			))}
		</div>
	),
}));
jest.mock('./logistique-supplier-delete-dialog', () => ({
	__esModule: true,
	default: ({ supplier, onClose, onDeleted }: LogistiqueSupplierDeleteDialogProps) => (
		<div role="dialog" aria-label={supplier.nom}>
			<button onClick={onClose}>Annuler la suppression</button>
			<button onClick={onDeleted}>Confirmer la suppression</button>
		</div>
	),
}));

const t = translations.fr;
const supplier = { id: 7, company: 12, nom: 'Fournisseur Test', email: 'supplier@example.com', total_dossiers: 2 };
const mockRefetch = jest.fn();
const mockRefetchDossiers = jest.fn();
const props = { company_id: 12, id: 7 };

beforeEach(() => {
	jest.clearAllMocks();
	window.history.replaceState(null, '', '/dashboard/logistique/fournisseurs/7?company_id=12&page=3');
	window.sessionStorage.clear();
	(useInitAccessToken as jest.Mock).mockReturnValue('token');
	(useAppSelector as jest.Mock).mockReturnValue([{ id: 12, role: 'Caissier' }]);
	(useGetLogistiqueSupplierQuery as jest.Mock).mockReturnValue({ currentData: supplier, refetch: mockRefetch });
	(useGetLogistiqueListQuery as jest.Mock).mockReturnValue({
		currentData: { count: 1, results: [{ id: 42, numero_commande: 'LOG-042' }] },
		refetch: mockRefetchDossiers,
	});
});

describe('LogistiqueSuppliersView', () => {
	it('shows the supplier identity, email link, and company-scoped dossiers', () => {
		render(<LogistiqueSuppliersView {...props} />);

		expect(screen.getByText(supplier.nom)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: supplier.email })).toHaveAttribute('href', `mailto:${supplier.email}`);
		expect(screen.getByText(`${t.logistique.supplierDossiers} (2)`)).toBeInTheDocument();
		expect(useGetLogistiqueSupplierQuery).toHaveBeenCalledWith({ id: 7, company_id: 12 }, { skip: false });
		expect(useGetLogistiqueListQuery).toHaveBeenCalledWith(
			expect.objectContaining({ company_id: 12, fournisseur_record: 7, page: 3 }),
		);
	});

	it('shows a dash for an absent optional email', () => {
		(useGetLogistiqueSupplierQuery as jest.Mock).mockReturnValue({ currentData: { ...supplier, email: '' } });
		render(<LogistiqueSuppliersView {...props} />);

		expect(screen.getByText('-')).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	it.each(['Caissier', 'Commercial', 'Logistique', 'Lecture'])(
		'keeps supplier actions consistent with the %s role',
		(role) => {
			(useAppSelector as jest.Mock).mockReturnValue([{ id: 12, role }]);
			render(<LogistiqueSuppliersView {...props} />);

			expect(screen.queryByRole('button', { name: t.common.edit }) !== null).toBe(role !== 'Lecture');
			expect(screen.queryByRole('button', { name: t.common.delete }) !== null).toBe(role === 'Caissier');
		},
	);

	it('waits for authentication without requesting dossiers or showing actions', () => {
		(useInitAccessToken as jest.Mock).mockReturnValue(undefined);
		(useGetLogistiqueSupplierQuery as jest.Mock).mockReturnValue({});
		render(<LogistiqueSuppliersView {...props} />);

		expect(screen.getByRole('progressbar')).toBeInTheDocument();
		expect(useGetLogistiqueSupplierQuery).toHaveBeenCalledWith({ id: 7, company_id: 12 }, { skip: true });
		expect(useGetLogistiqueListQuery).not.toHaveBeenCalled();
		expect(screen.queryByRole('button', { name: t.common.edit })).not.toBeInTheDocument();
	});

	it('does not render supplier dossiers outside the user company memberships', () => {
		(useAppSelector as jest.Mock).mockReturnValue([{ id: 34, role: 'Caissier' }]);
		render(<LogistiqueSuppliersView {...props} />);

		expect(screen.getByText('Accès refusé')).toBeInTheDocument();
		expect(useGetLogistiqueListQuery).not.toHaveBeenCalled();
		expect(screen.queryByRole('button', { name: t.common.delete })).not.toBeInTheDocument();
	});

	it('keeps company scope when navigating back, editing, and opening a dossier', () => {
		render(<LogistiqueSuppliersView {...props} />);
		fireEvent.click(screen.getByRole('button', { name: t.logistique.supplierBackToList }));
		expect(mockPush).toHaveBeenLastCalledWith(`${LOGISTIQUE_SUPPLIERS}?company_id=12`);
		fireEvent.click(screen.getByRole('button', { name: t.common.edit }));
		expect(mockPush).toHaveBeenLastCalledWith(LOGISTIQUE_SUPPLIER_EDIT(7, 12));
		fireEvent.click(screen.getByRole('button', { name: t.common.view }));
		expect(mockPush).toHaveBeenLastCalledWith(LOGISTIQUE_VIEW(42, 12));
	});

	it('resets dossier pagination when searching within the supplier', () => {
		render(<LogistiqueSuppliersView {...props} />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Recherche de dossiers' }), { target: { value: 'LOG' } });

		expect(useGetLogistiqueListQuery).toHaveBeenLastCalledWith(
			expect.objectContaining({ company_id: 12, fournisseur_record: 7, page: 1, search: 'LOG' }),
		);
	});

	it('offers a retry for a failed supplier load and hides stale actions', () => {
		(useGetLogistiqueSupplierQuery as jest.Mock).mockReturnValue({
			currentData: supplier,
			error: { status: 500 },
			refetch: mockRefetch,
		});
		render(<LogistiqueSuppliersView {...props} />);

		expect(screen.getByRole('alert')).toHaveTextContent(t.logistique.supplierLoadError);
		expect(screen.queryByRole('button', { name: t.common.edit })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: t.common.retry }));
		expect(mockRefetch).toHaveBeenCalledTimes(1);
	});

	it('retries failed dossier loading independently of the supplier identity', () => {
		(useGetLogistiqueListQuery as jest.Mock).mockReturnValue({ error: { status: 500 }, refetch: mockRefetchDossiers });
		render(<LogistiqueSuppliersView {...props} />);

		expect(screen.getByText(supplier.nom)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: t.common.retry }));
		expect(mockRefetchDossiers).toHaveBeenCalledTimes(1);
	});

	it('allows cancelling deletion and returns to the company list after successful deletion', () => {
		render(<LogistiqueSuppliersView {...props} />);
		fireEvent.click(screen.getByRole('button', { name: t.common.delete }));
		expect(screen.getByRole('dialog', { name: supplier.nom })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Annuler la suppression' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(mockReplace).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: t.common.delete }));
		fireEvent.click(screen.getByRole('button', { name: 'Confirmer la suppression' }));
		expect(mockReplace).toHaveBeenCalledWith(`${LOGISTIQUE_SUPPLIERS}?company_id=12`);
	});
});
