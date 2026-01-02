'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography, Chip, IconButton, Avatar } from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	Archive as ArchiveIcon,
	Unarchive as UnarchiveIcon,
	Add as AddIcon,
	Close as CloseIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import { useDeleteArticleMutation, useGetArticlesListQuery, usePatchArchiveMutation } from '@/store/services/article';
import { ARTICLES_ADD, ARTICLES_EDIT, ARTICLES_VIEW } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { ArticleClass } from '@/models/classes';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import Image from 'next/image';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';

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

	const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);
	const [archiveTarget, setArchiveTarget] = useState<number | null>(null);

	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetArticlesListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			archived: archived,
		},
		{ skip: !token },
	);
	const data = rawData as PaginationResponseType<ArticleClass> | undefined;

	const [deleteRecord] = useDeleteArticleMutation();
	const [patchArchive] = usePatchArchiveMutation();

	const deleteHandler = async () => {
		try {
			await deleteRecord({ id: selectedId! }).unwrap();
			onSuccess('Article supprimé avec succès');
			refetch();
		} catch {
			onError("Erreur lors de la suppression d'article");
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

	const columns: GridColDef[] = [
		{
			field: 'photo',
			headerName: 'Photo',
			width: 70,
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
			width: 100,
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
			width: 90,
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
			width: 200,
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
			width: 120,
			renderCell: (params: GridRenderCellParams<ArticleClass>) => (
				<DarkTooltip title={params.value + ' DH'}>
					<Typography variant="body2" noWrap>
						{params.value} DH
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'prix_vente',
			headerName: 'Prix de vente',
			width: 120,
			renderCell: (params: GridRenderCellParams<ArticleClass>) => (
				<DarkTooltip title={params.value + ' DH'}>
					<Typography variant="body2" noWrap>
						{params.value} DH
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date_created',
			headerName: 'Date de création',
			width: 170,
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
			width: 200,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ArticleClass>) => (
				<Box sx={{ display: 'flex', gap: 1 }}>
					{(role === 'Admin' || role === 'Lecture') && (
						<DarkTooltip title="Voir">
							<IconButton
								size="small"
								color="info"
								onClick={() => router.push(ARTICLES_VIEW(params.row.id, company_id))}
							>
								<VisibilityIcon />
							</IconButton>
						</DarkTooltip>
					)}
					{role === 'Admin' && (
						<>
							<DarkTooltip title="Modifier">
								<IconButton
									size="small"
									color="primary"
									onClick={() => router.push(ARTICLES_EDIT(params.row.id, company_id))}
								>
									<EditIcon />
								</IconButton>
							</DarkTooltip>
							<DarkTooltip title="Supprimer">
								<IconButton size="small" color="error" onClick={() => showDeleteModalCall(params.row.id)}>
									<DeleteIcon />
								</IconButton>
							</DarkTooltip>
							<DarkTooltip title={archived ? 'Désarchiver' : 'Archiver'}>
								<IconButton size="small" color="warning" onClick={() => showArchiveModalCall(params.row.id)}>
									{archived ? <UnarchiveIcon /> : <ArchiveIcon />}
								</IconButton>
							</DarkTooltip>
						</>
					)}
				</Box>
			),
		},
	];

	return (
		<>
			{!archived && role === 'Admin' && (
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
