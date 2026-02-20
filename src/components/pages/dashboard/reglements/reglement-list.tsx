'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography, Chip, Card, CardContent, Stack, Divider } from '@mui/material';
import CurrencyToggle from '@/components/shared/currencyToggle/currencyToggle';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	Add as AddIcon,
	Close as CloseIcon,
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	AttachMoney as AttachMoneyIcon,
	Print as PrintIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams, GridFilterModel, GridLogicOperator } from '@mui/x-data-grid';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import { getAccessTokenFromSession } from '@/store/session';
import { fetchPdfBlob } from '@/utils/apiHelpers';
import {
	useDeleteReglementMutation,
	useGetReglementsListQuery,
	usePatchReglementStatutMutation,
	useBulkDeleteReglementsMutation,
} from '@/store/services/reglement';
import { REGLEMENTS_ADD, REGLEMENTS_EDIT, REGLEMENTS_VIEW, CLIENTS_VIEW, REGLEMENT_PDF } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import type { SessionProps } from '@/types/_initTypes';
import type { ReglementListResponseType } from '@/types/reglementTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { ReglementClass } from '@/models/classes';
import { formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import { useGetModePaiementListQuery } from '@/store/services/parameter';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import { useGetCompanyQuery } from '@/store/services/company';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';

interface FormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

export const statutFilterOptions = [
	{ value: 'Valide', label: 'Valide', color: 'success' as const },
	{ value: 'Annulé', label: 'Annulé', color: 'error' as const },
];

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { session, company_id, role } = props;
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const token = getAccessTokenFromSession(session);

	const { data: companyData } = useGetCompanyQuery({ id: company_id }, { skip: !token });
	const usesForeignCurrency = companyData?.uses_foreign_currency === true;

	const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedDevise, setSelectedDevise] = useState<'MAD' | 'EUR' | 'USD'>('MAD');

	// Reset to MAD when company changes or doesn't use foreign currency
	React.useEffect(() => {
		if (!usesForeignCurrency) {
			setSelectedDevise('MAD');
		}
	}, [company_id, usesForeignCurrency]);

	const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
	const [cancelTarget, setCancelTarget] = useState<number | null>(null);

	const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
	const [printReglementId, setPrintReglementId] = useState<number | null>(null);
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});

	// Bulk selection state
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);

	const { data: modePaiement } = useGetModePaiementListQuery({ company_id }, { skip: !token });

	const chipFilters: ChipFilterConfig[] = React.useMemo(
		() => [
			{ key: 'mode_reglement', label: 'Mode de règlement', paramName: 'mode_reglement_ids', options: modePaiement ?? [] },
		],
		[modePaiement],
	);

	const mergedFilterParams = React.useMemo(
		() => ({ ...chipFilterParams, ...customFilterParams }),
		[chipFilterParams, customFilterParams],
	);

	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetReglementsListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			...mergedFilterParams,
		},
		{ skip: !token },
	);
	const data = rawData as ReglementListResponseType | undefined;

	const clientFilterOptions = useMemo(() => {
		if (!data?.results) return [];
		const objectMap = new Map<number, string>();
		data.results.forEach((reglement) => {
			if (reglement.client && reglement.client_name) {
				objectMap.set(reglement.client, reglement.client_name);
			}
		});
		return Array.from(objectMap.entries()).map(([, name]) => ({
			value: name,
			label: name,
		}));
	}, [data?.results]);

	const [deleteRecord] = useDeleteReglementMutation();
	const [bulkDeleteReglements] = useBulkDeleteReglementsMutation();
	const [patchStatut] = usePatchReglementStatutMutation();

	const deleteHandler = async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			onSuccess('Règlement supprimé avec succès');
			refetch();
		} catch {
			onError('Erreur lors de la suppression du règlement');
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

	const handleSelectionChange = (ids: number[]) => {
		setSelectedIds(ids);
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteReglements({ ids: selectedIds }).unwrap();
			onSuccess(`${selectedIds.length} règlement(s) supprimé(s) avec succès`);
		} catch {
			onError(`Erreur lors de la suppression`);
		} finally {
			setSelectedIds([]);
			setShowBulkDeleteModal(false);
			refetch();
		}
	};

	const bulkDeleteModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowBulkDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: `Supprimer (${selectedIds.length})`, active: true, onClick: bulkDeleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const cancelHandler = async () => {
		if (!cancelTarget) return;
		try {
			await patchStatut({
				id: cancelTarget,
				data: { statut: 'Annulé' },
			}).unwrap();
			onSuccess('Règlement annulé avec succès');
			refetch();
		} catch {
			onError("Erreur lors de l'annulation du règlement");
		} finally {
			setShowCancelModal(false);
			setCancelTarget(null);
		}
	};

	const cancelModalActions = [
		{
			text: 'Fermer',
			active: false,
			onClick: () => {
				setShowCancelModal(false);
				setCancelTarget(null);
			},
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: 'Annuler le règlement',
			active: true,
			onClick: cancelHandler,
			icon: <CancelIcon />,
			color: '#D32F2F',
		},
	];

	const showCancelModalCall = (id: number) => {
		setCancelTarget(id);
		setShowCancelModal(true);
	};

	const handlePrint = (reglementId: number) => {
		setPrintReglementId(reglementId);
		setShowLanguageModal(true);
	};

	const handleLanguageSelect = async (language: 'fr' | 'en') => {
		setShowLanguageModal(false);

		if (!printReglementId) {
			return;
		}

		if (!token) {
			onError("Erreur d'authentification. Veuillez vous reconnecter.");
			return;
		}

		try {
			const url = REGLEMENT_PDF(printReglementId, company_id, language);
			const blob = await fetchPdfBlob(url, token);
			const blobUrl = window.URL.createObjectURL(blob);
			window.open(blobUrl, '_blank');

			setTimeout(() => {
				window.URL.revokeObjectURL(blobUrl);
			}, 60_000);
		} catch {
			onError("Erreur lors de l'ouverture du document.");
		} finally {
			setPrintReglementId(null);
		}
	};

	const handleLanguageModalClose = () => {
		setShowLanguageModal(false);
		setPrintReglementId(null);
	};

	const columns: GridColDef[] = [
		{
			field: 'facture_client_numero',
			headerName: 'N° Facture',
			flex: 1,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<ReglementClass>) => (
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
			flex: 1.5,
			minWidth: 150,
			filterOperators: createDropdownFilterOperators(clientFilterOptions, 'Tous les clients'),
			renderCell: (params: GridRenderCellParams<ReglementClass>) => (
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
			field: 'mode_reglement_name',
			headerName: 'Mode règlement',
			flex: 1.2,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<ReglementClass>) => (
				<DarkTooltip title={params.value || '-'}>
					<Typography variant="body2" noWrap>
						{params.value || '-'}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'montant',
			headerName: 'Montant',
			flex: 1,
			minWidth: 100,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<ReglementClass>) => {
				const devise = params.row.devise || 'MAD';
				const formattedValue = `${formatNumberWithSpaces(params.value, 2)} ${devise}`;
				return (
					<DarkTooltip title={formattedValue}>
						<Typography variant="body2" noWrap fontWeight={600} color="primary">
							{formattedValue}
						</Typography>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'date_reglement',
			headerName: 'Date règlement',
			flex: 1.5,
			minWidth: 150,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<ReglementClass>) => {
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
			field: 'date_echeance',
			headerName: "Date d'échéance",
			flex: 1.5,
			minWidth: 150,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<ReglementClass>) => {
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
			field: 'statut',
			headerName: 'Statut',
			flex: 0.8,
			minWidth: 100,
			filterOperators: createDropdownFilterOperators(statutFilterOptions, 'Tous les statuts', true),
			renderCell: (params: GridRenderCellParams<ReglementClass>) => {
				const statut = params.value as string;
				const isValid = statut === 'Valide';
				return (
					<DarkTooltip title={statut}>
						<Chip label={statut} size="small" color={isValid ? 'success' : 'error'} variant="outlined" />
					</DarkTooltip>
				);
			},
		},
		{
			field: 'actions',
			headerName: 'Actions',
			flex: 2,
			minWidth: 200,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ReglementClass>) => {
				const isValid = params.row.statut === 'Valide';
				const actions = [];

				// View action - available for all roles
				if (role === 'Caissier' || role === 'Comptable' || role === 'Commercial' || role === 'Lecture') {
					actions.push({
						label: 'Voir',
						icon: <VisibilityIcon />,
						onClick: () => router.push(REGLEMENTS_VIEW(params.row.id, company_id)),
						color: 'info' as const,
					});
				}

				// Print action - available for Caissier, Comptable, Commercial
				if (role === 'Caissier' || role === 'Comptable' || role === 'Commercial') {
					actions.push({
						label: 'Afficher le reçu de règlement',
						icon: <PrintIcon />,
						onClick: () => handlePrint(params.row.id),
						color: 'success' as const,
					});
				}

				// Edit and Cancel actions - only for Caissier and if status is Valid
				if (role === 'Caissier' && isValid) {
					actions.push(
						{
							label: 'Modifier',
							icon: <EditIcon />,
							onClick: () => router.push(REGLEMENTS_EDIT(params.row.id, company_id)),
							color: 'primary' as const,
						},
						{
							label: 'Annuler',
							icon: <CancelIcon />,
							onClick: () => showCancelModalCall(params.row.id),
							color: 'error' as const,
						},
					);
				}

				// Delete action - only for Caissier
				if (role === 'Caissier') {
					actions.push({
						label: 'Supprimer',
						icon: <DeleteIcon />,
						onClick: () => showDeleteModalCall(params.row.id),
						color: 'error' as const,
					});
				}

				return <MobileActionsMenu actions={actions} />;
			},
		},
	];

	// Get stats for selected currency
	const currencyStats = data?.stats_by_currency?.[selectedDevise];
	const chiffreAffaireTotal = currencyStats?.chiffre_affaire_total ? `${formatNumberWithSpaces(currencyStats.chiffre_affaire_total,2)} ${selectedDevise}` : `0,00 ${selectedDevise}`;
	const totalReglements = currencyStats?.total_reglements ? `${formatNumberWithSpaces(currencyStats.total_reglements,2)} ${selectedDevise}` : `0,00 ${selectedDevise}`;
	const totalImpayes = currencyStats?.total_impayes ? `${formatNumberWithSpaces(currencyStats.total_impayes, 2)} ${selectedDevise}` : `0,00 ${selectedDevise}`;

	return (
		<>
			{/* Stats Cards */}
			<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, mt: { xs: 1, sm: 2, md: 3 } }}>
				<CurrencyToggle
					selectedDevise={selectedDevise}
					onDeviseChange={setSelectedDevise}
					usesForeignCurrency={usesForeignCurrency}
				/>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
					<Card elevation={2} sx={{ flex: 1, borderRadius: 2 }}>
						<CardContent>
							<Stack direction="row" spacing={2} alignItems="center">
								<AttachMoneyIcon color="primary" />
								<Box>
									<Typography variant="body2" color="text.secondary">
									Chiffre d&#39;affaires total
									</Typography>
									<Typography variant="h6" fontWeight={700}>
										{chiffreAffaireTotal}
									</Typography>

								</Box>
							</Stack>
						</CardContent>
					</Card>
					<Card elevation={2} sx={{ flex: 1, borderRadius: 2 }}>
						<CardContent>
							<Stack direction="row" spacing={2} alignItems="center">
								<CheckCircleIcon color="success" />
								<Box>
									<Typography variant="body2" color="text.secondary">
										Total règlements
									</Typography>
									<Typography variant="h6" fontWeight={700} color="success.main">
										{totalReglements}
									</Typography>

								</Box>
							</Stack>
						</CardContent>
					</Card>
					<Card elevation={2} sx={{ flex: 1, borderRadius: 2 }}>
						<CardContent>
							<Stack direction="row" spacing={2} alignItems="center">
								<CancelIcon color="error" />
								<Box>
									<Typography variant="body2" color="text.secondary">
										Total impayés
									</Typography>
									<Typography variant="h6" fontWeight={700} color="error.main">
										{totalImpayes}
									</Typography>

								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Stack>
				<Divider sx={{ mb: 2 }} />
			</Box>

			{(role === 'Caissier' || role === 'Commercial') && (
				<Box
					sx={{
						width: '100%',
						display: 'flex',
						justifyContent: 'flex-start',
						gap: 2,
						px: { xs: 1, sm: 2, md: 3 },
						mt: { xs: 1, sm: 2, md: 3 },
						mb: { xs: 1, sm: 2, md: 3 },
					}}
				>
					<Button
						variant="contained"
						onClick={() => router.push(REGLEMENTS_ADD(company_id))}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
						startIcon={<AddIcon fontSize="small" />}
					>
						Nouveau règlement
					</Button>
					{role === 'Caissier' && selectedIds.length > 0 && (
						<Button
							variant="outlined"
							color="error"
							onClick={() => setShowBulkDeleteModal(true)}
							startIcon={<DeleteIcon fontSize="small" />}
							sx={{
								whiteSpace: 'nowrap',
								px: { xs: 1.5, sm: 2, md: 3 },
								py: { xs: 0.8, sm: 1, md: 1 },
								fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
							}}
						>
							Supprimer ({selectedIds.length})
						</Button>
					)}
				</Box>
			)}
			<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} />
			<PaginatedDataGrid
				data={data}
				isLoading={isLoading}
				columns={columns}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				filterModel={filterModel}
				onFilterModelChange={setFilterModel}
				onCustomFilterParamsChange={setCustomFilterParams}
				toolbar={{ quickFilter: true, debounceMs: 500 }}
				checkboxSelection={role === 'Caissier'}
				onSelectionChange={handleSelectionChange}
				selectedIds={selectedIds}
			/>
			{showDeleteModal && (
				<ActionModals
					title="Supprimer ce règlement ?"
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					body="Êtes‑vous sûr de vouloir supprimer ce règlement?"
					actions={deleteModalActions}
				/>
			)}
			{showCancelModal && (
				<ActionModals
					title="Annuler ce règlement ?"
					titleIcon={<CancelIcon />}
					titleIconColor="#D32F2F"
					body="Êtes‑vous sûr de vouloir annuler ce règlement? Cette action est irréversible."
					actions={cancelModalActions}
				/>
			)}
			{showBulkDeleteModal && (
				<ActionModals
					title={`Supprimer ${selectedIds.length} règlement(s) ?`}
					body={`Êtes-vous sûr de vouloir supprimer les ${selectedIds.length} règlement(s) sélectionné(s) ?`}
					actions={bulkDeleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
			{showLanguageModal && (
				<PdfLanguageModal onSelectLanguage={handleLanguageSelect} onClose={handleLanguageModalClose} />
			)}
		</>
	);
};

const ReglementListClient: React.FC<SessionProps> = ({ session }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title="Liste des Règlements">
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default ReglementListClient;
