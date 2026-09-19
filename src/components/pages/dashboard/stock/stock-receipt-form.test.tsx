import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { mockSession } from './stock-test-helpers';
import StockReceiptForm from './stock-receipt-form';

describe('StockReceiptForm', () => {
	it('renders the receipt fields and Logistique permission', async () => {
		render(<StockReceiptForm session={mockSession} company_id={1} />);

		await waitFor(() => expect(screen.getByRole('heading', { name: 'Dossier logistique' })).toBeInTheDocument());
		expect(screen.getByTestId('stock-form-wrapper')).toHaveAttribute('data-allowed-roles', 'Logistique');
		expect(screen.getByRole('heading', { name: 'Détails de la réception' })).toBeInTheDocument();
		expect(screen.getByLabelText('Article entrant')).toBeDisabled();
		expect(screen.getByLabelText('Quantité reçue')).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Enregistrer et valider' })).toBeInTheDocument();
	});
});
