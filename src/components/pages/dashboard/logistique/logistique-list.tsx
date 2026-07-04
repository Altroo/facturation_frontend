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
import {
	useBulkDeleteLogistiqueMutation,
	useDeleteLogistiqueMutation,
	useGetLogistiqueListQuery,
	useRequestLogistiquePaymentMutation,
} from '@/store/services/logistique';
import { useGetMarqueListQuery } from '@/store/services/parameter';
import { LOGISTIQUE_ADD, LOGISTIQUE_EDIT, LOGISTIQUE_VIEW } from '@/utils/routes';
import { extractApiErrorMessage, formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import type { SessionProps } from '@/types/_initTypes';
import type { LogistiqueListResponse, LogistiqueOrder, LogistiquePaymentStatus, LogistiqueStatut } from '@/types/logistiqueTypes';

interface FormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

const managerRoles = new Set(['Caissier', 'Commercial', 'Logistique']);

const logisticsStatuses: LogistiqueStatut[] = [
	'Réception commande',
	'Commande fournisseur',
	'Proforma',
	"Titre d'Importation",
	'Validation',
	'Paiement demandé',
	'Paiement effectué',
	'SWIFT / Draft LC',
	'Envoi SWIFT / Draft LC',
	'Production',
	'Expédition',
	'Documents originaux',
	'Transit',
	'Dédouanement',
	'Réception locale',
	'Livraison client',
	'Clôture',
	'Annulé',
];

const paymentStatuses: LogistiquePaymentStatus[] = ['Non demandé', 'En attente', 'Validé', 'Rejeté'];

const statusColor = (status: string) => {
	if (status === 'Clôture' || status === 'Livraison client') return 'success' as const;
	if (status === 'Annulé' || status === 'Rejeté') return 'error' as const;
	if (status.includes('Paiement') || status.includes('SWIFT')) return 'warning' as const;
	return 'info' as const;
};

const paymentColor = (status: LogistiquePaymentStatus) => {
	if (status === 'Validé') return 'success' as const;
	if (status === 'Rejeté') return 'error' as const;
	if (status === 'En attente') return 'warning' as const;
	return 'default' as const;
};

const formatMoney = (value: string | number | null | undefined, devise = 'MAD') =>
	`${formatNumberWithSpaces(value ?? 0, 2)} ${devise}`;

const FormikContent: React.FC<FormikContentProps> = ({ session, company_id, role }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const token = useInitAccessToken(session);
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

	const { data: marques } = useGetMarqueListQuery({ company_id }, { skip: !token });
	const chipFilters: ChipFilterConfig[] = useMemo(
		() => [{ key: 'marque', label: t.logistique.colMarque, paramName: 'marque_ids', options: marques ?? [] }],
		[marques, t.logistique.colMarque],
	);
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

	const [deleteLogistique] = useDeleteLogistiqueMutation();
	const [bulkDeleteLogistique] = useBulkDeleteLogistiqueMutation();
	const [requestPayment] = useRequestLogistiquePaymentMutation();

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

	const requestPaymentHandler = async (id: number) => {
		try {
			await requestPayment({ id }).unwrap();
			onSuccess(t.logistique.requestPaymentSuccess);
			refetch();
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.requestPaymentError));
		}
	};

	const columns: GridColDef[] = [
		{
			field: 'numero_commande',
			headerName: t.logistique.colNumero,
			flex: 1,
			minWidth: 130,
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
			flex: 1.2,
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
			field: 'marque_name',
			headerName: t.logistique.colMarque,
			flex: 1,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => params.value || '-',
		},
		{
			field: 'clients_display',
			headerName: t.logistique.colClients,
			flex: 1.4,
			minWidth: 170,
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
			minWidth: 130,
			filterOperators: createDateRangeFilterOperator(t.filterPanel.between),
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => formatDate(params.value as string | null),
		},
		{
			field: 'statut',
			headerName: t.logistique.colStatut,
			flex: 1.2,
			minWidth: 170,
			filterOperators: createDropdownFilterOperators(
				logisticsStatuses.map((value) => ({ value, label: value })),
				t.common.allStatuses,
				true,
				t.filterPanel.is,
			),
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => (
				<Chip label={params.value} size="small" color={statusColor(params.value as string)} variant="outlined" />
			),
		},
		{
			field: 'statut_paiement',
			headerName: t.logistique.colPaiement,
			flex: 1,
			minWidth: 135,
			filterOperators: createDropdownFilterOperators(
				paymentStatuses.map((value) => ({ value, label: value })),
				t.common.allStatuses,
				true,
				t.filterPanel.is,
			),
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => (
				<Chip
					label={params.value}
					size="small"
					color={paymentColor(params.value as LogistiquePaymentStatus)}
					variant="outlined"
				/>
			),
		},
		{
			field: 'cout_total',
			headerName: t.logistique.colCoutTotal,
			flex: 1,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => (
				<Typography variant="body2" color="primary" sx={{ fontWeight: 600 }} noWrap>
					{formatMoney(params.value, params.row.devise)}
				</Typography>
			),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 1.7,
			minWidth: 180,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<LogistiqueOrder>) => {
				const actions: ActionItem[] = [
					{
						label: t.common.view,
						icon: <VisibilityIcon />,
						onClick: () => router.push(LOGISTIQUE_VIEW(params.row.id, company_id)),
						color: 'info' as const,
					},
				];
				if (canManage) {
					actions.push({
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(LOGISTIQUE_EDIT(params.row.id, company_id)),
						color: 'primary' as const,
					});
					if (params.row.statut_paiement === 'Non demandé') {
						actions.push({
							label: t.logistique.requestPayment,
							icon: <PaymentIcon />,
							onClick: () => requestPaymentHandler(params.row.id),
							color: 'success' as const,
						});
					}
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
				return <MobileActionsMenu actions={actions} />;
			},
		},
	];

	const stats = listData?.stats;

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
				</Box>
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
						startIcon={<AddIcon fontSize="small" />}
						onClick={() => router.push(LOGISTIQUE_ADD(company_id))}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
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
			/>
			{showDeleteModal && (
				<ActionModals
					title={t.logistique.deleteModalTitle}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					body={t.logistique.deleteModalBody}
					actions={[
						{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
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
						{ text: t.common.cancel, active: false, onClick: () => setShowBulkDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
						{ text: t.logistique.bulkDeleteBtn(selectedIds.length), active: true, onClick: bulkDeleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
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
