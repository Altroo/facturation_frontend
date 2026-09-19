import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { mockSession } from './stock-test-helpers';
import StockForm from './stock-form';

describe('StockForm', () => {
	it('renders the adjustment fields and Caissier permission', async () => {
		render(<StockForm session={mockSession} company_id={1} />);

		await waitFor(() => expect(screen.getByRole('heading', { name: 'Mouvement de stock' })).toBeInTheDocument());
		expect(screen.getByTestId('stock-form-wrapper')).toHaveAttribute('data-allowed-roles', 'Caissier');
		expect(screen.getByLabelText('Type de mouvement')).toBeInTheDocument();
		expect(screen.getByLabelText('Article')).toBeInTheDocument();
		expect(screen.getByLabelText('Emplacement')).toBeInTheDocument();
		expect(screen.getByLabelText('Quantité signée')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Enregistrer le mouvement' })).toBeInTheDocument();
	});
});
