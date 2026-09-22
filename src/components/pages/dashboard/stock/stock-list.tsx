'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Chip, Typography } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import type { GridColDef, GridFilterModel, GridRenderCellParams } from '@mui/x-data-grid';
import { GridLogicOperator } from '@mui/x-data-grid';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import type { ActionItem } from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import StockDisabledState from '@/components/pages/dashboard/stock/stock-disabled-state';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { useGetCompanyQuery } from '@/store/services/company';
import { useGetEmplacementListQuery } from '@/store/services/parameter';
import { useGetStockBalancesQuery } from '@/store/services/stock';
import type { SessionProps } from '@/types/_initTypes';
import type { StockBalance, StockState } from '@/types/stockTypes';
import { formatNumberWithSpaces } from '@/utils/helpers';
import { STOCK_ADD, STOCK_VIEW } from '@/utils/routes';

const stockStateOptions = [
	{ id: 'disponible', nom: 'Disponible' },
	{ id: 'minimum', nom: 'Stock minimum' },
	{ id: 'a_approvisionner', nom: 'À approvisionner' },
];

const stateLabel = (state: StockState) => stockStateOptions.find((option) => option.id === state)?.nom ?? state;

const stateColor = (state: StockState): 'success' | 'warning' | 'error' => {
	if (state === 'disponible') return 'success';
	if (state === 'minimum') return 'warning';
	return 'error';
};

const quantityText = (value: string, color: string) => (
	<Typography variant="body2" noWrap sx={{ color, fontWeight: 600 }}>
		{formatNumberWithSpaces(value, 3)}
	</Typography>
);

