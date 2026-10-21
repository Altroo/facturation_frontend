'use client';

import { type FC, isValidElement, startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	Link,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { ArrowBack, Business, Delete, Description, Edit, Email, Visibility } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NoPermission from '@/components/shared/noPermission/noPermission';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import SupplierDeleteDialog from './logistique-supplier-delete-dialog';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetLogistiqueListQuery, useGetLogistiqueSupplierQuery } from '@/store/services/logistique';
import { getUserCompaniesState } from '@/store/selectors';
import { useAppSelector, useLanguage } from '@/utils/hooks';
import { extractApiErrorMessage, formatDate, listReturnUrl } from '@/utils/helpers';
import { LOGISTIQUE_SUPPLIER_EDIT, LOGISTIQUE_SUPPLIERS, LOGISTIQUE_VIEW } from '@/utils/routes';
import type { PaginationResponseType } from '@/types/_initTypes';
import type {
	LogistiqueOrder,
	LogistiqueViewInfoRowProps as InfoRowProps,
	LogistiqueViewProps as Props,
} from '@/types/logistiqueTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const InfoRow: FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue = value === null || value === undefined || value === '' ? '-' : value;
	return (
		<Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', py: 1.5 }}>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack
				direction={isMobile ? 'column' : 'row'}
				spacing={isMobile ? 0.5 : 2}
				sx={{ alignItems: isMobile ? 'stretch' : 'center', flex: 1, minWidth: 0 }}
			>
				<Typography
					sx={{ fontWeight: 600, color: 'text.secondary', minWidth: { xs: '100%', sm: 200 }, wordBreak: 'break-word' }}
				>
					{label}
				</Typography>
				<Box sx={{ flex: isMobile ? 'initial' : 1, minWidth: 0, overflowWrap: 'anywhere' }}>
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

const SupplierDossiers: FC<Pick<Props, 'id' | 'company_id'>> = ({ id, company_id }) => {
	const { t } = useLanguage();
	const router = useRouter();
	const [paginationModel, setPaginationModel, sorting] = useDataGridPagination(5, { company_id });
	const [search, setSearch] = useState('');
	const { currentData, isFetching, error, refetch } = useGetLogistiqueListQuery({
		company_id,
		fournisseur_record: id,
		search,
		with_pagination: true,
		page: paginationModel.page + 1,
		pageSize: paginationModel.pageSize,
		ordering: sorting.ordering,
	});
	const columns: GridColDef[] = [
		{ field: 'numero_commande', headerName: t.logistique.colNumero, minWidth: 180, flex: 1 },
		{ field: 'statut_global', headerName: t.logistique.colStatut, minWidth: 160, flex: 1 },
		{
			field: 'date_prevue',
			headerName: t.logistique.colDatePrevue,
			minWidth: 150,
			flex: 1,
			type: 'date',
			valueGetter: (value) => (value ? new Date(value) : null),
			valueFormatter: (value: Date | null) => (value ? formatDate(value.toISOString()) : '-'),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			minWidth: 110,
			sortable: false,
			filterable: false,
			renderCell: ({ row }) => (
				<MobileActionsMenu
					actions={[
						{
							label: t.common.view,
							icon: <Visibility />,
							color: 'info',
							onClick: () => router.push(LOGISTIQUE_VIEW(row.id, company_id)),
						},
					]}
				/>
			),
		},
	];
	if (error)
		return (
			<Alert severity="error">
				{extractApiErrorMessage(error, t.logistique.supplierLoadError)}{' '}
				<Button onClick={() => refetch()}>{t.common.retry}</Button>
			</Alert>
		);
	return (
		<PaginatedDataGrid
			data={currentData as PaginationResponseType<LogistiqueOrder> | undefined}
			isLoading={isFetching}
			columns={columns.map((column) => ({ ...column, filterable: false }))}
			paginationModel={paginationModel}
			setPaginationModel={setPaginationModel}
			sorting={sorting}
			searchTerm={search}
			setSearchTerm={(next) =>
				startTransition(() => {
					setPaginationModel((p) => ({ ...p, page: 0 }));
					setSearch(next);
				})
			}
			toolbar={{ quickFilter: true, debounceMs: 500 }}
			gridMaxWidth={false}
		/>
	);
};

const LogistiqueSuppliersView: FC<Props> = ({ session, company_id, id }) => {
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();
	const company = useAppSelector(getUserCompaniesState)?.find((entry) => entry.id === company_id);
	const {
		currentData: supplier,
		isFetching,
		error,
		refetch,
	} = useGetLogistiqueSupplierQuery({ id, company_id }, { skip: !token });
	const [deleting, setDeleting] = useState(false);
	const canManage = !!company && ['Caissier', 'Commercial', 'Logistique'].includes(company.role);
	const back = () => router.push(listReturnUrl(`${LOGISTIQUE_SUPPLIERS}?company_id=${company_id}`));
	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '32px' }}>
			<NavigationBar title={t.logistique.supplierViewTitle}>
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
					<Stack
						direction={isMobile ? 'column' : 'row'}
						spacing={2}
						sx={{ justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center' }}
					>
						<Button
							variant="outlined"
							startIcon={<ArrowBack />}
							onClick={back}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							{t.logistique.supplierBackToList}
						</Button>
						{supplier && !isFetching && !error && (
							<Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
								{canManage && (
									<Button
										variant="outlined"
										size="small"
										startIcon={<Edit />}
										onClick={() => router.push(LOGISTIQUE_SUPPLIER_EDIT(id, company_id))}
									>
										{t.common.edit}
									</Button>
								)}
								{company?.role === 'Caissier' && (
									<Button
										variant="outlined"
										size="small"
										color="error"
										startIcon={<Delete />}
										onClick={() => setDeleting(true)}
									>
										{t.common.delete}
									</Button>
								)}
							</Stack>
						)}
					</Stack>
					{!token || isFetching ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : error ? (
						<Alert severity="error">
							{extractApiErrorMessage(error, t.logistique.supplierLoadError)}{' '}
							<Button onClick={() => refetch()}>{t.common.retry}</Button>
						</Alert>
					) : !company || !supplier ? (
						<NoPermission />
					) : (
						<>
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
										<Business color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											{t.logistique.supplierIdentity}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<Business />} label={t.logistique.supplierName} value={supplier.nom} />
										<Divider />
										<InfoRow
											icon={<Email />}
											label={t.logistique.colSupplierEmail}
											value={supplier.email ? <Link href={`mailto:${supplier.email}`}>{supplier.email}</Link> : '-'}
										/>
									</Stack>
								</CardContent>
							</Card>
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
										<Description color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											{t.logistique.supplierDossiers} ({supplier.total_dossiers})
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<SupplierDossiers id={id} company_id={company_id} />
								</CardContent>
							</Card>
						</>
					)}
				</Stack>
				{deleting && supplier && (
					<SupplierDeleteDialog
						supplier={supplier}
						onClose={() => setDeleting(false)}
						onDeleted={() => router.replace(`${LOGISTIQUE_SUPPLIERS}?company_id=${company_id}`)}
					/>
				)}
			</NavigationBar>
		</Stack>
	);
};

export default LogistiqueSuppliersView;
