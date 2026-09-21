'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chip, Typography } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import type { GridColDef, GridFilterModel, GridRenderCellParams } from '@mui/x-data-grid';
import { GridLogicOperator } from '@mui/x-data-grid';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { useGetEmplacementListQuery } from '@/store/services/parameter';
import { useGetStockMovementsQuery } from '@/store/services/stock';
import type { SessionProps } from '@/types/_initTypes';
import type { StockMovement } from '@/types/stockTypes';
import { formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { STOCK_MOVEMENT_VIEW } from '@/utils/routes';

const movementOptions = [
	{ id: 'opening', nom: 'Stock initial', value: 'opening', label: 'Stock initial' },
	{ id: 'adjustment', nom: 'Ajustement', value: 'adjustment', label: 'Ajustement' },
	{ id: 'receipt', nom: 'Réception', value: 'receipt', label: 'Réception' },
	{ id: 'delivery', nom: 'Livraison', value: 'delivery', label: 'Livraison' },
	{ id: 'inventory', nom: 'Inventaire', value: 'inventory', label: 'Inventaire' },
	{ id: 'reversal', nom: 'Annulation', value: 'reversal', label: 'Annulation' },
];

const movementColor = (type: StockMovement['movement_type']): 'default' | 'warning' | 'success' | 'error' | 'info' | 'secondary' => {
	if (type === 'adjustment') return 'warning';
	if (type === 'receipt') return 'success';
	if (type === 'delivery') return 'error';
	if (type === 'inventory') return 'info';
	if (type === 'reversal') return 'secondary';
	return 'default';
};

const StockMovementsContent: React.FC<{ company_id: number }> = ({ company_id }) => {
	const router = useRouter();
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
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
			{ key: 'type', label: 'Type de mouvement', paramName: 'movement_types', options: movementOptions },
		],
		[emplacements],
	);
	const movements = useGetStockMovementsQuery({
		company_id,
		page: paginationModel.page + 1,
		pageSize: paginationModel.pageSize,
		search: searchTerm,
		filters,
	});

	const columns = useMemo<GridColDef[]>(
		() => [
			{
				field: 'article_reference',
				headerName: 'Référence',
				minWidth: 105,
				flex: 0.9,
				renderCell: (params: GridRenderCellParams<StockMovement>) => (
					<DarkTooltip title={params.row.article_reference}>
						<Typography variant="body2" noWrap>{params.row.article_reference}</Typography>
					</DarkTooltip>
				),
			},
			{
				field: 'article_designation',
				headerName: 'Désignation',
				minWidth: 155,
				flex: 1.3,
				renderCell: (params: GridRenderCellParams<StockMovement>) => (
					<DarkTooltip title={params.row.article_designation}>
						<Typography variant="body2" noWrap>{params.row.article_designation}</Typography>
					</DarkTooltip>
				),
			},
			{ field: 'emplacement_name', headerName: 'Emplacement', minWidth: 135, flex: 0.9 },
			{
				field: 'movement_type',
				headerName: 'Type',
				minWidth: 120,
				flex: 0.8,
				filterOperators: createDropdownFilterOperators(movementOptions, 'Tous les types'),
				renderCell: (params: GridRenderCellParams<StockMovement>) => (
					<Chip
						size="small"
						variant="outlined"
						label={params.row.movement_type_display}
						color={movementColor(params.row.movement_type)}
					/>
				),
			},
			{
				field: 'quantity',
				headerName: 'Quantité',
				type: 'number',
				minWidth: 100,
				flex: 0.7,
				filterOperators: createNumericFilterOperators(),
				valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
				renderCell: (params: GridRenderCellParams<StockMovement>) => (
					<Typography
						sx={{
							fontWeight: 700,
							color: Number(params.row.quantity) < 0 ? 'error.main' : 'success.main',
						}}
					>
						{Number(params.row.quantity) > 0 ? '+' : ''}
						{formatNumberWithSpaces(params.row.quantity, 3)}
					</Typography>
				),
			},
			{
				field: 'balance_after',
				headerName: 'Stock après',
				type: 'number',
				minWidth: 110,
				flex: 0.7,
				filterOperators: createNumericFilterOperators(),
				valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
				renderCell: (params: GridRenderCellParams<StockMovement>) => (
					<Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
						{formatNumberWithSpaces(params.row.balance_after, 3)}
					</Typography>
				),
			},
			{ field: 'note', headerName: 'Motif / source', minWidth: 155, flex: 1.1 },
			{
				field: 'date_created',
				headerName: 'Date',
				minWidth: 145,
				flex: 0.9,
				filterOperators: createDateRangeFilterOperator('entre'),
				renderCell: (params: GridRenderCellParams<StockMovement>) => {
					const formatted = formatDate(params.row.date_created).split(',')[0];
					return (
						<DarkTooltip title={formatted}>
							<Typography variant="body2" noWrap>{formatted}</Typography>
						</DarkTooltip>
					);
				},
			},
			{
				field: 'actions',
				headerName: 'Actions',
				minWidth: 90,
				flex: 0.8,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<StockMovement>) => (
					<MobileActionsMenu
						actions={[
							{
								label: 'Voir le mouvement',
								icon: <VisibilityIcon />,
								onClick: () => router.push(STOCK_MOVEMENT_VIEW(params.row.id, company_id)),
								color: 'info',
							},
						]}
					/>
				),
			},
		],
		[company_id, router],
	);

	return (
		<>
			<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} />
			<PaginatedDataGrid
				data={movements.data}
				isLoading={movements.isLoading || movements.isFetching}
				columns={columns}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				filterModel={filterModel}
				onFilterModelChange={setFilterModel}
				onCustomFilterParamsChange={setCustomFilterParams}
				toolbar={{ quickFilter: true, debounceMs: 400 }}
			/>
		</>
	);
};

const StockMovementsListClient: React.FC<SessionProps> = ({ session }) => {
	const searchParams = useSearchParams();
	const requestedCompanyId = Number(searchParams.get('company_id')) || undefined;
	return (
		<CompanyDocumentsWrapperList session={session} title="Mouvements de stock" requestedCompanyId={requestedCompanyId}>
			{({ company_id }) => <StockMovementsContent company_id={company_id} />}
		</CompanyDocumentsWrapperList>
	);
};

export default StockMovementsListClient;
