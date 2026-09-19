import React from 'react';
import { render, screen } from '@testing-library/react';
import { mockSession } from './stock-test-helpers';
import StockMovementsListClient from './stock-movements-list';

describe('StockMovementsListClient', () => {
	it('renders filters, colored movement data and the view action', () => {
		render(<StockMovementsListClient session={mockSession} />);

		expect(screen.getByRole('heading', { name: 'Mouvements de stock' })).toBeInTheDocument();
		expect(screen.getByTestId('chip-filter-bar')).toHaveTextContent('Emplacement Type de mouvement');
		expect(screen.getByTestId('paginated-data-grid')).toHaveTextContent('Référence');
		expect(screen.getByText('Réception')).toBeInTheDocument();
		expect(screen.getByText('+2,000')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Voir le mouvement' })).toBeInTheDocument();
	});
});
