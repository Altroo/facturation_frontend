'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Chip, Typography } from '@mui/material';
import { Add as AddIcon, CheckCircle as CheckCircleIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import type { GridColDef, GridFilterModel, GridRenderCellParams } from '@mui/x-data-grid';
import { GridLogicOperator } from '@mui/x-data-grid';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import type { ActionItem } from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { useGetEmplacementListQuery } from '@/store/services/parameter';
import { useGetInventoriesQuery, useValidateInventoryMutation } from '@/store/services/stock';
import type { SessionProps } from '@/types/_initTypes';
import type { InventorySession } from '@/types/stockTypes';
import { extractApiErrorMessage, formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import { STOCK_INVENTORIES_ADD, STOCK_INVENTORY_VIEW } from '@/utils/routes';

const inventoryStatusOptions = [
	{ id: 'draft', nom: 'Brouillon', value: 'draft', label: 'Brouillon' },
	{ id: 'validated', nom: 'Validé', value: 'validated', label: 'Validé' },
	{ id: 'cancelled', nom: 'Annulé', value: 'cancelled', label: 'Annulé' },
];

const inventoryStatusLabel = (status: InventorySession['status']) =>
	inventoryStatusOptions.find((option) => option.value === status)?.label ?? status;

const inventoryStatusColor = (status: InventorySession['status']): 'default' | 'success' | 'error' => {
	if (status === 'validated') return 'success';
	if (status === 'cancelled') return 'error';
	return 'default';
};

const StockInventoriesContent: React.FC<{ company_id: number; role: string }> = ({ company_id, role }) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const canAdjust = role === 'Caissier';
	const [paginationModel, setPaginationModel] = useDataGridPagination();
	const [searchTerm, setSearchTerm] = useState('');
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const { data: emplacements = [] } = useGetEmplacementListQuery({ company_id });
	const filters = useMemo(
		() => ({ ...chipFilterParams, ...customFilterParams }),
		[chipFilterParams, customFilterParams],
	);
	const chipFilters = useMemo<ChipFilterConfig[]>(
		() => [
			{ key: 'emplacement', label: 'Emplacement', paramName: 'emplacement_ids', options: emplacements },
			{ key: 'status', label: 'Statut', paramName: 'statuses', options: inventoryStatusOptions },
		],
		[emplacements],
	);
	const inventories = useGetInventoriesQuery({
		company_id,
		page: paginationModel.page + 1,
		pageSize: paginationModel.pageSize,
		search: searchTerm,
		filters,
	});
	const [validateInventory, validateState] = useValidateInventoryMutation();

	const handleValidate = useCallback(
		async (id: number) => {
			try {
				await validateInventory({ company_id, id }).unwrap();
				onSuccess('Inventaire validé et stock ajusté.');
			} catch (error) {
				onError(extractApiErrorMessage(error, "Impossible de valider l'inventaire."));
			}
		},
		[company_id, onError, onSuccess, validateInventory],
	);

	const columns = useMemo<GridColDef[]>(
		() => [
			{
				field: 'reference',
				headerName: 'Référence',
				minWidth: 130,
				flex: 1,
				valueGetter: (value: string | null | undefined, row: InventorySession) => value || `INV-${row.id}`,
			},
			{ field: 'emplacement_name', headerName: 'Emplacement', minWidth: 150, flex: 1.1 },
			{
				field: 'counted_lines',
				headerName: 'Comptage',
				minWidth: 170,
				flex: 1.3,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<InventorySession>) => (
					<Typography variant="body2" color="primary" noWrap sx={{ fontWeight: 600 }}>
						{params.row.lines
							.map((line) => `${line.article_reference}: ${formatNumberWithSpaces(line.counted_quantity, 3)}`)
							.join(', ')}
					</Typography>
				),
			},
			{
				field: 'differences',
				headerName: 'Écarts',
				minWidth: 170,
				flex: 1.3,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<InventorySession>) => {
					const hasDifference = params.row.lines.some((line) => Number(line.difference) !== 0);
					return (
						<Typography
							variant="body2"
							noWrap
							sx={{ fontWeight: 600, color: hasDifference ? 'error.main' : 'success.main' }}
						>
							{params.row.lines
								.map((line) => `${line.article_reference}: ${formatNumberWithSpaces(line.difference, 3)}`)
								.join(', ')}
						</Typography>
					);
				},
			},
			{
				field: 'status',
				headerName: 'Statut',
				minWidth: 115,
				flex: 0.9,
				filterOperators: createDropdownFilterOperators(inventoryStatusOptions, 'Tous les statuts', true),
				renderCell: (params: GridRenderCellParams<InventorySession>) => (
					<Chip
						size="small"
						variant="outlined"
						label={inventoryStatusLabel(params.row.status)}
						color={inventoryStatusColor(params.row.status)}
					/>
				),
			},
			{
				field: 'date_created',
				headerName: 'Date',
				minWidth: 155,
				flex: 1.2,
				filterOperators: createDateRangeFilterOperator('entre'),
				renderCell: (params: GridRenderCellParams<InventorySession>) => (
					<Typography variant="body2" noWrap>
						{formatDate(params.row.date_created).split(',')[0]}
					</Typography>
				),
			},
			{
				field: 'actions',
				headerName: 'Actions',
				minWidth: 120,
				flex: 1,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<InventorySession>) => {
					const actions: ActionItem[] = [
						{
							label: 'Voir l’inventaire',
							icon: <VisibilityIcon />,
							onClick: () => router.push(STOCK_INVENTORY_VIEW(params.row.id, company_id)),
							color: 'info' as const,
						},
					];
					if (canAdjust && params.row.status === 'draft') {
						actions.push({
							label: 'Valider l’inventaire',
							icon: <CheckCircleIcon />,
							onClick: () => handleValidate(params.row.id),
							color: 'success' as const,
							disabled: validateState.isLoading,
						});
					}
					return <MobileActionsMenu actions={actions} />;
				},
			},
		],
		[canAdjust, company_id, handleValidate, router, validateState.isLoading],
	);

	return (
		<>
			{canAdjust && (
				<Box
					sx={{
						width: '100%',
						display: 'flex',
						justifyContent: 'flex-start',
						px: { xs: 1, sm: 2, md: 3 },
						mt: { xs: 1, sm: 2, md: 3 },
						mb: { xs: 1, sm: 2, md: 3 },
					}}
				>
					<Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push(STOCK_INVENTORIES_ADD(company_id))}>
						Nouvel inventaire
					</Button>
				</Box>
			)}
			<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} />
			<PaginatedDataGrid
				data={inventories.data}
				isLoading={inventories.isLoading || inventories.isFetching}
				columns={columns}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				filterModel={filterModel}
				onFilterModelChange={setFilterModel}
				onCustomFilterParamsChange={setCustomFilterParams}
				toolbar={{ quickFilter: true, debounceMs: 500 }}
			/>
		</>
	);
};

const StockInventoriesListClient: React.FC<SessionProps> = ({ session }) => {
	const searchParams = useSearchParams();
	const requestedCompanyId = Number(searchParams.get('company_id')) || undefined;
	return (
		<CompanyDocumentsWrapperList session={session} title="Inventaires de stock" requestedCompanyId={requestedCompanyId}>
			{({ company_id, role }) => <StockInventoriesContent company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default StockInventoriesListClient;
