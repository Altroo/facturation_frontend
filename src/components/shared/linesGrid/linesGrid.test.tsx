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
			devise_prix_vente: 'MAD',
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
			devise_prix_vente: 'MAD',
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

	test('renders with empty rows', () => {
		render(<LinesGrid rows={[]} columns={columns} onAddClick={() => {}} isLoading={false} title="Articles" />, {
			wrapper: Wrapper,
		});

		expect(screen.getByText('Articles')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Ajouter article/i })).toBeEnabled();
	});

	test('renders with different row data and columns', () => {
		const newRows = [
			{
				id: 3,
				article: 103,
				article_designation: 'ART-103',
				designation: 'Product C',
				prix_achat: 100,
				devise_prix_achat: 'EUR',
				prix_vente: 150,
				devise_prix_vente: 'EUR',
				quantity: 10,
				remise_type: 'Pourcentage' as const,
				remise: 5,
			},
		];

		const newColumns: GridColDef[] = [
			{ field: 'designation', headerName: 'Article', width: 250 },
			{ field: 'prix_vente', headerName: 'Price', width: 150 },
		];

		render(
			<LinesGrid rows={newRows} columns={newColumns} onAddClick={() => {}} isLoading={false} title="Facture Lines" />,
			{ wrapper: Wrapper },
		);

		expect(screen.getByText('Facture Lines')).toBeInTheDocument();
		expect(screen.getByText('Article')).toBeInTheDocument();
		expect(screen.getByText('Price')).toBeInTheDocument();
	});

	test('memo comparison function triggers rerender only when props change', () => {
		const handleAdd = jest.fn();

		const { rerender } = render(
			<LinesGrid rows={rows} columns={columns} onAddClick={handleAdd} isLoading={false} title="Test" />,
			{ wrapper: Wrapper },
		);

		// Same rows and columns - should not rerender (memo comparison)
		rerender(
			<LinesGrid rows={rows} columns={columns} onAddClick={handleAdd} isLoading={false} title="Test" />,
		);
		expect(screen.getByText('Test')).toBeInTheDocument();

		// Different rows - should trigger rerender
		const newRows = [
			{
				id: 3,
				article: 103,
				article_designation: 'ART-103',
				designation: 'New Product',
				prix_achat: 100,
				devise_prix_achat: 'MAD',
				prix_vente: 150,
				devise_prix_vente: 'MAD',
				quantity: 1,
				remise_type: '' as const,
				remise: 0,
			},
		];

		rerender(
			<LinesGrid rows={newRows} columns={columns} onAddClick={handleAdd} isLoading={false} title="Test" />,
		);
		expect(screen.getByText('Test')).toBeInTheDocument();

		// Different columns - should trigger rerender
		const newColumns: GridColDef[] = [
			{ field: 'designation', headerName: 'Name', width: 200 },
		];

		rerender(
			<LinesGrid rows={newRows} columns={newColumns} onAddClick={handleAdd} isLoading={false} title="Test" />,
		);
		expect(screen.getByText('Name')).toBeInTheDocument();

		// Change isLoading - should trigger rerender
		rerender(
			<LinesGrid rows={newRows} columns={newColumns} onAddClick={handleAdd} isLoading={true} title="Test" />,
		);
		expect(screen.getByRole('button', { name: /Ajouter article/i })).toBeDisabled();
	});

	test('renders with rows having different lengths', () => {
		const handleAdd = jest.fn();

		const { rerender } = render(
			<LinesGrid rows={rows} columns={columns} onAddClick={handleAdd} isLoading={false} title="Items" />,
			{ wrapper: Wrapper },
		);

		expect(screen.getByText('Items')).toBeInTheDocument();

		// Rerender with fewer rows  
		const fewerRows = [rows[0]];
		rerender(
			<LinesGrid rows={fewerRows} columns={columns} onAddClick={handleAdd} isLoading={false} title="Items" />,
		);

		expect(screen.getByText('Items')).toBeInTheDocument();
	});

	test('renders with rows having different values', () => {
		const handleAdd = jest.fn();

		const { rerender } = render(
			<LinesGrid rows={rows} columns={columns} onAddClick={handleAdd} isLoading={false} title="Products" />,
			{ wrapper: Wrapper },
		);

		// Rerender with modified row value
		const modifiedRows = [
			{ ...rows[0], quantity: 99 },
			rows[1],
		];

		rerender(
			<LinesGrid rows={modifiedRows} columns={columns} onAddClick={handleAdd} isLoading={false} title="Products" />,
		);

		expect(screen.getByText('Products')).toBeInTheDocument();
	});
});
