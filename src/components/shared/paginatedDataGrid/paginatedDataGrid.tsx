'use client';

import React, { Dispatch, SetStateAction, useState, useEffect, useCallback, useRef } from 'react';
import { Badge, Box, Stack, ThemeProvider } from '@mui/material';
import { ViewColumn as ViewColumnIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import type { GridColDef, GridFilterModel } from '@mui/x-data-grid';
import { DataGrid, GridSlotProps, ColumnsPanelTrigger, ToolbarButton, GridLogicOperator } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { getDefaultTheme } from '@/utils/themes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomFilterPanel, {
	CustomFilterModel,
	CustomFilterItem,
	CustomFilterValue,
	DateRangeFilterValue,
	filterHasValue,
} from '@/components/shared/filterPanel/customFilterPanel';

type PaginatedDataGridProps<T> = {
	queryHook?: (params: { page: number; pageSize: number; search: string; [key: string]: string | number }) => {
		data?: { count: number; results: T[] };
		isLoading: boolean;
	};
	data?: { count: number; results: T[] };
	isLoading?: boolean;
	columns: GridColDef[];
	paginationModel: { page: number; pageSize: number };
	setPaginationModel: Dispatch<SetStateAction<{ page: number; pageSize: number }>>;
	searchTerm: string;
	setSearchTerm: Dispatch<SetStateAction<string>>;
	filterModel?: GridFilterModel;
	onFilterModelChange?: (model: GridFilterModel) => void;
	/** Callback emitting backend-ready filter params whenever custom filters change */
	onCustomFilterParamsChange?: (params: Record<string, string>) => void;
	toolbar?: {
		quickFilter?: boolean;
		debounceMs?: number;
	};
	/** Extra toolbar action buttons (CSV import, etc.) shown alongside filter/column buttons */
	toolbarActions?: React.ReactNode;
};

/** Type guard for DateRangeFilterValue */
export function isDateRangeValue(value: CustomFilterValue): value is DateRangeFilterValue {
	return typeof value === 'object' && value !== null && 'from' in value;
}

/** Map frontend operator names to backend query param suffixes */
export function mapOperatorToParam(field: string, operator: string, value: CustomFilterValue): Record<string, string> {
	const params: Record<string, string> = {};
	const strValue = String(value);

	switch (operator) {
		// Text operators
		case 'contains':
			params[`${field}__icontains`] = strValue;
			break;
		case 'equals':
		case '=':
		case 'is':
			params[field] = strValue;
			break;
		case 'startsWith':
			params[`${field}__istartswith`] = strValue;
			break;
		case 'endsWith':
			params[`${field}__iendswith`] = strValue;
			break;
		case 'isEmpty':
			params[`${field}__isempty`] = 'true';
			break;
		case 'isNotEmpty':
			params[`${field}__isempty`] = 'false';
			break;

		// Numeric operators (from createNumericFilterOperators)
		case 'numEquals':
			params[field] = strValue;
			break;
		case 'numNotEquals':
		case '!=':
		case 'ne':
		case 'not':
			params[`${field}__ne`] = strValue;
			break;
		case 'numGreaterThan':
		case '>':
		case 'gt':
			params[`${field}__gt`] = strValue;
			break;
		case 'numGreaterThanOrEqual':
		case '>=':
		case 'gte':
			params[`${field}__gte`] = strValue;
			break;
		case 'numLessThan':
		case '<':
		case 'lt':
			params[`${field}__lt`] = strValue;
			break;
		case 'numLessThanOrEqual':
		case '<=':
		case 'lte':
			params[`${field}__lte`] = strValue;
			break;

		default:
			// Fallback: use operator as suffix
			params[`${field}__${operator}`] = strValue;
	}

	return params;
}

