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
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { CLIENTS_VIEW } from '@/utils/routes';
import type {
	DocumentListClass,
	DocumentListConfig,
	DocumentListQueryResult,
	DocumentDeleteMutationResult,
	DocumentConvertMutationResult,
	PaginationModel,
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
	} = props;

	const { onSuccess, onError } = useToast();

	const { data, isLoading, refetch } = queryResult;
	const { deleteRecord } = deleteMutation;

	// Modal states
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [activeConvertAction, setActiveConvertAction] = useState<string | null>(null);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [menuItemId, setMenuItemId] = useState<number | null>(null);

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

	const renderActions = useCallback(
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
				width: 130,
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
				width: 180,
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
				width: 150,
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
				width: 100,
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
				width: 150,
				renderCell: (params: GridRenderCellParams<TDocument>) => (
					<DarkTooltip title={params.value + ' DH'}>
						<Typography variant="body2" noWrap fontWeight={600} color="primary">
							{params.value} DH
						</Typography>
					</DarkTooltip>
				),
			},
			{
				field: 'lignes_count',
				headerName: "Nombre d'articles",
				width: 150,
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
				width: 130,
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
				width: 180,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<TDocument>) => (
					<Box sx={{ display: 'flex', gap: 1 }}>
						{(role === 'Admin' || role === 'Lecture') && (
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
						{role === 'Admin' && <>{renderActions(params)}</>}
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
		renderActions,
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
				queryHook={() => ({ data, isLoading })}
				columns={columns}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
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
					items.push(
						<MenuItem key={action.key} disabled={action.disabled} onClick={() => handleMenuItemClick(action.key)}>
							<ListItemIcon>{action.icon}</ListItemIcon>
							<ListItemText>{action.label}</ListItemText>
						</MenuItem>,
					);
					return items;
				})}
			</Menu>
		</>
	);
}

export default CompanyDocumentsListContent;
