'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography, Chip, IconButton, Tooltip, Tabs, Tab, Paper, Container } from '@mui/material';
import { Edit, Delete, Visibility, BusinessOutlined, AddOutlined } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/pro-forma/pro-forma.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useDeleteFactureProFormaMutation, useGetFactureProFormaListQuery } from '@/store/services/factureProForma';
import { PRO_FORMA_EDIT, PRO_FORMA_VIEW, COMPANIES_ADD, PRO_FORMA_ADD } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { FactureProFormaClass } from '@/models/Classes';
import { formatDate } from '@/utils/helpers';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { useToast } from '@/utils/hooks';

interface ProformaListContentProps extends SessionProps {
	company_id: number;
	role: string;
}

const ProformaListContent: React.FC<ProformaListContentProps> = (props: ProformaListContentProps) => {
	const { session, company_id, role } = props;
	const { onSuccess, onError } = useToast();
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
	} = useGetFactureProFormaListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
		},
		{ skip: !token },
	);
	const data = rawData as PaginationResponseType<FactureProFormaClass> | undefined;
	const [deleteRecord] = useDeleteFactureProFormaMutation();

	const deleteHandler = async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			onSuccess('Facture proforma supprimé avec succès');
			refetch();
		} catch {
			onError('Erreur lors de la suppression de la facture proforma');
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
			field: 'numero_facture',
			headerName: 'Numéro facture',
			width: 130,
			renderCell: (params: GridRenderCellParams<FactureProFormaClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date_facture',
			headerName: 'Date facture',
			width: 130,
			renderCell: (params: GridRenderCellParams<FactureProFormaClass>) => {
				const formatted = formatDate(params.value as string | null).split(',')[0];
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
			field: 'client_name',
			headerName: 'Client',
			width: 200,
			renderCell: (params: GridRenderCellParams<FactureProFormaClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'numero_demande_prix_client',
			headerName: 'N° Dde de prix',
			width: 150,
			renderCell: (params: GridRenderCellParams<FactureProFormaClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'statut',
			headerName: 'Statut',
			width: 150,
			renderCell: (params: GridRenderCellParams<FactureProFormaClass>) => (
				<DarkTooltip title={params.value}>
					<Chip label={params.value} size="small" variant="outlined" />
				</DarkTooltip>
			),
		},
		{
			field: 'total_ttc_apres_remise',
			headerName: 'Total TTC après remise',
			width: 150,
			renderCell: (params: GridRenderCellParams<FactureProFormaClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'lignes_count',
			headerName: "Nombre d'articles",
			width: 150,
			renderCell: (params: GridRenderCellParams<FactureProFormaClass>) => (
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
			renderCell: (params: GridRenderCellParams<FactureProFormaClass>) => (
				<Box sx={{ display: 'flex', gap: 1 }}>
					{(role === 'Admin' || role === 'Lecture') && (
						<Tooltip title="Voir">
							<IconButton
								size="small"
								color="info"
								onClick={() => router.push(PRO_FORMA_VIEW(params.row.id, company_id))}
							>
								<Visibility />
							</IconButton>
						</Tooltip>
					)}
					{role === 'Admin' && (
						<>
							<Tooltip title="Modifier">
								<IconButton
									size="small"
									color="primary"
									onClick={() => router.push(PRO_FORMA_EDIT(params.row.id, company_id))}
								>
									<Edit />
								</IconButton>
							</Tooltip>
							<Tooltip title="Supprimer">
								<IconButton size="small" color="error" onClick={() => showDeleteModalCall(params.row.id)}>
									<Delete />
								</IconButton>
							</Tooltip>
						</>
					)}
				</Box>
			),
		},
	];

	return (
		<>
			{role === 'Admin' && (
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
						onClick={() => router.push(PRO_FORMA_ADD(company_id))}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
						startIcon={<AddOutlined fontSize="small" />}
					>
						Nouveau facture proforma
					</Button>
				</Box>
			)}
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
					title="Supprimer ce devi ?"
					body="Êtes‑vous sûr de vouloir supprimer ce devi?"
					actions={deleteModalActions}
				/>
			)}
		</>
	);
};

const ProformaListClient: React.FC<SessionProps> = ({ session }: SessionProps) => {
	const token = getAccessTokenFromSession(session);
	const router = useRouter();
	const { data: companiesData, isLoading } = useGetUserCompaniesQuery(undefined, { skip: !token });
	const [selectedIndex, setSelectedIndex] = useState(0);
	const companies = useMemo(() => companiesData ?? [], [companiesData]);
	const selectedCompany = useMemo(() => companies?.[selectedIndex] ?? null, [companies, selectedIndex]);

	const handleChange = (_: React.SyntheticEvent, newValue: number) => {
		setSelectedIndex(newValue);
	};

	if (isLoading) {
		return <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;
	}

	return (
		<>
			<Stack
				direction="column"
				spacing={2}
				className={Styles.flexRootStack}
				mt="40px"
				sx={{ overflowX: 'auto', overflowY: 'hidden' }}
			>
				<NavigationBar title={'Liste des Factures Proforma'}>
					{!companies || companies.length === 0 ? (
						<Container maxWidth="sm" sx={{ mt: 8 }}>
							<Paper
								elevation={3}
								sx={{
									p: 6,
									textAlign: 'center',
									borderRadius: 3,
									background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)',
								}}
							>
								<Box
									sx={{
										width: 80,
										height: 80,
										borderRadius: '50%',
										backgroundColor: 'rgba(13, 7, 11, 0.08)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										margin: '0 auto 24px',
									}}
								>
									<BusinessOutlined sx={{ fontSize: 48, color: '#0D070B', opacity: 0.6 }} />
								</Box>
								<Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
									Aucune entreprise trouvée
								</Typography>
								{selectedCompany?.role === 'Admin' ? (
									<>
										<Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
											Vous n&#39;avez pas encore d&#39;entreprises associées à votre compte. Veuillez créer une nouvelle
											entreprise.
										</Typography>
										<Button
											variant="contained"
											size="large"
											sx={{ mt: 2, borderRadius: 2, px: 4 }}
											onClick={() => router.push(COMPANIES_ADD)}
										>
											Créer une entreprise
										</Button>
									</>
								) : (
									<Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
										Vous n&#39;avez pas encore d&#39;entreprises associées à votre compte. Veuillez contacter votre
										administrateur.
									</Typography>
								)}
							</Paper>
						</Container>
					) : (
						<>
							<Paper
								elevation={0}
								sx={{
									width: '100%',
									borderBottom: 1,
									borderColor: 'divider',
									mb: 2,
									bgcolor: 'background.paper',
									borderRadius: '8px 8px 0 0',
								}}
							>
								<Tabs
									value={selectedIndex}
									onChange={handleChange}
									variant="scrollable"
									allowScrollButtonsMobile
									scrollButtons="auto"
									aria-label="companies tabs"
									sx={{
										'& .MuiTabs-indicator': {
											height: 3,
											borderRadius: '3px 3px 0 0',
										},
										'& .MuiTab-root': {
											textTransform: 'none',
											fontSize: '0.95rem',
											fontWeight: 500,
											minHeight: 56,
											px: 3,
											transition: 'all 0.2s ease',
											'&:hover': {
												backgroundColor: 'action.hover',
											},
											'&.Mui-selected': {
												fontWeight: 600,
											},
										},
										'& .MuiTabs-scrollButtons': {
											'&.Mui-disabled': {
												opacity: 0.3,
											},
										},
									}}
								>
									{companies.length > 0 &&
										companies.map((company) => <Tab key={company.id} label={company.raison_sociale} />)}
								</Tabs>
							</Paper>
							{selectedCompany && (
								<ProformaListContent session={session} company_id={selectedCompany.id} role={selectedCompany.role} />
							)}
						</>
					)}
				</NavigationBar>
			</Stack>
		</>
	);
};

export default ProformaListClient;
