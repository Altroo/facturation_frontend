'use client';

import { startTransition, useRef, useState, type FC } from 'react';
import { GridLogicOperator, type GridColDef, type GridFilterModel } from '@mui/x-data-grid';
import { Alert, Button, Box } from '@mui/material';
import { Add, Close, Delete, Edit, Visibility } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import SupplierDeleteDialog from './logistique-supplier-delete-dialog';
import { LOGISTIQUE_SUPPLIER_ADD, LOGISTIQUE_SUPPLIER_EDIT, LOGISTIQUE_SUPPLIER_VIEW } from '@/utils/routes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useBulkDeleteLogistiqueSuppliersMutation,
	useGetLogistiqueSuppliersQuery,
	useLazyGetLogistiqueSuppliersQuery,
} from '@/store/services/logistique';
import type {
	ApiErrorResponseType,
	PaginationResponseType,
	ResponseDataInterface,
	SessionProps,
} from '@/types/_initTypes';
import type { LogistiqueSupplier, LogistiqueListFormikContentProps as ContentProps } from '@/types/logistiqueTypes';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';

const SupplierListContent: FC<ContentProps> = ({ session, company_id, role }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const router = useRouter();
	const canManage = ['Caissier', 'Commercial', 'Logistique'].includes(role);
	const canDelete = role === 'Caissier';
	const { onSuccess, onError } = useToast();
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
	const [bulkError, setBulkError] = useState('');
	const selectionGeneration = useRef(0);
	const [fetchAllSuppliers, { isFetching: selectingAll }] = useLazyGetLogistiqueSuppliersQuery();
	const [bulkDeleteSuppliers, { isLoading: deletingSuppliers }] = useBulkDeleteLogistiqueSuppliersMutation();
	const clearSelection = () => {
		selectionGeneration.current += 1;
		setSelectedIds([]);
		setIsAllMatchingSelected(false);
		setShowBulkDeleteModal(false);
		setBulkError('');
	};
	const [deleting, setDeleting] = useState<LogistiqueSupplier | null>(null);
	const [paginationModel, setPaginationModel, sorting] = useDataGridPagination(10, { company_id });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const { currentData, isFetching, error } = useGetLogistiqueSuppliersQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			ordering: sorting.ordering,
			search: searchTerm,
			...customFilterParams,
		},
		{ skip: !token },
	);
	const data = currentData as PaginationResponseType<LogistiqueSupplier> | undefined;
	const apiError = error as ResponseDataInterface<ApiErrorResponseType> | undefined;
	const selectAllMatching = async () => {
		if (!canDelete || !token) return;
		const generation = ++selectionGeneration.current;
		try {
			const result = await fetchAllSuppliers({
				company_id,
				with_pagination: false,
				search: searchTerm,
				...customFilterParams,
			}).unwrap();
			if (generation !== selectionGeneration.current) return;
			setSelectedIds((Array.isArray(result) ? result : result.results).map((supplier) => supplier.id));
			setIsAllMatchingSelected(true);
		} catch {
			if (generation === selectionGeneration.current) onError(t.shared.selectionError);
		}
	};
	const confirmBulkDelete = async () => {
		if (!canDelete || !token || !selectedIds.length || deletingSuppliers) return;
		setBulkError('');
		try {
			await bulkDeleteSuppliers({ company_id, ids: selectedIds }).unwrap();
			onSuccess(t.logistique.suppliersDeleted(selectedIds.length));
			clearSelection();
			setPaginationModel((previous) => ({ ...previous, page: 0 }));
		} catch (e) {
			setBulkError(extractApiErrorMessage(e, t.logistique.supplierBulkDeleteError));
		}
	};
	const columns: GridColDef[] = [
		{ field: 'nom', headerName: t.logistique.colFournisseur, minWidth: 200, flex: 1.3 },
		{
			field: 'email',
			headerName: t.logistique.colSupplierEmail,
			minWidth: 220,
			flex: 1.3,
			valueFormatter: (value: string) => value || '-',
		},
		{
			field: 'total_dossiers',
			headerName: t.logistique.ordersCount,
			type: 'number',
			minWidth: 120,
			flex: 0.6,
			filterOperators: createNumericFilterOperators(),
		},
		{
			field: 'derniere_activite',
			headerName: t.logistique.colLastActivity,
			minWidth: 210,
			flex: 1,
			type: 'dateTime',
			valueGetter: (value: string | null) => (value ? new Date(value) : null),
			valueFormatter: (value: Date | null) => (value ? formatDate(value.toISOString()) : '-'),
			filterOperators: createDateRangeFilterOperator(),
		},
		{
			field: 'actions',
			disableColumnMenu: true,
			resizable: false,
			headerName: t.common.actions,
			sortable: false,
			filterable: false,
			minWidth: 150,
			flex: 0.7,
			renderCell: ({ row }) => (
				<MobileActionsMenu
					actions={[
						{
							label: t.common.view,
							icon: <Visibility />,
							color: 'info',
							onClick: () => router.push(LOGISTIQUE_SUPPLIER_VIEW(row.id, company_id)),
						},
						{
							label: t.common.edit,
							icon: <Edit />,
							color: 'primary',
							show: canManage,
							onClick: () => router.push(LOGISTIQUE_SUPPLIER_EDIT(row.id, company_id)),
						},
						{
							label: t.common.delete,
							icon: <Delete />,
							color: 'error',
							show: canDelete,
							onClick: () => setDeleting(row),
						},
					]}
				/>
			),
		},
	];

	if (apiError) return <ApiAlert errorDetails={apiError.data?.details} />;

	return (
		<>
			{canManage && (
				<Box
					sx={{
						px: { xs: 1, sm: 2, md: 3 },
						my: { xs: 1, sm: 2, md: 3 },
						display: 'flex',
						gap: 2,
						flexWrap: 'wrap',
						alignItems: 'center',
					}}
				>
					<Button
						variant="contained"
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
						startIcon={<Add fontSize="small" />}
						onClick={() => router.push(LOGISTIQUE_SUPPLIER_ADD(company_id))}
					>
						{t.logistique.supplierNew}
					</Button>
					{canDelete && selectedIds.length > 0 && (
						<Button
							variant="outlined"
							sx={{
								whiteSpace: 'nowrap',
								px: { xs: 1.5, sm: 2, md: 3 },
								py: { xs: 0.8, sm: 1, md: 1 },
								fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
							}}
							color="error"
							startIcon={<Delete fontSize="small" />}
							disabled={deletingSuppliers}
							onClick={() => {
								setBulkError('');
								setShowBulkDeleteModal(true);
							}}
						>
							{t.logistique.bulkDeleteBtn(selectedIds.length)}
						</Button>
					)}
				</Box>
			)}
			<PaginatedDataGrid
				data={data}
				isLoading={isFetching || !token}
				columns={columns}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				sorting={sorting}
				searchTerm={searchTerm}
				setSearchTerm={(next) => {
					const nextSearch = typeof next === 'function' ? next(searchTerm) : next;
					if (nextSearch === searchTerm) return;
					clearSelection();
					startTransition(() => {
						setPaginationModel((previous) => ({ ...previous, page: 0 }));
						setSearchTerm(nextSearch);
					});
				}}
				filterModel={filterModel}
				onFilterModelChange={setFilterModel}
				onCustomFilterParamsChange={(params) => {
					if (JSON.stringify(params) === JSON.stringify(customFilterParams)) return;
					clearSelection();
					startTransition(() => {
						setPaginationModel((previous) => ({ ...previous, page: 0 }));
						setCustomFilterParams(params);
					});
				}}
				toolbar={{ quickFilter: true, debounceMs: 500 }}
				checkboxSelection={canDelete}
				selectedIds={selectedIds}
				onSelectionChange={(ids) => {
					selectionGeneration.current += 1;
					setSelectedIds(ids);
					setIsAllMatchingSelected(false);
				}}
				totalMatchingCount={data?.count}
				onSelectAllMatchingClick={canDelete ? selectAllMatching : undefined}
				selectAllMatchingLoading={selectingAll}
				isAllMatchingSelected={isAllMatchingSelected}
				onClearAllMatchingSelected={clearSelection}
				gridMaxWidth={false}
			/>
			{deleting && (
				<SupplierDeleteDialog
					supplier={deleting}
					onClose={() => setDeleting(null)}
					beforeDelete={() => setPaginationModel((p) => ({ ...p, page: 0 }))}
					onDeleted={() => {
						selectionGeneration.current += 1;
						setSelectedIds((ids) => ids.filter((id) => id !== deleting.id));
						setIsAllMatchingSelected(false);
						setDeleting(null);
					}}
				/>
			)}
			{showBulkDeleteModal && canDelete && (
				<ActionModals
					title={t.logistique.supplierBulkDeleteTitle(selectedIds.length)}
					titleIcon={<Delete />}
					titleIconColor="#D32F2F"
					body={t.logistique.supplierBulkDeleteBody(selectedIds.length)}
					onClose={() => {
						if (!deletingSuppliers) setShowBulkDeleteModal(false);
					}}
					actions={[
						{
							text: t.common.cancel,
							active: false,
							icon: <Close />,
							disabled: deletingSuppliers,
							onClick: () => setShowBulkDeleteModal(false),
						},
						{
							text: deletingSuppliers ? t.common.loading : t.logistique.bulkDeleteBtn(selectedIds.length),
							active: true,
							icon: <Delete />,
							color: '#D32F2F',
							disabled: deletingSuppliers,
							onClick: confirmBulkDelete,
						},
					]}
				>
					{bulkError && <Alert severity="error">{bulkError}</Alert>}
				</ActionModals>
			)}
		</>
	);
};

const LogistiqueSuppliers: FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperList session={session} title={t.navigation.logistiqueSuppliers}>
			{({ company_id, role }) => (
				<SupplierListContent key={company_id} session={session} company_id={company_id} role={role} />
			)}
		</CompanyDocumentsWrapperList>
	);
};

export default LogistiqueSuppliers;
