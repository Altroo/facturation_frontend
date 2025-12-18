'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography, Chip, IconButton, Tabs, Tab, Paper, Container, Avatar } from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	Business as BusinessIcon,
	Archive as ArchiveIcon,
	Unarchive as UnarchiveIcon,
	Add as AddIcon,
	Close as CloseIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useDeleteArticleMutation, useGetArticlesListQuery, usePatchArchiveMutation } from '@/store/services/article';
import { ARTICLES_ADD, ARTICLES_EDIT, ARTICLES_VIEW, COMPANIES_ADD } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { ArticleClass } from '@/models/classes';
import { formatDate } from '@/utils/helpers';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { useToast } from '@/utils/hooks';
import Image from 'next/image';

interface FormikContentProps extends SessionProps {
	company_id: number;
	archived: boolean;
	role: string;
}

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
				<DarkTooltip title={params.value.toFixed(2) + ' DH'}>
					<Typography variant="body2" noWrap>
						{params.value.toFixed(2)} DH
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'prix_vente',
			headerName: 'Prix de vente',
			width: 120,
			renderCell: (params: GridRenderCellParams<ArticleClass>) => (
				<DarkTooltip title={params.value.toFixed(2) + ' DH'}>
					<Typography variant="body2" noWrap>
						{params.value.toFixed(2)} DH
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
				<NavigationBar title={archived ? 'Articles Archivés' : 'Liste des Articles'}>
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
								<FormikContent
									archived={archived}
									session={session}
									company_id={selectedCompany.id}
									role={selectedCompany.role}
								/>
							)}
						</>
					)}
				</NavigationBar>
			</Stack>
		</>
	);
};

export default ArticlesListClient;
