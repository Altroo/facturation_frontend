'use client';

import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { Add as AddIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';
import type { LinesGridProps } from '@/types/companyDocumentsTypes';

const LinesGrid = ({ rows, columns, onAddClick, isLoading, title }: LinesGridProps) => {
	const { t } = useLanguage();
	return (
		<Card elevation={2} sx={{ borderRadius: 2 }}>
			<CardContent sx={{ p: 3 }}>
				<Stack
					direction="row"
					spacing={2}
					sx={{
						alignItems: 'center',
						justifyContent: 'space-between',
						mb: 2,
					}}
				>
					<Stack
						direction="row"
						spacing={2}
						sx={{
							alignItems: 'center',
						}}
					>
						<ShoppingCartIcon color="primary" />
						<Typography
							variant="h6"
							sx={{
								fontWeight: 700,
							}}
						>
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
};

LinesGrid.displayName = 'LinesGrid';
export default LinesGrid;
