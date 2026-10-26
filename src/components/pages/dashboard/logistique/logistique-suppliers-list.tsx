'use client';

import { startTransition, useState, type FC } from 'react';
import { GridLogicOperator, type GridColDef, type GridFilterModel } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import SupplierDeleteDialog from './logistique-supplier-delete-dialog';
import { LOGISTIQUE_SUPPLIER_ADD, LOGISTIQUE_SUPPLIER_EDIT, LOGISTIQUE_SUPPLIER_VIEW } from '@/utils/routes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetLogistiqueSuppliersQuery } from '@/store/services/logistique';
import type {
	ApiErrorResponseType,
	PaginationResponseType,
	ResponseDataInterface,
	SessionProps,
} from '@/types/_initTypes';
import type { LogistiqueSupplier, LogistiqueListFormikContentProps as ContentProps } from '@/types/logistiqueTypes';
import { formatDate } from '@/utils/helpers';
import { useLanguage } from '@/utils/hooks';

const SupplierListContent: FC<ContentProps> = ({ session, company_id, role }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const router = useRouter();
	const canManage = ['Caissier', 'Commercial', 'Logistique'].includes(role);
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
							show: role === 'Caissier',
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
				<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, my: { xs: 1, sm: 2, md: 3 } }}>
					<PrimaryLoadingButton
						buttonText={t.logistique.supplierNew}
						size="small"
						loading={false}
						active
						startIcon={<Add />}
						onClick={() => router.push(LOGISTIQUE_SUPPLIER_ADD(company_id))}
					/>
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
					startTransition(() => {
						setPaginationModel((previous) => ({ ...previous, page: 0 }));
						setSearchTerm(nextSearch);
					});
				}}
				filterModel={filterModel}
				onFilterModelChange={setFilterModel}
				onCustomFilterParamsChange={(params) => {
					if (JSON.stringify(params) === JSON.stringify(customFilterParams)) return;
					startTransition(() => {
						setPaginationModel((previous) => ({ ...previous, page: 0 }));
						setCustomFilterParams(params);
					});
				}}
				toolbar={{ quickFilter: true, debounceMs: 500 }}
				gridMaxWidth={false}
			/>
			{deleting && (
				<SupplierDeleteDialog
					supplier={deleting}
					onClose={() => setDeleting(null)}
					beforeDelete={() => setPaginationModel((p) => ({ ...p, page: 0 }))}
					onDeleted={() => setDeleting(null)}
				/>
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
