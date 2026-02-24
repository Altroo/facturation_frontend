'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
	Box,
	Button,
	Typography,
	Chip,
	CircularProgress,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Menu,
	Divider,
} from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	Add as AddIcon,
	Close as CloseIcon,
	SwapHoriz as SwapHorizIcon,
	Print as PrintIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams, GridFilterModel } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import { formatDate, formatNumberWithSpaces, extractApiErrorMessage } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { CLIENTS_VIEW } from '@/utils/routes';
import { getAccessTokenFromSession } from '@/store/session';
import { fetchPdfBlob } from '@/utils/apiHelpers';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import type {
	DocumentListClass,
	DocumentListConfig,
	DocumentListQueryResult,
	DocumentDeleteMutationResult,
	DocumentBulkDeleteMutationResult,
	DocumentConvertMutationResult,
	PaginationModel,
	PrintAction,
} from '@/types/companyDocumentsTypes';
import type { DeviClass, FactureClass } from '@/models/classes';

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
		case 'Valide':
			return 'success';
		case 'Facturé':
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

export const statutFilterOptions = [
	{ value: 'Brouillon', label: 'Brouillon', color: 'default' as const },
	{ value: 'Envoyé', label: 'Envoyé', color: 'info' as const },
	{ value: 'Accepté', label: 'Accepté', color: 'success' as const },
	{ value: 'Refusé', label: 'Refusé', color: 'error' as const },
	{ value: 'Annulé', label: 'Annulé', color: 'error' as const },
	{ value: 'Expiré', label: 'Expiré', color: 'warning' as const },
];

export interface DocumentListContentProps<TDocument extends DocumentListClass> {
	/** Company ID */
	companyId: number;
	/** User role */
	role: string;
	/** Router instance */
	router: ReturnType<typeof import('next/navigation').useRouter>;
	/** Configuration for the list */
	config: DocumentListConfig<TDocument>;
	/** Query result from RTK Query hook */
	queryResult: DocumentListQueryResult<TDocument>;
	/** Delete mutation function */
	deleteMutation: DocumentDeleteMutationResult;
	/** Optional single-request bulk delete mutation */
	bulkDeleteMutation?: DocumentBulkDeleteMutationResult;
	/** Convert mutations - key is action key, value is mutation result */
	convertMutations?: Record<string, DocumentConvertMutationResult>;
	/** Pagination model state */
	paginationModel: PaginationModel;
	/** Set pagination model state */
	setPaginationModel: React.Dispatch<React.SetStateAction<PaginationModel>>;
	/** Search term state */
	searchTerm: string;
	/** Set search term state */
	setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
	/** Filter model state */
	filterModel?: GridFilterModel;
	/** Filter model change handler */
	onFilterModelChange?: (model: GridFilterModel) => void;
	/** Callback emitting backend-ready custom filter params */
	onCustomFilterParamsChange?: (params: Record<string, string>) => void;
	/** Optional chip filter bar rendered between the action buttons and the data grid */
	chipFilterBar?: React.ReactNode;
}

