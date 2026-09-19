import React from 'react';
import { render, screen } from '@testing-library/react';
import { mockSession, setMockCompanyRole } from './stock-test-helpers';
import StockInventoryView from './stock-inventory-view';

describe('StockInventoryView', () => {
	it('renders inventory cards, lines table and validation action', () => {
		render(<StockInventoryView session={mockSession} company_id={1} id={1} />);

		expect(screen.getByRole('heading', { name: 'Informations de l’inventaire' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Suivi de validation' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Lignes comptées' })).toBeInTheDocument();
		expect(screen.getByTestId('mui-data-grid')).toHaveTextContent('Colonnes Filtres Exporter Recherche Pagination');
		expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
	});

	it('hides validation from a read-only role', () => {
		setMockCompanyRole('Lecture');
		render(<StockInventoryView session={mockSession} company_id={1} id={1} />);

		expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument();
	});
});
