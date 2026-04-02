'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography, Chip } from '@mui/material';
import {
	Edit as EditIcon,
	PauseCircle as PauseIcon,
	Visibility as VisibilityIcon,
	Add as AddIcon,
	Close as CloseIcon,
	Business as BusinessIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams, GridFilterModel } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useSuspendCompanyMutation, useGetCompaniesListQuery, useBulkSuspendCompaniesMutation, useLazyGetCompaniesListQuery } from '@/store/services/company';
import { COMPANIES_ADD, COMPANIES_VIEW, COMPANIES_EDIT } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { CompanyClass } from '@/models/classes';
import { formatDate } from '@/utils/helpers';
import { Protected } from '@/components/layouts/protected/protected';
import { useToast, useLanguage } from '@/utils/hooks';
import Image from 'next/image';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';

export const nbrEmployeFilterOptions = [
	{ value: '1 à 5', label: '1 à 5', color: 'default' as const },
	{ value: '5 à 10', label: '5 à 10', color: 'default' as const },
	{ value: '10 à 50', label: '10 à 50', color: 'default' as const },
	{ value: '50 à 100', label: '50 à 100', color: 'default' as const },
	{ value: 'plus que 100', label: 'plus que 100', color: 'default' as const },
];

const CompaniesListClient: React.FC<SessionProps> = ({ session }: SessionProps) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
	const [showSuspendModal, setShowSuspendModal] = useState<boolean>(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});

	// Bulk selection state
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkSuspendModal, setShowBulkSuspendModal] = useState<boolean>(false);
	const [isAllMatchingSelected, setIsAllMatchingSelected] = useState<boolean>(false);

	// Call query hook at component level
	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetCompaniesListQuery(
		{
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			...customFilterParams,
		},
		{ skip: !token },
	);
	// enforce the type of the users data
	const data = rawData as PaginationResponseType<CompanyClass> | undefined;

	const [suspendRecord] = useSuspendCompanyMutation();
	const [bulkSuspendCompanies] = useBulkSuspendCompaniesMutation();
	const [fetchAllCompanyIds, { isLoading: isLoadingAllIds }] = useLazyGetCompaniesListQuery();

	const suspendHandler = async () => {
		try {
			await suspendRecord({ id: selectedId! }).unwrap();
			onSuccess(t.companies.suspendSuccess);
			refetch();
		} catch {
			onError(t.companies.suspendError);
		} finally {
			setShowSuspendModal(false);
			setSelectedIds((prev) => prev.filter((id) => id !== selectedId));
		}
	};

	const bulkSuspendHandler = async () => {
		try {
			await bulkSuspendCompanies({ ids: selectedIds }).unwrap();
			onSuccess(t.companies.bulkSuspendSuccess(selectedIds.length));
			refetch();
		} catch {
			onError(t.companies.bulkSuspendError);
		} finally {
			setShowBulkSuspendModal(false);
			setSelectedIds([]);
			setIsAllMatchingSelected(false);
		}
	};

	const handleSelectionChange = useCallback((ids: number[]) => {
		setSelectedIds(ids);
		setIsAllMatchingSelected(false);
	}, []);

	const handleSelectAllMatching = useCallback(async () => {
		try {
			const result = await fetchAllCompanyIds({
				with_pagination: false,
				...customFilterParams,
			}).unwrap();
			const allIds = (result as Array<Partial<CompanyClass>>).map((c) => c.id).filter((id): id is number => id !== undefined);
			setSelectedIds(allIds);
			setIsAllMatchingSelected(true);
		} catch {
			onError(t.companies.fetchIdsError);
		}
	}, [fetchAllCompanyIds, customFilterParams, onError, t]);

	const handleClearAllMatching = useCallback(() => {
		setSelectedIds([]);
		setIsAllMatchingSelected(false);
	}, []);

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowSuspendModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{ text: t.companies.suspendBtn, active: true, onClick: suspendHandler, icon: <PauseIcon />, color: '#D32F2F' },
	];

	const showDeleteModalCall = (id: number) => {
		setSelectedId(id);
		setShowSuspendModal(true);
	};

	const localNbrEmployeFilterOptions = React.useMemo(
		() => [
			{ value: '1 à 5', label: t.rawData.employeeRanges['1to5'], color: 'default' as const },
			{ value: '5 à 10', label: t.rawData.employeeRanges['5to10'], color: 'default' as const },
			{ value: '10 à 50', label: t.rawData.employeeRanges['10to50'], color: 'default' as const },
			{ value: '50 à 100', label: t.rawData.employeeRanges['50to100'], color: 'default' as const },
			{ value: 'plus que 100', label: t.rawData.employeeRanges.moreThan100, color: 'default' as const },
		],
		[t],
	);

	const columns: GridColDef[] = [
		{
			field: 'logo',
			headerName: t.companies.colLogo,
			flex: 0.5,
			minWidth: 70,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => {
				const src = params.value as string | undefined | null;
				return (
					<DarkTooltip
						title={
							src ? (
								<Box sx={{ width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Image
										src={src}
										alt={params.row.raison_sociale}
										width={260}
										height={260}
										style={{ objectFit: 'contain', display: 'block' }}
									/>
								</Box>
							) : (
								''
							)
						}
						placement="right"
						arrow
						enterDelay={100}
						leaveDelay={200}
						slotProps={{ tooltip: { sx: { pointerEvents: 'auto' } } }}
					>
						{src ? (
							<Box
								component="img"
								src={src}
								alt={params.row.raison_sociale}
								sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
							/>
						) : (
							<Box
								sx={{
									width: 40,
									height: 40,
									borderRadius: 1,
									backgroundColor: '#E0E0E0',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<BusinessIcon sx={{ fontSize: 20, color: '#9E9E9E' }} />
							</Box>
						)}
					</DarkTooltip>
				);
			},
			sortable: false,
			filterable: false,
		},
		{
			field: 'raison_sociale',
			headerName: t.companies.colRaisonSociale,
			flex: 1.5,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'ICE',
			headerName: t.companies.colICE,
			flex: 1,
			minWidth: 100,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'nom_responsable',
			headerName: t.companies.colResponsable,
			flex: 1.2,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => {
				return (
					<DarkTooltip title={params.value}>
						<Typography variant="body2" noWrap>
							{params.value}
						</Typography>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'email',
			headerName: t.companies.colEmail,
			flex: 1.5,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'telephone',
			headerName: t.companies.colTelephone,
			flex: 1.2,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'nbr_employe',
			headerName: t.companies.colEmployes,
			flex: 0.8,
			minWidth: 100,
			filterOperators: createDropdownFilterOperators(localNbrEmployeFilterOptions, t.companies.allEmployeeCounts, true, t.filterPanel.is),
			renderCell: (params: GridRenderCellParams<CompanyClass>) => {
				const option = localNbrEmployeFilterOptions.find((o) => o.value === (params.value as string));
				const label = option?.label ?? (params.value as string);
				return (
					<DarkTooltip title={label}>
						<Chip label={label} size="small" variant="outlined" />
					</DarkTooltip>
				);
			},
		},
		{
			field: 'date_created',
			headerName: t.common.dateCreation,
			flex: 1.5,
			minWidth: 150,
			filterOperators: createDateRangeFilterOperator(t.filterPanel.between),
			renderCell: (params: GridRenderCellParams<CompanyClass>) => {
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
			field: 'actions',
			headerName: t.common.actions,
			flex: 1.2,
			minWidth: 130,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => {
				const actions = [
					{
						label: t.common.view,
						icon: <VisibilityIcon />,
						onClick: () => router.push(COMPANIES_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(COMPANIES_EDIT(params.row.id)),
						color: 'primary' as const,
					},
					{
						label: t.companies.suspendBtn,
						icon: <PauseIcon />,
						onClick: () => showDeleteModalCall(params.row.id),
						color: 'error' as const,
					},
				];

				return <MobileActionsMenu actions={actions} />;
			},
		},
	];

	return (
		<Stack
			direction="column"
			spacing={3}
			className={Styles.flexRootStack}
			mt="48px"
			sx={{ overflowX: 'auto', overflowY: 'hidden' }}
		>
			<NavigationBar title={t.companies.listTitle}>
				<Protected>
					<>
						<Box
							sx={{
								width: '100%',
								display: 'flex',
								flexWrap: 'wrap',
								gap: 1,
								justifyContent: 'flex-start',
								px: { xs: 1, sm: 2, md: 3 },
								mt: { xs: 1, sm: 2, md: 3 },
								mb: { xs: 1, sm: 2, md: 3 },
							}}
						>
							<Button
								variant="contained"
								onClick={() => router.push(COMPANIES_ADD)}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
								startIcon={<AddIcon fontSize="small" />}
							>
								{t.companies.newCompany}
							</Button>
							{selectedIds.length > 0 && (
								<Button
									variant="outlined"
									color="error"
									onClick={() => setShowBulkSuspendModal(true)}
									sx={{
										whiteSpace: 'nowrap',
										px: { xs: 1.5, sm: 2, md: 3 },
										py: { xs: 0.8, sm: 1, md: 1 },
										fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
									}}
									startIcon={<PauseIcon fontSize="small" />}
								>
									Suspendre ({selectedIds.length})
								</Button>
							)}
						</Box>
						<PaginatedDataGrid
							data={data}
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
							checkboxSelection
							onSelectionChange={handleSelectionChange}
							selectedIds={selectedIds}
							totalMatchingCount={data?.count}
							onSelectAllMatchingClick={handleSelectAllMatching}
							selectAllMatchingLoading={isLoadingAllIds}
							isAllMatchingSelected={isAllMatchingSelected}
							onClearAllMatchingSelected={handleClearAllMatching}
						/>
						{showSuspendModal && (
							<ActionModals
								title={t.companies.suspendModalTitle}
								body={t.companies.suspendModalBody}
								actions={deleteModalActions}
								titleIcon={<PauseIcon />}
								titleIconColor="#D32F2F"
							/>
						)}
						{showBulkSuspendModal && (
							<ActionModals
								title={t.companies.bulkSuspendModalTitle(selectedIds.length)}
								body={`Êtes-vous sûr de vouloir suspendre les ${selectedIds.length} entreprise(s) sélectionnée(s) ? Cette action est irréversible.`}
								actions={[
									{
										text: t.common.cancel,
										active: false,
										onClick: () => setShowBulkSuspendModal(false),
										icon: <CloseIcon />,
										color: '#6B6B6B',
									},
									{
										text: t.companies.suspendBtn,
										active: true,
										onClick: bulkSuspendHandler,
										icon: <PauseIcon />,
										color: '#D32F2F',
									},
								]}
								titleIcon={<PauseIcon />}
								titleIconColor="#D32F2F"
							/>
						)}
					</>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default CompaniesListClient;
