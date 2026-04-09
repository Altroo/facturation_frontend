'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import {
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
	AttachMoney as AttachMoneyIcon,
	CalendarToday as CalendarTodayIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Info as InfoIcon,
	Notes as NotesIcon,
	Payment as PaymentIcon,
	PictureAsPdf as PictureAsPdfIcon,
	Receipt as ReceiptIcon,
} from '@mui/icons-material';
import Grid from '@mui/material/Grid';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { REGLEMENT_PDF, REGLEMENTS_EDIT, REGLEMENTS_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { useDeleteReglementMutation, useGetReglementQuery } from '@/store/services/reglement';
import { useInitAccessToken } from '@/contexts/InitContext';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { getStatutColor } from '@/components/pages/dashboard/devis/devis-list';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { fetchPdfBlob } from '@/utils/apiHelpers';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue =
		React.isValidElement(value) || (value !== null && value !== undefined && value.toString().length > 0) ? value : '-';

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
			{/* Icon */}
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

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const ReglementViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const token = useInitAccessToken(session);
	const companies = useAppSelector(getUserCompaniesState);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const { data: reglement, isLoading, error } = useGetReglementQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const company = useMemo(() => {
		return companies?.find((comp) => comp.id === company_id);
	}, [companies, company_id]);

	const [deleteRecord] = useDeleteReglementMutation();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showLanguageModal, setShowLanguageModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess(t.reglements.deleteSuccess);
			router.push(REGLEMENTS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.reglements.deleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <ArrowBackIcon />,
			color: '#6B6B6B',
		},
		{
			text: t.common.delete,
			active: true,
			onClick: handleDelete,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	const handleLanguageSelect = async (language: 'fr' | 'en') => {
		setShowLanguageModal(false);
		if (!token) {
			onError(t.errors.authRequired);
			return;
		}
		try {
			const url = REGLEMENT_PDF(id, company_id, language);
			const blob = await fetchPdfBlob(url, token);
			const blobUrl = window.URL.createObjectURL(blob);
			window.open(blobUrl, '_blank');
			setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
		} catch {
			onError(t.errors.documentOpenError);
		}
	};

	const handleLanguageModalClose = () => {
		setShowLanguageModal(false);
	};

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '32px',
			}}
		>
			<NavigationBar title={t.reglements.detailsTitle}>
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
							onClick={() => router.push(REGLEMENTS_LIST)}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							{t.reglements.backToList}
						</Button>
						{!isLoading && !error && (
							<Stack
								direction="row"
								sx={{
									gap: 1,
									flexWrap: 'wrap',
								}}
							>
								{(company?.role === 'Caissier' || company?.role === 'Comptable' || company?.role === 'Commercial') && (
									<Button
										variant="outlined"
										color="error"
										size="small"
										startIcon={<PictureAsPdfIcon />}
										onClick={() => setShowLanguageModal(true)}
									>
										PDF
									</Button>
								)}
								{company?.role === 'Caissier' && reglement?.statut === 'Valide' && (
									<Button
										variant="outlined"
										size="small"
										startIcon={<EditIcon />}
										onClick={() => router.push(REGLEMENTS_EDIT(id, company_id))}
									>
										Modifier
									</Button>
								)}
								{company?.role === 'Caissier' && (
									<Button
										variant="outlined"
										color="error"
										size="small"
										startIcon={<DeleteIcon />}
										onClick={() => setShowDeleteModal(true)}
									>
										{t.common.delete}
									</Button>
								)}
							</Stack>
						)}
					</Stack>

					{isLoading ? (
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
							{/* Financial Summary Card - at top like other views */}
							{reglement?.montant_facture !== undefined && (
								<Card elevation={3} sx={{ borderRadius: 2, bgcolor: 'primary.50' }}>
									<CardContent sx={{ p: 3 }}>
										<Grid
											container
											spacing={2}
											sx={{
												alignItems: 'center',
												justifyContent: isMobile ? 'center' : 'space-between',
											}}
										>
											<Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
												<Box
													sx={{
														display: 'flex',
														flexDirection: 'column',
														alignItems: 'center',
														justifyContent: 'center',
														textAlign: 'center',
														px: 1,
													}}
												>
													<Typography
														variant="subtitle2"
														sx={{
															fontWeight: 600,
															color: 'text.secondary',
															mb: 0.5,
														}}
													>
														MONTANT FACTURE
													</Typography>
													<Typography
														variant="h6"
														sx={{
															fontWeight: 800,
															color: 'text.secondary',
														}}
													>
														{reglement?.montant_facture !== null
															? `${formatNumber(reglement.montant_facture)} ${reglement.devise}`
															: '-'}
													</Typography>
												</Box>
											</Grid>
											<Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
												<Box
													sx={{
														display: 'flex',
														flexDirection: 'column',
														alignItems: 'center',
														justifyContent: 'center',
														textAlign: 'center',
														px: 1,
													}}
												>
													<Typography
														variant="subtitle2"
														sx={{
															fontWeight: 600,
															color: 'text.secondary',
															mb: 0.5,
														}}
													>
														{t.reglements.totalReglements.toUpperCase()}
													</Typography>
													<Typography
														variant="h6"
														sx={{
															fontWeight: 800,
															color: 'success.main',
														}}
													>
														{reglement?.total_reglements_facture !== undefined &&
														reglement?.total_reglements_facture !== null
															? `${formatNumber(reglement.total_reglements_facture)} ${reglement.devise}`
															: '-'}
													</Typography>
												</Box>
											</Grid>
											<Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
												<Box
													sx={{
														display: 'flex',
														flexDirection: 'column',
														alignItems: 'center',
														justifyContent: 'center',
														textAlign: 'center',
														px: 1,
													}}
												>
													<Typography
														variant="subtitle2"
														sx={{
															fontWeight: 600,
															color: 'text.secondary',
															mb: 0.5,
														}}
													>
														{t.reglements.resteAPayer.toUpperCase()}
													</Typography>
													<Typography
														variant="h5"
														sx={{
															fontWeight: 900,
															color: 'error.main',
														}}
													>
														{reglement?.reste_a_payer !== undefined
															? `${formatNumber(reglement.reste_a_payer)} ${reglement.devise}`
															: '-'}
													</Typography>
												</Box>
											</Grid>
											<Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
												<Box
													sx={{
														display: 'flex',
														flexDirection: 'column',
														alignItems: 'center',
														justifyContent: 'center',
														textAlign: 'center',
														px: 1,
													}}
												>
													<Typography
														variant="subtitle2"
														sx={{
															fontWeight: 600,
															color: 'text.secondary',
															mb: 0.5,
														}}
													>
														{t.reglements.ceReglement}
													</Typography>
													<Typography
														variant="h5"
														color="primary"
														sx={{
															fontWeight: 900,
														}}
													>
														{reglement?.montant !== undefined && reglement?.montant !== null
															? `${formatNumber(reglement.montant)} ${reglement.devise}`
															: '-'}
													</Typography>
												</Box>
											</Grid>
										</Grid>
									</CardContent>
								</Card>
							)}

							{/* Status Card */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={3}
										sx={{
											alignItems: 'center',
										}}
									>
										<InfoIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											Statut
										</Typography>
									</Stack>
									<Divider sx={{ my: 2 }} />
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
										<Chip
											label={reglement?.statut}
											size="medium"
											color={getStatutColor(reglement?.statut ?? '')}
											variant="outlined"
											sx={{ fontSize: '1rem', py: 2 }}
										/>
									</Box>
								</CardContent>
							</Card>

							{/* Facture Information */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={3}
										sx={{
											alignItems: 'center',
										}}
									>
										<ReceiptIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.reglements.infoFacture}
										</Typography>
									</Stack>
									<Divider sx={{ my: 2 }} />
									<InfoRow
										icon={<ReceiptIcon fontSize="small" />}
										label={t.reglements.fieldFactureClient}
										value={reglement?.facture_client_numero}
									/>
									<InfoRow
										icon={<InfoIcon fontSize="small" />}
										label={t.reglements.labelClient}
										value={reglement?.client_name}
									/>
								</CardContent>
							</Card>

							{/* Payment Details */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={3}
										sx={{
											alignItems: 'center',
										}}
									>
										<PaymentIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.reglements.detailsReglement}
										</Typography>
									</Stack>
									<Divider sx={{ my: 2 }} />
									<InfoRow
										icon={<PaymentIcon fontSize="small" />}
										label={t.reglements.fieldModeReglement}
										value={reglement?.mode_reglement_name ?? '-'}
									/>
									<InfoRow
										icon={<AttachMoneyIcon fontSize="small" />}
										label={t.reglements.colMontant}
										value={
											<Typography
												color="primary"
												sx={{
													fontWeight: 600,
												}}
											>
												{reglement?.montant ? `${formatNumber(reglement.montant)} ${reglement.devise}` : '-'}
											</Typography>
										}
									/>
									<InfoRow
										icon={<NotesIcon fontSize="small" />}
										label={t.reglements.fieldLibelle}
										value={reglement?.libelle || '-'}
									/>
								</CardContent>
							</Card>

							{/* Dates */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={3}
										sx={{
											alignItems: 'center',
										}}
									>
										<CalendarTodayIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											Dates
										</Typography>
									</Stack>
									<Divider sx={{ my: 2 }} />
									<InfoRow
										icon={<CalendarTodayIcon fontSize="small" />}
										label={t.reglements.fieldDateReglement}
										value={formatDate(reglement?.date_reglement ?? null)}
									/>
									<InfoRow
										icon={<CalendarTodayIcon fontSize="small" />}
										label={t.reglements.fieldDateEcheance}
										value={formatDate(reglement?.date_echeance ?? null)}
									/>
									<InfoRow
										icon={<CalendarTodayIcon fontSize="small" />}
										label={t.common.dateCreation}
										value={formatDate(reglement?.date_created ?? null)}
									/>
									<InfoRow
										icon={<CalendarTodayIcon fontSize="small" />}
										label={t.common.dateMaj}
										value={formatDate(reglement?.date_updated ?? null)}
									/>
								</CardContent>
							</Card>
						</Stack>
					)}
				</Stack>
			</NavigationBar>
			{showLanguageModal && (
				<PdfLanguageModal onSelectLanguage={handleLanguageSelect} onClose={handleLanguageModalClose} />
			)}
			{showDeleteModal && (
				<ActionModals
					title={t.reglements.deleteModalTitle}
					body={t.reglements.deleteModalBody}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default ReglementViewClient;
