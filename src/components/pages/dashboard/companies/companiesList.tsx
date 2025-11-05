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
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';

type Props = { session?: AppSession };

const CompaniesList: React.FC<Props> = ({ session }: Props) => {
	const router = useRouter();
	const token = getAccessTokenFromSession(session);
	const { data: companies, isLoading } = useGetCompaniesListQuery(token, { skip: !token });

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

	const rows = companies?.results || [];

	return (
		<ThemeProvider theme={getDefaultTheme()}>
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

					<Box
						sx={{
							width: '100%',
							position: 'relative',
							overflow: 'auto',
						}}
					>
						{isLoading && (
							<ApiProgress
								cssStyle={{
									position: 'absolute',
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)',
									zIndex: 1500,
								}}
								backdropColor="#FFFFFF"
								circularColor="#0D070B"
							/>
						)}

						<Box
							sx={{
								width: '100%',
								overflowX: 'auto',
								overflowY: 'visible',
								WebkitOverflowScrolling: 'touch',
								overscrollBehavior: 'contain',
								px: { xs: 1, sm: 2, md: 3 },
								mb: { xs: 1, sm: 2, md: 3 },
							}}
						>
							<Box
								sx={{
									width: {
										xs: 'fit-content',
										sm: 'fit-content',
										md: '100%',
										maxWidth: '1600px',
										mx: 'auto',
									},
								}}
							>
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
										height: '100%',
										'& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
										'& .MuiDataGrid-row:hover': { cursor: 'pointer' },
									}}
								/>
							</Box>
						</Box>
					</Box>
				</NavigationBar>
			</Stack>
		</ThemeProvider>
	);
};

export default CompaniesList;
