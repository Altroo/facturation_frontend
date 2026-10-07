import { render, screen, waitFor } from '@testing-library/react';
import { mockSession, setMockInventoryEnabled } from './stock-test-helpers';
import StockInventoryForm from './stock-inventory-form';

describe('StockInventoryForm', () => {
	it('renders the inventory fields and Caissier permission', async () => {
		render(<StockInventoryForm session={mockSession} company_id={1} />);

		await waitFor(() => expect(screen.getByRole('heading', { name: 'Périmètre de l’inventaire' })).toBeInTheDocument());
		expect(screen.getByTestId('stock-form-wrapper')).toHaveAttribute('data-allowed-roles', 'Caissier');
		expect(screen.getByRole('heading', { name: 'Comptage physique' })).toBeInTheDocument();
		expect(screen.getByLabelText('Quantité comptée')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Enregistrer et valider' })).toBeInTheDocument();
	});
	it('explains activation instead of offering an unusable form', () => {
		setMockInventoryEnabled(false);
		render(<StockInventoryForm session={mockSession} company_id={1} />);
		expect(screen.getByText(/Activez-le dans les paramètres de la société/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Enregistrer et valider' })).not.toBeInTheDocument();
	});
});
