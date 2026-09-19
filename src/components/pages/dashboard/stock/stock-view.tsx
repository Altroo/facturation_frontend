'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	CalendarToday as CalendarTodayIcon,
	History as HistoryIcon,
	Inventory2 as Inventory2Icon,
	LocalShipping as LocalShippingIcon,
	Lock as LockIcon,
	TrendingUp as TrendingUpIcon,
	Visibility as VisibilityIcon,
	Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import type { GridColDef, GridFilterModel, GridRenderCellParams } from '@mui/x-data-grid';
import { GridLogicOperator } from '@mui/x-data-grid';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import DashboardStatCard from '@/components/shared/dashboardStatCard/dashboardStatCard';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getUserCompaniesState } from '@/store/selectors';
import { useGetStockBalanceQuery, useGetStockMovementsQuery } from '@/store/services/stock';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { SessionProps } from '@/types/_initTypes';
import type { StockMovement, StockState } from '@/types/stockTypes';
import { formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { useAppSelector } from '@/utils/hooks';
import { STOCK_ADD, STOCK_LIST, STOCK_MOVEMENT_VIEW } from '@/utils/routes';

type InfoRowProps = {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode | string | number | null | undefined;
};

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue = isValidElement(value) ? value : value && value.toString().length > 0 ? value : '—';

	return (
		<Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', py: 1.5, flexWrap: 'wrap' }}>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack
				direction="row"
				spacing={isMobile ? 0 : 2}
				sx={{ alignItems: 'center', flex: 1, flexWrap: 'wrap' }}
			>
				<Typography
					sx={{
						fontWeight: 600,
						color: 'text.secondary',
						minWidth: { xs: '100%', sm: 200 },
						wordBreak: 'break-word',
					}}
				>
					{label}
				</Typography>
				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

const movementOptions = [
	{ value: 'opening', label: 'Stock initial' },
	{ value: 'adjustment', label: 'Ajustement' },
	{ value: 'receipt', label: 'Réception' },
	{ value: 'delivery', label: 'Livraison' },
	{ value: 'inventory', label: 'Inventaire' },
	{ value: 'reversal', label: 'Annulation' },
];

const stateLabel = (state: StockState) => {
	if (state === 'disponible') return 'Disponible';
	if (state === 'minimum') return 'Stock minimum';
	return 'À approvisionner';
};

const stateColor = (state: StockState): 'success' | 'warning' | 'error' => {
	if (state === 'disponible') return 'success';
	if (state === 'minimum') return 'warning';
	return 'error';
};

const movementColor = (
	type: StockMovement['movement_type'],
): 'default' | 'warning' | 'success' | 'error' | 'info' | 'secondary' => {
	if (type === 'adjustment') return 'warning';
	if (type === 'receipt') return 'success';
	if (type === 'delivery') return 'error';
	if (type === 'inventory') return 'info';
	if (type === 'reversal') return 'secondary';
	return 'default';
};

type StockViewProps = SessionProps & { company_id: number; id: number };

const StockView: React.FC<StockViewProps> = ({ session, company_id, id }) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const companies = useAppSelector(getUserCompaniesState);
	const role = companies?.find((company) => company.id === company_id)?.role;
	const canAdjust = role === 'Caissier';
	const { data: balance, isLoading, isError } = useGetStockBalanceQuery({ company_id, id }, { skip: !token });
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [filterModel, setFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});
	const movements = useGetStockMovementsQuery(
		{
			company_id,
			article_id: balance?.article,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			filters: customFilterParams,
		},
		{ skip: !token || !balance },
	);

	const columns = useMemo<GridColDef[]>(
		() => [
			{
				field: 'date_created',
				headerName: 'Date',
				minWidth: 190,
				flex: 1.2,
				filterOperators: createDateRangeFilterOperator('entre'),
				renderCell: (params: GridRenderCellParams<StockMovement>) => (
					<Typography variant="body2" noWrap>
						{formatDate(params.row.date_created)}
					</Typography>
				),
			},
			{
				field: 'movement_type',
				headerName: 'Type',
				minWidth: 150,
				flex: 0.9,
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
				minWidth: 120,
				flex: 0.7,
				filterOperators: createNumericFilterOperators(),
				valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
				renderCell: (params: GridRenderCellParams<StockMovement>) => (
					<Typography
						sx={{ fontWeight: 700, color: Number(params.row.quantity) < 0 ? 'error.main' : 'success.main' }}
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
				minWidth: 130,
				flex: 0.8,
				filterOperators: createNumericFilterOperators(),
				valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
				renderCell: (params: GridRenderCellParams<StockMovement>) => (
					<Typography color="primary" sx={{ fontWeight: 600 }}>
						{formatNumberWithSpaces(params.row.balance_after, 3)}
					</Typography>
				),
			},
			{ field: 'note', headerName: 'Motif / source', minWidth: 240, flex: 1.5 },
			{ field: 'actor_name', headerName: 'Utilisateur', minWidth: 170, flex: 1 },
			{
				field: 'actions',
				headerName: 'Actions',
				minWidth: 100,
				flex: 0.7,
				filterable: false,
				sortable: false,
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
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '32px' }}>
			<NavigationBar title="Détails du stock">
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
					<Stack
						direction={isMobile ? 'column' : 'row'}
						spacing={2}
						sx={{ justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center' }}
					>
						<Button
							variant="outlined"
							startIcon={<ArrowBackIcon />}
							onClick={() => router.push(`${STOCK_LIST}?company_id=${company_id}`)}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							État du stock
						</Button>
						{!isLoading && !isError && canAdjust && balance && (
							<Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
								<Button
									variant="outlined"
									size="small"
									startIcon={<AddIcon />}
									onClick={() => router.push(STOCK_ADD(company_id, balance.id))}
								>
									Ajuster le stock
								</Button>
							</Stack>
						)}
					</Stack>

					{isLoading ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : isError || !balance ? (
						<Typography sx={{ p: 4 }}>Ce stock est introuvable.</Typography>
					) : (
						<Stack spacing={3}>
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
									gap: 2,
								}}
							>
								<DashboardStatCard icon={<WarehouseIcon />} label="Physique" value={formatNumberWithSpaces(balance.physical_quantity, 3)} color="#1565C0" />
								<DashboardStatCard icon={<LockIcon />} label="Réservé" value={formatNumberWithSpaces(balance.reserved_quantity, 3)} color="#6A1B9A" />
								<DashboardStatCard icon={<Inventory2Icon />} label="Disponible" value={formatNumberWithSpaces(balance.available_quantity, 3)} color="#2E7D32" />
								<DashboardStatCard icon={<LocalShippingIcon />} label="Entrant" value={formatNumberWithSpaces(balance.incoming_quantity, 3)} color="#0277BD" />
								<DashboardStatCard icon={<TrendingUpIcon />} label="Projeté" value={formatNumberWithSpaces(balance.projected_quantity, 3)} color="#00838F" />
								<DashboardStatCard icon={<Inventory2Icon />} label="Minimum" value={formatNumberWithSpaces(balance.stock_minimum, 3)} color="#ED6C02" />
							</Box>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<Inventory2Icon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Informations du stock
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<Inventory2Icon />} label="Référence" value={balance.article_reference} />
										<Divider />
										<InfoRow icon={<Inventory2Icon />} label="Désignation" value={balance.article_designation} />
										<Divider />
										<InfoRow icon={<WarehouseIcon />} label="Emplacement" value={balance.emplacement_name} />
										<Divider />
										<InfoRow
											icon={<Inventory2Icon />}
											label="Statut"
											value={<Chip size="small" variant="outlined" label={stateLabel(balance.stock_state)} color={stateColor(balance.stock_state)} />}
										/>
										<Divider />
										<InfoRow icon={<CalendarTodayIcon />} label="Dernière mise à jour" value={formatDate(balance.date_updated)} />
									</Stack>
								</CardContent>
							</Card>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<HistoryIcon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Historique des mouvements
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
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
										toolbar={{ quickFilter: true, debounceMs: 500 }}
										embedded
									/>
								</CardContent>
							</Card>
						</Stack>
					)}
				</Stack>
			</NavigationBar>
		</Stack>
	);
};

export default StockView;
