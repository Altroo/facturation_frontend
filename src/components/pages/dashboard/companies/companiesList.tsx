'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography, Avatar, Chip, IconButton, Tooltip } from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useDeleteCompanyMutation, useGetCompaniesListQuery } from '@/store/services/company';
import { COMPANIES_ADD, COMPANIES_VIEW, COMPANIES_EDIT } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import { CompanyClass } from '@/models/Classes';
import { formatDate } from '@/utils/helpers';
import { Protected } from '@/components/layouts/protected/protected';

const CompaniesListClient: React.FC<SessionProps> = ({ session }: SessionProps) => {
	const router = useRouter();
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
			token,
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

	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState<string>('');
	const [toastType, setToastType] = useState<'success' | 'error'>('success');

	const deleteHandler = async () => {
		try {
			await deleteRecord({ token, id: selectedId! }).unwrap();
			// success toast
			setToastMessage('Entreprise supprimée avec succès');
			setToastType('success');
			setShowToast(true);
			// refresh the page / data
			refetch();
		} catch (err) {
			// error toast
			setToastMessage('Erreur lors de la suppression de l’entreprise');
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
		setSelectedId(id);
		setShowDeleteModal(true);
	};

	const columns: GridColDef[] = [
		{
			field: 'logo',
			headerName: 'Logo',
			width: 60,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => (
				<Avatar src={params.value} alt={params.row.raison_sociale} variant="rounded" sx={{ width: 40, height: 40 }} />
			),
			sortable: false,
			filterable: false,
		},
		{
			field: 'raison_sociale',
			headerName: 'Raison Sociale',
			width: 180,
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
			width: 180,
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
			width: 220,
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
			width: 240,
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
			width: 180,
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
			width: 120,
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
			width: 200,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<CompanyClass>) => (
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Tooltip title="Voir">
						<IconButton size="small" color="info" onClick={() => router.push(COMPANIES_VIEW(params.row.id))}>
							<Visibility />
						</IconButton>
					</Tooltip>

					<Tooltip title="Modifier">
						<IconButton size="small" color="primary" onClick={() => router.push(COMPANIES_EDIT(params.row.id))}>
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
							/>
						)}
					</>
				</Protected>
			</NavigationBar>
			<Portal id="snackbar_portal">
				<CustomToast type={toastType} message={toastMessage} setShow={setShowToast} show={showToast} />
			</Portal>
		</Stack>
	);
};

export default CompaniesListClient;
