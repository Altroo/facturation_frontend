'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography, Chip, IconButton } from '@mui/material';
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
import { getAccessTokenFromSession } from '@/store/session';
import { useDeleteClientMutation, useGetClientsListQuery, usePatchArchiveMutation } from '@/store/services/client';
import { CLIENTS_ADD, CLIENTS_EDIT, CLIENTS_VIEW } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { ClientClass } from '@/models/classes';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';

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
	const token = getAccessTokenFromSession(session);

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

	// Extract date filter parameters from filter model
	const getDateFilterParams = () => {
		const params: Record<string, string> = {};
		filterModel.items.forEach(item => {
			if (item.field === 'date_created' && item.value) {
				const { from, to } = item.value as { from?: string; to?: string };
				if (from) {
					params.date_created_after = from;
				}
				if (to) {
					params.date_created_before = to;
				}
			}
		});
		return params;
	};

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
			...getDateFilterParams(),
		},
		{ skip: !token },
	);
	const data = rawData as PaginationResponseType<ClientClass> | undefined;

	const [deleteRecord] = useDeleteClientMutation();
	const [patchArchive] = usePatchArchiveMutation();

	const deleteHandler = async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			onSuccess('Client supprimé avec succès');
			refetch();
		} catch {
			onError('Erreur lors de la suppression du client');
		} finally {
			setShowDeleteModal(false);
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
			renderCell: (params: GridRenderCellParams<ClientClass>) => (
				<Box sx={{ display: 'flex', gap: 1 }}>
					{(role === 'Caissier' || role === 'Lecture' || role === 'Comptable' || role === 'Commercial') && (
						<DarkTooltip title="Voir">
							<IconButton
								size="small"
								color="info"
								onClick={() => router.push(CLIENTS_VIEW(params.row.id, company_id))}
							>
								<VisibilityIcon />
							</IconButton>
						</DarkTooltip>
					)}
					{(role === 'Caissier' || role === 'Commercial') && (
						<>
							<DarkTooltip title="Modifier">
								<IconButton
									size="small"
									color="primary"
									onClick={() => router.push(CLIENTS_EDIT(params.row.id, company_id))}
								>
									<EditIcon />
								</IconButton>
							</DarkTooltip>
							<DarkTooltip title="Supprimer">
								<IconButton size="small" color="error" onClick={() => showDeleteModalCall(params.row.id)}>
									<DeleteIcon />
								</IconButton>
							</DarkTooltip>
							<DarkTooltip title={archived ? 'Désarchiver' : 'Archiver'}>
								<IconButton size="small" color="warning" onClick={() => showArchiveModalCall(params.row.id)}>
									{archived ? <UnarchiveIcon /> : <ArchiveIcon />}
								</IconButton>
							</DarkTooltip>
						</>
					)}
				</Box>
			),
		},
	];

	return (
		<>
			{!archived && (role === 'Caissier' || role === 'Commercial') && (
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
				</Box>
			)}
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
				toolbar={{ quickFilter: true, debounceMs: 500 }}
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
