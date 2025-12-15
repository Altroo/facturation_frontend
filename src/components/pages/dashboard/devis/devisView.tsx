'use client';

import React, { useMemo } from 'react';
import {
	Avatar,
	Box,
	Stack,
	Typography,
	Card,
	CardContent,
	Divider,
	Button,
	useTheme,
	useMediaQuery,
	Chip,
} from '@mui/material';
import {
	ArrowBack,
	Edit,
	Description as DescriptionIcon,
	Person as PersonIcon,
	Payment as PaymentIcon,
	Discount as DiscountIcon,
	CalendarToday as CalendarTodayIcon,
	Numbers as NumbersIcon,
	Receipt as ReceiptIcon,
	Notes as NotesIcon,
	ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { DEVIS_LIST, DEVIS_EDIT } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { useGetDeviQuery } from '@/store/services/devi';
import { getAccessTokenFromSession } from '@/store/session';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import Styles from '@/styles/dashboard/clients/clients.module.sass';
import { useAppSelector } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { ArticleClass } from '@/models/Classes';
import { useGetArticlesListQuery } from '@/store/services/article';
import { formatDate } from '@/utils/helpers';
import FactureDevisTotalsCard from '@/components/shared/factureDevistotalCard/factureDevisTotalsCard';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const displayValue = React.isValidElement(value)
		? value
		: value === null || value === undefined || String(value).trim() === ''
			? '-'
			: value;

	return (
		<Stack direction="row" alignItems="flex-start" spacing={2} sx={{ py: 1.5, flexWrap: 'wrap' }}>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack direction="row" alignItems="center" spacing={isMobile ? 0 : 2} sx={{ flex: 1, flexWrap: 'wrap' }}>
				<Typography
					fontWeight={600}
					color="text.secondary"
					sx={{ minWidth: { xs: '100%', sm: 200 }, wordBreak: 'break-word' }}
				>
					{label}
				</Typography>
				<Box sx={{ flex: 1 }}>
					{React.isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

const getStatutColor = (
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

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const DevisViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const token = getAccessTokenFromSession(session);
	const companies = useAppSelector(getUserCompaniesState);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const { data: rawData, isLoading, error } = useGetDeviQuery({ id }, { skip: !token });
	const { data: rawArticlesData, isLoading: isArticlesLoading } = useGetArticlesListQuery(
		{ company_id, with_pagination: false, archived: false },
		{ skip: !token },
	);
	const articlesData = rawArticlesData as Array<Partial<ArticleClass>> | undefined;

	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const company = useMemo(() => {
		return companies?.find((comp) => comp.id === company_id);
	}, [companies, company_id]);

	// Calculate totals
	const totals = useMemo(() => {
		if (!rawData) return { totalHT: 0, totalTVA: 0, totalTTC: 0, totalTTCApresRemise: 0 };

		// detect any server-provided totals
		const hasAnyServerTotal =
			rawData.total_ht !== undefined ||
			rawData.total_ttc !== undefined ||
			rawData.total_tva !== undefined ||
			rawData.total_ttc_apres_remise !== undefined;

		if (hasAnyServerTotal) {
			const serverTotalHTRaw = rawData.total_ht !== undefined ? Number(rawData.total_ht ?? 0) : undefined;
			const serverTotalTTCRaw = rawData.total_ttc !== undefined ? Number(rawData.total_ttc ?? 0) : undefined;
			const serverTotalTVARaw = rawData.total_tva !== undefined ? Number(rawData.total_tva ?? 0) : undefined;
			const serverTotalTTCAfterRaw =
				rawData.total_ttc_apres_remise !== undefined ? Number(rawData.total_ttc_apres_remise ?? 0) : undefined;

			// derive missing values when possible
			const serverTotalHT =
				serverTotalHTRaw !== undefined
					? serverTotalHTRaw
					: serverTotalTTCRaw !== undefined && serverTotalTVARaw !== undefined
						? Math.max(0, serverTotalTTCRaw - serverTotalTVARaw)
						: 0;

			const serverTotalTTC =
				serverTotalTTCRaw !== undefined
					? serverTotalTTCRaw
					: serverTotalTVARaw !== undefined
						? serverTotalHT + serverTotalTVARaw
						: serverTotalHT; // best-effort

			const serverTotalTVA = serverTotalTVARaw !== undefined ? serverTotalTVARaw : serverTotalTTC - serverTotalHT;

			const serverTotalTTCAfter = serverTotalTTCAfterRaw !== undefined ? serverTotalTTCAfterRaw : serverTotalTTC;

			return {
				totalHT: Math.max(0, Number(serverTotalHT)),
				totalTVA: Math.max(0, Number(serverTotalTVA)),
				totalTTC: Math.max(0, Number(serverTotalTTC)),
				totalTTCApresRemise: Math.max(0, Number(serverTotalTTCAfter)),
			};
		}

		// Fallback: compute locally per-lines
		let rawTotalHT = 0;
		let rawTotalTVA = 0;

		(rawData.lignes || []).forEach((ligne) => {
			const article = articlesData?.find((a) => a.id === ligne.article);
			if (!article) return;

			const prixVente = Number(ligne.prix_vente ?? 0);
			const quantity = Number(ligne.quantity ?? 1);
			const baseHT = prixVente * (Number.isFinite(quantity) ? quantity : 1);

			let discountedHT = baseHT;
			if (ligne.remise && ligne.remise > 0 && ligne.remise_type) {
				if (ligne.remise_type === 'Pourcentage') {
					discountedHT = baseHT * (1 - ligne.remise / 100);
				} else if (ligne.remise_type === 'Fixe') {
					discountedHT = Math.max(0, baseHT - ligne.remise);
				}
			}

			const tvaRate = Number(article.tva ?? 0);
			const lineTVA = discountedHT * (tvaRate / 100);

			if (Number.isFinite(discountedHT)) rawTotalHT += discountedHT;
			if (Number.isFinite(lineTVA)) rawTotalTVA += lineTVA;
		});

		const rawTotalTTC = rawTotalHT + rawTotalTVA;
		let finalTotalHT = rawTotalHT;
		let finalTotalTVA = rawTotalTVA;
		let finalTotalTTC = rawTotalTTC;

		if (rawData.remise && rawData.remise > 0 && rawData.remise_type) {
			if (rawData.remise_type === 'Pourcentage') {
				finalTotalHT = rawTotalHT * (1 - rawData.remise / 100);
			} else if (rawData.remise_type === 'Fixe') {
				finalTotalHT = Math.max(0, rawTotalHT - rawData.remise);
			}
			const ratio = rawTotalHT > 0 ? finalTotalHT / rawTotalHT : 0;
			finalTotalTVA = rawTotalTVA * ratio;
			finalTotalTTC = finalTotalHT + finalTotalTVA;
		}

		return {
			totalHT: Math.max(0, rawTotalHT),
			totalTVA: Math.max(0, rawTotalTVA),
			totalTTC: Math.max(0, rawTotalTTC),
			totalTTCApresRemise: Math.max(0, finalTotalTTC),
		};
	}, [rawData, articlesData]);

	// Lines DataGrid columns (read-only)
	const linesColumns: GridColDef[] = [
		{
			field: 'photo',
			headerName: 'Photo',
			width: 70,
			renderCell: (params: GridRenderCellParams) => {
				const article = articlesData?.find((a) => a.id === params.row.article);
				return (
					<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
						<Avatar
							src={article?.photo as string | undefined}
							alt={article?.reference as string | undefined}
							variant="rounded"
							sx={{ width: 40, height: 40 }}
						/>
					</Box>
				);
			},
			sortable: false,
			filterable: false,
		},
		{
			field: 'reference',
			headerName: 'Référence',
			width: 110,
			renderCell: (params: GridRenderCellParams) => {
				const article = articlesData?.find((a) => a.id === params.row.article);
				const value = article?.reference ?? '';
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'designation',
			headerName: 'Désignation',
			width: 150,
			renderCell: (params: GridRenderCellParams) => {
				const value = params.row.designation ?? '';
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'marque',
			headerName: 'Marque',
			width: 130,
			renderCell: (params: GridRenderCellParams) => {
				const article = articlesData?.find((a) => a.id === params.row.article);
				const value = article?.marque_name ?? '';
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'categorie',
			headerName: 'Catégorie',
			width: 130,
			renderCell: (params: GridRenderCellParams) => {
				const article = articlesData?.find((a) => a.id === params.row.article);
				const value = article?.categorie_name ?? '';
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'prix_achat',
			headerName: "Prix d'achat",
			width: 120,
			renderCell: (params: GridRenderCellParams) => {
				const value = Number(params.row.prix_achat ?? 0).toFixed(2) + ' MAD';
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'prix_vente',
			headerName: 'Prix de vente',
			width: 150,
			renderCell: (params: GridRenderCellParams) => {
				const value = Number(params.row.prix_vente ?? 0).toFixed(2) + ' MAD';
				return (
					<DarkTooltip title={value}>
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
								{value}
							</Typography>
						</Box>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'quantity',
			headerName: 'Quantité',
			width: 120,
			renderCell: (params: GridRenderCellParams) => {
				const value = params.row.quantity ?? 1;
				return (
					<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
						<Typography variant="body2">{value}</Typography>
					</Box>
				);
			},
		},
		{
			field: 'remise_type',
			headerName: 'Type remise',
			width: 120,
			renderCell: (params: GridRenderCellParams) => {
				const value = params.row.remise_type ?? '';
				return (
					<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
						<Typography variant="body2">{value || '-'}</Typography>
					</Box>
				);
			},
		},
		{
			field: 'remise',
			headerName: 'Remise',
			width: 120,
			renderCell: (params: GridRenderCellParams) => {
				const remise = params.row.remise ?? 0;
				const remiseType = params.row.remise_type ?? '';
				const value = remise > 0 ? `${remise}${remiseType === 'Pourcentage' ? '%' : ' MAD'}` : '-';
				return (
					<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
						<Typography variant="body2">{value}</Typography>
					</Box>
				);
			},
		},
	];

	const dateDevisLabel = formatDate(rawData?.date_devis as string | null) || '-';

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
			<NavigationBar title="Détails du devis">
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
					<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
						<Button
							variant="outlined"
							startIcon={<ArrowBack />}
							onClick={() => router.push(DEVIS_LIST)}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							Liste des devis
						</Button>
						{!isLoading && !error && company?.role === 'Admin' && (
							<Button
								variant="contained"
								startIcon={<Edit />}
								onClick={() => router.push(DEVIS_EDIT(id, company_id))}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								Modifier
							</Button>
						)}
					</Stack>
					{isLoading || isArticlesLoading ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : (axiosError?.status as number) > 400 ? (
						<ApiAlert
							errorDetails={axiosError?.data.details}
							cssStyle={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
							}}
						/>
					) : (
						<Stack spacing={3}>
							{/* Totals Card */}
							<FactureDevisTotalsCard
								totals={{
									totalHT: totals.totalHT,
									totalTVA: totals.totalTVA,
									totalTTC: totals.totalTTC,
									totalTTCApresRemise: totals.totalTTCApresRemise,
								}}
								isMobile={isMobile}
							/>
							{/* Document Information Card */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<DescriptionIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Informations du document
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<NumbersIcon />} label="Numéro du devis" value={rawData?.numero_devis} />
										<Divider />
										<InfoRow
											icon={<CalendarTodayIcon />}
											label="Date du devis"
											value={dateDevisLabel.split(',')[0] || '-'}
										/>
									</Stack>
								</CardContent>
							</Card>
							{/* Statut du rawData */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<DescriptionIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Statut du devis
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
										<Chip
											label={rawData?.statut || '-'}
											color={getStatutColor(rawData?.statut || '')}
											variant="outlined"
										/>
									</Box>
								</CardContent>
							</Card>
							{/* Client Information Card */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<PersonIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Client
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<InfoRow icon={<PersonIcon />} label="Client" value={rawData?.client_name} />
								</CardContent>
							</Card>
							{/* Payment & Terms Card */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<PaymentIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Paiement & Conditions
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<PaymentIcon />} label="Mode de paiement" value={rawData?.mode_paiement_name} />
										<Divider />
										<InfoRow
											icon={<ReceiptIcon />}
											label="Numéro demande prix client"
											value={rawData?.numero_demande_prix_client}
										/>
									</Stack>
								</CardContent>
							</Card>
							{/* Lines Card */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<ShoppingCartIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Lignes du devis
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Box sx={{ height: '100%' }}>
										<DataGrid
											rows={(rawData?.lignes || []).map((ligne, index) => ({
												...ligne,
												id: index,
											}))}
											showToolbar={true}
											slotProps={{
												toolbar: {
													showQuickFilter: true,
													quickFilterProps: { debounceMs: 500 },
												},
											}}
											columns={linesColumns}
											localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
											disableRowSelectionOnClick
											pageSizeOptions={[5, 10, 25, 50, 100]}
											initialState={{
												pagination: {
													paginationModel: { pageSize: 10 },
												},
											}}
										/>
									</Box>
								</CardContent>
							</Card>
							{/* Global Remise */}
							{rawData?.remise && rawData?.remise > 0 && (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<DiscountIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Remise globale
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<InfoRow
											icon={<DiscountIcon />}
											label="Remise appliquée"
											value={`${rawData.remise}${rawData.remise_type === 'Pourcentage' ? '%' : ' MAD'}`}
										/>
									</CardContent>
								</Card>
							)}
							{/* Remark */}
							{rawData?.remarque && (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<NotesIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Remarque
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<InfoRow icon={<NotesIcon />} label="Remarque" value={rawData?.remarque} />
									</CardContent>
								</Card>
							)}
							{/* Metadata */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<DescriptionIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Informations système
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<CalendarTodayIcon />}
											label="Date de création"
											value={formatDate(rawData?.date_created as string | null)}
										/>
										<Divider />
										<InfoRow
											icon={<CalendarTodayIcon />}
											label="Dernière modification"
											value={formatDate(rawData?.date_updated as string | null)}
										/>
										<Divider />
										<InfoRow icon={<PersonIcon />} label="Créé par" value={rawData?.created_by_user_name} />
									</Stack>
								</CardContent>
							</Card>
						</Stack>
					)}
				</Stack>
			</NavigationBar>
		</Stack>
	);
};

export default DevisViewClient;
