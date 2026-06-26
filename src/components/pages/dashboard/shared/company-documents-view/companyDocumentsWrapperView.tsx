'use client';

import React, { useMemo } from 'react';
import {
	Alert,
	AlertTitle,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	CalendarToday as CalendarTodayIcon,
	Description as DescriptionIcon,
	Discount as DiscountIcon,
	Edit as EditIcon,
	Error as ErrorIcon,
	Inventory2 as Inventory2Icon,
	LocalShipping as LocalShippingIcon,
	Notes as NotesIcon,
	Numbers as NumbersIcon,
	Payment as PaymentIcon,
	Person as PersonIcon,
	Receipt as ReceiptIcon,
	Refresh as RefreshIcon,
	ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import FactureDevisTotalsCard from '@/components/shared/factureDevistotalCard/factureDevisTotalsCard';

import Styles from '@/styles/dashboard/dashboard.module.sass';
import { useAppSelector, useLanguage } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';
import { useGetArticlesListQuery } from '@/store/services/article';
import { extractApiErrorMessage, formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { isNectarRaisonSociale } from '@/utils/nectar';
import { useInitAccessToken } from '@/contexts/InitContext';

import type { ArticleClass } from '@/models/classes';
import type { ApiErrorResponseType, ResponseDataInterface } from '@/types/_initTypes';
import { getStatutColor } from '@/components/pages/dashboard/devis/devis-list';
import type { CompanyDocumentData, CompanyDocumentsViewProps, Totals } from '@/types/companyDocumentsTypes';

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
		<Stack
			direction="row"
			spacing={2}
			sx={{
				alignItems: 'flex-start',
				py: 1.5,
				flexWrap: 'wrap',
			}}
		>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack
				direction="row"
				spacing={isMobile ? 0 : 2}
				sx={{
					alignItems: 'center',
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					sx={{
						fontWeight: 600,
						color: 'text.secondary',
						minWidth: { xs: '100%', sm: 200 },
						wordBreak: 'break-word',
					}}
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

type DocumentErrorStateProps = {
	title: string;
	message: string;
	helpText: string;
	backLabel: string;
	retryLabel: string;
	onBack: () => void;
	onRetry: () => void;
};

const DocumentErrorState: React.FC<DocumentErrorStateProps> = ({
	title,
	message,
	helpText,
	backLabel,
	retryLabel,
	onBack,
	onRetry,
}) => (
	<Box
		sx={{
			display: 'flex',
			justifyContent: 'center',
			px: { xs: 0, sm: 2 },
			pt: { xs: 6, md: 10 },
		}}
	>
		<Alert
			severity="error"
			variant="outlined"
			icon={<ErrorIcon sx={{ fontSize: 40 }} />}
			sx={{
				width: '100%',
				maxWidth: 720,
				borderRadius: 1,
				borderColor: 'error.light',
				bgcolor: 'rgba(211, 47, 47, 0.04)',
				px: { xs: 2, sm: 3 },
				py: { xs: 2, sm: 2.5 },
				alignItems: 'flex-start',
				'& .MuiAlert-icon': {
					mt: 0.25,
					mr: 2,
				},
				'& .MuiAlert-message': {
					width: '100%',
				},
			}}
		>
			<AlertTitle sx={{ fontSize: 20, fontWeight: 700, mb: 0.75 }}>{title}</AlertTitle>
			<Typography variant="body1" sx={{ color: 'text.primary', mb: 0.75 }}>
				{message}
			</Typography>
			<Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.25 }}>
				{helpText}
			</Typography>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
				<Button variant="contained" color="error" startIcon={<ArrowBackIcon />} onClick={onBack}>
					{backLabel}
				</Button>
				<Button variant="outlined" color="error" startIcon={<RefreshIcon />} onClick={onRetry}>
					{retryLabel}
				</Button>
			</Stack>
		</Alert>
	</Box>
);

const toNumber = (value: unknown, fallback = 0): number => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
	if (typeof value === 'string') {
		const n = Number(value);
		return Number.isFinite(n) ? n : fallback;
	}
	return fallback;
};

const isPositiveNumber = (value: unknown): boolean => toNumber(value, 0) > 0;

const computeTotals = <TData extends CompanyDocumentData>(
	rawData: TData | undefined,
	articlesData: Array<Partial<ArticleClass>> | undefined,
): Totals => {
	if (!rawData) return { totalHT: 0, totalTVA: 0, totalTTC: 0, totalTTCApresRemise: 0 };

	const hasAnyServerTotal =
		rawData.total_ht !== undefined ||
		rawData.total_ttc !== undefined ||
		rawData.total_tva !== undefined ||
		rawData.total_ttc_apres_remise !== undefined;

	if (hasAnyServerTotal) {
		const serverTotalHTRaw = rawData.total_ht !== undefined ? toNumber(rawData.total_ht, 0) : undefined;
		const serverTotalTTCRaw = rawData.total_ttc !== undefined ? toNumber(rawData.total_ttc, 0) : undefined;
		const serverTotalTVARaw = rawData.total_tva !== undefined ? toNumber(rawData.total_tva, 0) : undefined;
		const serverTotalTTCAfterRaw =
			rawData.total_ttc_apres_remise !== undefined ? toNumber(rawData.total_ttc_apres_remise, 0) : undefined;

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
					: serverTotalHT;

		const serverTotalTVA = serverTotalTVARaw !== undefined ? serverTotalTVARaw : serverTotalTTC - serverTotalHT;
		const serverTotalTTCAfter = serverTotalTTCAfterRaw !== undefined ? serverTotalTTCAfterRaw : serverTotalTTC;

		return {
			totalHT: Math.max(0, serverTotalHT),
			totalTVA: Math.max(0, serverTotalTVA),
			totalTTC: Math.max(0, serverTotalTTC),
			totalTTCApresRemise: Math.max(0, serverTotalTTCAfter),
		};
	}

	let rawTotalHT = 0;
	let rawTotalTVA = 0;

	(rawData.lignes || []).forEach((ligne) => {
		const articleId = toNumber(ligne.article, NaN);
		if (!Number.isFinite(articleId)) return;

		const article = articlesData?.find((a) => a.id === articleId);
		if (!article) return;

		const prixVente = toNumber(ligne.prix_vente, 0);
		const quantity = toNumber(ligne.quantity, 1);
		const baseHT = prixVente * (Number.isFinite(quantity) ? quantity : 1);

		let discountedHT = baseHT;

		const lineRemise = toNumber(ligne.remise, 0);
		const lineRemiseType = ligne.remise_type ?? null;

		if (lineRemise > 0 && lineRemiseType) {
			if (lineRemiseType === 'Pourcentage') discountedHT = baseHT * (1 - lineRemise / 100);
			if (lineRemiseType === 'Fixe') discountedHT = Math.max(0, baseHT - lineRemise);
		}

		const tvaRate = toNumber(article.tva, 0);
		const lineTVA = discountedHT * (tvaRate / 100);

		rawTotalHT += Number.isFinite(discountedHT) ? discountedHT : 0;
		rawTotalTVA += Number.isFinite(lineTVA) ? lineTVA : 0;
	});

	const rawTotalTTC = rawTotalHT + rawTotalTVA;

	let finalTotalHT = rawTotalHT;
	let finalTotalTVA = rawTotalTVA;

	const globalRemise = toNumber(rawData.remise, 0);
	const globalRemiseType = rawData.remise_type ?? null;

	if (globalRemise > 0 && globalRemiseType) {
		if (globalRemiseType === 'Pourcentage') finalTotalHT = rawTotalHT * (1 - globalRemise / 100);
		if (globalRemiseType === 'Fixe') finalTotalHT = Math.max(0, rawTotalHT - globalRemise);

		const ratio = rawTotalHT > 0 ? finalTotalHT / rawTotalHT : 0;
		finalTotalTVA = rawTotalTVA * ratio;
	}

	const finalTotalTTC = finalTotalHT + finalTotalTVA;

	return {
		totalHT: Math.max(0, rawTotalHT),
		totalTVA: Math.max(0, rawTotalTVA),
		totalTTC: Math.max(0, rawTotalTTC),
		totalTTCApresRemise: Math.max(0, finalTotalTTC),
	};
};

const CompanyDocumentsWrapperView = <TData extends CompanyDocumentData>({
	session,
	company_id,
	id,
	type,
	title,
	backLabel,
	backTo,
	editTo,
	documentNumberLabel,
	getDocumentNumber,
	documentDateLabel,
	getDocumentDateRaw,
	statusTitle,
	linesTitle,
	termsSecondLabel,
	getTermsSecondValue,
	query,
	headerActions,
	canEdit = true,
	extraDocumentRows = [],
	extraSections,
}: CompanyDocumentsViewProps<TData>) => {
	const token = useInitAccessToken(session);
	const companies = useAppSelector(getUserCompaniesState);
	const router = useRouter();
	const { t } = useLanguage();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const { data: rawData, isLoading, error } = query;

	const { data: rawArticlesData } = useGetArticlesListQuery(
		{ company_id, with_pagination: false, archived: false },
		{ skip: !token },
	);

	const articlesData = useMemo(() => {
		if (Array.isArray(rawArticlesData)) return rawArticlesData as Array<Partial<ArticleClass>>;
		return undefined;
	}, [rawArticlesData]);

	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const errorStatus = Number(axiosError?.status ?? 0);
	const documentErrorTitle =
		errorStatus === 404 ? t.common.documentNotFoundTitle : t.common.documentLoadErrorTitle;
	const documentErrorMessage = extractApiErrorMessage(axiosError, t.common.genericError);

	const company = useMemo(() => companies?.find((comp) => comp.id === company_id), [companies, company_id]);
	const isNectarCompany = isNectarRaisonSociale(company?.raison_sociale);

	const totals = useMemo(() => computeTotals(rawData, articlesData), [rawData, articlesData]);

	const linesColumns: GridColDef[] = useMemo(
		() => [
			{
				field: 'photo',
				headerName: t.documentView.colPhoto,
				flex: 0.5,
				minWidth: 60,
				renderCell: (params: GridRenderCellParams) => {
					const articleId = toNumber((params.row as { article?: unknown }).article, NaN);
					const article = Number.isFinite(articleId) ? articlesData?.find((a) => a.id === articleId) : undefined;

					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<DarkTooltip
								title={
									article?.photo ? (
										<Box
											sx={{
												width: 260,
												height: 260,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<Image
												src={String(article.photo)}
												alt={String(article.reference ?? '')}
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
								{article?.photo ? (
									<Box
										component="img"
										src={String(article.photo)}
										alt={article?.reference ? String(article.reference) : undefined}
										sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
									/>
								) : (
									<Box
										sx={{
											width: 40,
											height: 40,
											borderRadius: 1,
											backgroundColor: '#E0E0E0',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Inventory2Icon sx={{ fontSize: 20, color: '#9E9E9E' }} />
									</Box>
								)}
							</DarkTooltip>
						</Box>
					);
				},
				sortable: false,
				filterable: false,
			},
			{
				field: 'reference',
				headerName: t.documentView.colReference,
				flex: 0.8,
				minWidth: 90,
				renderCell: (params: GridRenderCellParams) => {
					const articleId = toNumber((params.row as { article?: unknown }).article, NaN);
					const article = Number.isFinite(articleId) ? articlesData?.find((a) => a.id === articleId) : undefined;
					const value = article?.reference ? String(article.reference) : '';
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
				headerName: t.documentView.colDesignation,
				flex: 1.4,
				minWidth: 120,
				renderCell: (params: GridRenderCellParams) => {
					const value = (params.row as { designation?: unknown }).designation;
					const label = value === null || value === undefined ? '' : String(value);
					return (
						<DarkTooltip title={label}>
							<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
								<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
									{label}
								</Typography>
							</Box>
						</DarkTooltip>
					);
				},
			},
			{
				field: 'marque',
				headerName: t.documentView.colMarque,
				flex: 1,
				minWidth: 100,
				renderCell: (params: GridRenderCellParams) => {
					const articleId = toNumber((params.row as { article?: unknown }).article, NaN);
					const article = Number.isFinite(articleId) ? articlesData?.find((a) => a.id === articleId) : undefined;
					const value = article?.marque_name ? String(article.marque_name) : '';
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
				headerName: t.documentView.colCategorie,
				flex: 1,
				minWidth: 100,
				renderCell: (params: GridRenderCellParams) => {
					const articleId = toNumber((params.row as { article?: unknown }).article, NaN);
					const article = Number.isFinite(articleId) ? articlesData?.find((a) => a.id === articleId) : undefined;
					const value = article?.categorie_name ? String(article.categorie_name) : '';
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
				headerName: t.documentView.colPrixAchat,
				flex: 1,
				minWidth: 110,
				renderCell: (params: GridRenderCellParams) => {
					const value =
						formatNumberWithSpaces(params.row.prix_achat ?? 0, 2) + ' ' + (params.row.devise_prix_achat || 'MAD');
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
				headerName: isNectarCompany ? t.documentForm.colPrixUnitaire : t.documentView.colPrixVente,
				flex: 1,
				minWidth: 110,
				renderCell: (params: GridRenderCellParams) => {
					const value =
						formatNumberWithSpaces(params.row.prix_vente ?? 0, 2) + ' ' + (params.row.devise_prix_vente || 'MAD');
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
				headerName: t.documentView.colQuantite,
				flex: 0.8,
				minWidth: 90,
				renderCell: (params: GridRenderCellParams) => {
					const raw = (params.row as { quantity?: unknown }).quantity;
					const value = raw === null || raw === undefined ? 1 : String(raw);
					const articleId = toNumber((params.row as { article?: unknown }).article, NaN);
					const article = Number.isFinite(articleId) ? articlesData?.find((a) => a.id === articleId) : undefined;
					const uniteName = article?.unite_name ? String(article.unite_name) : '';
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2">
								{value}
								{uniteName ? ` ${uniteName}` : ''}
							</Typography>
						</Box>
					);
				},
			},
			{
				field: 'taxes',
				headerName: t.documentForm.colTaxes,
				flex: 0.8,
				minWidth: 90,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams) => {
					const articleId = toNumber((params.row as { article?: unknown }).article, NaN);
					const article = Number.isFinite(articleId) ? articlesData?.find((a) => a.id === articleId) : undefined;
					const tvaRate = toNumber(article?.tva, 0);
					const value = `${formatNumberWithSpaces(tvaRate, 1)}%`;
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
				field: 'montant',
				headerName: t.documentForm.colMontant,
				flex: 1,
				minWidth: 120,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams) => {
					const row = params.row as {
						prix_vente?: unknown;
						quantity?: unknown;
						devise_prix_vente?: unknown;
					};
					const prixVente = toNumber(row.prix_vente, 0);
					const quantity = toNumber(row.quantity, 1);
					const amount = prixVente * (Number.isFinite(quantity) ? quantity : 1);
					const devise =
						row.devise_prix_vente === null || row.devise_prix_vente === undefined
							? 'MAD'
							: String(row.devise_prix_vente);
					const value = `${formatNumberWithSpaces(amount, 2)} ${devise}`;
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
				field: 'remise_type',
				headerName: t.documentView.colTypeRemise,
				flex: 0.8,
				minWidth: 90,
				renderCell: (params: GridRenderCellParams) => {
					const value = (params.row as { remise_type?: unknown }).remise_type;
					const label = value === null || value === undefined ? '' : String(value);
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2">{label || '-'}</Typography>
						</Box>
					);
				},
			},
			{
				field: 'remise',
				headerName: t.documentView.colRemise,
				flex: 0.8,
				minWidth: 90,
				renderCell: (params: GridRenderCellParams) => {
					const row = params.row as { remise?: unknown; remise_type?: unknown };
					const remise = toNumber(row.remise, 0);
					const remiseType = row.remise_type === null || row.remise_type === undefined ? '' : String(row.remise_type);
					const value = remise > 0 ? `${remise}${remiseType === 'Pourcentage' ? '%' : ' MAD'}` : '-';
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Typography variant="body2">{value}</Typography>
						</Box>
					);
				},
			},
		].filter((column) => {
			if (!isNectarCompany) return !['taxes', 'montant'].includes(column.field);
			return !['prix_achat', 'remise_type', 'remise'].includes(column.field);
		}),
		[articlesData, t, isNectarCompany],
	);

	const dateLabel = formatDate(getDocumentDateRaw(rawData) ?? null) || '-';

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '32px',
			}}
		>
			<NavigationBar title={title}>
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
					<Stack
						direction={isMobile ? 'column' : 'row'}
						spacing={2}
						sx={{
							justifyContent: 'space-between',
							alignItems: isMobile ? 'stretch' : 'center',
						}}
					>
						<Button
							variant="outlined"
							startIcon={<ArrowBackIcon />}
							onClick={() => router.push(backTo)}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							{backLabel}
						</Button>
						{!isLoading && !error && (
							<Stack
								direction="row"
								sx={{
									gap: 1,
									flexWrap: 'wrap',
								}}
							>
								{canEdit && (company?.role === 'Caissier' || company?.role === 'Commercial') && (
									<Button
										variant="outlined"
										size="small"
										startIcon={<EditIcon />}
										onClick={() => router.push(editTo(id, company_id))}
									>
										Modifier
									</Button>
								)}
								{headerActions}
							</Stack>
						)}
					</Stack>

					{isLoading ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : errorStatus > 400 ? (
						<DocumentErrorState
							title={documentErrorTitle}
							message={documentErrorMessage}
							helpText={t.common.documentErrorHelp}
							backLabel={backLabel}
							retryLabel={t.common.retry}
							onBack={() => router.push(backTo)}
							onRetry={() => router.refresh()}
						/>
					) : (
						<Stack spacing={3}>
							<FactureDevisTotalsCard
								totals={{
									totalHT: totals.totalHT,
									totalTVA: totals.totalTVA,
									totalTTC: totals.totalTTC,
									totalTTCApresRemise: totals.totalTTCApresRemise,
								}}
								devise={rawData?.devise ?? undefined}
								isMobile={isMobile}
								showDiscountTotal={!isNectarCompany}
							/>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<DescriptionIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.documentView.documentInfoSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<NumbersIcon />} label={documentNumberLabel} value={getDocumentNumber(rawData)} />
										<Divider />
										<InfoRow
											icon={<CalendarTodayIcon />}
											label={documentDateLabel}
											value={dateLabel.split(',')[0] || '-'}
										/>
										{isNectarCompany && (
											<>
												<Divider />
												<InfoRow
													icon={<CalendarTodayIcon />}
													label={t.documentForm.fieldDateEcheanceLabel}
													value={formatDate(rawData?.date_echeance ?? null)?.split(',')[0] || '-'}
												/>
											</>
										)}
										{extraDocumentRows.map((row, index) => (
											<React.Fragment key={`${row.label}-${index}`}>
												<Divider />
												<InfoRow icon={row.icon} label={row.label} value={row.getValue(rawData)} />
											</React.Fragment>
										))}
									</Stack>
								</CardContent>
							</Card>

							{extraSections}

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<DescriptionIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{statusTitle}
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

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<PersonIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											Client
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<InfoRow icon={<PersonIcon />} label={t.documentView.clientLabel} value={rawData?.client_name} />
								</CardContent>
							</Card>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<PaymentIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.documentView.paymentSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<PaymentIcon />}
											label={t.documentView.modePaiementLabel}
											value={rawData?.mode_paiement_name}
										/>
										<Divider />
										{type === 'bon-de-livraison' && (
											<>
												<InfoRow
													icon={<LocalShippingIcon />}
													label={t.documentView.livreParLabel}
													value={rawData?.livre_par_name}
												/>
												<Divider />
											</>
										)}
										<InfoRow icon={<ReceiptIcon />} label={termsSecondLabel} value={getTermsSecondValue(rawData)} />
									</Stack>
								</CardContent>
							</Card>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<ShoppingCartIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{linesTitle}
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Box sx={{ height: '100%' }}>
										<DataGrid
											rows={(rawData?.lignes || []).map((ligne, index) => ({ ...ligne, id: index }))}
											showToolbar={true}
											slotProps={{
												toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } },
											}}
											columns={linesColumns}
											localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
											disableRowSelectionOnClick
											pageSizeOptions={[5, 10, 25, 50, 100]}
											initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
										/>
									</Box>
								</CardContent>
							</Card>

							{isPositiveNumber(rawData?.remise) && rawData?.remise_type && (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction="row"
											spacing={2}
											sx={{
												alignItems: 'center',
												mb: 2,
											}}
										>
											<DiscountIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.documentView.remiseGlobaleSection}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<InfoRow
											icon={<DiscountIcon />}
											label={t.documentView.remiseAppliedLabel}
											value={`${toNumber(rawData?.remise, 0)}${rawData?.remise_type === 'Pourcentage' ? '%' : ' MAD'}`}
										/>
									</CardContent>
								</Card>
							)}

							{rawData?.remarque && !isNectarCompany && (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction="row"
											spacing={2}
											sx={{
												alignItems: 'center',
												mb: 2,
											}}
										>
											<NotesIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												Remarque
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<InfoRow icon={<NotesIcon />} label={t.documentView.remarqueLabel} value={rawData?.remarque} />
									</CardContent>
								</Card>
							)}

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<DescriptionIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.documentView.systemInfoSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<CalendarTodayIcon />}
											label={t.common.dateCreation}
											value={formatDate(rawData?.date_created ?? null)}
										/>
										<Divider />
										<InfoRow
											icon={<CalendarTodayIcon />}
											label={t.common.dateMaj}
											value={formatDate(rawData?.date_updated ?? null)}
										/>
										<Divider />
										<InfoRow
											icon={<PersonIcon />}
											label={t.documentView.createdByLabel}
											value={rawData?.created_by_user_name}
										/>
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

export default CompanyDocumentsWrapperView;
