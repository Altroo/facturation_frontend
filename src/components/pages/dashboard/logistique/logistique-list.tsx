'use client';

import { extractApiErrorMessage, formatDate, formatNumberWithSpaces, runWithCleanup } from '@/utils/helpers';
import { type FC, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Box, Chip, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ActionItem, ChipFilterConfig } from '@/types/uiTypes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
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
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import {
	logistiqueGlobalStatusItemsList as logisticsStatuses,
	logistiqueImportTitleStatusItemsList as importTitleStatuses,
	logistiqueManagerRoles,
	logistiquePaymentStatusItemsList as paymentStatuses,
} from '@/utils/rawData';
import type { SessionProps } from '@/types/_initTypes';
import type {
	LogistiqueListFormikContentProps as FormikContentProps,
	LogistiqueListResponse,
	LogistiqueOrder,
	LogistiquePaymentStatus,
} from '@/types/logistiqueTypes';

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

const FormikContent: FC<FormikContentProps> = ({ session, company_id, role }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const token = useInitAccessToken(session);
	const currentUserId = useAppSelector(getInitStateToken).user.pk;
	const canManage = logistiqueManagerRoles.has(role);
	const canDelete = role === 'Caissier';

	const [paginationModel, setPaginationModel, sorting] = useDataGridPagination(10, { company_id });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const mergedFilterParams = { ...chipFilterParams, ...customFilterParams };

	const { data, isLoading, refetch } = useGetLogistiqueListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			ordering: sorting.ordering,
			search: searchTerm,
			...mergedFilterParams,
		},
		{ skip: !token },
	);
	const listData = data as LogistiqueListResponse | undefined;
	const supplierFilterOptions = (listData?.stats.fournisseurs ?? []).map((item) => ({
		value: item.fournisseur,
		label: item.fournisseur,
	}));
	const statusFilterOptions = logisticsStatuses.map((value) => ({ value, label: value, color: statusColor(value) }));
	const paymentFilterOptions = paymentStatuses.map((value) => ({ value, label: value, color: paymentColor(value) }));
	const importTitleFilterOptions = importTitleStatuses.map((value) => ({ value, label: value }));
	const chipFilters: ChipFilterConfig[] = [
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
	];

	const [deleteLogistique] = useDeleteLogistiqueMutation();
	const [bulkDeleteLogistique] = useBulkDeleteLogistiqueMutation();

	const deleteHandler = async () => {
		if (!selectedId) return;
		await runWithCleanup(
			async () => {
				try {
					await deleteLogistique({ id: selectedId }).unwrap();
					onSuccess(t.logistique.deleteSuccess);
					refetch();
				} catch (err) {
					onError(extractApiErrorMessage(err, t.logistique.deleteError));
				}
			},
			() => {
				setShowDeleteModal(false);
				setSelectedId(null);
			},
		);
	};

	const bulkDeleteHandler = async () => {
		await runWithCleanup(
			async () => {
				try {
					await bulkDeleteLogistique({ ids: selectedIds }).unwrap();
					onSuccess(t.logistique.bulkDeleteSuccess(selectedIds.length));
					refetch();
				} catch (err) {
					onError(extractApiErrorMessage(err, t.logistique.bulkDeleteError));
				}
			},
			() => {
				setSelectedIds([]);
				setShowBulkDeleteModal(false);
			},
		);
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
					canManage || (params.row.responsable === currentUserId && params.row.statut_paiement === 'Non demandé');
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

	return (
		<>
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
							onClick={() => setShowBulkDeleteModal(true)}
							startIcon={<DeleteIcon fontSize="small" />}
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
				sorting={sorting}
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

const LogistiqueListClient: FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperList session={session} title={t.logistique.listTitle}>
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default LogistiqueListClient;
