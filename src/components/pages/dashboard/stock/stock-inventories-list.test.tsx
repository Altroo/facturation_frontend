import React from 'react';
import { render, screen } from '@testing-library/react';
import { mockSession, setMockListRole } from './stock-test-helpers';
import StockInventoriesListClient from './stock-inventories-list';

describe('StockInventoriesListClient', () => {
	it('renders draft inventory data and Caissier actions', () => {
		render(<StockInventoriesListClient session={mockSession} />);

		expect(screen.getByRole('heading', { name: 'Inventaires de stock' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Nouvel inventaire' })).toBeInTheDocument();
		expect(screen.getByTestId('chip-filter-bar')).toHaveAttribute('data-filter-layout', 'auto');
		expect(screen.getByText('Brouillon')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Voir l’inventaire' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Valider l’inventaire' })).toBeInTheDocument();
	});

	it('hides write actions from a read-only role', () => {
		setMockListRole('Lecture');
		render(<StockInventoriesListClient session={mockSession} />);

		expect(screen.queryByRole('button', { name: 'Nouvel inventaire' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Valider l’inventaire' })).not.toBeInTheDocument();
	});
});
