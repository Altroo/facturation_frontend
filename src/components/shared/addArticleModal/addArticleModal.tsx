'use client';

import React, { useMemo } from 'react';
import { Box, Button, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { ArticleClass } from '@/models/classes';
import { DataGrid, GridColDef, GridRowId, GridRowSelectionModel, GridRenderCellParams } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { formatNumberWithSpaces } from '@/utils/helpers';

interface AddArticleModalProps {
	open: boolean;
	loading: boolean;
	onClose: () => void;
	articles: Array<Partial<ArticleClass>>;
	selectedArticles: Set<number>;
	setSelectedArticles: (selection: Set<number>) => void;
	onAdd: () => void;
	existingArticleIds: Set<number>;
	documentDevise?: string;
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
	documentDevise,
}) => {
	const availableArticles = useMemo(
		() =>
			articles.filter((article) => {
				if (!article.id) return false;
				if (existingArticleIds.has(article.id)) return false;
				// If document has a currency set, filter by matching devise_prix_vente
				if (documentDevise && documentDevise !== 'MAD') {
					return article.devise_prix_vente === documentDevise;
				}
				return true;
			}),
		[articles, existingArticleIds, documentDevise],
	);

	const columns: GridColDef[] = [
		{
			field: 'reference',
			headerName: 'Référence',
			flex: 0.8,
			minWidth: 90,
			renderCell: (params: GridRenderCellParams) => {
				const value = String(params.value ?? '');
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'designation',
			headerName: 'Désignation',
			flex: 1.5,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams) => {
				const value = String(params.value ?? '');
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'marque_name',
			headerName: 'Marque',
			flex: 1,
			minWidth: 100,
			renderCell: (params: GridRenderCellParams) => {
				const value = String(params.value ?? '');
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'categorie_name',
			headerName: 'Catégorie',
			flex: 1,
			minWidth: 100,
			renderCell: (params: GridRenderCellParams) => {
				const value = String(params.value ?? '');
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'unite_name',
			headerName: 'Unité',
			flex: 0.7,
			minWidth: 80,
			renderCell: (params: GridRenderCellParams) => {
				const value = String(params.value ?? '');
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'emplacement_name',
			headerName: 'Emplacement',
			flex: 1.2,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams) => {
				const value = String(params.value ?? '');
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'prix_achat',
			headerName: "Prix d'achat",
			flex: 1,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams) => {
				const value = formatNumberWithSpaces(params.row.prix_achat ?? 0, 2) + ' ' + (params.row.devise_prix_achat || 'MAD');
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'prix_vente',
			headerName: 'Prix de vente',
			flex: 1,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams) => {
				const value = formatNumberWithSpaces(params.row.prix_vente ?? 0, 2) + ' ' + (params.row.devise_prix_vente || 'MAD');
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
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
