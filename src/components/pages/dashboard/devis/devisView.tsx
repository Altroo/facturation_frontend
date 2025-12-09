'use client';

import React, { useMemo, isValidElement } from 'react';
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
import { ArticleClass } from '@/models/Classes';
import { useGetArticlesListQuery } from '@/store/services/article';
import { formatDate } from '@/utils/helpers';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue = React.isValidElement(value) ? value : value && value.toString().length > 1 ? value : '-';

	return (
		<Stack
			direction="row"
			alignItems="flex-start"
			spacing={2}
			sx={{
				py: 1.5,
				flexWrap: 'wrap',
			}}
		>
			<Box
				sx={{
					color: 'primary.main',
					display: 'flex',
					alignItems: 'center',
					minWidth: 40,
				}}
			>
				{icon}
			</Box>

			<Stack
				direction="row"
				alignItems="center"
				spacing={isMobile ? 0 : 2}
				sx={{
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					fontWeight={600}
					color="text.secondary"
					sx={{
						minWidth: { xs: '100%', sm: 200 },
						wordBreak: 'break-word',
					}}
				>
					{label}
				</Typography>

				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? (
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

	const { data: devis, isLoading, error } = useGetDeviQuery({ id }, { skip: !token });
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
		if (!devis) return { totalHT: 0, totalTVA: 0, totalTTC: 0 };

		let totalHT = 0;
		let totalTVA = 0;

		(devis.lignes || []).forEach((ligne) => {
			const article = articlesData?.find((a) => a.id === ligne.article);
			if (!article) return;

			const basePrice = ligne.prix_vente * ligne.quantity;
			const tvaRate = article.tva || 20;
			const lineTVA = basePrice * (tvaRate / 100);
			const lineTotalWithTVA = basePrice + lineTVA;

			// Apply line remise after TVA
			let finalLineTotal = lineTotalWithTVA;
			if (ligne.remise && ligne.remise > 0 && ligne.remise_type) {
				if (ligne.remise_type === 'Pourcentage') {
					finalLineTotal -= lineTotalWithTVA * (ligne.remise / 100);
				} else if (ligne.remise_type === 'Fixe') {
					finalLineTotal -= ligne.remise;
				}
			}

			// Back-calculate HT and TVA from final total
			const finalHT = finalLineTotal / (1 + tvaRate / 100);
			const finalTVA = finalLineTotal - finalHT;

			totalHT += finalHT;
			totalTVA += finalTVA;
		});

		let finalTotalHT = totalHT;
		let finalTotalTVA = totalTVA;
		let finalTotalTTC = totalHT + totalTVA;

		// Apply global remise
		if (devis.remise && devis.remise > 0 && devis.remise_type) {
			if (devis.remise_type === 'Pourcentage') {
				const remiseAmount = finalTotalTTC * (devis.remise / 100);
				finalTotalTTC -= remiseAmount;
				const ratio = finalTotalTTC / (totalHT + totalTVA);
				finalTotalHT = totalHT * ratio;
				finalTotalTVA = totalTVA * ratio;
			} else if (devis.remise_type === 'Fixe') {
				finalTotalTTC -= devis.remise;
				const ratio = finalTotalTTC / (totalHT + totalTVA);
				finalTotalHT = totalHT * ratio;
				finalTotalTVA = totalTVA * ratio;
			}
		}

		return {
			totalHT: Math.max(0, finalTotalHT),
			totalTVA: Math.max(0, finalTotalTVA),
			totalTTC: Math.max(0, finalTotalTTC),
		};
	}, [devis, articlesData]);

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
							<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%', color: 'grey.500' }}>
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

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
			<NavigationBar title="Détails du devis">
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
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
							<Card elevation={3} sx={{ borderRadius: 2, bgcolor: 'primary.50' }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction={isMobile ? 'column' : 'row'}
										spacing={isMobile ? 2 : 4}
										alignItems="center"
										justifyContent="space-between"
										divider={isMobile ? <Divider /> : <Divider orientation="vertical" flexItem />}
									>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												alignItems: isMobile ? 'flex-start' : 'center',
												minWidth: 120,
											}}
										>
											<Typography variant="subtitle2" fontWeight={600}>
												TOTAL HT
											</Typography>
											<Typography variant="h6" fontWeight={800} color="text.secondary">
												{totals.totalHT.toFixed(2)} MAD
											</Typography>
										</Box>

										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												alignItems: isMobile ? 'flex-start' : 'center',
												minWidth: 120,
											}}
										>
											<Typography variant="subtitle2" fontWeight={600}>
												TOTAL TVA
											</Typography>
											<Typography variant="h6" fontWeight={800} color="text.secondary">
												{totals.totalTVA.toFixed(2)} MAD
											</Typography>
										</Box>

										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												alignItems: isMobile ? 'flex-start' : 'center',
												minWidth: 140,
											}}
										>
											<Typography variant="subtitle2" fontWeight={600}>
												TOTAL TTC
											</Typography>
											<Typography variant="h5" fontWeight={900} color="primary">
												{totals.totalTTC.toFixed(2)} MAD
											</Typography>
										</Box>
									</Stack>
								</CardContent>
							</Card>

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
										<InfoRow icon={<NumbersIcon />} label="Numéro du devis" value={devis?.numero_devis} />
										<Divider />
										<InfoRow
											icon={<CalendarTodayIcon />}
											label="Date du devis"
											value={formatDate(devis?.date_devis as string | null).split(',')[0]}
										/>
									</Stack>
								</CardContent>
							</Card>

							{/* Statut du devis */}
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
										<Chip label={devis?.statut || '-'} color={getStatutColor(devis?.statut || '')} variant="outlined" />
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
									<InfoRow icon={<PersonIcon />} label="Client" value={devis?.client_name} />
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
										<InfoRow icon={<PaymentIcon />} label="Mode de paiement" value={devis?.mode_paiement_name} />
										<Divider />
										<InfoRow
											icon={<ReceiptIcon />}
											label="Numéro demande prix client"
											value={devis?.numero_demande_prix_client}
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
									<Box sx={{ height: 500 }}>
										<DataGrid
											rows={(devis?.lignes || []).map((ligne, index) => ({
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
							{devis?.remise && devis?.remise > 0 && (
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
											value={`${devis.remise}${devis.remise_type === 'Pourcentage' ? '%' : ' MAD'}`}
										/>
									</CardContent>
								</Card>
							)}

							{/* Remark */}
							{devis?.remarque && (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<NotesIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Remarque
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<InfoRow icon={<NotesIcon />} label="Remarque" value={devis?.remarque} />
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
											value={formatDate(devis?.date_created as string | null)}
										/>
										<Divider />
										<InfoRow
											icon={<CalendarTodayIcon />}
											label="Dernière modification"
											value={formatDate(devis?.date_updated as string | null)}
										/>
										<Divider />
										<InfoRow icon={<PersonIcon />} label="Créé par" value={devis?.created_by_user_name} />
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
