import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LinesGrid from './linesGrid';
import type { GridColDef } from '@mui/x-data-grid';

const theme = createTheme();
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('LinesGrid', () => {
	const columns: GridColDef[] = [
		{ field: 'designation', headerName: 'Designation', width: 200 },
		{ field: 'quantity', headerName: 'Quantity', width: 120 },
	];

	const rows = [
		{
			id: 1,
			article: 101,
			article_designation: 'ART-101',
			designation: 'Product A',
			prix_achat: 50,
			devise_prix_achat: 'MAD',
			prix_vente: 75,
			quantity: 2,
			remise_type: '' as const,
			remise: 0,
		},
		{
			id: 2,
			article: 102,
			article_designation: 'ART-102',
			designation: 'Product B',
			prix_achat: 30,
			devise_prix_achat: 'MAD',
			prix_vente: 45,
			quantity: 5,
			remise_type: '' as const,
			remise: 0,
		},
	];

	test('renders title, add button and data grid column headers', () => {
		render(<LinesGrid rows={rows} columns={columns} onAddClick={() => {}} isLoading={false} title="Lignes" />, {
			wrapper: Wrapper,
		});

		expect(screen.getByText('Lignes')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Ajouter article/i })).toBeEnabled();
		expect(screen.getByText('Designation')).toBeInTheDocument();
		expect(screen.getByText('Quantity')).toBeInTheDocument();
	});

	test('calls onAddClick when add button is clicked and respects isLoading', () => {
		const handleAdd = jest.fn();

		const { rerender } = render(
			<LinesGrid rows={rows} columns={columns} onAddClick={handleAdd} isLoading={false} title="Lignes" />,
			{ wrapper: Wrapper },
		);

		const addButton = screen.getByRole('button', { name: /Ajouter article/i });
		expect(addButton).toBeEnabled();

		// Use fireEvent.click to avoid pointer-events blocking in the test environment
		fireEvent.click(addButton);
		expect(handleAdd).toHaveBeenCalledTimes(1);

		// When loading: button should be disabled; do not attempt to click it
		rerender(<LinesGrid rows={rows} columns={columns} onAddClick={handleAdd} isLoading title="Lignes" />);
		const disabledButton = screen.getByRole('button', { name: /Ajouter article/i });
		expect(disabledButton).toBeDisabled();
		// No further click attempted; handler count remains unchanged
		expect(handleAdd).toHaveBeenCalledTimes(1);
	});
});
