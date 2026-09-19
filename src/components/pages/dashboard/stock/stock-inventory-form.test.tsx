import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { mockSession } from './stock-test-helpers';
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
});
