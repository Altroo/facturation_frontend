'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography, Avatar, IconButton, Tooltip } from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
	AddOutlined as AddOutlinedIcon,
	Close as CloseIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useDeleteUserMutation, useGetUsersListQuery } from '@/store/services/account';
import { USERS_VIEW, USERS_EDIT, USERS_ADD } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { UserClass } from '@/models/classes';
import { formatDate } from '@/utils/helpers';
import { Protected } from '@/components/layouts/protected/protected';
import { useToast } from '@/utils/hooks';
import Image from 'next/image';

const UsersListClient: React.FC<SessionProps> = ({ session }: SessionProps) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const token = getAccessTokenFromSession(session);

	const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetUsersListQuery(
		{
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
		},
		{ skip: !token },
	);
	// enforce the type of the users data
	const data = rawData as PaginationResponseType<UserClass> | undefined;
	const [deleteRecord] = useDeleteUserMutation();

	const deleteHandler = async () => {
		try {
			await deleteRecord({ id: selectedUserId! }).unwrap();
			// success toast
			onSuccess('Utilisateur supprimée avec succès');
			// refresh the page / data
			refetch();
		} catch {
			// error toast
			onError('Erreur lors de la suppression de l’utilisateur');
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: 'Supprimer', active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const showDeleteModalCall = (id: number) => {
		setSelectedUserId(id);
		setShowDeleteModal(true);
	};

	const columns: GridColDef[] = [
		{
			field: 'avatar',
			headerName: 'Avatar',
			width: 70,
			renderCell: (params: GridRenderCellParams<UserClass>) => {
				const src = params.value as string | undefined | null;
				return (
					<Tooltip
						title={
							src ? (
								<Box sx={{ width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Image
										src={src}
										alt={params.row.first_name}
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
							alt={params.row.first_name}
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
			field: 'first_name',
			headerName: 'Nom',
			width: 100,
			renderCell: (params: GridRenderCellParams<UserClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'last_name',
			headerName: 'Prénom',
			width: 100,
			renderCell: (params: GridRenderCellParams<UserClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'email',
			headerName: 'Email',
			width: 200,
			renderCell: (params: GridRenderCellParams<UserClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'gender',
			headerName: 'Sexe',
			width: 80,
			renderCell: (params: GridRenderCellParams<UserClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'is_staff',
			headerName: 'Admin',
			width: 70,
			renderCell: (params: GridRenderCellParams<UserClass>) => {
				const isAdmin = Boolean(params.value);
				return (
					<DarkTooltip title={isAdmin ? 'Oui' : 'Non'}>
						{isAdmin ? (
							<CheckCircleIcon color="success" fontSize="small" />
						) : (
							<CancelIcon color="error" fontSize="small" />
						)}
					</DarkTooltip>
				);
			},
		},
		{
			field: 'is_active',
			headerName: 'Active',
			width: 70,
			renderCell: (params: GridRenderCellParams<UserClass>) => {
				const isActive = Boolean(params.value);
				return (
					<DarkTooltip title={isActive ? 'Oui' : 'Non'}>
						{isActive ? (
							<CheckCircleIcon color="success" fontSize="small" />
						) : (
							<CancelIcon color="error" fontSize="small" />
						)}
					</DarkTooltip>
				);
			},
		},
		{
			field: 'date_joined',
			headerName: "Date d'inscription",
			width: 170,
			renderCell: (params: GridRenderCellParams<UserClass>) => {
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
			field: 'last_login',
			headerName: 'Dernière connexion',
			width: 170,
			renderCell: (params: GridRenderCellParams<UserClass>) => {
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
			width: 200,
			sortable: false,
			filterable: false,
			renderCell: (params) => (
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Tooltip title="Voir">
						<IconButton size="small" color="info" onClick={() => router.push(USERS_VIEW(params.row.id))}>
							<VisibilityIcon />
						</IconButton>
					</Tooltip>

					<Tooltip title="Modifier">
						<IconButton size="small" color="primary" onClick={() => router.push(USERS_EDIT(params.row.id))}>
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
			spacing={2}
			className={Styles.flexRootStack}
			mt="48px"
			sx={{ overflowX: 'auto', overflowY: 'hidden' }}
		>
			<NavigationBar title="Liste des utilisateurs">
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
								onClick={() => router.push(USERS_ADD)}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
								startIcon={<AddOutlinedIcon fontSize="small" />}
							>
								Nouveau utilisateur
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
								title="Supprimer ce utilisateur ?"
								body="Êtes‑vous sûr de vouloir supprimer ce utilisateur?"
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

export default UsersListClient;
