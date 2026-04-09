'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetCompanyQuery, useSuspendCompanyMutation } from '@/store/services/company';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Paper,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	AccountBalance as AccountBalanceIcon,
	AccountBalanceWallet as AccountBalanceWalletIcon,
	AdminPanelSettings as AdminPanelSettingsIcon,
	ArrowBack as ArrowBackIcon,
	Badge as BadgeIcon,
	Business as BusinessIcon,
	CalendarToday as CalendarTodayIcon,
	ContactPhone as ContactPhoneIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	Fax as FaxIcon,
	Fingerprint as FingerprintIcon,
	Gavel as GavelIcon,
	Language as LanguageIcon,
	LocationOn as LocationOnIcon,
	PauseCircle as PauseIcon,
	People as PeopleIcon,
	Person as PersonIcon,
	PersonPin as PersonPinIcon,
	Phone as PhoneIcon,
	PhoneAndroid as PhoneAndroidIcon,
	Public as PublicIcon,
	Receipt as ReceiptIcon,
	Verified as StampIcon,
} from '@mui/icons-material';
import { COMPANIES_EDIT, COMPANIES_LIST } from '@/utils/routes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { Protected } from '@/components/layouts/protected/protected';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { formatDate } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const displayValue = isValidElement(value) ? value : value && value.toString().length > 1 ? value : '-';

	return (
		<Stack
			direction="row"
			sx={{
				alignItems: 'center',
				py: 1.5,
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
			{/* Label + Value */}
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
	id: number;
}

const CompaniesViewClient: React.FC<Props> = ({ session, id }) => {
	const router = useRouter();
	const token = useInitAccessToken(session);
	const { data: companyData, isLoading, error } = useGetCompanyQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const [suspendRecord] = useSuspendCompanyMutation();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const [showSuspendModal, setShowSuspendModal] = useState(false);

	const handleSuspend = async () => {
		try {
			await suspendRecord({ id }).unwrap();
			onSuccess(t.companies.suspendSuccess);
			router.push(COMPANIES_LIST);
		} catch {
			onError(t.companies.suspendError);
		} finally {
			setShowSuspendModal(false);
		}
	};

	const suspendModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowSuspendModal(false),
			icon: <ArrowBackIcon />,
			color: '#6B6B6B',
		},
		{
			text: t.companies.suspendBtn,
			active: true,
			onClick: handleSuspend,
			icon: <PauseIcon />,
			color: '#D32F2F',
		},
	];

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '32px',
			}}
		>
			<NavigationBar title={t.companies.detailsTitle}>
				<Protected>
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
								onClick={() => router.push(COMPANIES_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								{t.companies.backToList}
							</Button>
							{!isLoading && !error && (
								<Stack
									direction="row"
									sx={{
										gap: 1,
										flexWrap: 'wrap',
									}}
								>
									<Button
										variant="outlined"
										size="small"
										startIcon={<EditIcon />}
										onClick={() => router.push(COMPANIES_EDIT(id))}
									>
										Modifier
									</Button>
									<Button
										variant="outlined"
										color="error"
										size="small"
										startIcon={<PauseIcon />}
										onClick={() => setShowSuspendModal(true)}
									>
										Suspendre
									</Button>
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
								{/* Header Card with Logo and Company Name */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction={isMobile ? 'column' : 'row'}
											spacing={3}
											sx={{
												alignItems: isMobile ? 'center' : 'flex-start',
											}}
										>
											<Avatar
												src={`${companyData?.logo_cropped}`}
												alt={t.companies.logoLabel}
												sx={{
													width: isMobile ? 100 : 120,
													height: isMobile ? 100 : 120,
													border: '4px solid',
													borderColor: 'primary.light',
													boxShadow: 3,
													'& img': {
														objectFit: 'contain',
													},
												}}
											/>
											<Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
												<Stack
													spacing={1}
													sx={{
														alignItems: isMobile ? 'center' : 'flex-start',
													}}
												>
													<Typography
														variant="h4"
														sx={{
															textAlign: isMobile ? 'center' : 'inherit',
															fontSize: isMobile ? '20px' : '25px',
															fontWeight: 700,
														}}
													>
														{companyData?.raison_sociale ?? "Nom de l'entreprise"}
													</Typography>
													<Stack
														direction="row"
														spacing={1}
														sx={{
															alignItems: 'center',
															flexWrap: 'wrap',
														}}
													>
														<Chip
															icon={<BadgeIcon />}
															label={`ICE: ${companyData?.id ?? '-'}`}
															size="small"
															variant="outlined"
														/>
														<Chip
															icon={<BusinessIcon />}
															label={t.companies.companyChip}
															color="primary"
															size="small"
														/>
													</Stack>
												</Stack>
											</Stack>
										</Stack>
									</CardContent>
								</Card>

								{/* Stamp Card */}
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
											<StampIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.companies.stampSection}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 3 }} />
										<Stack
											direction={isMobile ? 'column' : 'row'}
											spacing={3}
											sx={{
												alignItems: isMobile ? 'center' : 'flex-start',
											}}
										>
											<Avatar
												variant="square"
												src={`${companyData?.cachet_cropped}`}
												sx={{
													width: isMobile ? 100 : 120,
													height: isMobile ? 100 : 120,
													border: '4px solid',
													borderColor: 'primary.light',
													boxShadow: 3,
													'& img': {
														objectFit: 'contain',
													},
												}}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* General Information Card */}
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
											<PublicIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.companies.generalSection}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.common.dateCreation}
												value={formatDate(companyData?.date_created ?? null)}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.common.dateMaj}
												value={formatDate(companyData?.date_updated ?? null)}
											/>
											<Divider />
											<InfoRow
												icon={<PeopleIcon />}
												label={t.companies.fieldNbrEmploye}
												value={companyData?.nbr_employe}
											/>
											<Divider />
											<InfoRow
												icon={<LocationOnIcon />}
												label={t.companies.fieldAdresse}
												value={companyData?.adresse}
											/>
											<Divider />
											<InfoRow icon={<LanguageIcon />} label={t.companies.fieldSiteWeb} value={companyData?.site_web} />
										</Stack>
									</CardContent>
								</Card>

								{/* Administrative Information Card */}
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
											<AdminPanelSettingsIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.companies.adminSection}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<AccountBalanceIcon />}
												label={t.companies.fieldNumeroCompte}
												value={companyData?.numero_du_compte}
											/>
											<Divider />
											<InfoRow icon={<FingerprintIcon />} label={t.companies.fieldICE} value={companyData?.ICE} />
											<Divider />
											<InfoRow
												icon={<GavelIcon />}
												label={t.companies.fieldRegistreCommerce}
												value={companyData?.registre_de_commerce}
											/>
											<Divider />
											<InfoRow
												icon={<ReceiptIcon />}
												label={t.companies.fieldIdentifiantFiscal}
												value={companyData?.identifiant_fiscal}
											/>
											<Divider />
											<InfoRow
												icon={<AccountBalanceWalletIcon />}
												label={t.companies.fieldTaxeProfessionnelle}
												value={companyData?.tax_professionnelle}
											/>
											<Divider />
											<InfoRow icon={<BadgeIcon />} label={t.companies.fieldCNSS} value={companyData?.CNSS} />
										</Stack>
									</CardContent>
								</Card>

								{/* Responsible Person Card */}
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
											<PersonPinIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												Responsable
											</Typography>
										</Stack>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<PersonIcon />}
												label={t.companies.fieldCivilite}
												value={companyData?.civilite_responsable}
											/>
											<Divider />
											<InfoRow
												icon={<PersonIcon />}
												label={t.companies.fieldNomResponsable}
												value={companyData?.nom_responsable}
											/>
											<Divider />
											<InfoRow
												icon={<PhoneAndroidIcon />}
												label={t.companies.fieldGsmResponsable}
												value={companyData?.gsm_responsable}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* Contact Information Card */}
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
											<ContactPhoneIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												Contact
											</Typography>
										</Stack>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={0}>
											<InfoRow icon={<EmailIcon />} label={t.companies.fieldEmail} value={companyData?.email} />
											<Divider />
											<InfoRow icon={<PhoneIcon />} label={t.companies.fieldTelephone} value={companyData?.telephone} />
											<Divider />
											<InfoRow icon={<FaxIcon />} label={t.companies.fieldFax} value={companyData?.fax} />
										</Stack>
									</CardContent>
								</Card>

								{/* Managers Card */}
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
											<AdminPanelSettingsIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.companies.managersSection}{' '}
												{companyData?.admins?.length ? `(${companyData.admins.length})` : ''}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 2 }} />
										{companyData?.admins?.length ? (
											<Stack spacing={2}>
												{companyData.admins.map((manager, index) => (
													<Paper
														key={manager.id ?? index}
														elevation={0}
														sx={{
															p: 2,
															backgroundColor: 'grey.50',
															borderRadius: 2,
															border: '1px solid',
															borderColor: 'grey.200',
															'&:hover': {
																backgroundColor: 'grey.100',
																borderColor: 'primary.main',
																transition: 'all 0.3s ease',
															},
														}}
													>
														<Stack
															direction={isMobile ? 'column' : 'row'}
															spacing={2}
															sx={{
																justifyContent: 'space-between',
																alignItems: isMobile ? 'flex-start' : 'center',
															}}
														>
															<Stack
																direction="row"
																spacing={2}
																sx={{
																	alignItems: 'center',
																}}
															>
																<Avatar
																	sx={{
																		bgcolor: 'primary.main',
																		width: 40,
																		height: 40,
																	}}
																>
																	<PersonIcon />
																</Avatar>
																<Stack>
																	<Typography
																		variant="body1"
																		sx={{
																			fontWeight: 600,
																		}}
																	>
																		{`${manager.first_name ?? ''} ${manager.last_name ?? ''}`.trim() ||
																			`Utilisateur ${manager.id}`}
																	</Typography>
																	{manager.id && (
																		<Typography
																			variant="caption"
																			sx={{
																				color: 'text.secondary',
																			}}
																		>
																			ID: {manager.id}
																		</Typography>
																	)}
																</Stack>
															</Stack>
															{manager.role && (
																<Chip label={manager.role} color="primary" variant="outlined" size="small" />
															)}
														</Stack>
													</Paper>
												))}
											</Stack>
										) : (
											<Paper
												elevation={0}
												sx={{
													p: 3,
													backgroundColor: 'grey.50',
													borderRadius: 2,
													textAlign: 'center',
												}}
											>
												<Typography
													sx={{
														color: 'text.secondary',
													}}
												>
													{t.companies.noManager}
												</Typography>
											</Paper>
										)}
									</CardContent>
								</Card>
							</Stack>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
			{showSuspendModal && (
				<ActionModals
					title={t.companies.suspendModalTitle}
					body={t.companies.suspendModalBody}
					actions={suspendModalActions}
					titleIcon={<PauseIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default CompaniesViewClient;
