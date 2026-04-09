'use client';

import React, { useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { ArticleClass } from '@/models/classes';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { formatNumberWithSpaces, parseNumber } from '@/utils/helpers';
import FormattedNumberInput from '@/components/formikElements/formattedNumberInput/formattedNumberInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customGridDropdownTheme, gridInputTheme } from '@/utils/themes';
import { remiseTypeItemsList } from '@/utils/rawData';
import type { TypeRemiseType } from '@/types/devisTypes';
import { useLanguage } from '@/utils/hooks';

const gridFieldTheme = gridInputTheme();
const gridSelectTheme = customGridDropdownTheme();

export interface SelectedArticlePopupValues {
	articleId: number;
	quantity: string | number;
	remise_type: TypeRemiseType;
	remise: string | number;
}

type ArticlePopupValues = {
	quantity: string | number;
	remise_type: TypeRemiseType;
	remise: string | number;
};

interface AddArticleModalProps {
	open: boolean;
	loading: boolean;
	onClose: () => void;
	articles: Array<Partial<ArticleClass>>;
	selectedArticles: Set<number>;
	setSelectedArticles: (selection: Set<number>) => void;
	onAdd: (selectedArticlesData: SelectedArticlePopupValues[]) => void;
	existingArticleIds: Set<number>;
	existingArticleLineValues?: Record<number, ArticlePopupValues>;
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
	existingArticleLineValues = {},
	documentDevise,
}) => {
	const { t } = useLanguage();
	const [articlePopupValues, setArticlePopupValues] = useState<Record<number, ArticlePopupValues>>({});
	const [prevOpen, setPrevOpen] = useState(false);

	// Derived state: reset popup values when modal closes
	if (prevOpen !== open) {
		setPrevOpen(open);
		if (!open) {
			setArticlePopupValues({});
		}
	}

	const availableArticles = useMemo(
		() =>
			articles.filter((article) => {
				if (!article.id) return false;
				// If document has a currency set, filter by matching devise_prix_vente
				if (documentDevise && documentDevise !== 'MAD') {
					return article.devise_prix_vente === documentDevise;
				}
				return true;
			}),
		[articles, documentDevise],
	);

	const getRowPopupValues = (articleId: number): ArticlePopupValues => {
		const existingValues = articlePopupValues[articleId];
		const existingLine = existingArticleLineValues[articleId];
		return {
			quantity: existingValues?.quantity ?? existingLine?.quantity ?? 1,
			remise_type: existingValues?.remise_type ?? existingLine?.remise_type ?? '',
			remise: existingValues?.remise ?? existingLine?.remise ?? 0,
		};
	};

	const setRowPopupValues = (articleId: number, values: Partial<ArticlePopupValues>) => {
		setArticlePopupValues((prev) => ({
			...prev,
			[articleId]: {
				...(prev[articleId] ?? {
					quantity: existingArticleLineValues[articleId]?.quantity ?? 1,
					remise_type: existingArticleLineValues[articleId]?.remise_type ?? '',
					remise: existingArticleLineValues[articleId]?.remise ?? 0,
				}),
				...values,
			},
		}));
	};

	const rows = availableArticles.map((article) => {
		const popupValues = article.id
			? getRowPopupValues(article.id)
			: { quantity: 1, remise_type: '' as TypeRemiseType, remise: 0 };
		return {
			...article,
			quantity: popupValues.quantity,
			remise_type: popupValues.remise_type,
			remise: popupValues.remise,
			status:
				article.id && existingArticleIds.has(article.id)
					? t.addArticleModal.statusExisting
					: t.addArticleModal.statusNew,
		};
	});

	const columns: GridColDef[] = [
		{
			field: 'status',
			headerName: t.addArticleModal.statusHeader,
			flex: 0.8,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams) => {
				const value = String(params.value ?? t.addArticleModal.statusNew);
				const color = value === t.addArticleModal.statusExisting ? '#0274d7' : '#2e7d32';
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%', color, fontWeight: 600 }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'reference',
			headerName: t.addArticleModal.colReference,
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
			headerName: t.addArticleModal.colDesignation,
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
			headerName: t.addArticleModal.colMarque,
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
			headerName: t.addArticleModal.colCategorie,
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
			headerName: t.addArticleModal.colUnite,
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
			headerName: t.addArticleModal.colEmplacement,
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
			headerName: t.addArticleModal.colPrixAchat,
			flex: 1,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams) => {
				const value =
					formatNumberWithSpaces(params.row.prix_achat ?? 0, 2) + ' ' + (params.row.devise_prix_achat || 'MAD');
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
			headerName: t.addArticleModal.colPrixVente,
			flex: 1,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams) => {
				const value =
					formatNumberWithSpaces(params.row.prix_vente ?? 0, 2) + ' ' + (params.row.devise_prix_vente || 'MAD');
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
			field: 'quantity',
			headerName: t.addArticleModal.colQuantite,
			flex: 0.9,
			minWidth: 120,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams) => {
				const articleId = Number(params.row.id);
				const rowValues = getRowPopupValues(articleId);
				const uniteName = String(params.row.unite_name ?? '');
				return (
					<Box
						sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}
						onClick={(e) => e.stopPropagation()}
					>
						<FormattedNumberInput
							id={`popup_quantity_${articleId}`}
							type="text"
							value={rowValues.quantity}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								const raw = (e.target as HTMLInputElement).value;
								const parsed = parseNumber(raw);
								if (parsed !== null && parsed < 0.01) return;
								setRowPopupValues(articleId, { quantity: parsed === null ? raw : parsed });
							}}
							fullWidth
							size="small"
							theme={gridFieldTheme}
							decimals={2}
							endIcon={uniteName ? <Typography variant="caption">{uniteName}</Typography> : undefined}
							slotProps={{ input: { style: { textAlign: 'center' } } }}
						/>
					</Box>
				);
			},
		},
		{
			field: 'remise_type',
			headerName: t.addArticleModal.colTypeRemise,
			flex: 1,
			minWidth: 140,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams) => {
				const articleId = Number(params.row.id);
				const rowValues = getRowPopupValues(articleId);
				return (
					<Box
						sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}
						onClick={(e) => e.stopPropagation()}
					>
						<CustomDropDownSelect
							id={`popup_remise_type_${articleId}`}
							label={t.addArticleModal.typeLabel}
							items={remiseTypeItemsList}
							theme={gridSelectTheme}
							size="small"
							value={rowValues.remise_type || ''}
							onChange={(e) => {
								const nextType = (e.target.value as TypeRemiseType) || '';
								setRowPopupValues(articleId, {
									remise_type: nextType,
									remise: nextType ? rowValues.remise : 0,
								});
							}}
						/>
					</Box>
				);
			},
		},
		{
			field: 'remise',
			headerName: t.addArticleModal.colRemise,
			flex: 0.9,
			minWidth: 130,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams) => {
				const articleId = Number(params.row.id);
				const rowValues = getRowPopupValues(articleId);
				return (
					<Box
						sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}
						onClick={(e) => e.stopPropagation()}
					>
						<FormattedNumberInput
							id={`popup_remise_${articleId}`}
							type="text"
							value={rowValues.remise}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								const raw = (e.target as HTMLInputElement).value;
								const parsed = parseNumber(raw);
								if (parsed !== null && parsed < 0) return;
								setRowPopupValues(articleId, { remise: parsed === null ? raw : parsed });
							}}
							fullWidth
							size="small"
							theme={gridFieldTheme}
							disabled={!rowValues.remise_type}
							decimals={2}
							endIcon={
								<Typography variant="caption">
									{rowValues.remise_type === 'Pourcentage'
										? '%'
										: params.row.devise_prix_vente || documentDevise || 'MAD'}
								</Typography>
							}
							slotProps={{ input: { style: { textAlign: 'center' } } }}
						/>
					</Box>
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
				<Stack
					direction="row"
					spacing={2}
					sx={{
						alignItems: 'center',
					}}
				>
					<AddIcon color="primary" />
					<Typography variant="h6">{t.addArticleModal.title}</Typography>
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
							rows={rows}
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
										idsArray = rows
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
				<Button onClick={onClose}>{t.addArticleModal.cancelBtn}</Button>
				<Button
					variant="contained"
					onClick={() => {
						const payload: SelectedArticlePopupValues[] = Array.from(selectedArticles).map((articleId) => {
							const values = getRowPopupValues(articleId);
							return {
								articleId,
								quantity: values.quantity,
								remise_type: values.remise_type || '',
								remise: values.remise,
							};
						});
						onAdd(payload);
					}}
					disabled={selectedArticles.size === 0}
					startIcon={<AddIcon />}
				>
					{t.addArticleModal.addBtn(selectedArticles.size)}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default AddArticleModal;
