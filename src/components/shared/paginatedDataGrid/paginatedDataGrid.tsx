'use client';

import React from 'react';
import { Box, ThemeProvider, Stack } from '@mui/material';
import { DataGrid, GridColDef, GridFilterModel } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { getDefaultTheme } from '@/utils/themes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';

type PaginatedDataGridProps<T> = {
	queryHook: (params: { page: number; pageSize: number; search: string }) => {
		data?: { count: number; results: T[] };
		isLoading: boolean;
	};
	columns: GridColDef[];
	paginationModel: { page: number; pageSize: number };
	setPaginationModel: React.Dispatch<React.SetStateAction<{ page: number; pageSize: number }>>;
	searchTerm: string;
	setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
	toolbar?: {
		quickFilter?: boolean;
		debounceMs?: number;
	};
};

const PaginatedDataGrid = <T,>({
	queryHook,
	columns,
	paginationModel,
	setPaginationModel,
	searchTerm,
	setSearchTerm,
	toolbar = { quickFilter: true, debounceMs: 500 },
}: PaginatedDataGridProps<T>) => {
	const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
		items: [],
		quickFilterValues: [],
	});

	const { data, isLoading } = queryHook({
		page: paginationModel.page + 1,
		pageSize: paginationModel.pageSize,
		search: searchTerm,
	});

	const rows = data?.results ?? [];

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
								showToolbar={toolbar.quickFilter}
								slotProps={{
									toolbar: {
										showQuickFilter: toolbar.quickFilter,
										quickFilterProps: { debounceMs: toolbar.debounceMs },
									},
								}}
								filterModel={filterModel}
								onFilterModelChange={(model) => {
									setFilterModel(model);
									const value = model.quickFilterValues?.[0] ?? '';
									setSearchTerm(value);
								}}
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
