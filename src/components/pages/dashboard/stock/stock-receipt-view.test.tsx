import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mockSession, mockValidateReceipt, setMockCompanyRole } from './stock-test-helpers';
import StockReceiptView from './stock-receipt-view';

describe('StockReceiptView', () => {
	it('renders receipt cards and confirms validation for Logistique', async () => {
		setMockCompanyRole('Logistique');
		render(<StockReceiptView session={mockSession} company_id={1} id={14} />);

		expect(screen.getByRole('heading', { name: 'Informations de réception' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Suivi de validation' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Articles reçus' })).toBeInTheDocument();
		expect(screen.getByTestId('mui-data-grid')).toHaveTextContent('Colonnes Filtres Exporter Recherche Pagination');
		fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
		expect(screen.getByRole('dialog', { name: 'Valider la réception' })).toBeInTheDocument();
		fireEvent.click(screen.getAllByRole('button', { name: 'Valider' }).at(-1)!);
		await waitFor(() => expect(mockValidateReceipt).toHaveBeenCalledWith({ company_id: 1, id: 14 }));
	});

	it('hides write actions from a read-only role', () => {
		setMockCompanyRole('Lecture');
		render(<StockReceiptView session={mockSession} company_id={1} id={14} />);

		expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument();
	});
});
