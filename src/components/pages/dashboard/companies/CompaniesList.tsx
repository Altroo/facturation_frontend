'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography, Avatar, Chip, IconButton, Tooltip } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useGetCompaniesListQuery } from '@/store/services/company/company';
import { COMPANIES_ADD, COMPANIES_EDIT } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { AppSession } from '@/types/_init/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';

type Props = { session?: AppSession };

const CompaniesList: React.FC<Props> = ({ session }: Props) => {
	const router = useRouter();
	const token = getAccessTokenFromSession(session);

	const [paginationModel, setPaginationModel] = React.useState<{ page: number; pageSize: number }>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = React.useState<string>('');

	const { data, isLoading } = useGetCompaniesListQuery(
		{
			token,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
		},
		{ skip: !token },
	);

	const columns: GridColDef[] = [
		{
			field: 'logo',
			headerName: 'Logo',
			width: 60,
			renderCell: (params) => (
				<Avatar
					src={`${process.env.NEXT_PUBLIC_API_URL_GRID_IMAGES}${params.value}`}
					alt={params.row.raison_sociale}
					variant="rounded"
					sx={{ width: 40, height: 40 }}
				/>
			),
			sortable: false,
			filterable: false,
		},
		{
			field: 'raison_sociale',
			headerName: 'Raison Sociale',
			width: 180,
			renderCell: (params) => (
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
			renderCell: (params) => (
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
			renderCell: (params) => {
				const fullName = `${params.row.civilite_responsable} ${params.value}`;
				return (
					<DarkTooltip title={fullName}>
						<Typography variant="body2" noWrap>
							{fullName}
						</Typography>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'email',
			headerName: 'Email',
			width: 240,
			renderCell: (params) => (
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
			renderCell: (params) => (
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
			renderCell: (params) => (
				<DarkTooltip title={params.value}>
					<Chip label={params.value} size="small" variant="outlined" />
				</DarkTooltip>
			),
		},
		{
			field: 'date_created',
			headerName: 'Date de création',
			width: 180,
			renderCell: (params) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'actions',
			headerName: 'Actions',
			width: 200,
			sortable: false,
			filterable: false,
			renderCell: (params) => (
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Tooltip title="Modifier">
						<IconButton size="small" onClick={() => router.push(COMPANIES_EDIT(params.row.id))}>
							<Edit />
						</IconButton>
					</Tooltip>
					<Tooltip title="Supprimer">
						<IconButton size="small" onClick={() => {}}>
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
			<NavigationBar>
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
			</NavigationBar>
		</Stack>
	);
};

export default CompaniesList;
