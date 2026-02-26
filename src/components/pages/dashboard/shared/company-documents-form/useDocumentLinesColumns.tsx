'use client';

import React, { useMemo, useCallback } from 'react';
import { Box, Typography, Tooltip, InputAdornment, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Inventory2 as Inventory2Icon } from '@mui/icons-material';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import FormattedNumberInput from '@/components/formikElements/formattedNumberInput/formattedNumberInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { parseNumber, safeParseForInput, formatNumberWithSpaces } from '@/utils/helpers';
import { gridInputTheme, customGridDropdownTheme } from '@/utils/themes';
import { remiseTypeItemsList } from '@/utils/rawData';
import Image from 'next/image';
import type { ArticleClass } from '@/models/classes';
import type { DeviFactureLineFormValues } from '@/types/companyDocumentsTypes';
import type { ValidateArticleLinesErrorType } from '@/types/devisTypes';
import { generateRowId } from './companyDocumentFormContent';

const gridFieldTheme = gridInputTheme();

export interface UseDocumentLinesColumnsParams {
	getLines: () => DeviFactureLineFormValues[];
	validationErrors: ValidateArticleLinesErrorType;
	role?: string;
	devise: string;
	handleLineChangeRef: React.RefObject<(index: number, field: keyof DeviFactureLineFormValues, value: string | number) => void>;
	handleDeleteLine: (index: number) => void;
	getArticleById: (articleRef: number | string | Partial<ArticleClass> | undefined) => Partial<ArticleClass> | undefined;
}

