'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography, Avatar, IconButton, Tooltip } from '@mui/material';
import { Edit, Delete, Visibility, CheckCircle, Cancel } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useDeleteUserMutation, useGetUsersListQuery } from '@/store/services/account';
import { USERS_VIEW, USERS_EDIT, USERS_ADD } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import { UserClass } from '@/models/Classes';
import { formatDate } from '@/utils/helpers';

const UsersListClient: React.FC<SessionProps> = ({ session }: SessionProps) => {
	const router = useRouter();
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
			token,
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

	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState<string>('');
	const [toastType, setToastType] = useState<'success' | 'error'>('success');

	const deleteHandler = async () => {
		try {
			await deleteRecord({ token, id: selectedUserId! }).unwrap();
			// success toast
			setToastMessage('Utilisateur supprimée avec succès');
			setToastType('success');
			setShowToast(true);
			// refresh the page / data
			refetch();
		} catch (err) {
			// error toast
			setToastMessage('Erreur lors de la suppression de l’utilisateur');
			setToastType('error');
			setShowToast(true);

			console.error(err);
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{
			active: true,
			text: 'Oui',
			onClick: deleteHandler,
		},
		{
			active: false,
			text: 'Non',
			onClick: () => setShowDeleteModal(false),
		},
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
			renderCell: (params: GridRenderCellParams<UserClass>) => (
				<Avatar src={params.value} alt={params.row.first_name} variant="rounded" sx={{ width: 40, height: 40 }} />
			),
			sortable: false,
			filterable: false,
		},
		{
			field: 'first_name',
			headerName: 'Nom',
			width: 150,
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
			width: 150,
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
						{isAdmin ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
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
						{isActive ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
					</DarkTooltip>
				);
			},
		},
		{
			field: 'date_joined',
			headerName: "Date d'inscription",
			width: 200,
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
			width: 200,
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
							<Visibility />
						</IconButton>
					</Tooltip>

					<Tooltip title="Modifier">
						<IconButton size="small" color="primary" onClick={() => router.push(USERS_EDIT(params.row.id))}>
							<Edit />
						</IconButton>
					</Tooltip>

					<Tooltip title="Supprimer">
						<IconButton size="small" color="error" onClick={() => showDeleteModalCall(params.row.id)}>
							<Delete />
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
			mt="32px"
			sx={{ overflowX: 'auto', overflowY: 'hidden' }}
		>
			<NavigationBar title="Liste des utilisateurs">
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
					/>
				)}
				<Portal id="snackbar_portal">
					<CustomToast type={toastType} message={toastMessage} setShow={setShowToast} show={showToast} />
				</Portal>
			</NavigationBar>
		</Stack>
	);
};

export default UsersListClient;
