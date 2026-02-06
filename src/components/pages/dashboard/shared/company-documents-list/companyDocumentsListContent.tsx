'use client';

import React, { useCallback, useMemo, useState } from 'react';
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
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { CLIENTS_VIEW } from '@/utils/routes';
import { getAccessTokenFromSession } from '@/store/session';
import type {
	DocumentListClass,
	DocumentListConfig,
	DocumentListQueryResult,
	DocumentDeleteMutationResult,
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
		convertMutations,
		paginationModel,
		setPaginationModel,
		searchTerm,
		setSearchTerm,
		filterModel,
		onFilterModelChange,
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

	const deleteHandler = useCallback(async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			onSuccess(config.labels.deleteSuccessMessage);
			refetch();
		} catch {
			onError(config.labels.deleteErrorMessage);
		} finally {
			setShowDeleteModal(false);
		}
	}, [selectedId, deleteRecord, onSuccess, onError, refetch, config.labels]);

	const showDeleteModalCall = useCallback((id: number) => {
		setSelectedId(id);
		setShowDeleteModal(true);
	}, []);

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
		(language: 'fr' | 'en') => {
			setShowLanguageModal(false);

			if (!selectedPrintAction || printMenuItemId === null) {
				return;
			}

			const accessToken = getAccessTokenFromSession(session ?? undefined);

			if (!accessToken) {
				onError("Erreur d'authentification. Veuillez vous reconnecter.");
				return;
			}

			// Generate URL with selected language
			const url = selectedPrintAction.urlGenerator(printMenuItemId, companyId, language);
			const urlWithToken = `${url}&token=${encodeURIComponent(accessToken)}`;
			window.open(urlWithToken, '_blank');

			// Reset states
			setSelectedPrintAction(null);
			setPrintMenuItemId(null);
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

	const renderMutationActions = useCallback(
		(params: GridRenderCellParams<TDocument>) => {
			const isCurrentItemLoading = isAnyConvertLoading && selectedId === (params.row as DocumentListClass).id;

			return (
				<>
					<DarkTooltip title="Modifier">
						<IconButton
							size="small"
							color="primary"
							onClick={() => router.push(config.routes.editRoute((params.row as DocumentListClass).id, companyId))}
						>
							<EditIcon fontSize="small" />
						</IconButton>
					</DarkTooltip>
					<DarkTooltip title="Supprimer">
						<IconButton
							size="small"
							color="error"
							onClick={() => showDeleteModalCall((params.row as DocumentListClass).id)}
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</DarkTooltip>
					{config.convertActions && config.convertActions.length > 0 && (
						<DarkTooltip title="Convertir">
							<IconButton
								size="small"
								color="success"
								onClick={(e) => showConvertModalCall(e, (params.row as DocumentListClass).id)}
								disabled={isCurrentItemLoading}
							>
								{isCurrentItemLoading ? <CircularProgress size={20} /> : <SwapHorizIcon fontSize="small" />}
							</IconButton>
						</DarkTooltip>
					)}
				</>
			);
		},
		[
			router,
			config.routes,
			config.convertActions,
			companyId,
			showDeleteModalCall,
			showConvertModalCall,
			isAnyConvertLoading,
			selectedId,
		],
	);

	const renderPrintAction = useCallback(
		(params: GridRenderCellParams<TDocument>) => (
			<>
				{config.printActions && config.printActions.length > 0 && (
					<DarkTooltip title="Afficher">
						<IconButton
							size="small"
							color="info"
							onClick={(e) => showPrintMenuCall(e, (params.row as DocumentListClass).id)}
						>
							<PrintIcon fontSize="small" />
						</IconButton>
					</DarkTooltip>
				)}
			</>
		),
		[config.printActions, showPrintMenuCall],
	);

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
					const displayValue = `${params.value} ${devise}`;
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
				renderCell: (params: GridRenderCellParams<TDocument>) => (
					<Box sx={{ display: 'flex', gap: 1 }}>
					{(role === 'Caissier' ||
						role === 'Comptable' ||
						role === 'Commercial' ||
						role === 'Lecture') && (
						<DarkTooltip title="Voir">
							<IconButton
								size="small"
								color="info"
								onClick={() => router.push(config.routes.viewRoute((params.row as DocumentListClass).id, companyId))}
							>
								<VisibilityIcon />
							</IconButton>
						</DarkTooltip>
					)}
					{(role === 'Caissier' || role === 'Commercial') && <>{renderMutationActions(params)}</>}
					{(role === 'Caissier' || role === 'Comptable' || role === 'Commercial') && <>{renderPrintAction(params)}</>}
			</Box>
		),
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
clientFilterOptions,
router,
companyId,
role,
renderMutationActions,
renderPrintAction,
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
				</Box>
			)}

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
				toolbar={{ quickFilter: true, debounceMs: 500 }}
			/>

			{showDeleteModal && <ActionModals {...modalsConfig.delete} />}

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
