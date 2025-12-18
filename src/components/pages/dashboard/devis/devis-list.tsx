'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	Stack,
	Typography,
	Chip,
	IconButton,
	Tabs,
	Tab,
	Paper,
	Container,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
	CircularProgress,
} from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	Business as BusinessIcon,
	Add as AddIcon,
	Close as CloseIcon,
	SwapHoriz as SwapHorizIcon,
	CheckCircle as CheckCircleIcon,
	ReceiptLong as ReceiptLongIcon,
	ReceiptLongOutlined as ReceiptLongOutlinedIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	useDeleteDeviMutation,
	useGetDevisListQuery,
	useConvertDeviToFactureProFormaMutation,
	useConvertDeviToFactureClientMutation,
} from '@/store/services/devi';
import {
	DEVIS_EDIT,
	DEVIS_VIEW,
	COMPANIES_ADD,
	DEVIS_ADD,
	FACTURE_PRO_FORMA_EDIT,
	FACTURE_CLIENT_EDIT,
	CLIENTS_VIEW,
} from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { DeviClass } from '@/models/classes';
import { formatDate } from '@/utils/helpers';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { useToast } from '@/utils/hooks';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';

export const getStatutColor = (
	statut: string,
): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
	switch (statut) {
		case 'Brouillon':
			return 'default';
		case 'Envoyé':
			return 'info';
		case 'Accepté':
			return 'success';
		case 'Refusé':
			return 'error';
		case 'Annulé':
			return 'error';
		case 'Expiré':
			return 'warning';
		default:
			return 'default';
	}
};

interface FormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