const PaginatedDataGrid = <T,>({
	queryHook,
	data: externalData,
	isLoading: externalIsLoading,
	columns,
	paginationModel,
	setPaginationModel,
	searchTerm,
	setSearchTerm,
	filterModel: externalFilterModel,
	onFilterModelChange,
	onCustomFilterParamsChange,
	toolbar = { quickFilter: true, debounceMs: 500 },
	toolbarActions,
}: PaginatedDataGridProps<T>) => {
	const [internalFilterModel, setInternalFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});

	const filterModel = externalFilterModel ?? internalFilterModel;

	// Custom filters state (bypasses DataGrid's filterModel)
	const [customFilters, setCustomFiltersInternal] = useState<CustomFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});
	const [showCustomFilterPanel, setShowCustomFilterPanel] = useState(false);

	// Wrapped setter that auto-hides panel when all filters are cleared
	const setCustomFilters = useCallback(
		(value: CustomFilterModel | ((prev: CustomFilterModel) => CustomFilterModel)) => {
			setCustomFiltersInternal((prev) => {
				const next = typeof value === 'function' ? value(prev) : value;
				// Auto-hide panel when transitioning from filters to no filters
				if (prev.items.length > 0 && next.items.length === 0) {
					setShowCustomFilterPanel(false);
				}
				return next;
			});
		},
		[],
	);

	// Extract custom filter parameters for backend API
	const extractCustomFilterParams = useCallback((): Record<string, string> => {
		const params: Record<string, string> = {};

		customFilters.items.forEach((item) => {
			// Skip if no value for operators that require one
			if (!filterHasValue(item)) return;

			const field = item.field;
			const operator = item.operator;
			const value = item.value;

			// Handle date range filters specially
			if (isDateRangeValue(value)) {
				if (value.from) params[`${field}_after`] = value.from;
				if (value.to) params[`${field}_before`] = value.to;
				return;
			}

			Object.assign(params, mapOperatorToParam(field, operator, value));
		});

		return params;
	}, [customFilters]);

	// Notify parent when custom filter params change & reset pagination
	const prevParamsRef = useRef<string>('');
	useEffect(() => {
		const params = extractCustomFilterParams();
		const paramsKey = JSON.stringify(params);

		if (paramsKey !== prevParamsRef.current) {
			prevParamsRef.current = paramsKey;
			onCustomFilterParamsChange?.(params);
			// Reset to first page when filters change (skip initial empty state)
			if (paramsKey !== '{}') {
				setPaginationModel((prev) => (prev.page !== 0 ? { ...prev, page: 0 } : prev));
			}
		}
	}, [extractCustomFilterParams, onCustomFilterParamsChange, setPaginationModel]);

	// Count of active (non-empty) filters
	const activeFilterCount = customFilters.items.filter(filterHasValue).length;

	// Use queryHook if provided, otherwise use external data
	const queryResult = queryHook?.({
		page: paginationModel.page + 1,
		pageSize: paginationModel.pageSize,
		search: searchTerm,
		...extractCustomFilterParams(),
	});

	const data = queryResult?.data ?? externalData;
	const isLoading = queryResult?.isLoading ?? externalIsLoading ?? false;

	const rows = data?.results ?? [];

	const handleFilterChange = (model: GridFilterModel) => {
		// Extract quickFilter value for server-side search
		const quickFilterValue = model.quickFilterValues?.join(' ') ?? '';
		setSearchTerm(quickFilterValue);

		const updatedModel: GridFilterModel = {
			items: model.items,
			logicOperator: model.logicOperator,
		};

		if (onFilterModelChange) {
			onFilterModelChange(updatedModel);
		} else if (!externalFilterModel) {
			setInternalFilterModel(updatedModel);
		}
	};

	const handleToggleFilterPanel = () => {
		const isOpening = !showCustomFilterPanel;
		setShowCustomFilterPanel(isOpening);

		// Auto-add first filter when opening if no filters exist
		if (isOpening && customFilters.items.length === 0) {
			const firstFilterableColumn = columns.find((col) => col.field !== 'actions' && col.filterable !== false);
			if (firstFilterableColumn) {
				const newItem: CustomFilterItem = {
					id: `filter-${Date.now()}`,
					field: firstFilterableColumn.field,
					operator: 'contains',
					value: '',
				};
				setCustomFilters({
					...customFilters,
					items: [newItem],
				});
			}
		}
	};

	// Build toolbar mainControls - always show filter button
	const mainControls = (
		<>
			<ColumnsPanelTrigger render={<ToolbarButton />}>
				<ViewColumnIcon fontSize="small" />
			</ColumnsPanelTrigger>
			<ToolbarButton onClick={handleToggleFilterPanel} color={activeFilterCount > 0 ? 'primary' : 'default'}>
				<Badge badgeContent={activeFilterCount} color="primary" max={99}>
					<FilterListIcon fontSize="small" />
				</Badge>
			</ToolbarButton>
			{toolbarActions}
		</>
	);

	return (
		<ThemeProvider theme={getDefaultTheme()}>
			<Stack direction="column" spacing={2} mt="32px" sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
				<Box sx={{ width: '100%', position: 'relative' }}>
					{isLoading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
					<Box
						sx={{
							width: '100%',
							WebkitOverflowScrolling: 'touch',
							overscrollBehavior: 'contain',
							px: { xs: 1, sm: 2, md: 3 },
							mb: { xs: 1, sm: 2, md: 3 },
						}}
					>
						<Box
							sx={{
								width: {
									xs: 'fit-content',
									sm: 'fit-content',
									md: '100%',
									maxWidth: '1600px',
									mx: 'auto',
								},
							}}
						>
							{/* Custom Filter Panel */}
							{showCustomFilterPanel && (
								<Box sx={{ mb: 2 }}>
									<CustomFilterPanel
										columns={columns}
										filterModel={customFilters}
										onChange={setCustomFilters}
									/>
								</Box>
							)}

							<DataGrid
								rows={rows}
								columns={columns}
								loading={isLoading}
								rowCount={data?.count ?? 0}
								paginationMode="server"
								paginationModel={paginationModel}
								onPaginationModelChange={setPaginationModel}
								pageSizeOptions={[5, 10, 25, 50, 100]}
								localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
								disableRowSelectionOnClick
								showToolbar
								slotProps={{
									toolbar: {
										showQuickFilter: toolbar.quickFilter,
										quickFilterProps: { debounceMs: toolbar.debounceMs },
										mainControls,
									} as GridSlotProps['toolbar'],
									panel: {
										sx: {
											'& .MuiDataGrid-paper': {
												minWidth: '800px',
											},
										},
									} as GridSlotProps['panel'] & { sx: object },
								}}
								filterModel={filterModel}
								onFilterModelChange={handleFilterChange}
								sx={{
									height: '100%',
									'& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
									'& .MuiDataGrid-row:hover': { cursor: 'pointer' },
								}}
							/>
						</Box>
					</Box>
				</Box>
			</Stack>
		</ThemeProvider>
	);
};

export default PaginatedDataGrid;
