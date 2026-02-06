'use client';

import React, { Dispatch, SetStateAction, useState } from 'react';
import { Box, Stack, ThemeProvider } from '@mui/material';
import { ViewColumn as ViewColumnIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import type { GridColDef, GridFilterModel } from '@mui/x-data-grid';
import { DataGrid, GridSlotProps, ColumnsPanelTrigger, FilterPanelTrigger, ToolbarButton, GridLogicOperator } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { getDefaultTheme } from '@/utils/themes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';

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
	toolbar?: {
		quickFilter?: boolean;
		debounceMs?: number;
	};
	toolbarActions?: React.ReactNode;
};

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
	toolbar = { quickFilter: true, debounceMs: 500 },
	toolbarActions,
}: PaginatedDataGridProps<T>) => {
	const [internalFilterModel, setInternalFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});

	const filterModel = externalFilterModel ?? internalFilterModel;

	// Extract date filter parameters from filter model
	const extractDateFilterParams = () => {
		const params: Record<string, string> = {};
		filterModel.items.forEach((item) => {
			if (item.value && typeof item.value === 'object' && 'from' in item.value) {
				const { from, to } = item.value as { from?: string; to?: string };
				const fieldName = item.field;

				if (from) {
					params[`${fieldName}_after`] = from;
				}
				if (to) {
					params[`${fieldName}_before`] = to;
				}
			}
		});
		return params;
	};

	// Use queryHook if provided, otherwise use external data
	const queryResult = queryHook?.({
		page: paginationModel.page + 1,
		pageSize: paginationModel.pageSize,
		search: searchTerm,
		...extractDateFilterParams(),
	});

	const data = queryResult?.data ?? externalData;
	const isLoading = queryResult?.isLoading ?? externalIsLoading ?? false;

	const rows = data?.results ?? [];

	const handleFilterChange = (model: GridFilterModel) => {
		// Extract quickFilter value for server-side search
		// Join all search terms with space since DataGrid splits by spaces
		const quickFilterValue = model.quickFilterValues?.join(' ') ?? '';
		// Update search term for server-side search
		setSearchTerm(quickFilterValue);

		// Don't include quickFilterValues in the updated model to prevent client-side filtering
		// but keep items for column filters (client-side filtering)
		const updatedModel: GridFilterModel = {
			items: model.items,
			logicOperator: model.logicOperator,
		};

		if (onFilterModelChange) {
			onFilterModelChange(updatedModel);
		} else if (!externalFilterModel) {
			// Only update internal state if we're not using external filterModel
			// This prevents "Cannot update during render" warnings when external filterModel is provided
			setInternalFilterModel(updatedModel);
		}
	};

	return (
		<ThemeProvider theme={getDefaultTheme()}>
			<Stack direction="column" spacing={2} mt="32px" sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
				<Box sx={{ width: '100%', position: 'relative', overflow: 'auto' }}>
					{isLoading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}

					<Box
						sx={{
							width: '100%',
							overflowX: 'auto',
							overflowY: 'visible',
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
								showToolbar={toolbar.quickFilter || !!toolbarActions}
								slotProps={{
									toolbar: {
										showQuickFilter: toolbar.quickFilter,
										quickFilterProps: { debounceMs: toolbar.debounceMs },
										...(toolbarActions && {
											mainControls: (
												<>
													<ColumnsPanelTrigger render={<ToolbarButton />}>
														<ViewColumnIcon fontSize="small" />
													</ColumnsPanelTrigger>
													<FilterPanelTrigger render={(triggerProps, state) => (
														<ToolbarButton {...triggerProps} color={state.filterCount > 0 ? 'primary' : 'default'}>
															<FilterListIcon fontSize="small" />
														</ToolbarButton>
													)} />
													{toolbarActions}
												</>
											),
										}),
									} as GridSlotProps['toolbar'],
									panel: {
										sx: {
											'& .MuiDataGrid-paper': {
												minWidth: '800px',
											},
										},
									} as GridSlotProps['panel'] & { sx: never },
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
