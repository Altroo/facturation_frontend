'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography, Avatar, Chip, IconButton, Tooltip } from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	AddOutlined as AddOutlinedIcon,
	Close as CloseIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useDeleteCompanyMutation, useGetCompaniesListQuery } from '@/store/services/company';
import { COMPANIES_ADD, COMPANIES_VIEW, COMPANIES_EDIT } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { CompanyClass } from '@/models/classes';
import { formatDate } from '@/utils/helpers';
import { Protected } from '@/components/layouts/protected/protected';
import { useToast } from '@/utils/hooks';
import Image from 'next/image';

const CompaniesListClient: React.FC<SessionProps> = ({ session }: SessionProps) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const token = getAccessTokenFromSession(session);
	const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);

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
		},
		{ skip: !token },
	);
	// enforce the type of the users data
	const data = rawData as PaginationResponseType<CompanyClass> | undefined;
	const [deleteRecord] = useDeleteCompanyMutation();

	const deleteHandler = async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			// success toast
			onSuccess('Entreprise supprimée avec succès');
			// refresh the page / data
			refetch();
		} catch {
			// error toast
			onError('Erreur lors de la suppression de l’entreprise');
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

	const columns: GridColDef[] = [
		{
			field: 'logo',
			headerName: 'Logo',
			width: 70,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => {
				const src = params.value as string | undefined | null;
				return (
					<Tooltip
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
						<Avatar
							src={src ?? undefined}
							alt={params.row.raison_sociale}
							variant="rounded"
							sx={{ width: 40, height: 40 }}
						/>
					</Tooltip>
				);
			},
			sortable: false,
			filterable: false,
		},
		{
			field: 'raison_sociale',
			headerName: 'Raison Sociale',
			width: 150,
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
			headerName: 'ICE',
			width: 100,
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
			headerName: 'Responsable',
			width: 150,
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
			headerName: 'Email',
			width: 150,
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
			headerName: 'Téléphone',
			width: 150,
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
			headerName: 'Employés',
			width: 100,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => (
				<DarkTooltip title={params.value}>
					<Chip label={params.value} size="small" variant="outlined" />
				</DarkTooltip>
			),
		},
		{
			field: 'date_created',
			headerName: 'Date de création',
			width: 180,
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
			headerName: 'Actions',
			width: 150,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => (
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Tooltip title="Voir">
						<IconButton size="small" color="info" onClick={() => router.push(COMPANIES_VIEW(params.row.id))}>
							<VisibilityIcon />
						</IconButton>
					</Tooltip>

					<Tooltip title="Modifier">
						<IconButton size="small" color="primary" onClick={() => router.push(COMPANIES_EDIT(params.row.id))}>
							<EditIcon />
						</IconButton>
					</Tooltip>

					<Tooltip title="Supprimer">
						<IconButton size="small" color="error" onClick={() => showDeleteModalCall(params.row.id)}>
							<DeleteIcon />
						</IconButton>
					</Tooltip>
				</Box>
			),
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
			<NavigationBar title="Liste des entreprises">
				<Protected>
					<>
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
								onClick={() => router.push(COMPANIES_ADD)}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
								startIcon={<AddOutlinedIcon fontSize="small" />}
							>
								Nouvelle entreprise
							</Button>
						</Box>
						<PaginatedDataGrid
							queryHook={() => ({ data, isLoading })}
							columns={columns}
							paginationModel={paginationModel}
							setPaginationModel={setPaginationModel}
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							toolbar={{ quickFilter: true, debounceMs: 500 }}
						/>
						{showDeleteModal && (
							<ActionModals
								title="Supprimer cette entreprise ?"
								body="Êtes‑vous sûr de vouloir supprimer cette entreprise?"
								actions={deleteModalActions}
								titleIcon={<DeleteIcon />}
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
