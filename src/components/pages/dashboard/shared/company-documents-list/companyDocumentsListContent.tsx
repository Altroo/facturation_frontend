'use client';

import { useState, type ReactNode, type JSX, type MouseEvent } from 'react';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Print as PrintIcon,
	SwapHoriz as SwapHorizIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import { extractApiErrorMessage, formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { CLIENTS_VIEW } from '@/utils/routes';
import { fetchPdfBlob } from '@/utils/apiHelpers';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import { useGetClientsListQuery } from '@/store/services/client';
import type { DocumentListClass, ConvertAction, PrintAction } from '@/types/companyDocumentsTypes';
import type { ClientClass, DeviClass, FactureAvoirClass, FactureClass } from '@/models/classes';
import type { DocumentListContentProps } from '@/types/companyDocumentsTypes';

const runWithCleanup = async (action: () => Promise<void>, cleanup: () => void) => {
	try {
		await action();
	} finally {
		cleanup();
	}
};

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

export const getStatutLabel = (statut: string, t: import('@/types/languageTypes').TranslationDictionary): string => {
	switch (statut) {
		case 'Brouillon':
			return t.rawData.documentStatuses.draft;
		case 'Envoyé':
			return t.rawData.documentStatuses.sent;
		case 'Accepté':
			return t.rawData.documentStatuses.accepted;
		case 'Facturé':
			return t.rawData.documentStatuses.invoiced;
		case 'Refusé':
			return t.rawData.documentStatuses.refused;
		case 'Annulé':
			return t.rawData.documentStatuses.cancelled;
		case 'Expiré':
			return t.rawData.documentStatuses.expired;
		case 'Valide':
			return t.common.validShort;
		default:
			return statut;
	}
};

export const createStatutFilterOptions = (t: import('@/types/languageTypes').TranslationDictionary) => [
	{ value: 'Brouillon', label: t.rawData.documentStatuses.draft, color: 'default' as const },
	{ value: 'Envoyé', label: t.rawData.documentStatuses.sent, color: 'info' as const },
	{ value: 'Accepté', label: t.rawData.documentStatuses.accepted, color: 'success' as const },
	{ value: 'Refusé', label: t.rawData.documentStatuses.refused, color: 'error' as const },
	{ value: 'Annulé', label: t.rawData.documentStatuses.cancelled, color: 'error' as const },
	{ value: 'Expiré', label: t.rawData.documentStatuses.expired, color: 'warning' as const },
];

const getClientDisplayName = (client: Partial<ClientClass>) => {
	const isPhysicalPerson = client.client_type === 'PP' || client.client_type === 'Personne physique';
	if (isPhysicalPerson) {
		return `${client.nom ?? ''} ${client.prenom ?? ''}`.trim();
	}
	return client.raison_sociale || `${client.nom ?? ''} ${client.prenom ?? ''}`.trim() || client.code_client || '';
};

function CompanyDocumentsListContent<TDocument extends DocumentListClass>(
	props: DocumentListContentProps<TDocument>,
): JSX.Element {
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
		accessToken,
	} = props;

	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();

	const { data, isLoading, refetch } = queryResult;
	const { data: rawClientsData } = useGetClientsListQuery(
		{ company_id: companyId, with_pagination: false, archived: false },
		{ skip: !accessToken },
	);
	const clientsData = (() => {
		if (!rawClientsData) return [];
		return Array.isArray(rawClientsData) ? rawClientsData : rawClientsData.results;
	})();
	const { deleteRecord } = deleteMutation;
	const allowDelete = config.allowDelete ?? true;
	const getCompletedConvertLabel = (action: ConvertAction, row: DocumentListClass) => {
		if (typeof action.completedLabel === 'function') {
			return action.completedLabel(row);
		}
		return action.completedLabel ?? t.common.convert;
	};

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

	const deleteHandler = async () => {
		await runWithCleanup(
			async () => {
				try {
					await deleteRecord({ id: selectedId! }).unwrap();
					onSuccess(config.labels.deleteSuccessMessage);
					refetch();
				} catch (err) {
					onError(extractApiErrorMessage(err, config.labels.deleteErrorMessage));
				}
			},
			() => setShowDeleteModal(false),
		);
	};

	const showDeleteModalCall = (id: number) => {
		setSelectedId(id);
		setShowDeleteModal(true);
	};

	const handleSelectionChange = (ids: number[]) => {
		setSelectedIds(ids);
	};

	const bulkDeleteHandler = async () => {
		if (bulkDeleteMutation) {
			try {
				await bulkDeleteMutation.bulkDeleteRecords({ ids: selectedIds }).unwrap();
				onSuccess(t.documentList.bulkDeleteSuccess(selectedIds.length, config.labels.documentTypeName));
			} catch (err) {
				onError(extractApiErrorMessage(err, `Erreur lors de la suppression`));
			}
		} else {
			const results = await Promise.allSettled(selectedIds.map((id) => deleteRecord({ id }).unwrap()));
			const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
			if (failures.length === 0) {
				onSuccess(t.documentList.bulkDeleteSuccess(selectedIds.length, config.labels.documentTypeName));
			} else {
				const firstError = failures[0].reason;
				onError(extractApiErrorMessage(firstError, t.documentList.bulkDeletePartialError(failures.length)));
			}
		}
		setSelectedIds([]);
		setShowBulkDeleteModal(false);
		refetch();
	};

	const handleConvertAction = async (actionKey: string) => {
		if (!convertMutations) return;
		const mutation = convertMutations[actionKey];
		const action = config.convertActions?.find((a) => a.key === actionKey);
		if (!mutation || !action || !selectedId) return;

		await runWithCleanup(
			async () => {
				try {
					const response = await mutation.convertMutation({ id: selectedId }).unwrap();
					onSuccess(t.documentList.convertSuccess(config.labels.documentTypeName));
					router.push(action.redirectRoute(response.id, companyId));
				} catch {
					onError(t.documentList.convertError(config.labels.documentTypeName));
				}
			},
			() => setActiveConvertAction(null),
		);
	};

	const showConvertModalCall = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>, id: number) => {
		setAnchorEl(e.currentTarget);
		setMenuItemId(id);
	};

	const handleMenuItemClick = (actionKey: string) => {
		if (menuItemId) {
			setSelectedId(menuItemId);
			setActiveConvertAction(actionKey);
		}
		setAnchorEl(null);
	};

	const showPrintMenuCall = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>, id: number) => {
		setPrintAnchorEl(e.currentTarget);
		setPrintMenuItemId(id);
	};

	const handlePrintMenuItemClick = (action: PrintAction) => {
		setPrintAnchorEl(null);
		setSelectedPrintAction(action);
		setShowLanguageModal(true);
	};

	const handleLanguageSelect = async (language: 'fr' | 'en') => {
		setShowLanguageModal(false);

		if (!selectedPrintAction || printMenuItemId === null) {
			return;
		}

		if (!accessToken) {
			onError(t.documentList.authError);
			return;
		}

		await runWithCleanup(
			async () => {
				try {
					const url = selectedPrintAction.urlGenerator(printMenuItemId, companyId, language);
					const blob = await fetchPdfBlob(url, accessToken);
					const blobUrl = window.URL.createObjectURL(blob);
					window.open(blobUrl, '_blank');

					setTimeout(() => {
						window.URL.revokeObjectURL(blobUrl);
					}, 60_000);
				} catch {
					onError(t.errors.documentOpenError);
				}
			},
			() => {
				setSelectedPrintAction(null);
				setPrintMenuItemId(null);
			},
		);
	};

	const handleLanguageModalClose = () => {
		setShowLanguageModal(false);
		setSelectedPrintAction(null);
		setPrintMenuItemId(null);
	};

	const handlePrintMenuClose = () => {
		setPrintAnchorEl(null);
		setPrintMenuItemId(null);
	};

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{ text: t.common.delete, active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const bulkDeleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowBulkDeleteModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: t.documentList.bulkDeleteBtn(selectedIds.length),
			active: true,
			onClick: bulkDeleteHandler,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	const convertModalActionsMap = (() => {
		const map: Record<
			string,
			{ actions: Array<{ text: string; active: boolean; onClick: () => void; icon: ReactNode; color: string }> }
		> = {};
		config.convertActions?.forEach((action) => {
			map[action.key] = {
				actions: [
					{
						text: t.common.cancel,
						active: false,
						onClick: () => setActiveConvertAction(null),
						icon: <CloseIcon />,
						color: '#6B6B6B',
					},
					{
						text: t.common.convert,
						active: true,
						onClick: () => handleConvertAction(action.key),
						icon: action.icon,
						color: '#2E7D32',
					},
				],
			};
		});
		return map;
	})();

	const isAnyConvertLoading = (() => {
		if (!convertMutations) return false;
		return Object.values(convertMutations).some((m) => m.isLoading);
	})();

	const clientFilterOptions = (() => {
		const objectMap = new Map<string, string>();
		clientsData.forEach((client) => {
			const label = getClientDisplayName(client);
			if (label) {
				objectMap.set(label, label);
			}
		});

		data?.results?.forEach((doc) => {
			const document = doc as DeviClass | FactureClass | FactureAvoirClass;
			if (document.client && document.client_name) {
				objectMap.set(document.client_name, document.client_name);
			}
		});

		return Array.from(objectMap.values()).map((name) => ({
			value: name,
			label: name,
		}));
	})();

	const localStatutFilterOptions = createStatutFilterOptions(t);

	const columns: GridColDef[] = (() => {
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
				headerName: t.documentList.colClient,
				flex: 1.5,
				minWidth: 140,
				filterOperators: createDropdownFilterOperators(
					clientFilterOptions,
					t.documentList.allClients,
					undefined,
					t.filterPanel.is,
				),
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
				headerName: t.documentList.colStatut,
				flex: 0.8,
				minWidth: 100,
				filterOperators: createDropdownFilterOperators(
					localStatutFilterOptions,
					t.common.allStatuses,
					true,
					t.filterPanel.is,
				),
				renderCell: (params: GridRenderCellParams<TDocument>) => {
					const statutLabel = getStatutLabel(params.value || '', t);
					return (
						<DarkTooltip title={statutLabel}>
							<Chip label={statutLabel || '-'} color={getStatutColor(params.value || '')} variant="outlined" />
						</DarkTooltip>
					);
				},
			},
			{
				field: 'total_ttc_apres_remise',
				headerName: t.documentList.colTotalTTC,
				flex: 1.3,
				minWidth: 130,
				filterOperators: createNumericFilterOperators(),
				renderCell: (params: GridRenderCellParams<TDocument>) => {
					const devise = params.row.devise || 'MAD';
					const formattedValue = formatNumberWithSpaces(params.value, 2);
					const displayValue = `${formattedValue} ${devise}`;
					return (
						<DarkTooltip title={displayValue}>
							<Typography
								variant="body2"
								noWrap
								color="primary"
								sx={{
									fontWeight: 600,
								}}
							>
								{displayValue}
							</Typography>
						</DarkTooltip>
					);
				},
			},
			{
				field: 'lignes_count',
				headerName: t.documentList.colNombreArticles,
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
				filterOperators: createDateRangeFilterOperator(t.filterPanel.between),
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
				headerName: t.common.actions,
				flex: 2,
				minWidth: 200,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<TDocument>) => {
					const actions = [];

					// View action - available for all roles
					if (role === 'Caissier' || role === 'Comptable' || role === 'Commercial' || role === 'Lecture') {
						actions.push({
							label: t.common.view,
							icon: <VisibilityIcon />,
							onClick: () => router.push(config.routes.viewRoute((params.row as DocumentListClass).id, companyId)),
							color: 'info' as const,
						});
					}

					// Edit, Delete, Convert actions - only for Caissier and Commercial
					if (role === 'Caissier' || role === 'Commercial') {
						const row = params.row as DocumentListClass;
						if (!config.canEditRow || config.canEditRow(params.row)) {
							actions.push({
								label: t.common.edit,
								icon: <EditIcon />,
								onClick: () => router.push(config.routes.editRoute(row.id, companyId)),
								color: 'primary' as const,
							});
						}
						if (allowDelete) {
							actions.push({
								label: t.common.delete,
								icon: <DeleteIcon />,
								onClick: () => showDeleteModalCall(row.id),
								color: 'error' as const,
							});
						}

						// Convert action if available
						if (config.convertActions && config.convertActions.length > 0) {
							const isCurrentItemLoading = isAnyConvertLoading && selectedId === (params.row as DocumentListClass).id;
							const completedAction = config.convertActions.find((action) => action.completed?.(row));
							const isConvertCompleted = Boolean(completedAction);
							actions.push({
								label: completedAction ? getCompletedConvertLabel(completedAction, row) : t.common.convert,
								icon: isCurrentItemLoading ? <CircularProgress size={20} /> : <SwapHorizIcon />,
								onClick: (e?: MouseEvent<HTMLElement>) => {
									if (!isCurrentItemLoading && !isConvertCompleted && e) {
										showConvertModalCall(e as MouseEvent<HTMLButtonElement>, (params.row as DocumentListClass).id);
									}
								},
								color: isConvertCompleted ? ('default' as const) : ('success' as const),
								show: !isCurrentItemLoading,
								disabled: isConvertCompleted,
							});
						}
					}

					// Print action - available for Caissier, Comptable, Commercial
					if (
						(role === 'Caissier' || role === 'Comptable' || role === 'Commercial') &&
						config.printActions &&
						config.printActions.length > 0 &&
						(!config.canPrintRow || config.canPrintRow(params.row))
					) {
						actions.push({
							label: t.common.display,
							icon: <PrintIcon />,
							onClick: (e?: MouseEvent<HTMLElement>) => {
								if (e) {
									showPrintMenuCall(e as MouseEvent<HTMLButtonElement>, (params.row as DocumentListClass).id);
								}
							},
							color: 'info' as const,
						});
					}

					return <MobileActionsMenu actions={actions} />;
				},
			},
		];

		const extraColumns = config.getExtraColumns?.({ router, companyId }) ?? [];
		return [...baseColumns.slice(0, -1), ...extraColumns, baseColumns[baseColumns.length - 1]];
	})();
	const modalsConfig = {
		delete: {
			title: config.labels.deleteConfirmTitle,
			body: config.labels.deleteConfirmBody,
			actions: deleteModalActions,
			titleIcon: <DeleteIcon />,
			titleIconColor: '#D32F2F',
		},
	};

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
					{allowDelete && selectedIds.length > 0 && (
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
				checkboxSelection={allowDelete && (role === 'Caissier' || role === 'Commercial')}
				onSelectionChange={handleSelectionChange}
				selectedIds={selectedIds}
			/>

			{allowDelete && showDeleteModal && <ActionModals {...modalsConfig.delete} />}

			{allowDelete && showBulkDeleteModal && (
				<ActionModals
					title={t.documentList.bulkDeleteTitle(selectedIds.length)}
					body={t.documentList.bulkDeleteBody(selectedIds.length, config.labels.documentTypeName)}
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
					const isDisabled =
						typeof action.disabled === 'function'
							? currentRow
								? action.disabled(currentRow)
								: true
							: (action.disabled ?? false);
					const isCompleted = currentRow ? Boolean(action.completed?.(currentRow)) : false;
					const label = isCompleted && currentRow ? getCompletedConvertLabel(action, currentRow) : action.label;

					items.push(
						<MenuItem
							key={action.key}
							disabled={isDisabled || isCompleted}
							onClick={() => handleMenuItemClick(action.key)}
						>
							<ListItemIcon>{action.icon}</ListItemIcon>
							<ListItemText>{label}</ListItemText>
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
						<MenuItem key={action.key} onClick={() => handlePrintMenuItemClick(action)}>
							<ListItemIcon sx={{ color: action.iconColor || 'inherit' }}>{action.icon}</ListItemIcon>
							<ListItemText>{action.label}</ListItemText>
						</MenuItem>,
					);
					return items;
				})}
			</Menu>

			{showLanguageModal && (
				<PdfLanguageModal onSelectLanguage={handleLanguageSelect} onClose={handleLanguageModalClose} />
			)}
		</>
	);
}

export default CompanyDocumentsListContent;
