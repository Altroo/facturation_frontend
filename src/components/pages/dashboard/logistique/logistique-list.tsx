'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Divider, Typography } from '@mui/material';
import {
	Add as AddIcon,
	AssignmentTurnedIn as AssignmentTurnedInIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	ErrorOutlined as ErrorOutlinedIcon,
		LocalShipping as LocalShippingIcon,
		Payment as PaymentIcon,
		RequestQuote as RequestQuoteIcon,
	Visibility as VisibilityIcon,
	Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import DashboardStatCard from '@/components/shared/dashboardStatCard/dashboardStatCard';
import ChipSelectFilterBar, { type ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import MobileActionsMenu, { type ActionItem } from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getInitStateToken } from '@/store/selectors';
import {
	useBulkDeleteLogistiqueMutation,
	useDeleteLogistiqueMutation,
	useGetLogistiqueListQuery,
} from '@/store/services/logistique';
import { LOGISTIQUE_ADD, LOGISTIQUE_EDIT, LOGISTIQUE_VIEW } from '@/utils/routes';
import { extractApiErrorMessage, formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import {
	logistiqueGlobalStatusItemsList as logisticsStatuses,
	logistiqueImportTitleStatusItemsList as importTitleStatuses,
	logistiquePaymentStatusItemsList as paymentStatuses,
} from '@/utils/rawData';
import type { SessionProps } from '@/types/_initTypes';
import type { LogistiqueListResponse, LogistiqueOrder, LogistiquePaymentStatus } from '@/types/logistiqueTypes';

interface FormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

const managerRoles = new Set(['Caissier', 'Commercial', 'Logistique']);

const statusColor = (status: string) => {
	if (status === 'Clôturé') return 'success' as const;
	if (status === 'Annulé' || status === 'Bloqué' || status === 'En retard') return 'error' as const;
	if (status === 'À lancer' || status === 'En attente externe' || status === 'À clôturer') return 'warning' as const;
	return 'info' as const;
};

const paymentColor = (status: LogistiquePaymentStatus) => {
	if (status === 'Validé') return 'success' as const;
	if (status === 'En attente') return 'warning' as const;
	return 'default' as const;
};

const formatMoney = (value: string | number | null | undefined, devise = 'MAD') =>
	`${formatNumberWithSpaces(value ?? 0, 2)} ${devise}`;

const numericValue = (value: string | number | null | undefined) => {
	const parsed = Number(
		String(value ?? 0)
			.replace(/\s/g, '')
			.replace(',', '.'),
	);
	return Number.isFinite(parsed) ? parsed : 0;
};

const FormikContent: React.FC<FormikContentProps> = ({ session, company_id, role }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const token = useInitAccessToken(session);
	const currentUserId = useAppSelector(getInitStateToken).user.pk;
	const canManage = managerRoles.has(role);
	const canDelete = role === 'Caissier';

	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const mergedFilterParams = useMemo(
		() => ({ ...chipFilterParams, ...customFilterParams }),
		[chipFilterParams, customFilterParams],
	);

	const { data, isLoading, refetch } = useGetLogistiqueListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			...mergedFilterParams,
		},
		{ skip: !token },
	);
	const listData = data as LogistiqueListResponse | undefined;
	const supplierFilterOptions = useMemo(
		() =>
			(listData?.stats.fournisseurs ?? []).map((item) => ({
				value: item.fournisseur,
				label: item.fournisseur,
			})),
		[listData],
	);
	const statusFilterOptions = useMemo(
		() => logisticsStatuses.map((value) => ({ value, label: value, color: statusColor(value) })),
		[],
	);
	const paymentFilterOptions = useMemo(
		() => paymentStatuses.map((value) => ({ value, label: value, color: paymentColor(value) })),
		[],
	);
	const importTitleFilterOptions = useMemo(() => importTitleStatuses.map((value) => ({ value, label: value })), []);
	const chipFilters: ChipFilterConfig[] = useMemo(
		() => [
			{
				key: 'fournisseur',
				label: t.logistique.colFournisseur,
				paramName: 'fournisseur',
				options: (listData?.stats.fournisseurs ?? []).map((item) => ({
					id: item.fournisseur,
					nom: item.fournisseur,
				})),
			},
			{
				key: 'statut',
				label: t.logistique.colStatut,
				paramName: 'statut_global',
				options: logisticsStatuses.map((value) => ({ id: value, nom: value })),
			},
			{
				key: 'paiement',
				label: t.logistique.colPaiement,
				paramName: 'statut_paiement',
				options: paymentStatuses.map((value) => ({ id: value, nom: value })),
			},
			{
				key: 'titre_importation',
				label: t.logistique.fieldStatutTI,
				paramName: 'statut_titre_importation',
				options: importTitleStatuses.map((value) => ({ id: value, nom: value })),
			},
		],
		[
			listData,
			t.logistique.colFournisseur,
			t.logistique.colPaiement,
			t.logistique.colStatut,
			t.logistique.fieldStatutTI,
		],
	);

	const [deleteLogistique] = useDeleteLogistiqueMutation();
	const [bulkDeleteLogistique] = useBulkDeleteLogistiqueMutation();

	const deleteHandler = async () => {
		if (!selectedId) return;
		try {
			await deleteLogistique({ id: selectedId }).unwrap();
			onSuccess(t.logistique.deleteSuccess);
			refetch();
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.deleteError));
		} finally {
			setShowDeleteModal(false);
			setSelectedId(null);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteLogistique({ ids: selectedIds }).unwrap();
			onSuccess(t.logistique.bulkDeleteSuccess(selectedIds.length));
			refetch();
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.bulkDeleteError));
		} finally {
			setSelectedIds([]);
			setShowBulkDeleteModal(false);
		}
	};

	const columns: GridColDef[] = [
		{
			field: 'numero_commande',
			headerName: t.logistique.colNumero,
			flex: 1,
			minWidth: 125,
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'fournisseur',
			headerName: t.logistique.colFournisseur,
			flex: 1,
			minWidth: 110,
			filterOperators: createDropdownFilterOperators(
				supplierFilterOptions,
				t.logistique.allSuppliers,
				undefined,
				t.filterPanel.is,
			),
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => (
				<DarkTooltip title={params.row.fournisseur || '-'}>
					<Typography variant="body2" noWrap>
						{params.row.fournisseur || '-'}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'clients_display',
			headerName: t.logistique.colClients,
			flex: 1.4,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => (
				<DarkTooltip title={params.value || '-'}>
					<Typography variant="body2" noWrap>
						{params.value || '-'}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'projects_display',
			headerName: t.logistique.colProjects,
			flex: 1.1,
			minWidth: 135,
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => (
				<DarkTooltip title={params.value || '-'}>
					<Typography variant="body2" noWrap>
						{params.value || '-'}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date_prevue',
			headerName: t.logistique.colDatePrevue,
			flex: 1,
			minWidth: 125,
			filterOperators: createDateRangeFilterOperator(t.filterPanel.between),
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => {
				const formatted = formatDate(params.value as string | null);
				return (
					<DarkTooltip title={formatted}>
						<Typography variant="body2" noWrap>
							{formatted}
						</Typography>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'statut_global',
			headerName: t.logistique.colStatut,
			flex: 1.2,
			minWidth: 155,
			filterOperators: createDropdownFilterOperators(statusFilterOptions, t.common.allStatuses, true, t.filterPanel.is),
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => (
				<DarkTooltip title={params.value || '-'}>
					<Chip label={params.value} size="small" color={statusColor(params.value as string)} variant="outlined" />
				</DarkTooltip>
			),
		},
		{
			field: 'statut_paiement',
			headerName: t.logistique.colPaiement,
			flex: 1,
			minWidth: 125,
			filterOperators: createDropdownFilterOperators(
				paymentFilterOptions,
				t.common.allStatuses,
				true,
				t.filterPanel.is,
			),
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => (
				<DarkTooltip title={params.value || '-'}>
					<Chip
						label={params.value}
						size="small"
						color={paymentColor(params.value as LogistiquePaymentStatus)}
						variant="outlined"
					/>
				</DarkTooltip>
			),
		},
		{
			field: 'statut_titre_importation',
			headerName: t.logistique.fieldStatutTI,
			flex: 1,
			minWidth: 130,
			filterOperators: createDropdownFilterOperators(
				importTitleFilterOptions,
				t.common.allStatuses,
				undefined,
				t.filterPanel.is,
			),
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => (
				<DarkTooltip title={params.value || '-'}>
					<Chip label={params.value || '-'} size="small" variant="outlined" />
				</DarkTooltip>
			),
		},
		{
			field: 'alerts',
			headerName: t.logistique.colAlerts,
			flex: 1.2,
			minWidth: 150,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => {
				const alerts = params.row.alerts ?? [];
				if (!alerts.length) {
					return (
						<DarkTooltip title={t.logistique.noAlerts}>
							<Chip label={t.logistique.noAlerts} size="small" variant="outlined" />
						</DarkTooltip>
					);
				}
				return (
					<DarkTooltip title={alerts.join(', ')}>
						<Chip
							label={alerts.length === 1 ? alerts[0] : `${alerts.length} ${t.logistique.colAlerts}`}
							size="small"
							color="warning"
							variant="outlined"
						/>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'cout_total',
			headerName: t.logistique.colCoutTotal,
			flex: 1,
			minWidth: 120,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => {
				const formatted = formatMoney(params.value, params.row.devise);
				return (
					<DarkTooltip title={formatted}>
						<Typography variant="body2" color="primary" sx={{ fontWeight: 600 }} noWrap>
							{formatted}
						</Typography>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 0.8,
			minWidth: 160,
			sortable: false,
			filterable: false,
			disableColumnMenu: true,
			resizable: false,
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => {
				const actions: ActionItem[] = [
					{
						label: t.common.view,
						icon: <VisibilityIcon />,
						onClick: () => router.push(LOGISTIQUE_VIEW(params.row.id, company_id)),
						color: 'info' as const,
					},
				];
				const canEditRow =
					canManage ||
					(params.row.responsable === currentUserId && params.row.statut_paiement === 'Non demandé');
				if (canEditRow && params.row.statut_global !== 'Annulé') {
					actions.push({
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(LOGISTIQUE_EDIT(params.row.id, company_id)),
						color: 'primary' as const,
					});
				}
				if (canDelete) {
					actions.push({
						label: t.common.delete,
						icon: <DeleteIcon />,
						onClick: () => {
							setSelectedId(params.row.id);
							setShowDeleteModal(true);
						},
						color: 'error' as const,
					});
				}
				return <MobileActionsMenu actions={actions} desktopGap={0.5} />;
			},
		},
	];

	const stats = listData?.stats;
	const supplierKpis = useMemo(
		() =>
			(stats?.kpi_fournisseurs ?? []).map((supplier, index) => ({
				id: `supplier-${index}-${supplier.fournisseur || 'unknown'}`,
				name: supplier.fournisseur || '-',
				total_commandes: supplier.total_commandes,
				cout_total: supplier.cout_total,
			})),
		[stats],
	);
	const maxSupplierCost = Math.max(...supplierKpis.map((supplier) => numericValue(supplier.cout_total)), 1);
	const maxSupplierOrders = Math.max(...supplierKpis.map((supplier) => supplier.total_commandes), 1);

	return (
		<>
			<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, mt: { xs: 1, sm: 2, md: 3 } }}>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: '1fr 1fr 1fr' },
						gap: 2,
						mb: 3,
					}}
				>
					<DashboardStatCard
						icon={<RequestQuoteIcon />}
						label={t.logistique.totalOrders}
						value={String(stats?.total_commandes ?? 0)}
						color="#1565C0"
						testId="logistique-stats-total"
					/>
					<DashboardStatCard
						icon={<WarehouseIcon />}
						label={t.logistique.inProgress}
						value={String(stats?.commandes_en_cours ?? 0)}
						color="#2E7D32"
						testId="logistique-stats-progress"
					/>
					<DashboardStatCard
						icon={<ErrorOutlinedIcon />}
						label={t.logistique.delays}
						value={String(stats?.retards ?? 0)}
						color="#D32F2F"
						valueColor="error.main"
						testId="logistique-stats-delays"
					/>
					<DashboardStatCard
						icon={<PaymentIcon />}
						label={t.logistique.pendingPayments}
						value={String(stats?.paiements_en_attente ?? 0)}
						color="#ED6C02"
						testId="logistique-stats-payments"
					/>
					<DashboardStatCard
						icon={<LocalShippingIcon />}
						label={t.logistique.deliveries}
						value={String(stats?.livraisons ?? 0)}
						color="#00838F"
						testId="logistique-stats-deliveries"
					/>
					<DashboardStatCard
						icon={<AssignmentTurnedInIcon />}
						label={t.logistique.logisticsCosts}
						value={formatMoney(stats?.couts_logistiques ?? 0)}
						color="#6A1B9A"
						testId="logistique-stats-costs"
					/>
					<DashboardStatCard
						icon={<PaymentIcon />}
						label={t.logistique.swiftMissing}
						value={String(stats?.swift_manquant ?? 0)}
						color="#C62828"
						testId="logistique-stats-swift"
					/>
					<DashboardStatCard
						icon={<RequestQuoteIcon />}
						label={t.logistique.docsMissing}
						value={String(stats?.documents_non_recus ?? 0)}
						color="#455A64"
						testId="logistique-stats-docs"
					/>
					<DashboardStatCard
						icon={<LocalShippingIcon />}
						label={t.logistique.transitNotStarted}
						value={String(stats?.transit_non_lance ?? 0)}
						color="#00695C"
						testId="logistique-stats-transit"
					/>
				</Box>
				{supplierKpis.length ? (
					<Box sx={{ mb: 3 }}>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'baseline',
								gap: 2,
								mb: 1.5,
								flexWrap: 'wrap',
							}}
						>
							<Typography variant="h6" sx={{ fontWeight: 800 }}>
								{t.logistique.supplierKpiSection}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{t.logistique.supplierKpiComparisonHint}
							</Typography>
						</Box>
						<Box sx={{ display: 'grid', gap: 1.25 }}>
							{supplierKpis.map((supplier, index) => {
								const costValue = numericValue(supplier.cout_total);
								const costPercent = Math.max(5, Math.round((costValue / maxSupplierCost) * 100));
								const orderPercent = Math.max(5, Math.round((supplier.total_commandes / maxSupplierOrders) * 100));
								return (
									<Box
										key={supplier.id}
										sx={{
											border: '1px solid',
											borderColor: 'divider',
											borderRadius: 2,
											bgcolor: 'background.paper',
											p: { xs: 1.5, sm: 2 },
											display: 'grid',
											gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 0.8fr) minmax(320px, 1.6fr)' },
											gap: { xs: 1.25, md: 2 },
											alignItems: 'center',
											minWidth: 0,
											boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
										}}
									>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
											<Box
												sx={{
													width: 34,
													height: 34,
													borderRadius: '50%',
													display: 'grid',
													placeItems: 'center',
													bgcolor: index === 0 ? 'primary.main' : 'grey.100',
													color: index === 0 ? 'primary.contrastText' : 'text.primary',
													fontWeight: 800,
													flexShrink: 0,
												}}
											>
												{index + 1}
											</Box>
											<Box sx={{ minWidth: 0 }}>
												<DarkTooltip title={supplier.name}>
													<Typography variant="subtitle2" noWrap sx={{ fontWeight: 800 }}>
														{supplier.name}
													</Typography>
												</DarkTooltip>
											</Box>
										</Box>
										<Box sx={{ display: 'grid', gap: 1, minWidth: 0 }}>
											<Box sx={{ display: 'grid', gap: 0.5, minWidth: 0 }}>
												<Box
													sx={{
														display: 'flex',
														alignItems: 'baseline',
														justifyContent: 'space-between',
														gap: 1,
														minWidth: 0,
													}}
												>
													<Typography variant="caption" color="text.secondary">
														{t.logistique.colCoutTotal}
													</Typography>
													<Typography
														variant="caption"
														sx={{ fontWeight: 800, color: 'text.primary', textAlign: 'right' }}
													>
														{formatMoney(supplier.cout_total)} · {costPercent}% {t.logistique.supplierKpiRelativeToMax}
													</Typography>
												</Box>
												<Box sx={{ height: 9, borderRadius: 999, bgcolor: 'grey.100', overflow: 'hidden' }}>
													<Box
														sx={{
															width: `${costPercent}%`,
															height: '100%',
															bgcolor: 'primary.main',
															borderRadius: 999,
														}}
													/>
												</Box>
											</Box>
											<Box sx={{ display: 'grid', gap: 0.5, minWidth: 0 }}>
												<Box
													sx={{
														display: 'flex',
														alignItems: 'baseline',
														justifyContent: 'space-between',
														gap: 1,
														minWidth: 0,
													}}
												>
													<Typography variant="caption" color="text.secondary">
														{t.logistique.ordersCount}
													</Typography>
													<Typography
														variant="caption"
														sx={{ fontWeight: 800, color: 'text.primary', textAlign: 'right' }}
													>
														{supplier.total_commandes} · {orderPercent}% {t.logistique.supplierKpiRelativeToMax}
													</Typography>
												</Box>
												<Box sx={{ height: 9, borderRadius: 999, bgcolor: 'grey.100', overflow: 'hidden' }}>
													<Box
														sx={{
															width: `${orderPercent}%`,
															height: '100%',
															bgcolor: 'success.main',
															borderRadius: 999,
														}}
													/>
												</Box>
											</Box>
										</Box>
									</Box>
								);
							})}
						</Box>
					</Box>
				) : null}
				<Divider sx={{ mb: 2 }} />
			</Box>
			{canManage && (
				<Box
					sx={{
						width: '100%',
						display: 'flex',
						justifyContent: 'flex-start',
						gap: 2,
						px: { xs: 1, sm: 2, md: 3 },
						mt: { xs: 1, sm: 2, md: 3 },
						mb: { xs: 1, sm: 2, md: 3 },
						flexWrap: 'wrap',
					}}
				>
					<Button
						variant="contained"
						onClick={() => router.push(LOGISTIQUE_ADD(company_id))}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
						startIcon={<AddIcon fontSize="small" />}
					>
						{t.logistique.newOrder}
					</Button>
					{canDelete && selectedIds.length > 0 && (
						<Button
							variant="outlined"
							color="error"
							startIcon={<DeleteIcon fontSize="small" />}
							onClick={() => setShowBulkDeleteModal(true)}
							sx={{
								whiteSpace: 'nowrap',
								px: { xs: 1.5, sm: 2, md: 3 },
								py: { xs: 0.8, sm: 1, md: 1 },
								fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
							}}
						>
							{t.logistique.bulkDeleteBtn(selectedIds.length)}
						</Button>
					)}
				</Box>
			)}
			<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} />
			<PaginatedDataGrid
				data={listData}
				isLoading={isLoading}
				columns={columns}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				filterModel={filterModel}
				onFilterModelChange={setFilterModel}
				onCustomFilterParamsChange={setCustomFilterParams}
				toolbar={{ quickFilter: true, debounceMs: 500 }}
				checkboxSelection={canDelete}
				selectedIds={selectedIds}
				onSelectionChange={setSelectedIds}
				gridMaxWidth={false}
			/>
			{showDeleteModal && (
				<ActionModals
					title={t.logistique.deleteModalTitle}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					body={t.logistique.deleteModalBody}
					actions={[
						{
							text: t.common.cancel,
							active: false,
							onClick: () => setShowDeleteModal(false),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{ text: t.common.delete, active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}
			{showBulkDeleteModal && (
				<ActionModals
					title={t.logistique.bulkDeleteModalTitle(selectedIds.length)}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					body={t.logistique.bulkDeleteModalBody(selectedIds.length)}
					actions={[
						{
							text: t.common.cancel,
							active: false,
							onClick: () => setShowBulkDeleteModal(false),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{
							text: t.logistique.bulkDeleteBtn(selectedIds.length),
							active: true,
							onClick: bulkDeleteHandler,
							icon: <DeleteIcon />,
							color: '#D32F2F',
						},
					]}
				/>
			)}
		</>
	);
};

const LogistiqueListClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperList session={session} title={t.logistique.listTitle}>
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default LogistiqueListClient;