const FormikContent: React.FC<FormikContentProps> = (props) => {
	const { session, company_id, role } = props;
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const token = getAccessTokenFromSession(session);

	const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
		page: 0,
		pageSize: 10,
	});

	const [searchTerm, setSearchTerm] = useState('');
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [showConvertProFormaModal, setShowConvertProFormaModal] = useState(false);
	const [showConvertClientModal, setShowConvertClientModal] = useState(false);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [menuDeviId, setMenuDeviId] = useState<number | null>(null);

	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetDevisListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
		},
		{ skip: !token },
	);

	const [convertToFactureProforma, { isLoading: isConvertToFactureProFormaLoading }] =
		useConvertDeviToFactureProFormaMutation();
	const [convertToFactureClient, { isLoading: isConvertToFactureClientLoading }] =
		useConvertDeviToFactureClientMutation();
	const data = rawData as PaginationResponseType<DeviClass> | undefined;
	const [deleteRecord] = useDeleteDeviMutation();

	const deleteHandler = useCallback(async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			onSuccess('Devi supprimé avec succès');
			refetch();
		} catch {
			onError('Erreur lors de la suppression du devi');
		} finally {
			setShowDeleteModal(false);
		}
	}, [selectedId, deleteRecord, onSuccess, onError, refetch]);

	const deleteModalActions = useMemo(
		() => [
			{
				text: 'Annuler',
				active: false,
				onClick: () => setShowDeleteModal(false),
				icon: <CloseIcon />,
				color: '#6B6B6B',
			},
			{ text: 'Supprimer', active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
		],
		[deleteHandler],
	);

	const showDeleteModalCall = (id: number) => {
		setSelectedId(id);
		setShowDeleteModal(true);
	};

	const convertToFactureProformaHandler = useCallback(async () => {
		try {
			const response = await convertToFactureProforma({ id: selectedId! }).unwrap();
			onSuccess('Devis converti en facture pro-forma avec succès');
			setTimeout(() => {
				router.push(FACTURE_PRO_FORMA_EDIT(response.id, company_id));
			}, 500);
		} catch {
			onError('Erreur lors de la conversion du devis');
		} finally {
			setShowConvertProFormaModal(false);
		}
	}, [convertToFactureProforma, selectedId, onSuccess, router, company_id, onError]);

	const convertToFactureClientHandler = useCallback(async () => {
		try {
			const response = await convertToFactureClient({ id: selectedId! }).unwrap();
			onSuccess('Devis converti en facture client avec succès');
			setTimeout(() => {
				router.push(FACTURE_CLIENT_EDIT(response.id, company_id));
			}, 500);
		} catch {
			onError('Erreur lors de la conversion du devis');
		} finally {
			setShowConvertProFormaModal(false);
		}
	}, [convertToFactureClient, selectedId, onSuccess, router, company_id, onError]);

	const convertirToFactureProFormatModalActions = useMemo(
		() => [
			{
				text: 'Annuler',
				active: false,
				onClick: () => setShowConvertProFormaModal(false),
				icon: <CloseIcon />,
				color: '#6B6B6B',
			},
			{
				text: 'Convertir',
				active: true,
				onClick: convertToFactureProformaHandler,
				icon: <CheckCircleIcon />,
				color: '#2E7D32',
			},
		],
		[convertToFactureProformaHandler],
	);

	const convertirToFactureClientModalActions = useMemo(
		() => [
			{
				text: 'Annuler',
				active: false,
				onClick: () => setShowConvertClientModal(false),
				icon: <CloseIcon />,
				color: '#6B6B6B',
			},
			{
				text: 'Convertir',
				active: true,
				onClick: convertToFactureClientHandler,
				icon: <CheckCircleIcon />,
				color: '#2E7D32',
			},
		],
		[convertToFactureClientHandler],
	);

	const showConvertModalCall = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, id: number) => {
		setAnchorEl(e.currentTarget);
		setMenuDeviId(id);
	};

	const renderActions = (params: GridRenderCellParams<DeviClass>) => (
		<>
			<DarkTooltip title="Modifier">
				<IconButton size="small" color="primary" onClick={() => router.push(DEVIS_EDIT(params.row.id, company_id))}>
					<EditIcon fontSize="small" />
				</IconButton>
			</DarkTooltip>
			<DarkTooltip title="Supprimer">
				<IconButton size="small" color="error" onClick={() => showDeleteModalCall(params.row.id)}>
					<DeleteIcon fontSize="small" />
				</IconButton>
			</DarkTooltip>
			<DarkTooltip title="Convertir">
				<IconButton
					size="small"
					color="success"
					onClick={(e) => showConvertModalCall(e, params.row.id)}
					disabled={
						(isConvertToFactureProFormaLoading || isConvertToFactureClientLoading) && selectedId === params.row.id
					}
				>
					{(isConvertToFactureProFormaLoading || isConvertToFactureClientLoading) && selectedId === params.row.id ? (
						<CircularProgress size={20} />
					) : (
						<SwapHorizIcon fontSize="small" />
					)}
				</IconButton>
			</DarkTooltip>
		</>
	);

	const modalsConfig = useMemo(
		() => ({
			delete: {
				title: 'Supprimer ce devi ?',
				body: 'Êtes‑vous sûr de vouloir supprimer ce devi ?',
				actions: deleteModalActions,
				titleIcon: <DeleteIcon />,
				titleIconColor: '#D32F2F',
			},
			convert_facture_pro_forma: {
				title: 'Convertir en facture pro-forma ?',
				body: 'Êtes-vous sûr de vouloir convertir ce devi en facture pro-forma ?',
				actions: convertirToFactureProFormatModalActions,
				titleIcon: <ReceiptLongIcon />,
				titleIconColor: '#2E7D32',
			},
			convert_facture_client: {
				title: 'Convertir en facture client ?',
				body: 'Êtes-vous sûr de vouloir convertir ce devi en facture client ?',
				actions: convertirToFactureClientModalActions,
				titleIcon: <ReceiptLongIcon />,
				titleIconColor: '#2E7D32',
			},
		}),
		[deleteModalActions, convertirToFactureProFormatModalActions, convertirToFactureClientModalActions],
	);

	const columns: GridColDef[] = [
		{
			field: 'numero_devis',
			headerName: 'Numéro devi',
			width: 130,
			renderCell: (p: GridRenderCellParams<DeviClass>) => (
				<DarkTooltip title={p.value}>
					<Typography variant="body2" noWrap>
						{p.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'client_name',
			headerName: 'Client',
			width: 180,
			renderCell: (p: GridRenderCellParams<DeviClass>) => (
				<DarkTooltip title={p.value}>
					<Typography variant="body2" noWrap>
						<TextButton
							buttonText={p.value}
							onClick={() => router.push(CLIENTS_VIEW(p.row.client, company_id))}
							cssClass={Styles.textButton}
						/>
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'numero_demande_prix_client',
			headerName: 'N° Dde de prix',
			width: 150,
			renderCell: (p: GridRenderCellParams<DeviClass>) => (
				<DarkTooltip title={p.value}>
					<Typography variant="body2" noWrap>
						{p.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'statut',
			headerName: 'Statut',
			width: 100,
			renderCell: (p: GridRenderCellParams<DeviClass>) => (
				<DarkTooltip title={p.value}>
					<Chip label={p.value || '-'} color={getStatutColor(p.value || '')} variant="outlined" />
				</DarkTooltip>
			),
		},
		{
			field: 'total_ttc_apres_remise',
			headerName: 'Total TTC après remise',
			width: 150,
			renderCell: (p: GridRenderCellParams<DeviClass>) => (
				<DarkTooltip title={p.value.toFixed(2) + ' DH'}>
					<Typography variant="body2" noWrap>
						{p.value.toFixed(2)} DH
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'lignes_count',
			headerName: "Nombre d'articles",
			width: 150,
			renderCell: (p: GridRenderCellParams<DeviClass>) => (
				<DarkTooltip title={p.value}>
					<Typography variant="body2" noWrap>
						{p.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date_devis',
			headerName: 'Date devi',
			width: 130,
			renderCell: (p: GridRenderCellParams<DeviClass>) => {
				const f = formatDate(p.value as string | null).split(',')[0];
				return (
					<DarkTooltip title={f}>
						<Typography variant="body2" noWrap>
							{f}
						</Typography>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'actions',
			headerName: 'Actions',
			width: 180,
			sortable: false,
			filterable: false,
			renderCell: (p: GridRenderCellParams<DeviClass>) => (
				<Box sx={{ display: 'flex', gap: 1 }}>
					{(role === 'Admin' || role === 'Lecture') && (
						<DarkTooltip title="Voir">
							<IconButton size="small" color="info" onClick={() => router.push(DEVIS_VIEW(p.row.id, company_id))}>
								<VisibilityIcon />
							</IconButton>
						</DarkTooltip>
					)}
					{role === 'Admin' && <>{renderActions(p)}</>}
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
						onClick={() => router.push(DEVIS_ADD(company_id))}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
						startIcon={<AddIcon fontSize="small" />}
					>
						Nouveau devi
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

			{showDeleteModal && <ActionModals {...modalsConfig.delete} />}
			{showConvertProFormaModal && <ActionModals {...modalsConfig.convert_facture_pro_forma} />}
			{showConvertClientModal && <ActionModals {...modalsConfig.convert_facture_client} />}

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={() => {
					setAnchorEl(null);
					setMenuDeviId(null);
				}}
				slotProps={{ paper: { elevation: 3, sx: { minWidth: 220 } } }}
			>
				<MenuItem
					onClick={() => {
						if (menuDeviId) {
							setSelectedId(menuDeviId);
							setShowConvertProFormaModal(true);
						}
						setAnchorEl(null);
					}}
				>
					<ListItemIcon>
						<ReceiptLongOutlinedIcon fontSize="small" color="success" />
					</ListItemIcon>
					<ListItemText>Facture pro-forma</ListItemText>
				</MenuItem>
				<Divider />
				<MenuItem
					onClick={() => {
						if (menuDeviId) {
							setSelectedId(menuDeviId);
							setShowConvertClientModal(true);
						}
						setAnchorEl(null);
					}}
				>
					<ListItemIcon>
						<ReceiptLongIcon fontSize="small" color="success" />
					</ListItemIcon>
					<ListItemText>Facture client</ListItemText>
				</MenuItem>
			</Menu>
		</>
	);
};

const DevisListClient: React.FC<SessionProps> = ({ session }: SessionProps) => {
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
				<NavigationBar title={'Liste des Devis'}>
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
									<BusinessIcon sx={{ fontSize: 48, color: '#0D070B', opacity: 0.6 }} />
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
								<FormikContent session={session} company_id={selectedCompany.id} role={selectedCompany.role} />
							)}
						</>
					)}
				</NavigationBar>
			</Stack>
		</>
	);
};

export default DevisListClient;
