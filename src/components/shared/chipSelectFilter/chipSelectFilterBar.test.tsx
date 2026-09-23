import { type ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ChipSelectFilterBar from './chipSelectFilterBar';
import type { ChipFilterConfig } from '@/types/uiTypes';
import '@testing-library/jest-dom';

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

const filters: ChipFilterConfig[] = [
	{
		key: 'categorie',
		label: 'Catégorie',
		paramName: 'categorie_ids',
		options: [
			{ id: 1, nom: 'Céramique' },
			{ id: 2, nom: 'Bois' },
		],
	},
	{
		key: 'marque',
		label: 'Marque',
		paramName: 'marque_ids',
		options: [
			{ id: 10, nom: 'Marque A' },
			{ id: 20, nom: 'Marque B' },
		],
	},
];

describe('ChipSelectFilterBar component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders all filter labels', () => {
		renderWithTheme(<ChipSelectFilterBar filters={filters} onFilterChange={jest.fn()} />);
		expect(screen.getByText('Catégorie')).toBeInTheDocument();
		expect(screen.getByText('Marque')).toBeInTheDocument();
	});

	it('renders nothing when filters array is empty', () => {
		const { container } = renderWithTheme(<ChipSelectFilterBar filters={[]} onFilterChange={jest.fn()} />);
		expect(container.firstChild).toBeNull();
	});

	it('calls onFilterChange with empty params initially', () => {
		const onFilterChange = jest.fn();
		renderWithTheme(<ChipSelectFilterBar filters={filters} onFilterChange={onFilterChange} />);
		// Initially no filter is selected, so onFilterChange is deduplicated
		expect(onFilterChange).not.toHaveBeenCalled();
	});

	it('renders correct number of autocomplete inputs', () => {
		renderWithTheme(<ChipSelectFilterBar filters={filters} onFilterChange={jest.fn()} />);
		const inputs = screen.getAllByRole('combobox');
		expect(inputs).toHaveLength(2);
	});

	it('uses the latest callback when a filter changes after rerender', () => {
		const firstCallback = jest.fn();
		const latestCallback = jest.fn();
		const { rerender } = renderWithTheme(<ChipSelectFilterBar filters={filters} onFilterChange={firstCallback} />);
		rerender(
			<ThemeProvider theme={createTheme()}>
				<ChipSelectFilterBar filters={filters} onFilterChange={latestCallback} />
			</ThemeProvider>,
		);

		fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
		fireEvent.click(screen.getByText('Céramique'));

		expect(firstCallback).not.toHaveBeenCalled();
		expect(latestCallback).toHaveBeenCalledWith({ categorie_ids: '1' });
	});
});