function CompanyDocumentsListContent<TDocument extends DocumentListClass>(
	props: DocumentListContentProps<TDocument>,
): React.JSX.Element {
	const {
		companyId,
		role,
		router,
		config,
		queryResult,
		deleteMutation,
		bulkDeleteMutation,
		convertMutations,
		paginationModel,
		setPaginationModel,
		searchTerm,
		setSearchTerm,
		filterModel,
		onFilterModelChange,
		onCustomFilterParamsChange,
	chipFilterBar,
	} = props;

	const { data: session } = useSession();
	const { onSuccess, onError } = useToast();

	const { data, isLoading, refetch } = queryResult;
	const { deleteRecord } = deleteMutation;

	// Modal states
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [activeConvertAction, setActiveConvertAction] = useState<string | null>(null);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [menuItemId, setMenuItemId] = useState<number | null>(null);
	const [printAnchorEl, setPrintAnchorEl] = useState<null | HTMLElement>(null);
	const [printMenuItemId, setPrintMenuItemId] = useState<number | null>(null);
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const [selectedPrintAction, setSelectedPrintAction] = useState<PrintAction | null>(null);

	// Bulk selection state
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const deleteHandler = useCallback(async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			onSuccess(config.labels.deleteSuccessMessage);
			refetch();
		} catch (err) {
			onError(extractApiErrorMessage(err, config.labels.deleteErrorMessage));
		} finally {
			setShowDeleteModal(false);
		}
	}, [selectedId, deleteRecord, onSuccess, onError, refetch, config.labels]);

	const showDeleteModalCall = useCallback((id: number) => {
		setSelectedId(id);
		setShowDeleteModal(true);
	}, []);

	const handleSelectionChange = useCallback((ids: number[]) => {
		setSelectedIds(ids);
	}, []);

	const bulkDeleteHandler = useCallback(async () => {
		if (bulkDeleteMutation) {
			try {
				await bulkDeleteMutation.bulkDeleteRecords({ ids: selectedIds }).unwrap();
				onSuccess(`${selectedIds.length} ${config.labels.documentTypeName}(s) supprimé(s) avec succès`);
			} catch (err) {
				onError(extractApiErrorMessage(err, `Erreur lors de la suppression`));
			}
		} else {
			const results = await Promise.allSettled(
				selectedIds.map((id) => deleteRecord({ id }).unwrap()),
			);
			const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
			if (failures.length === 0) {
				onSuccess(`${selectedIds.length} ${config.labels.documentTypeName}(s) supprimé(s) avec succès`);
			} else {
				const firstError = failures[0].reason;
				onError(extractApiErrorMessage(firstError, `${failures.length} suppression(s) ont échoué`));
			}
		}
		setSelectedIds([]);
		setShowBulkDeleteModal(false);
		refetch();
	}, [selectedIds, bulkDeleteMutation, deleteRecord, onSuccess, onError, refetch, config.labels]);

	const handleConvertAction = useCallback(
		async (actionKey: string) => {
			if (!convertMutations) return;
			const mutation = convertMutations[actionKey];
			const action = config.convertActions?.find((a) => a.key === actionKey);
			if (!mutation || !action || !selectedId) return;

			try {
				const response = await mutation.convertMutation({ id: selectedId }).unwrap();
				onSuccess(`${config.labels.documentTypeName} converti(e) avec succès`);
				router.push(action.redirectRoute(response.id, companyId));
			} catch {
				onError(`Erreur lors de la conversion du ${config.labels.documentTypeName}`);
			} finally {
				setActiveConvertAction(null);
			}
		},
		[convertMutations, config, selectedId, onSuccess, router, companyId, onError],
	);

	const showConvertModalCall = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>, id: number) => {
		setAnchorEl(e.currentTarget);
		setMenuItemId(id);
	}, []);

	const handleMenuItemClick = useCallback(
		(actionKey: string) => {
			if (menuItemId) {
				setSelectedId(menuItemId);
				setActiveConvertAction(actionKey);
			}
			setAnchorEl(null);
		},
		[menuItemId],
	);

	const showPrintMenuCall = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>, id: number) => {
		setPrintAnchorEl(e.currentTarget);
		setPrintMenuItemId(id);
	}, []);

	const handlePrintMenuItemClick = useCallback(
		(action: PrintAction) => {
			setPrintAnchorEl(null);
			setSelectedPrintAction(action);
			setShowLanguageModal(true);
		},
		[],
	);

	const handleLanguageSelect = useCallback(
		async (language: 'fr' | 'en') => {
			setShowLanguageModal(false);

			if (!selectedPrintAction || printMenuItemId === null) {
				return;
			}

			const accessToken = getAccessTokenFromSession(session ?? undefined);

			if (!accessToken) {
				onError("Erreur d'authentification. Veuillez vous reconnecter.");
				return;
			}

			try {
				const url = selectedPrintAction.urlGenerator(printMenuItemId, companyId, language);
				const blob = await fetchPdfBlob(url, accessToken);
				const blobUrl = window.URL.createObjectURL(blob);
				window.open(blobUrl, '_blank');

				setTimeout(() => {
					window.URL.revokeObjectURL(blobUrl);
				}, 60_000);
			} catch {
				onError("Erreur lors de l'ouverture du document.");
			} finally {
				setSelectedPrintAction(null);
				setPrintMenuItemId(null);
			}
		},
		[selectedPrintAction, printMenuItemId, session, companyId, onError],
	);

	const handleLanguageModalClose = useCallback(() => {
		setShowLanguageModal(false);
		setSelectedPrintAction(null);
		setPrintMenuItemId(null);
	}, []);

	const handlePrintMenuClose = useCallback(() => {
		setPrintAnchorEl(null);
		setPrintMenuItemId(null);
	}, []);

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

	const bulkDeleteModalActions = useMemo(
		() => [
			{
				text: 'Annuler',
				active: false,
				onClick: () => setShowBulkDeleteModal(false),
				icon: <CloseIcon />,
				color: '#6B6B6B',
			},
			{
				text: `Supprimer (${selectedIds.length})`,
				active: true,
				onClick: bulkDeleteHandler,
				icon: <DeleteIcon />,
				color: '#D32F2F',
			},
		],
		[bulkDeleteHandler, selectedIds.length],
	);

	const convertModalActionsMap = useMemo(() => {
		const map: Record<
			string,
			{ actions: Array<{ text: string; active: boolean; onClick: () => void; icon: React.ReactNode; color: string }> }
		> = {};
		config.convertActions?.forEach((action) => {
			map[action.key] = {
				actions: [
					{
						text: 'Annuler',
						active: false,
						onClick: () => setActiveConvertAction(null),
						icon: <CloseIcon />,
						color: '#6B6B6B',
					},
					{
						text: 'Convertir',
						active: true,
						onClick: () => handleConvertAction(action.key),
						icon: action.icon,
						color: '#2E7D32',
					},
				],
			};
		});
		return map;
	}, [config.convertActions, handleConvertAction]);

	const isAnyConvertLoading = useMemo(() => {
		if (!convertMutations) return false;
		return Object.values(convertMutations).some((m) => m.isLoading);
	}, [convertMutations]);

	const clientFilterOptions = useMemo(() => {
		if (!data?.results) return [];

		const objectMap = new Map<number, string>();
		data.results.forEach((doc) => {
			const document = doc as DeviClass | FactureClass;
			if (document.client && document.client_name) {
				objectMap.set(document.client, document.client_name);
			}
		});

		return Array.from(objectMap.entries()).map(([, name]) => ({
			value: name,
			label: name,
		}));
	}, [data?.results]);

	const columns: GridColDef[] = useMemo(() => {
		const baseColumns: GridColDef[] = [
			{
				field: config.columns.numeroField as string,
				headerName: config.columns.numeroHeaderName,
				flex: 1,
				minWidth: 120,
				renderCell: (params: GridRenderCellParams<TDocument>) => (
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
				minWidth: 140,
				filterOperators: createDropdownFilterOperators(clientFilterOptions, 'Tous les clients'),
				renderCell: (params: GridRenderCellParams<TDocument>) => (
					<DarkTooltip title={params.value}>
						<Typography variant="body2" noWrap>
							<TextButton
								buttonText={params.value}
								onClick={() => router.push(CLIENTS_VIEW((params.row as DocumentListClass).client as number, companyId))}
								cssClass={Styles.textButton}
							/>
						</Typography>
					</DarkTooltip>
				),
			},
			{
				field: config.columns.extraField as string,
				headerName: config.columns.extraFieldHeaderName,
				flex: 1.2,
				minWidth: 120,
				renderCell: (params: GridRenderCellParams<TDocument>) => (
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
				flex: 0.8,
				minWidth: 100,
				filterOperators: createDropdownFilterOperators(statutFilterOptions, 'Tous les statuts', true),
				renderCell: (params: GridRenderCellParams<TDocument>) => (
					<DarkTooltip title={params.value}>
						<Chip label={params.value || '-'} color={getStatutColor(params.value || '')} variant="outlined" />
					</DarkTooltip>
				),
			},
			{
				field: 'total_ttc_apres_remise',
				headerName: 'Total TTC après remise',
				flex: 1.3,
				minWidth: 130,
				filterOperators: createNumericFilterOperators(),
				renderCell: (params: GridRenderCellParams<TDocument>) => {
					const devise = params.row.devise || 'MAD';
				const formattedValue = formatNumberWithSpaces(params.value, 2);
				const displayValue = `${formattedValue} ${devise}`;
					return (
						<DarkTooltip title={displayValue}>
							<Typography variant="body2" noWrap fontWeight={600} color="primary">
								{displayValue}
							</Typography>
						</DarkTooltip>
					);
				},
			},
			{
				field: 'lignes_count',
				headerName: "Nombre d'articles",
				flex: 1.2,
				minWidth: 120,
				filterOperators: createNumericFilterOperators(),
				renderCell: (params: GridRenderCellParams<TDocument>) => (
					<DarkTooltip title={params.value}>
						<Typography variant="body2" noWrap>
							{params.value}
						</Typography>
					</DarkTooltip>
				),
			},
			{
				field: config.columns.dateField as string,
				headerName: config.columns.dateHeaderName,
				flex: 1,
				minWidth: 110,
				filterOperators: createDateRangeFilterOperator(),
				renderCell: (params: GridRenderCellParams<TDocument>) => {
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
				flex: 2,
				minWidth: 200,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<TDocument>) => {
					const actions = [];

					// View action - available for all roles
					if (role === 'Caissier' || role === 'Comptable' || role === 'Commercial' || role === 'Lecture') {
						actions.push({
							label: 'Voir',
							icon: <VisibilityIcon />,
							onClick: () => router.push(config.routes.viewRoute((params.row as DocumentListClass).id, companyId)),
							color: 'info' as const,
						});
					}

					// Edit, Delete, Convert actions - only for Caissier and Commercial
					if (role === 'Caissier' || role === 'Commercial') {
						actions.push(
							{
								label: 'Modifier',
								icon: <EditIcon />,
								onClick: () => router.push(config.routes.editRoute((params.row as DocumentListClass).id, companyId)),
								color: 'primary' as const,
							},
							{
								label: 'Supprimer',
								icon: <DeleteIcon />,
								onClick: () => showDeleteModalCall((params.row as DocumentListClass).id),
								color: 'error' as const,
							},
						);

						// Convert action if available
						if (config.convertActions && config.convertActions.length > 0) {
							const isCurrentItemLoading = isAnyConvertLoading && selectedId === (params.row as DocumentListClass).id;
							actions.push({
								label: 'Convertir',
								icon: isCurrentItemLoading ? <CircularProgress size={20} /> : <SwapHorizIcon />,
							onClick: (e?: React.MouseEvent<HTMLElement>) => {
								if (!isCurrentItemLoading && e) {
									showConvertModalCall(e as React.MouseEvent<HTMLButtonElement>, (params.row as DocumentListClass).id);
									}
								},
								color: 'success' as const,
								show: !isCurrentItemLoading,
							});
						}
					}

					// Print action - available for Caissier, Comptable, Commercial
					if ((role === 'Caissier' || role === 'Comptable' || role === 'Commercial') && config.printActions && config.printActions.length > 0) {
						actions.push({
							label: 'Afficher',
							icon: <PrintIcon />,
						onClick: (e?: React.MouseEvent<HTMLElement>) => {
							if (e) {
								showPrintMenuCall(e as React.MouseEvent<HTMLButtonElement>, (params.row as DocumentListClass).id);
							}
						},
						color: 'info' as const,
					});
				}

				return <MobileActionsMenu actions={actions} />;
			},
		},
	];

return baseColumns;
}, [
	config.columns.numeroField,
	config.columns.numeroHeaderName,
	config.columns.extraField,
	config.columns.extraFieldHeaderName,
	config.columns.dateField,
	config.columns.dateHeaderName,
	config.routes,
	config.convertActions,
	config.printActions,
	clientFilterOptions,
	router,
	companyId,
	role,
	showDeleteModalCall,
	showConvertModalCall,
	showPrintMenuCall,
	isAnyConvertLoading,
	selectedId,
]);

const modalsConfig = useMemo(
() => ({
	delete: {
		title: config.labels.deleteConfirmTitle,
		body: config.labels.deleteConfirmBody,
		actions: deleteModalActions,
		titleIcon: <DeleteIcon />,
		titleIconColor: '#D32F2F',
	},
}),
[config.labels, deleteModalActions],
);

	return (
		<>
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
						onClick={() => router.push(config.routes.addRoute(companyId))}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
						startIcon={<AddIcon fontSize="small" />}
					>
						{config.labels.addButtonText}
					</Button>
					{selectedIds.length > 0 && (
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

			{chipFilterBar}

			<PaginatedDataGrid
				data={data}
				isLoading={isLoading}
				columns={columns}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				filterModel={filterModel}
				onFilterModelChange={onFilterModelChange}
				onCustomFilterParamsChange={onCustomFilterParamsChange}
				toolbar={{ quickFilter: true, debounceMs: 500 }}
				checkboxSelection={role === 'Caissier' || role === 'Commercial'}
				onSelectionChange={handleSelectionChange}
				selectedIds={selectedIds}
			/>

			{showDeleteModal && <ActionModals {...modalsConfig.delete} />}

			{showBulkDeleteModal && (
				<ActionModals
					title={`Supprimer ${selectedIds.length} élément(s) ?`}
					body={`Êtes-vous sûr de vouloir supprimer les ${selectedIds.length} ${config.labels.documentTypeName}(s) sélectionné(s) ?`}
					actions={bulkDeleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}

			{config.convertActions?.map(
				(action) =>
					activeConvertAction === action.key && (
						<ActionModals
							key={action.key}
							title={action.modalTitle}
							body={action.modalBody}
							actions={convertModalActionsMap[action.key]?.actions || []}
							titleIcon={action.icon}
							titleIconColor="#2E7D32"
						/>
					),
			)}

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={() => {
					setAnchorEl(null);
					setMenuItemId(null);
				}}
				slotProps={{ paper: { elevation: 3, sx: { minWidth: 220 } } }}
			>
				{config.convertActions?.flatMap((action, index) => {
					const items = [];
					if (index > 0) {
						items.push(<Divider key={`divider-${action.key}`} />);
					}
					
					// Find the current row to evaluate disabled state
					const currentRow = menuItemId && data?.results ? data.results.find((row) => row.id === menuItemId) : null;
					const isDisabled = typeof action.disabled === 'function' 
						? currentRow ? action.disabled(currentRow) : true
						: action.disabled ?? false;
					
					items.push(
						<MenuItem key={action.key} disabled={isDisabled} onClick={() => handleMenuItemClick(action.key)}>
							<ListItemIcon>{action.icon}</ListItemIcon>
							<ListItemText>{action.label}</ListItemText>
						</MenuItem>,
					);
					return items;
				})}
			</Menu>

			<Menu
				anchorEl={printAnchorEl}
				open={Boolean(printAnchorEl)}
				onClose={handlePrintMenuClose}
				slotProps={{ paper: { elevation: 3, sx: { minWidth: 240 } } }}
			>
				{config.printActions?.flatMap((action, index) => {
					const items = [];
					if (index > 0) {
						items.push(<Divider key={`divider-print-${action.key}`} />);
					}
					items.push(
						<MenuItem
							key={action.key}
							onClick={() => handlePrintMenuItemClick(action)}
						>
							<ListItemIcon sx={{ color: action.iconColor || 'inherit' }}>{action.icon}</ListItemIcon>
							<ListItemText>{action.label}</ListItemText>
						</MenuItem>,
					);
					return items;
				})}
			</Menu>

			{showLanguageModal && <PdfLanguageModal onSelectLanguage={handleLanguageSelect} onClose={handleLanguageModalClose} />}
		</>
	);
}

export default CompanyDocumentsListContent;
