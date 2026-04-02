import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import type { DeviFactureLineFormValues } from '@/types/devisTypes';
import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { Add as AddIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';

interface LinesGridProps {
	rows: Array<DeviFactureLineFormValues>;
	title: string;
	columns: GridColDef[];
	onAddClick: () => void;
	isLoading: boolean;
}

const LinesGrid = React.memo(
	({ rows, columns, onAddClick, isLoading, title }: LinesGridProps) => {
		const { t } = useLanguage();
		return (
			<Card elevation={2} sx={{ borderRadius: 2 }}>
				<CardContent sx={{ p: 3 }}>
					<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
						<Stack direction="row" spacing={2} alignItems="center">
							<ShoppingCartIcon color="primary" />
							<Typography variant="h6" fontWeight={700}>
								{title}
							</Typography>
						</Stack>
						<Button variant="contained" startIcon={<AddIcon />} onClick={onAddClick} size="small" disabled={isLoading}>
						{t.documentForm.addArticleBtn}
						</Button>
					</Stack>
					<Divider sx={{ mb: 3 }} />
					<Box sx={{ height: '100%' }}>
						<DataGrid
							rows={rows}
							showToolbar={true}
							slotProps={{
								toolbar: {
									showQuickFilter: true,
									quickFilterProps: { debounceMs: 500 },
								},
							}}
							columns={columns}
							localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
							disableRowSelectionOnClick
							pageSizeOptions={[5, 10, 25, 50, 100]}
							initialState={{
								pagination: {
									paginationModel: { pageSize: 10 },
								},
							}}
						/>
					</Box>
				</CardContent>
			</Card>
		);
	},
	(prevProps, nextProps) => {
		// Return TRUE if props are equal (DON'T re-render)
		// Return FALSE if props changed (DO re-render)
		const rowsEqual =
			prevProps.rows.length === nextProps.rows.length &&
			prevProps.rows.every((row, i) =>
				Object.entries(row).every(
					([key, val]) => val === (nextProps.rows[i] as unknown as Record<string, unknown>)?.[key],
				),
			);

		// Deep compare columns by checking length and field names
		const columnsEqual =
			prevProps.columns.length === nextProps.columns.length &&
			prevProps.columns.every((col, i) => col.field === nextProps.columns[i]?.field);

		return rowsEqual && columnsEqual && prevProps.isLoading === nextProps.isLoading;
	},
);

LinesGrid.displayName = 'LinesGrid';
export default LinesGrid;
