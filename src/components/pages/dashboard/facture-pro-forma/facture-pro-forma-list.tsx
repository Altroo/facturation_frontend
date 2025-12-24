'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	Typography,
	Chip,
	IconButton,
	CircularProgress,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Menu,
} from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	Add as AddIcon,
	Close as CloseIcon,
	CheckCircle as CheckCircleIcon,
	SwapHoriz as SwapHorizIcon,
	ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import {
	useDeleteFactureProFormaMutation,
	useGetFactureProFormaListQuery,
	useConvertFactureProFormaToFactureMutation,
} from '@/store/services/factureProForma';
import {
	CLIENTS_VIEW,
	FACTURE_CLIENT_EDIT,
	FACTURE_PRO_FORMA_ADD,
	FACTURE_PRO_FORMA_EDIT,
	FACTURE_PRO_FORMA_VIEW,
} from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { FactureClass } from '@/models/classes';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import { getStatutColor, statutFilterOptions } from '@/components/pages/dashboard/devis/devis-list';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';

interface FormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
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
	const [showConvertClientModal, setShowConvertClientModal] = useState(false);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [menuDeviId, setMenuDeviId] = useState<number | null>(null);

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

	const [convertToFactureClient, { isLoading: isConvertToFactureClientLoading }] =
		useConvertFactureProFormaToFactureMutation();
	const data = rawData as PaginationResponseType<FactureClass> | undefined;
	const [deleteRecord] = useDeleteFactureProFormaMutation();

	const deleteHandler = useCallback(async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			onSuccess('Facture pro-forma supprimé avec succès');
			refetch();
		} catch {
			onError('Erreur lors de la suppression du facture pro-forma');
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

	const convertToFactureClientHandler = useCallback(async () => {
		try {
			const response = await convertToFactureClient({ id: selectedId! }).unwrap();
			onSuccess('Facture pro-forma converti en facture client avec succès');
			setTimeout(() => {
				router.push(FACTURE_CLIENT_EDIT(response.id, company_id));
			}, 500);
		} catch {
			onError('Erreur lors de la conversion du facture pro-forma');
		} finally {
			setShowConvertClientModal(false);
		}
	}, [convertToFactureClient, selectedId, onSuccess, router, company_id, onError]);

	const convertirFactureClientModalActions = useMemo(
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

	const renderActions = (params: GridRenderCellParams<FactureClass>) => (
		<>
			<DarkTooltip title="Modifier">
				<IconButton
					size="small"
					color="primary"
					onClick={() => router.push(FACTURE_PRO_FORMA_EDIT(params.row.id, company_id))}
				>
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
					disabled={isConvertToFactureClientLoading && selectedId === params.row.id}
				>
					{isConvertToFactureClientLoading && selectedId === params.row.id ? (
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
				title: 'Supprimer cette facture pro-forma ?',
				body: 'Êtes‑vous sûr de vouloir supprimer cette facture pro-forma ?',
				actions: deleteModalActions,
				titleIcon: <DeleteIcon />,
				titleIconColor: '#D32F2F',
			},
			convert: {
				title: 'Convertir en facture client ?',
				body: 'Êtes-vous sûr de vouloir convertir cette facture pro forma en facture client ?',
				actions: convertirFactureClientModalActions,
				titleIcon: <ReceiptLongIcon />,
				titleIconColor: '#2E7D32',
			},
		}),
		[deleteModalActions, convertirFactureClientModalActions],
	);

	const clientFilterOptions = React.useMemo(() => {
		if (!data?.results) return [];

		const objectMap = new Map<number, string>();
		data.results.forEach((facture) => {
			if (facture.client && facture.client_name) {
				objectMap.set(facture.client, facture.client_name);
			}
		});

		return Array.from(objectMap.entries()).map(([, name]) => ({
			value: name,
			label: name,
		}));
	}, [data?.results]);

	const columns: GridColDef[] = [
		{
			field: 'numero_facture',
			headerName: 'Numéro facture',
			width: 130,
			renderCell: (params: GridRenderCellParams<FactureClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'client_name',
			headerName: 'Client',
			width: 180,
			filterOperators: createDropdownFilterOperators(clientFilterOptions, 'Tous les clients'),
			renderCell: (params: GridRenderCellParams<FactureClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						<TextButton
							buttonText={params.value}
							onClick={() => router.push(CLIENTS_VIEW(params.row.client as number, company_id))}
							cssClass={Styles.textButton}
						/>
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'numero_bon_commande_client',
			headerName: 'N° bon commande client',
			width: 150,
			renderCell: (params: GridRenderCellParams<FactureClass>) => (
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
			width: 100,
			filterOperators: createDropdownFilterOperators(statutFilterOptions, 'Tous les statuts', true),
			renderCell: (params: GridRenderCellParams<FactureClass>) => (
				<DarkTooltip title={params.value}>
					<Chip label={params.value || '-'} color={getStatutColor(params.value || '')} variant="outlined" />
				</DarkTooltip>
			),
		},
		{
			field: 'total_ttc_apres_remise',
			headerName: 'Total TTC après remise',
			width: 150,
			renderCell: (params: GridRenderCellParams<FactureClass>) => (
				<DarkTooltip title={params.value.toFixed(2) + ' DH'}>
					<Typography variant="body2" noWrap>
						{params.value.toFixed(2)} DH
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'lignes_count',
			headerName: "Nombre d'articles",
			width: 150,
			renderCell: (params: GridRenderCellParams<FactureClass>) => (
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
			renderCell: (params: GridRenderCellParams<FactureClass>) => {
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
			field: 'actions',
			headerName: 'Actions',
			width: 180,
			sortable: false,
			filterable: false,
			renderCell: (p: GridRenderCellParams<FactureClass>) => (
				<Box sx={{ display: 'flex', gap: 1 }}>
					{(role === 'Admin' || role === 'Lecture') && (
						<DarkTooltip title="Voir">
							<IconButton
								size="small"
								color="info"
								onClick={() => router.push(FACTURE_PRO_FORMA_VIEW(p.row.id, company_id))}
							>
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
						onClick={() => router.push(FACTURE_PRO_FORMA_ADD(company_id))}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
						startIcon={<AddIcon fontSize="small" />}
					>
						Nouvelle facture proforma
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
			{showConvertClientModal && <ActionModals {...modalsConfig.convert} />}
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
							setShowConvertClientModal(true);
						}
						setAnchorEl(null);
					}}
				>
					<ListItemIcon>
						<ReceiptLongIcon fontSize="small" color="success" />
					</ListItemIcon>
					<ListItemText>Facture</ListItemText>
				</MenuItem>
			</Menu>
		</>
	);
};

const FactureProformaListClient: React.FC<SessionProps> = ({ session }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title="Liste des Factures Proforma">
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default FactureProformaListClient;
