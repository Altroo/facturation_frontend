import React from 'react';
import { render, screen } from '@testing-library/react';
import { mockSession, setMockCompanyRole } from './stock-test-helpers';
import StockView from './stock-view';

describe('StockView', () => {
	it('renders stock cards, movement history and the Caissier action', () => {
		render(<StockView session={mockSession} company_id={1} id={4} />);

		expect(screen.getByRole('heading', { name: 'Détails du stock' })).toBeInTheDocument();
		expect(screen.getByText('Physique: 2,000')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Informations du stock' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Historique des mouvements' })).toBeInTheDocument();
		expect(screen.getByTestId('paginated-data-grid')).toHaveAttribute('data-embedded', 'true');
		expect(screen.getByRole('button', { name: 'Ajuster le stock' })).toBeInTheDocument();
	});

	it('hides adjustment actions from a read-only role', () => {
		setMockCompanyRole('Lecture');
		render(<StockView session={mockSession} company_id={1} id={4} />);

		expect(screen.queryByRole('button', { name: 'Ajuster le stock' })).not.toBeInTheDocument();
	});
});
