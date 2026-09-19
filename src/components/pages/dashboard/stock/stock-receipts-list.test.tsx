import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { mockSession, setMockListRole } from './stock-test-helpers';
import StockReceiptsListClient from './stock-receipts-list';

describe('StockReceiptsListClient', () => {
	it('renders Logistique actions and confirmation modals', () => {
		setMockListRole('Logistique');
		render(<StockReceiptsListClient session={mockSession} />);

		expect(screen.getByRole('button', { name: 'Nouvelle réception' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Valider la réception' }));
		expect(screen.getByRole('dialog', { name: 'Valider la réception' })).toBeInTheDocument();
		expect(screen.getByText(/quantités reçues seront ajoutées au stock/i)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
		fireEvent.click(screen.getByRole('button', { name: 'Annuler la réception' }));
		expect(screen.getByRole('dialog', { name: 'Annuler la réception' })).toBeInTheDocument();
		expect(screen.getByText(/quantités validées seront retirées du stock/i)).toBeInTheDocument();
	});

	it('hides write actions from a read-only role', () => {
		setMockListRole('Lecture');
		render(<StockReceiptsListClient session={mockSession} />);

		expect(screen.queryByRole('button', { name: 'Nouvelle réception' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Valider la réception' })).not.toBeInTheDocument();
	});
});