export const useDocumentLinesColumns = ({
	getLines,
	validationErrors,
	role,
	devise,
	handleLineChangeRef,
	handleDeleteLine,
	getArticleById,
}: UseDocumentLinesColumnsParams): { linesColumns: GridColDef[] } => {
	const getRowIndexFromParams = useCallback(
		(params: GridRenderCellParams): number => {
			const idStr = String(params.id);
			const lines = getLines();
			const idx = lines.findIndex((l, i) => generateRowId(l.article, i) === idStr);
			return idx >= 0 ? idx : 0;
		},
		[getLines],
	);

	const [renderPrixVenteCell, renderQuantityCell, renderRemiseCell] = useMemo<
		[
			(params: GridRenderCellParams) => React.JSX.Element,
			(params: GridRenderCellParams) => React.JSX.Element,
			(params: GridRenderCellParams) => React.JSX.Element,
		]
	>(() => {
		const prix = (params: GridRenderCellParams) => {
			const rowIndex = getRowIndexFromParams(params);
			const ligne = getLines()[rowIndex];
			const rawValue = ligne?.prix_vente ?? '';
			const inputValue = String(safeParseForInput(String(rawValue ?? '')));
			const errorKey = `ligne_${rowIndex}_prix_vente`;
			const helperText = validationErrors[errorKey] || '';
			const hasError = !!validationErrors[errorKey];
			const devisePrixVente = ligne?.devise_prix_vente || 'MAD';

			if (role === 'Commercial') {
				return (
					<DarkTooltip title={inputValue}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{inputValue}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			} else {
				return (
					<Tooltip title={helperText} arrow>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<FormattedNumberInput
								id={`prix_vente_${rowIndex}`}
								type="text"
								value={rawValue}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									const raw = (e.target as HTMLInputElement).value;
									const parsed = parseNumber(raw);
									if (parsed !== null && parsed < 0) return;
									handleLineChangeRef.current(rowIndex, 'prix_vente', parsed === null ? raw : parsed);
								}}
								fullWidth
								size="small"
								theme={gridFieldTheme}
								error={hasError}
								endIcon={<InputAdornment position="end">{devisePrixVente}</InputAdornment>}
								decimals={2}
								slotProps={{ input: { style: { textAlign: 'center' } } }}
							/>
						</Box>
					</Tooltip>
				);
			}
		};
		const quantity = (params: GridRenderCellParams) => {
			const rowIndex = getRowIndexFromParams(params);
			const ligne = getLines()[rowIndex];
			const rawValue = ligne?.quantity ?? '';
			const errorKey = `ligne_${rowIndex}_quantity`;
			const hasError = !!validationErrors[errorKey];
			const article = getArticleById(ligne?.article);
			const uniteName = article?.unite_name || '';
			return (
				<Tooltip title={validationErrors[errorKey] || ''} arrow>
					<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
						<FormattedNumberInput
							id={`quantity_${rowIndex}`}
							type="text"
							value={rawValue}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								const raw = (e.target as HTMLInputElement).value;
								const parsed = parseNumber(raw);
								if (parsed !== null && parsed < 0.01) return;
								handleLineChangeRef.current(rowIndex, 'quantity', parsed === null ? raw : parsed);
							}}
							fullWidth
							size="small"
							theme={gridFieldTheme}
							error={hasError}
							endIcon={uniteName ? <InputAdornment position="end">{uniteName}</InputAdornment> : undefined}
							decimals={2}
							slotProps={{ input: { style: { textAlign: 'center' } } }}
						/>
					</Box>
				</Tooltip>
			);
		};
		const remise = (params: GridRenderCellParams) => {
			const rowIndex = getRowIndexFromParams(params);
			const rawValue = getLines()[rowIndex]?.remise ?? '';
			const errorKey = `ligne_${rowIndex}_remise`;
			const helperText = validationErrors[errorKey] || '';
			const hasError = !!validationErrors[errorKey];
			const remiseTypeValue = getLines()[rowIndex]?.remise_type;
			return (
				<Tooltip title={helperText} arrow>
					<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
						<FormattedNumberInput
							id={`remise_${rowIndex}`}
							type="text"
							value={rawValue}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								const raw = (e.target as HTMLInputElement).value;
								const parsed = parseNumber(raw);
								if (parsed !== null && parsed < 0) return;
								handleLineChangeRef.current(rowIndex, 'remise', parsed === null ? raw : parsed);
							}}
							fullWidth
							size="small"
							theme={gridFieldTheme}
							error={hasError}
							disabled={!remiseTypeValue}
							endIcon={
								remiseTypeValue && (
									<InputAdornment position="end">{remiseTypeValue === 'Pourcentage' ? '%' : devise}</InputAdornment>
								)
							}
							decimals={2}
							slotProps={{ input: { style: { textAlign: 'center' } } }}
						/>
					</Box>
				</Tooltip>
			);
		};
		return [prix, quantity, remise];
	}, [getRowIndexFromParams, getLines, validationErrors, role, devise, handleLineChangeRef, getArticleById]);

	const linesColumns: GridColDef[] = useMemo(
		() => [
			{
				field: 'photo',
				headerName: 'Photo',
				flex: 0.5, minWidth: 60,
				sortable: false,
				filterable: false,
				editable: false,
				renderCell: (params: GridRenderCellParams) => {
					const article = getArticleById(params.row.article);
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<DarkTooltip
								title={
									article?.photo ? (
										<Box
											sx={{ width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
										>
											<Image
												src={article.photo as string}
												alt={article?.reference as string}
												width={260}
												height={260}
												style={{ objectFit: 'contain', display: 'block' }}
											/>
										</Box>
									) : (
										''
									)
								}
								placement="right"
								arrow
								enterDelay={100}
								leaveDelay={200}
								slotProps={{ tooltip: { sx: { pointerEvents: 'auto' } } }}
							>
								{article?.photo ? (
									<Box
										component="img"
										src={article.photo as string}
										alt={article?.reference as string | undefined}
										sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
									/>
								) : (
									<Box
										sx={{
											width: 40,
											height: 40,
											borderRadius: 1,
											backgroundColor: '#E0E0E0',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Inventory2Icon sx={{ fontSize: 20, color: '#9E9E9E' }} />
									</Box>
								)}
							</DarkTooltip>
						</Box>
					);
				},
			},
			{
				field: 'reference',
				headerName: 'Référence',
				flex: 0.8, minWidth: 90,
				renderCell: (params: GridRenderCellParams) => {
					const article = getArticleById(params.row.article);
					const value = params.row.reference || article?.reference || '';
					const isArchived = article?.archived === true;
					return (
						<DarkTooltip title={isArchived ? `${value} (Archivé)` : value}>
							<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<Typography variant="body2" noWrap sx={{ textAlign: 'left' }}>
									{value}
								</Typography>
								{isArchived && (
									<Typography variant="caption" noWrap sx={{ color: '#ED6C02', fontWeight: 600, whiteSpace: 'nowrap' }}>
										(Archivé)
									</Typography>
								)}
							</Box>
						</DarkTooltip>
					);
				},
			},
			{
				field: 'designation',
				headerName: 'Désignation',
				flex: 1, minWidth: 90,
				renderCell: (params: GridRenderCellParams) => {
					const value = params.row.designation ?? '';
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
				field: 'marque',
				headerName: 'Marque',
				flex: 1, minWidth: 100,
				renderCell: (params: GridRenderCellParams) => {
					const article = getArticleById(params.row.article);
					const value = article?.marque_name ?? '';
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
				field: 'categorie',
				headerName: 'Catégorie',
				flex: 1, minWidth: 100,
				renderCell: (params: GridRenderCellParams) => {
					const article = getArticleById(params.row.article);
					const value = article?.categorie_name ?? '';
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
				flex: 1, minWidth: 110,
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
			{ field: 'prix_vente', headerName: 'Prix de vente', flex: 1.8, minWidth: 170, renderCell: renderPrixVenteCell },
			{ field: 'quantity', headerName: 'Quantité', flex: 1.5, minWidth: 160, renderCell: renderQuantityCell },
			{
				field: 'remise_type',
				headerName: 'Type remise',
				flex: 1.2, minWidth: 150,
				renderCell: (params: GridRenderCellParams) => {
					const rowIndex = getRowIndexFromParams(params);
					const value = getLines()[rowIndex]?.remise_type ?? '';
					const errorKey = `ligne_${rowIndex}_remise`;
					const helperText = validationErrors[errorKey] || '';
					const hasError = !!validationErrors[errorKey];
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Tooltip title={helperText} arrow>
								<CustomDropDownSelect
									id={`remise_type_${rowIndex}`}
									label=""
									size="small"
									error={hasError}
									items={remiseTypeItemsList}
									value={value}
									onChange={(e) => handleLineChangeRef.current(rowIndex, 'remise_type', e.target.value)}
									theme={customGridDropdownTheme()}
								/>
							</Tooltip>
						</Box>
					);
				},
			},
			{ field: 'remise', headerName: 'Remise', flex: 1.2, minWidth: 120, renderCell: renderRemiseCell },
			{
				field: 'actions',
				headerName: 'Actions',
				flex: 0.6, minWidth: 70,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams) => {
					const rowIndex = getRowIndexFromParams(params);
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Tooltip title="Supprimer">
								<IconButton size="small" color="error" aria-label="Supprimer la ligne" onClick={() => handleDeleteLine(rowIndex)}>
									<DeleteIcon />
								</IconButton>
							</Tooltip>
						</Box>
					);
				},
			},
		],
		[
			renderPrixVenteCell,
			renderQuantityCell,
			renderRemiseCell,
			getArticleById,
			getRowIndexFromParams,
			getLines,
			validationErrors,
			handleDeleteLine,
			handleLineChangeRef,
		],
	);

	return { linesColumns };
};
