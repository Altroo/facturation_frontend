'use client';

import React, { useMemo } from 'react';
import { Box, Button, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { ArticleClass } from '@/models/classes';
import { DataGrid, GridColDef, GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';

interface AddArticleModalProps {
	open: boolean;
	loading: boolean;
	onClose: () => void;
	articles: Array<Partial<ArticleClass>>;
	selectedArticles: Set<number>;
	setSelectedArticles: (selection: Set<number>) => void;
	onAdd: () => void;
	existingArticleIds: Set<number>;
}

const AddArticleModal: React.FC<AddArticleModalProps> = ({
	open,
	loading,
	onClose,
	articles,
	selectedArticles,
	setSelectedArticles,
	onAdd,
	existingArticleIds,
}) => {
	const availableArticles = useMemo(
		() =>
			articles.filter((article) => {
				if (!article.id) return false;
				return !existingArticleIds.has(article.id);
			}),
		[articles, existingArticleIds],
	);

	const columns: GridColDef[] = [
		{ field: 'reference', headerName: 'Référence', width: 100 },
		{ field: 'designation', headerName: 'Désignation', width: 160 },
		{ field: 'marque_name', headerName: 'Marque', width: 150 },
		{ field: 'categorie_name', headerName: 'Catégorie', width: 150 },
		{ field: 'unite_name', headerName: 'Unité', width: 100 },
		{ field: 'emplacement_name', headerName: 'Emplacement', width: 160 },
		{ field: 'prix_achat', headerName: "Prix d'achat", width: 140 },
		{ field: 'prix_vente', headerName: 'Prix de vente', width: 140 },
	];

	// Build the selection object expected by MUI v6: { type: 'include'|'exclude', ids: Set<GridRowId> }
	const rowSelectionModelLocal: GridRowSelectionModel = {
		type: 'include',
		ids: new Set(Array.from(selectedArticles).map((n) => n as GridRowId)),
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogTitle>
				<Stack direction="row" spacing={2} alignItems="center">
					<AddIcon color="primary" />
					<Typography variant="h6">Ajouter des articles</Typography>
				</Stack>
			</DialogTitle>

			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					<Box sx={{ height: 450, width: '100%' }}>
						<DataGrid
							showToolbar={true}
							slotProps={{
								toolbar: {
									showQuickFilter: true,
									quickFilterProps: { debounceMs: 500 },
								},
							}}
							loading={loading}
							rows={availableArticles}
							columns={columns}
							checkboxSelection
							disableRowSelectionOnClick
							rowSelectionModel={rowSelectionModelLocal}
							onRowSelectionModelChange={(newSelection: GridRowSelectionModel | GridRowId[]) => {
								let idsArray: GridRowId[] = [];
								if (Array.isArray(newSelection)) {
									// array of ids
									idsArray = newSelection;
								} else if (newSelection && typeof newSelection === 'object' && 'ids' in newSelection) {
									const sel = newSelection as { type?: 'include' | 'exclude'; ids: Set<GridRowId> };
									if (!sel.type || sel.type === 'include') {
										// explicit list of selected ids
										idsArray = Array.from(sel.ids);
									} else if (sel.type === 'exclude') {
										// "all except these" -> compute selected as all available row ids minus excluded ones
										idsArray = availableArticles
											.map((a) => a.id)
											.filter((id) => id !== undefined && !sel.ids.has(id as GridRowId)) as GridRowId[];
									}
								}
								setSelectedArticles(new Set(idsArray.map((id) => Number(id))));
							}}
							localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
							pageSizeOptions={[5, 10, 25, 50, 100]}
							initialState={{
								pagination: { paginationModel: { pageSize: 10, page: 0 } },
							}}
							sx={{
								height: '100%',
								'& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
								'& .MuiDataGrid-row:hover': { cursor: 'pointer' },
							}}
						/>
					</Box>
				</Stack>
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose}>Annuler</Button>
				<Button variant="contained" onClick={onAdd} disabled={selectedArticles.size === 0} startIcon={<AddIcon />}>
					Ajouter ({selectedArticles.size})
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default AddArticleModal;
