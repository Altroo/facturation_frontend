import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useDeleteLogistiqueSupplierMutation } from '@/store/services/logistique';
import type { LogistiqueSupplier } from '@/types/logistiqueTypes';
import { translations } from '@/translations';
import SupplierDeleteDialog from './logistique-supplier-delete-dialog';

const mockOnSuccess = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ t: jest.requireActual('@/translations').translations.fr }),
	useToast: () => ({ onSuccess: mockOnSuccess }),
}));
jest.mock('@/store/services/logistique', () => ({ useDeleteLogistiqueSupplierMutation: jest.fn() }));

const supplier: LogistiqueSupplier = {
	id: 7,
	company: 12,
	nom: 'Fournisseur Test',
	email: 'supplier@example.com',
	fournisseur: 'Fournisseur Test',
	fournisseur_email: 'supplier@example.com',
	total_dossiers: 0,
	date_created: '2026-10-01',
	date_updated: '2026-10-01',
	derniere_activite: '',
};
const t = translations.fr;
const mockUnwrap = jest.fn();
const mockRemove = jest.fn(() => ({ unwrap: mockUnwrap }));
const onClose = jest.fn();
const onDeleted = jest.fn();
const beforeDelete = jest.fn();
const props = { supplier, onClose, onDeleted, beforeDelete };

beforeEach(() => {
	jest.clearAllMocks();
	mockUnwrap.mockResolvedValue(undefined);
	(useDeleteLogistiqueSupplierMutation as jest.Mock).mockReturnValue([mockRemove, { isLoading: false }]);
});

describe('SupplierDeleteDialog', () => {
	it('blocks deletion of a supplier linked to dossiers and allows closing the notice', () => {
		render(<SupplierDeleteDialog {...props} supplier={{ ...supplier, total_dossiers: 2 }} />);

		expect(screen.getByText(t.logistique.supplierInUse)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: t.common.delete })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: t.common.close }));
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(mockRemove).not.toHaveBeenCalled();
		expect(beforeDelete).not.toHaveBeenCalled();
	});

	it('cancels without deleting the supplier', () => {
		render(<SupplierDeleteDialog {...props} />);

		fireEvent.click(screen.getByRole('button', { name: t.common.cancel }));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(mockRemove).not.toHaveBeenCalled();
	});

	it('deletes within the supplier company and reports success after completion', async () => {
		render(<SupplierDeleteDialog {...props} />);

		fireEvent.click(screen.getByRole('button', { name: t.common.delete }));

		expect(beforeDelete).toHaveBeenCalledTimes(1);
		expect(mockRemove).toHaveBeenCalledWith({ id: 7, company_id: 12 });
		await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
		expect(mockOnSuccess).toHaveBeenCalledWith(t.logistique.supplierDeleted);
		expect(onClose).not.toHaveBeenCalled();
	});

	it('keeps the dialog open on an API failure and allows retrying', async () => {
		mockUnwrap.mockRejectedValueOnce({ data: { details: { detail: ['Suppression refusée.'] } } });
		render(<SupplierDeleteDialog {...props} />);

		fireEvent.click(screen.getByRole('button', { name: t.common.delete }));

		expect(await screen.findByRole('alert')).toHaveTextContent('Suppression refusée.');
		expect(onDeleted).not.toHaveBeenCalled();
		expect(mockOnSuccess).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: t.common.delete }));
		await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('disables actions and ignores Escape while deletion is pending', () => {
		(useDeleteLogistiqueSupplierMutation as jest.Mock).mockReturnValue([mockRemove, { isLoading: true }]);
		render(<SupplierDeleteDialog {...props} />);

		expect(screen.getByRole('button', { name: t.common.loading })).toBeDisabled();
		expect(screen.getByRole('button', { name: t.common.cancel })).toBeDisabled();
		fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
		expect(onClose).not.toHaveBeenCalled();
		expect(mockRemove).not.toHaveBeenCalled();
	});
});
