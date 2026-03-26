'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography, Chip } from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	Archive as ArchiveIcon,
	Unarchive as UnarchiveIcon,
	Add as AddIcon,
	Close as CloseIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams, GridFilterModel, GridLogicOperator } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteClientMutation, useGetClientsListQuery, usePatchArchiveMutation, useBulkDeleteClientsMutation, useBulkArchiveClientsMutation, useLazyGetClientsListQuery } from '@/store/services/client';
import { CLIENTS_ADD, CLIENTS_EDIT, CLIENTS_VIEW } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { ClientClass } from '@/models/classes';
import { formatDate, extractApiErrorMessage } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import { useGetCitiesListQuery } from '@/store/services/parameter';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';

interface FormikContentProps extends SessionProps {
	company_id: number;
	archived: boolean;
	role: string;
}

export const typeFilterOptions = [
	{ value: 'Personne physique', label: 'Personne physique', color: 'default' as const },
	{ value: 'Personne morale', label: 'Personne morale', color: 'default' as const },
];

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { session, company_id, archived, role } = props;
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const token = useInitAccessToken(session);

	const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);
	const [archiveTarget, setArchiveTarget] = useState<number | null>(null);
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});

	// Bulk selection state
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
	const [showBulkArchiveModal, setShowBulkArchiveModal] = useState<boolean>(false);
	const [bulkArchiveAction, setBulkArchiveAction] = useState<'archive' | 'unarchive'>('archive');
	// Select-all-matching state
	const [isAllMatchingSelected, setIsAllMatchingSelected] = useState<boolean>(false);

	const { data: cities } = useGetCitiesListQuery({ company_id }, { skip: !token });

	const chipFilters: ChipFilterConfig[] = React.useMemo(
		() => [
			{ key: 'ville', label: 'Ville', paramName: 'ville_ids', options: cities ?? [] },
		],
		[cities],
	);

	const mergedFilterParams = React.useMemo(
		() => ({ ...chipFilterParams, ...customFilterParams }),
		[chipFilterParams, customFilterParams],
	);

	// Call query hook at component level
	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetClientsListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			archived: archived,
			...mergedFilterParams,
		},
		{ skip: !token },
	);
	const data = rawData as PaginationResponseType<ClientClass> | undefined;

	const [deleteRecord] = useDeleteClientMutation();
	const [patchArchive] = usePatchArchiveMutation();
	const [bulkDeleteClients] = useBulkDeleteClientsMutation();
	const [bulkArchiveClients] = useBulkArchiveClientsMutation();
	const [fetchAllClientIds, { isLoading: isLoadingAllIds }] = useLazyGetClientsListQuery();

	const deleteHandler = async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			onSuccess('Client supprimé avec succès');
			refetch();
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression du client'));
		} finally {
			setShowDeleteModal(false);
			// Remove only the deleted item from selection (preserve remaining bulk selection)
			// Do NOT clear isAllMatchingSelected — user stays in 'all matching' mode minus this one item
			setSelectedIds((prev) => prev.filter((id) => id !== selectedId));
		}
	};

	const deleteModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: 'Supprimer', active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const showDeleteModalCall = (id: number) => {
		setSelectedId(id);
		setShowDeleteModal(true);
	};

	const archiveHandler = async () => {
		if (!archiveTarget) return;
		try {
			await patchArchive({
				id: archiveTarget,
				data: { archived: !archived },
			}).unwrap();
			if (archived) {
				onSuccess('Client désarchivé avec succès');
			} else {
				onSuccess('Client archivé avec succès');
			}
			refetch();
		} catch {
			if (archived) {
				onError('Erreur lors de la désarchivation du client');
			} else {
				onError('Erreur lors de l’archivage du client');
			}
		} finally {
			setShowArchiveModal(false);
			setArchiveTarget(null);
			// Remove only the archived item from selection (preserve remaining bulk selection)
			// Do NOT clear isAllMatchingSelected — user stays in 'all matching' mode minus this one item
			setSelectedIds((prev) => prev.filter((id) => id !== archiveTarget));
		}
	};

	const archiveModalActions = [
		{
			text: 'Annuler',
			active: false,
			onClick: () => {
				setShowArchiveModal(false);
				setArchiveTarget(null);
			},
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: archived ? 'Désarchiver' : 'Archiver',
			active: true,
			onClick: archiveHandler,
			icon: <ArchiveIcon />,
			color: '#ED6C02',
		},
	];

	const showArchiveModalCall = (id: number) => {
		setArchiveTarget(id);
		setShowArchiveModal(true);
	};

	const handleSelectionChange = useCallback((ids: number[]) => {
		setSelectedIds(ids);
		setIsAllMatchingSelected(false);
	}, []);

	const handleSelectAllMatching = useCallback(async () => {
		try {
			const result = await fetchAllClientIds({
				company_id,
				with_pagination: false,
				archived,
				...mergedFilterParams,
			}).unwrap();
			const allIds = (result as Partial<ClientClass>[]).map((c) => c.id!).filter(Boolean);
			setSelectedIds(allIds);
			setIsAllMatchingSelected(true);
		} catch {
			onError('Erreur lors de la sélection de tous les éléments');
		}
	}, [company_id, archived, mergedFilterParams, fetchAllClientIds, onError]);

	const handleClearAllMatching = useCallback(() => {
		setIsAllMatchingSelected(false);
		setSelectedIds([]);
	}, []);

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteClients({ ids: selectedIds }).unwrap();
			onSuccess(`${selectedIds.length} client(s) supprimé(s) avec succès`);
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression des clients'));
		} finally {
			setSelectedIds([]);
			setIsAllMatchingSelected(false);
			setShowBulkDeleteModal(false);
			refetch();
		}
	};

	const bulkDeleteModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowBulkDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: `Supprimer (${selectedIds.length})`, active: true, onClick: bulkDeleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const bulkArchiveHandler = async () => {
		const archiving = bulkArchiveAction === 'archive';
		try {
			await bulkArchiveClients({ ids: selectedIds, archived: archiving }).unwrap();
			onSuccess(`${selectedIds.length} client(s) ${archiving ? 'archivé(s)' : 'désarchivé(s)'} avec succès`);
		} catch {
			onError(`Erreur lors de l'${archiving ? 'archivage' : 'désarchivage'} des clients`);
		} finally {
			setSelectedIds([]);
			setIsAllMatchingSelected(false);
			setShowBulkArchiveModal(false);
			refetch();
		}
	};

	const bulkArchiveModalActions = [
		{
			text: 'Annuler',
			active: false,
			onClick: () => setShowBulkArchiveModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: bulkArchiveAction === 'archive' ? `Archiver (${selectedIds.length})` : `Désarchiver (${selectedIds.length})`,
			active: true,
			onClick: bulkArchiveHandler,
			icon: bulkArchiveAction === 'archive' ? <ArchiveIcon /> : <UnarchiveIcon />,
			color: '#ED6C02',
		},
	];

	const villeFilterOptions = React.useMemo(() => {
		if (!data?.results) return [];

		const objectMap = new Map<number, string>();
		data.results.forEach((client) => {
			if (client.ville && client.ville_name) {
				objectMap.set(client.ville, client.ville_name);
			}
		});

		return Array.from(objectMap.entries()).map(([, name]) => ({
			value: name,
			label: name,
		}));
	}, [data?.results]);

	const columns: GridColDef[] = [
		{
			field: 'code_client',
			headerName: 'Code Client',
			flex: 0.8,
			minWidth: 100,
			renderCell: (params: GridRenderCellParams<ClientClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'client_type',
			headerName: 'Type',
			flex: 1.2,
			minWidth: 120,
			filterOperators: createDropdownFilterOperators(typeFilterOptions, 'Tous les types', true),
			renderCell: (params: GridRenderCellParams<ClientClass>) => {
				return (
					<DarkTooltip title={params.value}>
						<Chip label={params.value} size="small" variant="outlined" />
					</DarkTooltip>
				);
			},
		},
		{
			field: 'raison_sociale',
			headerName: 'Raison Sociale',
			flex: 1.3,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<ClientClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'nom',
			headerName: 'Nom',
			flex: 1.2,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<ClientClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'prenom',
			headerName: 'Prénom',
			flex: 1.2,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<ClientClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'ville_name',
			headerName: 'Ville',
			flex: 1,
			minWidth: 100,
			filterOperators: createDropdownFilterOperators(villeFilterOptions, 'Tous les villes'),
			renderCell: (params: GridRenderCellParams<ClientClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date_created',
			headerName: 'Date de création',
			flex: 1.4,
			minWidth: 140,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<ClientClass>) => {
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
			headerName: 'Actions',
			flex: 1.5,
			minWidth: 150,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ClientClass>) => {
				const actions = [];

				// View action - available for all roles
				if (role === 'Caissier' || role === 'Lecture' || role === 'Comptable' || role === 'Commercial') {
					actions.push({
						label: 'Voir',
						icon: <VisibilityIcon />,
						onClick: () => router.push(CLIENTS_VIEW(params.row.id, company_id)),
						color: 'info' as const,
					});
				}

				// Edit, Delete, Archive actions - only for Caissier and Commercial
				if (role === 'Caissier' || role === 'Commercial') {
					actions.push(
						{
							label: 'Modifier',
							icon: <EditIcon />,
							onClick: () => router.push(CLIENTS_EDIT(params.row.id, company_id)),
							color: 'primary' as const,
						},
						{
							label: 'Supprimer',
							icon: <DeleteIcon />,
							onClick: () => showDeleteModalCall(params.row.id),
							color: 'error' as const,
						},
						{
							label: archived ? 'Désarchiver' : 'Archiver',
							icon: archived ? <UnarchiveIcon /> : <ArchiveIcon />,
							onClick: () => showArchiveModalCall(params.row.id),
							color: 'warning' as const,
						},
					);
				}

				return <MobileActionsMenu actions={actions} />;
			},
		},
	];

	return (
		<>
			{(role === 'Caissier' || role === 'Commercial') && (!archived || selectedIds.length > 0) && (
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
					{!archived && (
						<Button
							variant="contained"
							onClick={() => router.push(CLIENTS_ADD(company_id))}
							sx={{
								whiteSpace: 'nowrap',
								px: { xs: 1.5, sm: 2, md: 3 },
								py: { xs: 0.8, sm: 1, md: 1 },
								fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
							}}
							startIcon={<AddIcon fontSize="small" />}
						>
							Nouveau client
						</Button>
					)}
					{selectedIds.length > 0 && role === 'Caissier' && (
						<Button
							variant="outlined"
							color="error"
							onClick={() => setShowBulkDeleteModal(true)}
							sx={{
								whiteSpace: 'nowrap',
								px: { xs: 1.5, sm: 2, md: 3 },
								py: { xs: 0.8, sm: 1, md: 1 },
								fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
							}}
							startIcon={<DeleteIcon fontSize="small" />}
						>
							Supprimer ({selectedIds.length})
						</Button>
					)}
					{selectedIds.length > 0 && (
						<Button
							variant="outlined"
							color="warning"
							onClick={() => {
								setBulkArchiveAction(archived ? 'unarchive' : 'archive');
								setShowBulkArchiveModal(true);
							}}
							sx={{
								whiteSpace: 'nowrap',
								px: { xs: 1.5, sm: 2, md: 3 },
								py: { xs: 0.8, sm: 1, md: 1 },
								fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
							}}
							startIcon={archived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
						>
							{archived ? 'Désarchiver' : 'Archiver'} ({selectedIds.length})
						</Button>
					)}
				</Box>
			)}
			<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} />
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
				checkboxSelection={role === 'Caissier' || role === 'Commercial'}
				onSelectionChange={handleSelectionChange}
				selectedIds={selectedIds}

				totalMatchingCount={data?.count}
				onSelectAllMatchingClick={handleSelectAllMatching}
				selectAllMatchingLoading={isLoadingAllIds}
				isAllMatchingSelected={isAllMatchingSelected}
				onClearAllMatchingSelected={handleClearAllMatching}
			/>
			{showDeleteModal && (
				<ActionModals
					title="Supprimer ce client ?"
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					body="Êtes‑vous sûr de vouloir supprimer ce client?"
					actions={deleteModalActions}
				/>
			)}
			{showArchiveModal && (
				<ActionModals
					title={archived ? 'Désarchiver ce client ?' : 'Archiver ce client ?'}
					titleIcon={<ArchiveIcon />}
					titleIconColor="#ED6C02"
					body={
						archived
							? 'Êtes‑vous sûr de vouloir désarchiver ce client?'
							: 'Êtes‑vous sûr de vouloir archiver ce client?'
					}
					actions={archiveModalActions}
				/>
			)}
			{showBulkDeleteModal && (
				<ActionModals
					title={`Supprimer ${selectedIds.length} client(s) ?`}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					body={`Êtes-vous sûr de vouloir supprimer les ${selectedIds.length} client(s) sélectionné(s) ?`}
					actions={bulkDeleteModalActions}
				/>
			)}
			{showBulkArchiveModal && (
				<ActionModals
					title={bulkArchiveAction === 'archive' ? `Archiver ${selectedIds.length} client(s) ?` : `Désarchiver ${selectedIds.length} client(s) ?`}
					titleIcon={bulkArchiveAction === 'archive' ? <ArchiveIcon /> : <UnarchiveIcon />}
					titleIconColor="#ED6C02"
					body={bulkArchiveAction === 'archive'
						? `Êtes-vous sûr de vouloir archiver les ${selectedIds.length} client(s) sélectionné(s) ?`
						: `Êtes-vous sûr de vouloir désarchiver les ${selectedIds.length} client(s) sélectionné(s) ?`
					}
					actions={bulkArchiveModalActions}
				/>
			)}
		</>
	);
};

interface Props extends SessionProps {
	archived: boolean;
}

const ClientsListClient: React.FC<Props> = ({ session, archived }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title={archived ? 'Clients Archivés' : 'Liste des Clients'}>
			{({ company_id, role }) => (
				<FormikContent archived={archived} session={session} company_id={company_id} role={role} />
			)}
		</CompanyDocumentsWrapperList>
	);
};

export default ClientsListClient;
