'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography, Chip, IconButton, Avatar, Alert, CircularProgress } from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	Archive as ArchiveIcon,
	Unarchive as UnarchiveIcon,
	Add as AddIcon,
	Close as CloseIcon,
	FileUpload as FileUploadIcon,
	Email as EmailIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams, GridFilterModel, GridLogicOperator } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import { useDeleteArticleMutation, useGetArticlesListQuery, useImportArticlesMutation, usePatchArchiveMutation, useSendCSVExampleEmailMutation, useBulkDeleteArticlesMutation, useBulkArchiveArticlesMutation, useLazyGetArticlesListQuery } from '@/store/services/article';
import { ARTICLES_ADD, ARTICLES_EDIT, ARTICLES_VIEW } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { ArticleClass } from '@/models/classes';
import { formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import Image from 'next/image';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import { useGetCompanyQuery } from '@/store/services/company';
import { useGetCategorieListQuery, useGetEmplacementListQuery, useGetUniteListQuery, useGetMarqueListQuery } from '@/store/services/parameter';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';

interface FormikContentProps extends SessionProps {
	company_id: number;
	archived: boolean;
	role: string;
}

export const typeFilterOptions = [
	{ value: 'Produit', label: 'Produit', color: 'default' as const },
	{ value: 'Service', label: 'Service', color: 'default' as const },
];

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { session, company_id, archived, role } = props;
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

	const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);
	const [archiveTarget, setArchiveTarget] = useState<number | null>(null);
	const [importErrors, setImportErrors] = useState<{ row: number; message: string }[]>([]);
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});

	// Bulk selection state
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
	const [showBulkArchiveModal, setShowBulkArchiveModal] = useState<boolean>(false);
	const [bulkArchiveAction, setBulkArchiveAction] = useState<'archive' | 'unarchive'>('archive');
	// Select-all-matching state
	const [isAllMatchingSelected, setIsAllMatchingSelected] = useState<boolean>(false);

	const { data: categories } = useGetCategorieListQuery({ company_id }, { skip: !token });
	const { data: emplacements } = useGetEmplacementListQuery({ company_id }, { skip: !token });
	const { data: unites } = useGetUniteListQuery({ company_id }, { skip: !token });
	const { data: marques } = useGetMarqueListQuery({ company_id }, { skip: !token });

	const chipFilters: ChipFilterConfig[] = React.useMemo(
		() => [
			{ key: 'categorie', label: 'Catégorie', paramName: 'categorie_ids', options: categories ?? [] },
			{ key: 'emplacement', label: 'Emplacement', paramName: 'emplacement_ids', options: emplacements ?? [] },
			{ key: 'unite', label: 'Unité', paramName: 'unite_ids', options: unites ?? [] },
			{ key: 'marque', label: 'Marque', paramName: 'marque_ids', options: marques ?? [] },
		],
		[categories, emplacements, unites, marques],
	);

	const mergedFilterParams = React.useMemo(
		() => ({ ...chipFilterParams, ...customFilterParams }),
		[chipFilterParams, customFilterParams],
	);

	useEffect(() => {
		setImportErrors([]);
	}, [company_id]);

	// Call query hook at component level
	const { data: rawData, isLoading, refetch } = useGetArticlesListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			archived,
			...mergedFilterParams,
		},
		{ skip: !token },
	);

	const data = rawData as PaginationResponseType<ArticleClass> | undefined;

	const [deleteRecord] = useDeleteArticleMutation();
	const [patchArchive] = usePatchArchiveMutation();
	const [importArticles, { isLoading: isImporting }] = useImportArticlesMutation();
	const [sendCSVExampleEmail, { isLoading: isSendingEmail }] = useSendCSVExampleEmailMutation();
	const [bulkDeleteArticles] = useBulkDeleteArticlesMutation();
	const [bulkArchiveArticles] = useBulkArchiveArticlesMutation();
	const [fetchAllArticleIds, { isLoading: isLoadingAllIds }] = useLazyGetArticlesListQuery();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImportErrors([]);
		try {
			const result = await importArticles({ file, company_id }).unwrap();
			if (result.created > 0) {
				onSuccess(`${result.created} article(s) importé(s) avec succès`);
				refetch();
			}
			if (result.errors.length > 0) {
				setImportErrors(result.errors);
			}
		} catch {
			onError("Erreur lors de l'importation des articles");
		} finally {
			e.target.value = '';
		}
	};

	const handleSendCSVEmail = async () => {
		try {
			await sendCSVExampleEmail({ company_id }).unwrap();
			onSuccess('Email envoyé avec succès. Veuillez vérifier votre boîte de réception.');
		} catch {
			onError("Erreur lors de l'envoi de l'email");
		}
	};

	const deleteHandler = async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			onSuccess('Article supprimé avec succès');
			refetch();
		} catch {
			onError("Erreur lors de la suppression d'article");
		} finally {
			setShowDeleteModal(false);
			// Remove only the deleted item from selection (preserve remaining bulk selection)
			// Do NOT clear isAllMatchingSelected — user stays in 'all matching' mode minus this one item
			setSelectedIds((prev) => prev.filter((id) => id !== selectedId));
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

	const archiveHandler = async () => {
		if (!archiveTarget) return;
		try {
			await patchArchive({
				id: archiveTarget,
				data: { archived: !archived },
			}).unwrap();
			if (archived) {
				onSuccess('Article désarchivé avec succès');
			} else {
				onSuccess('Article archivé avec succès');
			}
			refetch();
		} catch {
			if (archived) {
				onError("Erreur lors de la désarchivation d'article");
			} else {
				onError("Erreur lors de l’archivage d'article");
			}
		} finally {
			setShowArchiveModal(false);
			setArchiveTarget(null);
			// Remove only the archived item from selection (preserve remaining bulk selection)
			// Do NOT clear isAllMatchingSelected — user stays in 'all matching' mode minus this one item
			setSelectedIds((prev) => prev.filter((id) => id !== archiveTarget));
		}
	};

	const archiveModalActions = [
		{
			text: 'Annuler',
			active: false,
			onClick: () => {
				setShowArchiveModal(false);
				setArchiveTarget(null);
			},
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: archived ? 'Désarchiver' : 'Archiver',
			active: true,
			onClick: archiveHandler,
			icon: <ArchiveIcon />,
			color: '#ED6C02',
		},
	];

	const showArchiveModalCall = (id: number) => {
		setArchiveTarget(id);
		setShowArchiveModal(true);
	};

	const handleSelectionChange = useCallback((ids: number[]) => {
		setSelectedIds(ids);
		setIsAllMatchingSelected(false);
	}, []);

	const handleSelectAllMatching = useCallback(async () => {
		try {
			const result = await fetchAllArticleIds({
				company_id,
				with_pagination: false,
				archived,
				...mergedFilterParams,
			}).unwrap();
			const allIds = (result as Partial<ArticleClass>[]).map((a) => a.id!).filter(Boolean);
			setSelectedIds(allIds);
			setIsAllMatchingSelected(true);
		} catch {
			onError('Erreur lors de la sélection de tous les éléments');
		}
	}, [company_id, archived, mergedFilterParams, fetchAllArticleIds, onError]);

	const handleClearAllMatching = useCallback(() => {
		setIsAllMatchingSelected(false);
		setSelectedIds([]);
	}, []);

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteArticles({ ids: selectedIds }).unwrap();
			onSuccess(`${selectedIds.length} article(s) supprimé(s) avec succès`);
		} catch {
			onError("Erreur lors de la suppression des articles");
		} finally {
			setSelectedIds([]);
			setIsAllMatchingSelected(false);
			setShowBulkDeleteModal(false);
			refetch();
		}
	};

	const bulkDeleteModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowBulkDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: `Supprimer (${selectedIds.length})`, active: true, onClick: bulkDeleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const bulkArchiveHandler = async () => {
		const archiving = bulkArchiveAction === 'archive';
		try {
			await bulkArchiveArticles({ ids: selectedIds, archived: archiving }).unwrap();
			onSuccess(`${selectedIds.length} article(s) ${archiving ? 'archivé(s)' : 'désarchivé(s)'} avec succès`);
		} catch {
			onError(`Erreur lors de l'${archiving ? 'archivage' : 'désarchivage'} des articles`);
		} finally {
			setSelectedIds([]);
			setIsAllMatchingSelected(false);
			setShowBulkArchiveModal(false);
			refetch();
		}
	};

	const bulkArchiveModalActions = [
		{
			text: 'Annuler',
			active: false,
			onClick: () => setShowBulkArchiveModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: bulkArchiveAction === 'archive' ? `Archiver (${selectedIds.length})` : `Désarchiver (${selectedIds.length})`,
			active: true,
			onClick: bulkArchiveHandler,
			icon: bulkArchiveAction === 'archive' ? <ArchiveIcon /> : <UnarchiveIcon />,
			color: '#ED6C02',
		},
	];

	const columns: GridColDef[] = [
		{
			field: 'photo',
			headerName: 'Photo',
			flex: 0.5,
			minWidth: 70,
			renderCell: (params: GridRenderCellParams<ArticleClass>) => {
				const src = params.value as string | undefined | null;
				return (
					<DarkTooltip
						title={
							src ? (
								<Box sx={{ width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Image
										src={src}
										alt={params.row.reference}
										width={260}
										height={260}
										style={{ objectFit: 'contain', display: 'block' }}
									/>
								</Box>
							) : (
								''
							)
						}
						placement="right"
						arrow
						enterDelay={100}
						leaveDelay={200}
						slotProps={{ tooltip: { sx: { pointerEvents: 'auto' } } }}
					>
						<Avatar
							src={src ?? undefined}
							alt={params.row.reference}
							variant="rounded"
							sx={{ width: 40, height: 40 }}
						/>
					</DarkTooltip>
				);
			},
			sortable: false,
			filterable: false,
		},
		{
			field: 'reference',
			headerName: 'Réference',
			flex: 1,
			minWidth: 100,
			renderCell: (params: GridRenderCellParams<ArticleClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'type_article',
			headerName: 'Type',
			flex: 0.9,
			minWidth: 90,
			filterOperators: createDropdownFilterOperators(typeFilterOptions, 'Tous les types', true),
			renderCell: (params: GridRenderCellParams<ArticleClass>) => {
				return (
					<DarkTooltip title={params.value}>
						<Chip label={params.value} size="small" variant="outlined" />
					</DarkTooltip>
				);
			},
		},
		{
			field: 'designation',
			headerName: 'Designation',
			flex: 2,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<ArticleClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'prix_achat',
			headerName: "Prix d'achat",
			flex: 1,
			minWidth: 100,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<ArticleClass>) => {
				const formattedValue = formatNumberWithSpaces(params.value, 2);
				const devise = usesForeignCurrency ? params.row.devise_prix_achat : 'MAD';
				return (
					<DarkTooltip title={`${formattedValue} ${devise}`}>
						<Typography variant="body2" noWrap fontWeight={600} color="primary">
							{formattedValue} {devise}
						</Typography>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'prix_vente',
			headerName: 'Prix de vente',
			flex: 1,
			minWidth: 100,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<ArticleClass>) => {
				const formattedValue = formatNumberWithSpaces(params.value, 2);
				const devise = usesForeignCurrency ? params.row.devise_prix_vente : 'MAD';
				return (
					<DarkTooltip title={`${formattedValue} ${devise}`}>
						<Typography variant="body2" noWrap fontWeight={600} color="primary">
							{formattedValue} {devise}
						</Typography>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'date_created',
			headerName: 'Date de création',
			flex: 1.4,
			minWidth: 140,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<ArticleClass>) => {
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
			field: 'actions',
			headerName: 'Actions',
			flex: 1.5,
			minWidth: 150,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ArticleClass>) => {
				const actions = [];

				// View action - available for all roles
				if (role === 'Caissier' || role === 'Lecture' || role === 'Comptable' || role === 'Commercial') {
					actions.push({
						label: 'Voir',
						icon: <VisibilityIcon />,
						onClick: () => router.push(ARTICLES_VIEW(params.row.id, company_id)),
						color: 'info' as const,
					});
				}

				// Edit, Delete, Archive actions - only for Caissier and Commercial
				if (role === 'Caissier' || role === 'Commercial') {
					actions.push(
						{
							label: 'Modifier',
							icon: <EditIcon />,
							onClick: () => router.push(ARTICLES_EDIT(params.row.id, company_id)),
							color: 'primary' as const,
						},
						{
							label: 'Supprimer',
							icon: <DeleteIcon />,
							onClick: () => showDeleteModalCall(params.row.id),
							color: 'error' as const,
						},
						{
							label: archived ? 'Désarchiver' : 'Archiver',
							icon: archived ? <UnarchiveIcon /> : <ArchiveIcon />,
							onClick: () => showArchiveModalCall(params.row.id),
							color: 'warning' as const,
						},
					);
				}

				return <MobileActionsMenu actions={actions} />;
			},
		},
	];

	return (
		<>
			{importErrors.length > 0 && (
				<Alert severity="error" icon={<WarningIcon />} sx={{ px: { xs: 1, sm: 2, md: 3 }, mt: { xs: 1, sm: 2, md: 3 } }}>
					<Typography variant="subtitle2" fontWeight={600}>
						Erreurs lors de l&#39;importation :
					</Typography>
					<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
						{importErrors.map((err) => (
							<li key={err.row}>
								<Typography variant="body2">
									Ligne {err.row} : {err.message}
								</Typography>
							</li>
						))}
					</ul>
				</Alert>
			)}
			{(role === 'Caissier' || role === 'Commercial') && (!archived || selectedIds.length > 0) && (
				<Box
					sx={{
						width: '100%',
						display: 'flex',
						flexWrap: 'wrap',
						gap: 1,
						justifyContent: 'flex-start',
						px: { xs: 1, sm: 2, md: 3 },
						mt: { xs: 1, sm: 2, md: 3 },
						mb: { xs: 1, sm: 2, md: 3 },
					}}
				>
					{!archived && (
						<Button
							variant="contained"
							onClick={() => router.push(ARTICLES_ADD(company_id))}
							sx={{
								whiteSpace: 'nowrap',
								px: { xs: 1.5, sm: 2, md: 3 },
								py: { xs: 0.8, sm: 1, md: 1 },
								fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
							}}
							startIcon={<AddIcon fontSize="small" />}
						>
							Nouvel article
						</Button>
					)}
					{selectedIds.length > 0 && role === 'Caissier' && (
						<Button
							variant="outlined"
							color="error"
							onClick={() => setShowBulkDeleteModal(true)}
							sx={{
								whiteSpace: 'nowrap',
								px: { xs: 1.5, sm: 2, md: 3 },
								py: { xs: 0.8, sm: 1, md: 1 },
								fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
							}}
							startIcon={<DeleteIcon fontSize="small" />}
						>
							Supprimer ({selectedIds.length})
						</Button>
					)}
					{selectedIds.length > 0 && (
						<Button
							variant="outlined"
							color="warning"
							onClick={() => {
								setBulkArchiveAction(archived ? 'unarchive' : 'archive');
								setShowBulkArchiveModal(true);
							}}
							sx={{
								whiteSpace: 'nowrap',
								px: { xs: 1.5, sm: 2, md: 3 },
								py: { xs: 0.8, sm: 1, md: 1 },
								fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
							}}
							startIcon={archived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
						>
							{archived ? 'Désarchiver' : 'Archiver'} ({selectedIds.length})
						</Button>
					)}
				</Box>
			)}
			<input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx" style={{ display: 'none' }} onChange={handleFileChange} />
			<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} columns={2} />
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
				checkboxSelection={role === 'Caissier' || role === 'Commercial'}
				onSelectionChange={handleSelectionChange}
				selectedIds={selectedIds}
				totalMatchingCount={data?.count}
				onSelectAllMatchingClick={handleSelectAllMatching}
				selectAllMatchingLoading={isLoadingAllIds}
				isAllMatchingSelected={isAllMatchingSelected}
				onClearAllMatchingSelected={handleClearAllMatching}
				toolbarActions={
					!archived && (role === 'Caissier' || role === 'Commercial') ? (
						<>
							<DarkTooltip title="Envoyer le guide d'importation par email">
								<IconButton
									disabled={isSendingEmail}
									size="small"
									color="default"
									onClick={handleSendCSVEmail}
								>
									{isSendingEmail ? <CircularProgress size={20} /> : <EmailIcon />}
								</IconButton>
							</DarkTooltip>
							<DarkTooltip title="Importer CSV ou Excel">
								<IconButton
									disabled={isImporting}
									size="small"
									color="default"
									onClick={() => fileInputRef.current?.click()}
								>
									{isImporting ? <CircularProgress size={20} /> : <FileUploadIcon />}
								</IconButton>
							</DarkTooltip>
						</>
					) : undefined
				}
			/>
			{showDeleteModal && (
				<ActionModals
					title="Supprimer cette article ?"
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					body="Êtes‑vous sûr de vouloir supprimer cette article?"
					actions={deleteModalActions}
				/>
			)}
			{showArchiveModal && (
				<ActionModals
					title={archived ? 'Désarchiver cette article ?' : 'Archiver cette article ?'}
					titleIcon={<ArchiveIcon />}
					titleIconColor="#ED6C02"
					body={
						archived
							? 'Êtes‑vous sûr de vouloir désarchiver cette article?'
							: 'Êtes‑vous sûr de vouloir archiver cette article?'
					}
					actions={archiveModalActions}
				/>
			)}
			{showBulkDeleteModal && (
				<ActionModals
					title={`Supprimer ${selectedIds.length} article(s) ?`}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					body={`Êtes-vous sûr de vouloir supprimer les ${selectedIds.length} article(s) sélectionné(s) ?`}
					actions={bulkDeleteModalActions}
				/>
			)}
			{showBulkArchiveModal && (
				<ActionModals
					title={bulkArchiveAction === 'archive' ? `Archiver ${selectedIds.length} article(s) ?` : `Désarchiver ${selectedIds.length} article(s) ?`}
					titleIcon={bulkArchiveAction === 'archive' ? <ArchiveIcon /> : <UnarchiveIcon />}
					titleIconColor="#ED6C02"
					body={bulkArchiveAction === 'archive'
						? `Êtes-vous sûr de vouloir archiver les ${selectedIds.length} article(s) sélectionné(s) ?`
						: `Êtes-vous sûr de vouloir désarchiver les ${selectedIds.length} article(s) sélectionné(s) ?`
					}
					actions={bulkArchiveModalActions}
				/>
			)}
		</>
	);
};

interface Props extends SessionProps {
	archived: boolean;
}

const ArticlesListClient: React.FC<Props> = ({ session, archived }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title={archived ? 'Articles Archivés' : 'Liste des Articles'}>
			{({ company_id, role }) => (
				<FormikContent archived={archived} session={session} company_id={company_id} role={role} />
			)}
		</CompanyDocumentsWrapperList>
	);
};

export default ArticlesListClient;
