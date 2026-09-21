'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Chip, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import type { GridColDef, GridFilterModel, GridRenderCellParams } from '@mui/x-data-grid';
import { GridLogicOperator } from '@mui/x-data-grid';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import type { ActionItem } from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import {
	useCancelStockReceiptMutation,
	useGetStockReceiptsQuery,
	useValidateStockReceiptMutation,
} from '@/store/services/stock';
import type { SessionProps } from '@/types/_initTypes';
import type { StockReceipt } from '@/types/stockTypes';
import { extractApiErrorMessage, formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import { STOCK_RECEIPTS_ADD, STOCK_RECEIPT_VIEW } from '@/utils/routes';

const receiptStatusOptions = [
	{ id: 'draft', nom: 'Brouillon', value: 'draft', label: 'Brouillon' },
	{ id: 'validated', nom: 'Validée', value: 'validated', label: 'Validée' },
	{ id: 'cancelled', nom: 'Annulée', value: 'cancelled', label: 'Annulée' },
];

const receiptStatusLabel = (status: StockReceipt['status']) =>
	receiptStatusOptions.find((option) => option.value === status)?.label ?? status;

const receiptStatusColor = (status: StockReceipt['status']): 'default' | 'success' | 'error' => {
	if (status === 'validated') return 'success';
	if (status === 'cancelled') return 'error';
	return 'default';
};

const StockReceiptsContent: React.FC<{ company_id: number; role: string }> = ({ company_id, role }) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const canReceive = role === 'Logistique';
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [pendingAction, setPendingAction] = useState<{ type: 'validate' | 'cancel'; id: number } | null>(null);
	const filters = useMemo(
		() => ({ ...chipFilterParams, ...customFilterParams }),
		[chipFilterParams, customFilterParams],
	);
	const receipts = useGetStockReceiptsQuery({
		company_id,
		page: paginationModel.page + 1,
		pageSize: paginationModel.pageSize,
		search: searchTerm,
		filters,
	});
	const logisticsOrderOptions = useMemo(
		() =>
			Array.from(
				new Map(
					(receipts.data?.results ?? []).map((receipt) => [
						receipt.logistics_order,
						{ id: receipt.logistics_order, nom: receipt.logistics_order_number },
					]),
				).values(),
			),
		[receipts.data?.results],
	);
	const chipFilters = useMemo<ChipFilterConfig[]>(
		() => [
			{ key: 'status', label: 'Statut', paramName: 'statuses', options: receiptStatusOptions },
			{ key: 'logistics', label: 'Dossier logistique', paramName: 'logistics_order_ids', options: logisticsOrderOptions },
		],
		[logisticsOrderOptions],
	);
	const [validateReceipt, validateState] = useValidateStockReceiptMutation();
	const [cancelReceipt, cancelState] = useCancelStockReceiptMutation();

	const handleValidate = useCallback(async (id: number) => {
		try {
			await validateReceipt({ company_id, id }).unwrap();
			onSuccess('Réception validée et ajoutée au stock.');
		} catch (error) {
			onError(extractApiErrorMessage(error, 'Impossible de valider la réception.'));
		} finally {
			setPendingAction(null);
		}
	}, [company_id, onError, onSuccess, validateReceipt]);

	const handleCancel = useCallback(async (id: number) => {
		try {
			await cancelReceipt({ company_id, id }).unwrap();
			onSuccess('Réception annulée.');
		} catch (error) {
			onError(extractApiErrorMessage(error, "Impossible d'annuler la réception."));
		} finally {
			setPendingAction(null);
		}
	}, [cancelReceipt, company_id, onError, onSuccess]);

	const columns = useMemo<GridColDef[]>(
		() => [
			{
				field: 'reference',
				headerName: 'Référence',
				minWidth: 130,
				flex: 0.9,
				valueGetter: (value: string | null | undefined, row: StockReceipt) => value || `REC-${row.id}`,
			},
			{ field: 'logistics_order_number', headerName: 'Dossier logistique', minWidth: 145, flex: 0.9 },
			{
				field: 'lines',
				headerName: 'Articles reçus',
				minWidth: 145,
				flex: 1,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<StockReceipt>) => (
					<Typography variant="body2" color="primary" noWrap sx={{ fontWeight: 600 }}>
						{params.row.lines
							.map((line) => `${line.article_reference}: ${formatNumberWithSpaces(line.quantity, 3)}`)
							.join(', ')}
					</Typography>
				),
			},
			{
				field: 'status',
				headerName: 'Statut',
				minWidth: 115,
				flex: 0.8,
				filterOperators: createDropdownFilterOperators(receiptStatusOptions, 'Tous les statuts', true),
				renderCell: (params: GridRenderCellParams<StockReceipt>) => (
					<Chip
						size="small"
						variant="outlined"
						label={receiptStatusLabel(params.row.status)}
						color={receiptStatusColor(params.row.status)}
					/>
				),
			},
			{ field: 'created_by_name', headerName: 'Créée par', minWidth: 140, flex: 0.9 },
			{
				field: 'date_created',
				headerName: 'Date',
				minWidth: 155,
				flex: 1.3,
				filterOperators: createDateRangeFilterOperator('entre'),
				renderCell: (params: GridRenderCellParams<StockReceipt>) => (
					<Typography variant="body2" noWrap>
						{formatDate(params.row.date_created).split(',')[0]}
					</Typography>
				),
			},
			{
				field: 'actions',
				headerName: 'Actions',
				minWidth: 130,
				flex: 1.1,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<StockReceipt>) => {
					const actions: ActionItem[] = [
						{
							label: 'Voir la réception',
							icon: <VisibilityIcon />,
							onClick: () => router.push(STOCK_RECEIPT_VIEW(params.row.id, company_id)),
							color: 'info' as const,
						},
					];
					if (canReceive && params.row.status === 'draft') {
						actions.push({
							label: 'Valider la réception',
							icon: <CheckCircleIcon />,
							onClick: () => setPendingAction({ type: 'validate', id: params.row.id }),
							color: 'success' as const,
							disabled: validateState.isLoading,
						});
					}
					if (canReceive && params.row.status === 'validated') {
						actions.push({
							label: 'Annuler la réception',
							icon: <CancelIcon />,
							onClick: () => setPendingAction({ type: 'cancel', id: params.row.id }),
							color: 'error' as const,
							disabled: cancelState.isLoading,
						});
					}
					return <MobileActionsMenu actions={actions} />;
				},
			},
		],
		[canReceive, cancelState.isLoading, company_id, router, validateState.isLoading],
	);

	return (
		<>
			{canReceive && (
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
					<Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push(STOCK_RECEIPTS_ADD(company_id))}>
						Nouvelle réception
					</Button>
				</Box>
			)}
			<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} />
			<PaginatedDataGrid
				data={receipts.data}
				isLoading={receipts.isLoading || receipts.isFetching}
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
			{pendingAction?.type === 'validate' && (
				<ActionModals
					title="Valider la réception"
					body="Voulez-vous vraiment valider cette réception ? Les quantités reçues seront ajoutées au stock."
					titleIcon={<CheckCircleIcon />}
					titleIconColor="#2E7D32"
					onClose={() => setPendingAction(null)}
					actions={[
						{
							text: 'Annuler',
							active: false,
							onClick: () => setPendingAction(null),
							icon: <CloseIcon />,
							color: '#6B6B6B',
							disabled: validateState.isLoading,
						},
						{
							text: 'Valider',
							active: true,
							onClick: () => handleValidate(pendingAction.id),
							icon: <CheckCircleIcon />,
							color: '#2E7D32',
							disabled: validateState.isLoading,
						},
					]}
				/>
			)}
			{pendingAction?.type === 'cancel' && (
				<ActionModals
					title="Annuler la réception"
					body="Voulez-vous vraiment annuler cette réception ? Les quantités validées seront retirées du stock."
					titleIcon={<CancelIcon />}
					titleIconColor="#D32F2F"
					onClose={() => setPendingAction(null)}
					actions={[
						{
							text: 'Retour',
							active: false,
							onClick: () => setPendingAction(null),
							icon: <CloseIcon />,
							color: '#6B6B6B',
							disabled: cancelState.isLoading,
						},
						{
							text: 'Annuler la réception',
							active: true,
							onClick: () => handleCancel(pendingAction.id),
							icon: <CancelIcon />,
							color: '#D32F2F',
							disabled: cancelState.isLoading,
						},
					]}
				/>
			)}
		</>
	);
};

const StockReceiptsListClient: React.FC<SessionProps> = ({ session }) => {
	const searchParams = useSearchParams();
	const requestedCompanyId = Number(searchParams.get('company_id')) || undefined;
	return (
		<CompanyDocumentsWrapperList session={session} title="Réceptions de stock" requestedCompanyId={requestedCompanyId}>
			{({ company_id, role }) => <StockReceiptsContent company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default StockReceiptsListClient;
