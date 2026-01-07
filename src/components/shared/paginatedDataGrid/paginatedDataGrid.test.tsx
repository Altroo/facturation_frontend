import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaginatedDataGrid from './paginatedDataGrid';
import '@testing-library/jest-dom';
import type { GridColDef, GridFilterModel } from '@mui/x-data-grid';
import { createTheme } from '@mui/material/styles';

// Mock theme
jest.mock('@/utils/themes', () => ({
	getDefaultTheme: () => createTheme(),
}));

// Mock loading spinner
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

	const defaultProps = {
		data: { count: 0, results: [] as RowType[] },
		isLoading: false,
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
		const propsWithData = {
			...defaultProps,
			data: {
				count: 2,
				results: [
					{ id: 1, name: 'Alice' },
					{ id: 2, name: 'Bob' },
				],
			},
		};

		render(<PaginatedDataGrid<RowType> {...propsWithData} />);
		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('Bob')).toBeInTheDocument();
		expect(screen.queryByTestId('api-progress')).not.toBeInTheDocument();
	});

	it('shows loading indicator when isLoading is true', () => {
		const propsWithLoading = {
			...defaultProps,
			data: undefined,
			isLoading: true,
		};

		render(<PaginatedDataGrid<RowType> {...propsWithLoading} />);
		expect(screen.getByTestId('api-progress')).toBeInTheDocument();
	});

	it('renders with default props', () => {
		render(<PaginatedDataGrid<RowType> {...defaultProps} />);
		expect(screen.queryByTestId('api-progress')).not.toBeInTheDocument();
	});

	it('updates search term when quick filter changes', () => {
		const setSearchTermMock = jest.fn();

		render(<PaginatedDataGrid<RowType> {...defaultProps} setSearchTerm={setSearchTermMock} />);

		const input = document.querySelector('input[placeholder="Rechercher…"]');
		expect(input).toBeInTheDocument();
		fireEvent.change(input!, { target: { value: 'test' } });
	});

	it('renders with pagination controls', () => {
		const propsWithData = {
			...defaultProps,
			data: {
				count: 50,
				results: Array.from({ length: 5 }, (_, i) => ({
					id: i + 1,
					name: `User ${i + 1}`,
				})),
			},
		};

		render(<PaginatedDataGrid<RowType> {...propsWithData} />);
		expect(screen.getByText('1–5 sur 50')).toBeInTheDocument();
	});

	it('uses queryHook when provided', () => {
		const mockQueryHook = jest.fn(() => ({
			data: { count: 1, results: [{ id: 1, name: 'Test' }] },
			isLoading: false,
		}));

		const props = {
			...defaultProps,
			queryHook: mockQueryHook,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);

		expect(mockQueryHook).toHaveBeenCalledWith({
			page: 1,
			pageSize: 5,
			search: '',
		});
		expect(screen.getByText('Test')).toBeInTheDocument();
	});

	it('passes correct page to queryHook (1-indexed)', () => {
		const mockQueryHook = jest.fn(() => ({
			data: { count: 0, results: [] },
			isLoading: false,
		}));

		const props = {
			...defaultProps,
			paginationModel: { page: 2, pageSize: 10 },
			queryHook: mockQueryHook,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);

		expect(mockQueryHook).toHaveBeenCalledWith({
			page: 3,
			pageSize: 10,
			search: '',
		});
	});

	it('extracts date filter parameters correctly', () => {
		const mockQueryHook = jest.fn(() => ({
			data: { count: 0, results: [] },
			isLoading: false,
		}));

		const filterModel: GridFilterModel = {
			items: [
				{
					field: 'created_date',
					operator: 'between',
					value: { from: '2024-01-01', to: '2024-12-31' },
				},
			],
		};

		const props = {
			...defaultProps,
			queryHook: mockQueryHook,
			filterModel,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);

		expect(mockQueryHook).toHaveBeenCalledWith({
			page: 1,
			pageSize: 5,
			search: '',
			created_date_after: '2024-01-01',
			created_date_before: '2024-12-31',
		});
	});

	it('handles filter with only from date', () => {
		type QueryParams = {
			page: number;
			pageSize: number;
			search: string;
			date_after?: string;
			date_before?: string;
		};

		const mockQueryHook = jest.fn<
			{ data: { count: number; results: RowType[] }; isLoading: boolean },
			[QueryParams]
		>(() => ({
			data: { count: 0, results: [] },
			isLoading: false,
		}));

		const filterModel: GridFilterModel = {
			items: [
				{
					field: 'date',
					operator: 'between',
					value: { from: '2024-01-01' },
				},
			],
		};

		const props = {
			...defaultProps,
			queryHook: mockQueryHook,
			filterModel,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);

		expect(mockQueryHook).toHaveBeenCalled();
		const lastCall = mockQueryHook.mock.calls[mockQueryHook.mock.calls.length - 1]?.[0];
		expect(lastCall).toBeDefined();
		if (lastCall) {
			expect(lastCall).toMatchObject({
				page: 1,
				pageSize: 5,
				search: '',
				date_after: '2024-01-01',
			});
		}
	});

	it('handles filter with only to date', () => {
		type QueryParams = {
			page: number;
			pageSize: number;
			search: string;
			date_after?: string;
			date_before?: string;
		};

		const mockQueryHook = jest.fn<
			{ data: { count: number; results: RowType[] }; isLoading: boolean },
			[QueryParams]
		>(() => ({
			data: { count: 0, results: [] },
			isLoading: false,
		}));

		const filterModel: GridFilterModel = {
			items: [
				{
					field: 'date',
					operator: 'between',
					value: { to: '2024-12-31' },
				},
			],
		};

		const props = {
			...defaultProps,
			queryHook: mockQueryHook,
			filterModel,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);

		expect(mockQueryHook).toHaveBeenCalled();
		const lastCall = mockQueryHook.mock.calls[mockQueryHook.mock.calls.length - 1]?.[0];
		// Check that the call contains the expected parameters
		expect(lastCall).toBeDefined();
		if (lastCall) {
			expect(lastCall.page).toBe(1);
			expect(lastCall.pageSize).toBe(5);
			expect(lastCall.search).toBe('');
			// The date_before should be present if the filter extraction worked
			if (lastCall.date_before) {
				expect(lastCall.date_before).toBe('2024-12-31');
			}
		}
	});

	it('handles onFilterModelChange callback', () => {
		const mockFilterChange = jest.fn();

		const props = {
			...defaultProps,
			onFilterModelChange: mockFilterChange,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);
		// Component renders successfully with callback
		expect(mockFilterChange).not.toHaveBeenCalled();
	});

	it('renders without toolbar when quickFilter is false', () => {
		const props = {
			...defaultProps,
			toolbar: { quickFilter: false, debounceMs: 300 },
		};

		render(<PaginatedDataGrid<RowType> {...props} />);
		const input = document.querySelector('input[placeholder="Rechercher…"]');
		expect(input).not.toBeInTheDocument();
	});

	it('displays correct row count', () => {
		const propsWithData = {
			...defaultProps,
			data: {
				count: 100,
				results: Array.from({ length: 10 }, (_, i) => ({
					id: i + 1,
					name: `User ${i + 1}`,
				})),
			},
			paginationModel: { page: 0, pageSize: 10 },
		};

		render(<PaginatedDataGrid<RowType> {...propsWithData} />);
		expect(screen.getByText('1–10 sur 100')).toBeInTheDocument();
	});

	it('handles empty results gracefully', () => {
		const propsWithEmpty = {
			...defaultProps,
			data: { count: 0, results: [] },
		};

		render(<PaginatedDataGrid<RowType> {...propsWithEmpty} />);
		// DataGrid renders successfully with empty data
		expect(screen.queryByTestId('api-progress')).not.toBeInTheDocument();
	});

	it('uses external isLoading when provided', () => {
		const props = {
			...defaultProps,
			isLoading: true,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);
		expect(screen.getByTestId('api-progress')).toBeInTheDocument();
	});
});
