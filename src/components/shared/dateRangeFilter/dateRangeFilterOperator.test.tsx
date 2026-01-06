import { GridFilterItem, GridColDef } from '@mui/x-data-grid';
import { createDateRangeFilterOperator } from './dateRangeFilterOperator';

describe('dateRangeFilterOperator', () => {
	let mockColumn: GridColDef;

	beforeEach(() => {
		mockColumn = { field: 'date', headerName: 'Date' };
	});

	describe('createDateRangeFilterOperator', () => {
		it('should return an array with one operator', () => {
			const operators = createDateRangeFilterOperator();
			expect(operators).toHaveLength(1);
		});

		it('should return operator with correct properties', () => {
			const operators = createDateRangeFilterOperator();
			const operator = operators[0];
			expect(operator.label).toBe('entre');
			expect(operator.value).toBe('between');
			expect(operator.getApplyFilterFn).toBeDefined();
			expect(operator.InputComponent).toBeDefined();
		});
	});

	describe('getApplyFilterFn', () => {
		const operators = createDateRangeFilterOperator();
		const getApplyFilterFn = operators[0].getApplyFilterFn;

		describe('between operator', () => {
			it('should return null when filterItem.value is undefined', () => {
				const filterItem: GridFilterItem = {
					field: 'date',
					operator: 'between',
					value: undefined,
				};
				const filterFn = getApplyFilterFn(filterItem, mockColumn);
				expect(filterFn).toBeNull();
			});

			it('should return null when filterItem.value is not an object', () => {
				const filterItem: GridFilterItem = {
					field: 'date',
					operator: 'between',
					value: 'invalid',
				};
				const filterFn = getApplyFilterFn(filterItem, mockColumn);
				expect(filterFn).toBeNull();
			});

			it('should return null for server-side filtering with valid date range', () => {
				const filterItem: GridFilterItem = {
					field: 'date',
					operator: 'between',
					value: { from: '2024-01-01', to: '2024-12-31' },
				};
				const filterFn = getApplyFilterFn(filterItem, mockColumn);
				expect(filterFn).toBeNull();
			});

			it('should return null for server-side filtering with only from date', () => {
				const filterItem: GridFilterItem = {
					field: 'date',
					operator: 'between',
					value: { from: '2024-06-01' },
				};
				const filterFn = getApplyFilterFn(filterItem, mockColumn);
				expect(filterFn).toBeNull();
			});

			it('should return null for server-side filtering with only to date', () => {
				const filterItem: GridFilterItem = {
					field: 'date',
					operator: 'between',
					value: { to: '2024-06-30' },
				};
				const filterFn = getApplyFilterFn(filterItem, mockColumn);
				expect(filterFn).toBeNull();
			});

			it('should return null for server-side filtering with empty value object', () => {
				const filterItem: GridFilterItem = {
					field: 'date',
					operator: 'between',
					value: {},
				};
				const filterFn = getApplyFilterFn(filterItem, mockColumn);
				expect(filterFn).toBeNull();
			});
		});

		describe('InputComponent', () => {
			const operators = createDateRangeFilterOperator();
			const InputComponent = operators[0].InputComponent;

			it('should be defined', () => {
				expect(InputComponent).toBeDefined();
				expect(typeof InputComponent).toBe('function');
			});
		});
	});
});
