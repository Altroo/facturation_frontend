'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Stack, ThemeProvider, Box, Typography, Avatar, Chip, Button, IconButton, Tooltip } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { getAccessTokenFromSession } from '@/store/session';
import { getDefaultTheme } from '@/utils/themes';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useGetCompaniesListQuery } from '@/store/services/company/company';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import type { AppSession } from '@/types/_init/_initTypes';
import { COMPANIES_ADD, COMPANIES_EDIT } from '@/utils/routes';

type Props = { session?: AppSession };

const CompaniesList: React.FC<Props> = ({ session }: Props) => {
	const router = useRouter();
	const token = getAccessTokenFromSession(session);
	const { data: companies, isLoading } = useGetCompaniesListQuery(token, { skip: !token });

	const columns: GridColDef[] = [
		{
			field: 'logo',
			headerName: 'Logo',
			width: 80,
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
		{ field: 'raison_sociale', headerName: 'Raison Sociale', width: 200, flex: 1 },
		{ field: 'ICE', headerName: 'ICE', width: 150 },
		{
			field: 'nom_responsable',
			headerName: 'Responsable',
			width: 200,
			renderCell: (params) => (
				<Box>
					<Typography variant="body2">
						{params.row.civilite_responsable} {params.value}
					</Typography>
				</Box>
			),
		},
		{ field: 'email', headerName: 'Email', width: 220 },
		{ field: 'telephone', headerName: 'Téléphone', width: 150 },
		{
			field: 'nbr_employe',
			headerName: 'Employés',
			width: 120,
			renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />,
		},
		{ field: 'adresse', headerName: 'Adresse', width: 250, flex: 1 },
		{ field: 'date_created', headerName: 'Date de création', width: 150 },
		{
			field: 'actions',
			headerName: 'Actions',
			width: 120,
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
						<IconButton
							size="small"
							onClick={() => {
								/* TODO: delete logic add confirmation modal */
							}}
						>
							<Delete />
						</IconButton>
					</Tooltip>
				</Box>
			),
		},
	];

	const rows = companies?.results || [];

	return (
		<ThemeProvider theme={getDefaultTheme()}>
			<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
				<NavigationBar>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 3, mr: 2 }}>
						<Button variant="contained" onClick={() => router.push(COMPANIES_ADD)}>
							Nouvelle entreprise
						</Button>
					</Box>

					<Box sx={{ height: '100%', width: '100%' }}>
						{isLoading && (
							<ApiProgress
								cssStyle={{ position: 'absolute', top: '50%', left: '50%' }}
								backdropColor="#FFFFFF"
								circularColor="#0D070B"
							/>
						)}

						<DataGrid
							rows={rows}
							columns={columns}
							loading={isLoading}
							pageSizeOptions={[5, 10, 25, 50, 100]}
							initialState={{
								pagination: { paginationModel: { pageSize: 10, page: 0 } },
							}}
							showToolbar
							slotProps={{
								toolbar: {
									showQuickFilter: true,
									quickFilterProps: { debounceMs: 500 },
								},
							}}
							localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
							disableRowSelectionOnClick
							sx={{
								'& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
								'& .MuiDataGrid-row:hover': { cursor: 'pointer' },
							}}
						/>
					</Box>
				</NavigationBar>
			</Stack>
		</ThemeProvider>
	);
};

export default CompaniesList;
