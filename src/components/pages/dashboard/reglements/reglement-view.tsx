'use client';

import React, { useMemo, isValidElement } from 'react';
import {
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
	ArrowBack as ArrowBackIcon,
	Edit as EditIcon,
	Receipt as ReceiptIcon,
	Payment as PaymentIcon,
	CalendarToday as CalendarTodayIcon,
	AttachMoney as AttachMoneyIcon,
	Notes as NotesIcon,
	Info as InfoIcon,
} from '@mui/icons-material';
import Grid from '@mui/material/Grid';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { REGLEMENTS_LIST, REGLEMENTS_EDIT } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { useGetReglementQuery } from '@/store/services/reglement';
import { getAccessTokenFromSession } from '@/store/session';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import { useAppSelector } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { formatDate, formatPrice } from '@/utils/helpers';
import { getStatutColor } from '@/components/pages/dashboard/devis/devis-list';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue = React.isValidElement(value) ? value : value && value.toString().length > 0 ? value : '-';

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

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const ReglementViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const token = getAccessTokenFromSession(session);
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

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
			<NavigationBar title="Détails du règlement">
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
					<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
						<Button
							variant="outlined"
							startIcon={<ArrowBackIcon />}
							onClick={() => router.push(REGLEMENTS_LIST)}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							Liste des règlements
						</Button>
						{!isLoading && !error && company?.role === 'Admin' && reglement?.statut === 'Valide' && (
							<Button
								variant="contained"
								startIcon={<EditIcon />}
								onClick={() => router.push(REGLEMENTS_EDIT(id, company_id))}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								Modifier
							</Button>
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
										<Grid container spacing={2} alignItems="center" justifyContent={isMobile ? 'center' : 'space-between'}>
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
													<Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
														MONTANT FACTURE
													</Typography>
													<Typography variant="h6" fontWeight={800} color="text.secondary">
														{formatPrice(reglement?.montant_facture)}
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
													<Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
														TOTAL RÈGLEMENTS
													</Typography>
													<Typography variant="h6" fontWeight={800} color="success.main">
														{formatPrice(reglement?.total_reglements_facture)}
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
													<Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
														RESTE À PAYER
													</Typography>
													<Typography variant="h5" fontWeight={900} color="error.main">
														{formatPrice(reglement?.reste_a_payer)}
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
													<Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
														CE RÈGLEMENT
													</Typography>
													<Typography variant="h5" fontWeight={900} color="primary">
														{formatPrice(reglement?.montant)}
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
									<Stack direction="row" spacing={3} alignItems="center">
										<InfoIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
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
									<Stack direction="row" spacing={3} alignItems="center">
										<ReceiptIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Informations de la facture
										</Typography>
									</Stack>
									<Divider sx={{ my: 2 }} />
									<InfoRow
										icon={<ReceiptIcon fontSize="small" />}
										label="Numéro de facture"
										value={reglement?.facture_client_numero}
									/>
									<InfoRow
										icon={<InfoIcon fontSize="small" />}
										label="Client"
										value={reglement?.client_name}
									/>
								</CardContent>
							</Card>

							{/* Payment Details */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={3} alignItems="center">
										<PaymentIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Détails du règlement
										</Typography>
									</Stack>
									<Divider sx={{ my: 2 }} />
									<InfoRow
										icon={<PaymentIcon fontSize="small" />}
										label="Mode de règlement"
										value={reglement?.mode_reglement_name ?? '-'}
									/>
									<InfoRow
										icon={<AttachMoneyIcon fontSize="small" />}
										label="Montant"
										value={
											<Typography fontWeight={600} color="primary">
												{formatPrice(reglement?.montant)}
											</Typography>
										}
									/>
									<InfoRow
										icon={<NotesIcon fontSize="small" />}
										label="Libellé"
										value={reglement?.libelle || '-'}
									/>
								</CardContent>
							</Card>

							{/* Dates */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={3} alignItems="center">
										<CalendarTodayIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Dates
										</Typography>
									</Stack>
									<Divider sx={{ my: 2 }} />
									<InfoRow
										icon={<CalendarTodayIcon fontSize="small" />}
										label="Date de règlement"
										value={formatDate(reglement?.date_reglement ?? null)}
									/>
									<InfoRow
										icon={<CalendarTodayIcon fontSize="small" />}
										label="Date d'échéance"
										value={formatDate(reglement?.date_echeance ?? null)}
									/>
									<InfoRow
										icon={<CalendarTodayIcon fontSize="small" />}
										label="Date de création"
										value={formatDate(reglement?.date_created ?? null)}
									/>
									<InfoRow
										icon={<CalendarTodayIcon fontSize="small" />}
										label="Dernière mise à jour"
										value={formatDate(reglement?.date_updated ?? null)}
									/>
								</CardContent>
							</Card>
						</Stack>
					)}
				</Stack>
			</NavigationBar>
		</Stack>
	);
};

export default ReglementViewClient;