const StockListContent: React.FC<{ company_id: number; role: string }> = ({ company_id, role }) => {
	const router = useRouter();
	const [paginationModel, setPaginationModel] = useDataGridPagination();
	const [searchTerm, setSearchTerm] = useState('');
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const { data: company, isLoading: companyLoading } = useGetCompanyQuery({ id: company_id });
	const { data: emplacements = [] } = useGetEmplacementListQuery({ company_id });
	const enabled = company?.stock_management_enabled === true;
	const canAdjust = role === 'Caissier';
	const filters = useMemo(
		() => ({ ...chipFilterParams, ...customFilterParams }),
		[chipFilterParams, customFilterParams],
	);
	const chipFilters = useMemo<ChipFilterConfig[]>(
		() => [
			{ key: 'emplacement', label: 'Emplacement', paramName: 'emplacement_ids', options: emplacements },
			{ key: 'state', label: 'État du stock', paramName: 'stock_states', options: stockStateOptions },
		],
		[emplacements],
	);
	const balances = useGetStockBalancesQuery(
		{
			company_id,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			filters,
		},
		{ skip: !enabled },
	);

	const columns = useMemo<GridColDef[]>(
		() => [
			{
				field: 'article_reference',
				headerName: 'Référence',
				minWidth: 105,
				flex: 0.9,
				renderCell: (params: GridRenderCellParams<StockBalance>) => (
					<DarkTooltip title={params.value}>
						<Typography variant="body2" noWrap>{params.value}</Typography>
					</DarkTooltip>
				),
			},
			{
				field: 'article_designation',
				headerName: 'Désignation',
				minWidth: 155,
				flex: 1.4,
				renderCell: (params: GridRenderCellParams<StockBalance>) => (
					<DarkTooltip title={params.value}>
						<Typography variant="body2" noWrap>{params.value}</Typography>
					</DarkTooltip>
				),
			},
			{
				field: 'emplacement_name',
				headerName: 'Emplacement',
				minWidth: 125,
				flex: 1.1,
				renderCell: (params: GridRenderCellParams<StockBalance>) => (
					<DarkTooltip title={params.value}>
						<Typography variant="body2" noWrap>{params.value}</Typography>
					</DarkTooltip>
				),
			},
			{
				field: 'physical_quantity',
				headerName: 'Physique',
				type: 'number',
				minWidth: 92,
				flex: 0.8,
				filterOperators: createNumericFilterOperators(),
				valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
				renderCell: (params: GridRenderCellParams<StockBalance>) => quantityText(params.row.physical_quantity, 'primary.main'),
			},
			{
				field: 'reserved_quantity',
				headerName: 'Réservé',
				type: 'number',
				minWidth: 92,
				flex: 0.8,
				filterOperators: createNumericFilterOperators(),
				valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
				renderCell: (params: GridRenderCellParams<StockBalance>) =>
					quantityText(params.row.reserved_quantity, Number(params.row.reserved_quantity) > 0 ? 'warning.main' : 'text.secondary'),
			},
			{
				field: 'available_quantity',
				headerName: 'Disponible',
				type: 'number',
				minWidth: 105,
				flex: 0.9,
				filterable: false,
				valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
				renderCell: (params: GridRenderCellParams<StockBalance>) => (
					<Chip
						size="small"
						variant="outlined"
						label={formatNumberWithSpaces(params.row.available_quantity, 3)}
						color={stateColor(params.row.stock_state)}
					/>
				),
			},
			{
				field: 'incoming_quantity',
				headerName: 'Entrant',
				type: 'number',
				minWidth: 90,
				flex: 0.8,
				filterable: false,
				valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
				renderCell: (params: GridRenderCellParams<StockBalance>) =>
					quantityText(params.row.incoming_quantity, Number(params.row.incoming_quantity) > 0 ? 'info.main' : 'text.secondary'),
			},
			{
				field: 'projected_quantity',
				headerName: 'Projeté',
				type: 'number',
				minWidth: 90,
				flex: 0.8,
				filterable: false,
				valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
				renderCell: (params: GridRenderCellParams<StockBalance>) => quantityText(params.row.projected_quantity, 'primary.main'),
			},
			{
				field: 'stock_state',
				headerName: 'État',
				minWidth: 135,
				flex: 1.1,
				filterable: false,
				renderCell: (params: GridRenderCellParams<StockBalance>) => (
					<DarkTooltip title={stateLabel(params.row.stock_state)}>
						<Chip size="small" variant="outlined" label={stateLabel(params.row.stock_state)} color={stateColor(params.row.stock_state)} />
					</DarkTooltip>
				),
			},
			{
				field: 'actions',
				headerName: 'Actions',
				minWidth: canAdjust ? 120 : 90,
				flex: canAdjust ? 1 : 0.8,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<StockBalance>) => {
					const actions: ActionItem[] = [
						{
							label: 'Voir le stock',
							icon: <VisibilityIcon />,
							onClick: () => router.push(STOCK_VIEW(params.row.id, company_id)),
							color: 'info' as const,
						},
					];
					if (canAdjust) {
						actions.push({
							label: 'Ajuster le stock',
							icon: <EditIcon />,
							onClick: () => router.push(STOCK_ADD(company_id, params.row.id)),
							color: 'primary' as const,
						});
					}
					return <MobileActionsMenu actions={actions} />;
				},
			},
		],
		[canAdjust, company_id, router],
	);

	if (companyLoading) return <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;
	if (!enabled) {
		return <StockDisabledState />;
	}

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
					<Button variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => router.push(STOCK_ADD(company_id))}>
						Ajuster le stock
					</Button>
				</Box>
			)}
			<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} />
			<PaginatedDataGrid
				data={balances.data}
				isLoading={balances.isLoading || balances.isFetching}
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

const StockListClient: React.FC<SessionProps> = ({ session }) => {
	const searchParams = useSearchParams();
	const requestedCompanyId = Number(searchParams.get('company_id')) || undefined;
	return (
		<CompanyDocumentsWrapperList session={session} title="État du stock" requestedCompanyId={requestedCompanyId}>
			{({ company_id, role }) => <StockListContent company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default StockListClient;
