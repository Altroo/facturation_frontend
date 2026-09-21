import React from 'react';
import { render, screen } from '@testing-library/react';
import StockDisabledState from './stock-disabled-state';

describe('StockDisabledState', () => {
	it('renders the established outlined warning state', () => {
		render(<StockDisabledState />);

		expect(screen.getByRole('alert')).toHaveClass('MuiAlert-outlined', 'MuiAlert-colorWarning');
		expect(screen.getByText('Gestion de stock désactivée')).toBeInTheDocument();
		expect(screen.getByText('La gestion de stock est désactivée pour cette entreprise.')).toBeInTheDocument();
	});
});
