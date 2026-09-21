import React from 'react';
import { render, screen } from '@testing-library/react';
import { mockSession, setMockListRole } from './stock-test-helpers';
import StockListClient from './stock-list';

describe('StockListClient', () => {
	it('renders filters, reference-first data, status and Caissier actions', () => {
		render(<StockListClient session={mockSession} />);

		expect(screen.getByRole('heading', { name: 'État du stock' })).toBeInTheDocument();
		expect(screen.getAllByRole('button', { name: 'Ajuster le stock' })).toHaveLength(2);
		expect(screen.getByTestId('chip-filter-bar')).toHaveTextContent('Emplacement État du stock');
		expect(screen.getByTestId('chip-filter-bar')).toHaveAttribute('data-filter-layout', 'auto');
		expect(screen.getByTestId('paginated-data-grid')).toHaveTextContent('Référence');
		expect(screen.getByTestId('paginated-data-grid')).toHaveTextContent('Recherche');
		expect(screen.getByText('À approvisionner')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Voir le stock' })).toBeInTheDocument();
	});

	it('hides adjustment actions from a read-only role', () => {
		setMockListRole('Lecture');
		render(<StockListClient session={mockSession} />);

		expect(screen.queryByRole('button', { name: 'Ajuster le stock' })).not.toBeInTheDocument();
	});
});
