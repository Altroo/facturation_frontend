import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaginatedDataGrid from './paginatedDataGrid';
import '@testing-library/jest-dom';
import { GridColDef } from '@mui/x-data-grid';
import { createTheme } from '@mui/material/styles';

// ✅ Mock theme
jest.mock('@/utils/themes', () => ({
	getDefaultTheme: () => createTheme(),
}));

// ✅ Mock loading spinner
jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-progress">Loading...</div>,
}));

type RowType = { id: number; name: string };

describe('PaginatedDataGrid', () => {
	const columns: GridColDef[] = [
		{ field: 'id', headerName: 'ID', width: 100, filterable: true },
		{ field: 'name', headerName: 'Name', width: 200, filterable: true },
	];

	const mockQueryHook = jest.fn();

	const defaultProps = {
		queryHook: mockQueryHook,
		columns,
		paginationModel: { page: 0, pageSize: 5 },
		setPaginationModel: jest.fn(),
		searchTerm: '',
		setSearchTerm: jest.fn(),
		toolbar: { quickFilter: true, debounceMs: 300 },
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders rows when data is returned', () => {
		mockQueryHook.mockReturnValue({
			data: {
				count: 2,
				results: [
					{ id: 1, name: 'Alice' },
					{ id: 2, name: 'Bob' },
				],
			},
			isLoading: false,
		});

		render(<PaginatedDataGrid<RowType> {...defaultProps} />);
		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('Bob')).toBeInTheDocument();
		expect(screen.queryByTestId('api-progress')).not.toBeInTheDocument();
	});

	it('shows loading indicator when isLoading is true', () => {
		mockQueryHook.mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		render(<PaginatedDataGrid<RowType> {...defaultProps} />);
		expect(screen.getByTestId('api-progress')).toBeInTheDocument();
	});

	it('calls queryHook with correct pagination and search', () => {
		mockQueryHook.mockReturnValue({
			data: { count: 0, results: [] },
			isLoading: false,
		});

		render(<PaginatedDataGrid<RowType> {...defaultProps} />);
		expect(mockQueryHook).toHaveBeenCalledWith({
			page: 1,
			pageSize: 5,
			search: '',
		});
	});

	it('updates search term when quick filter changes', async () => {
		const setSearchTermMock = jest.fn();

		mockQueryHook.mockReturnValue({
			data: { count: 0, results: [] },
			isLoading: false,
		});

		render(<PaginatedDataGrid<RowType> {...defaultProps} setSearchTerm={setSearchTermMock} />);

		const input = document.querySelector('input[placeholder="Rechercher…"]');
		expect(input).toBeInTheDocument();
		fireEvent.change(input!, { target: { value: 'test' } });
	});
});
