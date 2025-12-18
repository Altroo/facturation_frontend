'use client';

import React, { useMemo, isValidElement } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import { useGetCompanyQuery } from '@/store/services/company';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Stack,
	Typography,
	Avatar,
	Chip,
	useTheme,
	useMediaQuery,
	Button,
	Card,
	CardContent,
	Divider,
	Box,
	Paper,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Person as PersonIcon,
	Edit as EditIcon,
	Business as BusinessIcon,
	CalendarToday as CalendarTodayIcon,
	People as PeopleIcon,
	LocationOn as LocationOnIcon,
	Language as LanguageIcon,
	AccountBalance as AccountBalanceIcon,
	Receipt as ReceiptIcon,
	Badge as BadgeIcon,
	Fingerprint as FingerprintIcon,
	Gavel as GavelIcon,
	AccountBalanceWallet as AccountBalanceWalletIcon,
	Email as EmailIcon,
	Phone as PhoneIcon,
	Fax as FaxIcon,
	PhoneAndroid as PhoneAndroidIcon,
	PersonPin as PersonPinIcon,
	AdminPanelSettings as AdminPanelSettingsIcon,
	Verified as StampIcon,
} from '@mui/icons-material';
import { COMPANIES_LIST, COMPANIES_EDIT } from '@/utils/routes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import Image from 'next/image';
import { Protected } from '@/components/layouts/protected/protected';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';

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
		<Stack direction="row" alignItems="center" sx={{ py: 1.5 }}>
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
	id: number;
}

const CompaniesViewClient: React.FC<Props> = ({ session, id }) => {
	const router = useRouter();
	const token = getAccessTokenFromSession(session);
	const { data: companyData, isLoading, error } = useGetCompanyQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
			<NavigationBar title="Détails de l'entreprise">
				<Protected>
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
							<Button
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(COMPANIES_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								Liste des entreprises
							</Button>
							{!isLoading && !error && (
								<Button
									variant="contained"
									startIcon={<EditIcon />}
									onClick={() => router.push(COMPANIES_EDIT(id))}
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
								{/* Header Card with Logo and Company Name */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction={isMobile ? 'column' : 'row'}
											spacing={3}
											alignItems={isMobile ? 'center' : 'flex-start'}
										>
											<Avatar
												src={`${companyData?.logo_cropped}`}
												sx={{
													width: isMobile ? 100 : 120,
													height: isMobile ? 100 : 120,
													border: '4px solid',
													borderColor: 'primary.light',
													boxShadow: 3,
												}}
											/>
											<Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
												<Stack spacing={1} alignItems={isMobile ? 'center' : 'flex-start'}>
													<Typography
														variant="h4"
														textAlign={isMobile ? 'center' : 'inherit'}
														fontSize={isMobile ? '20px' : '25px'}
														fontWeight={700}
													>
														{companyData?.raison_sociale ?? "Nom de l'entreprise"}
													</Typography>
													<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
														<Chip
															icon={<BadgeIcon />}
															label={`ID: ${companyData?.id}`}
															size="small"
															variant="outlined"
														/>
														<Chip icon={<BusinessIcon />} label="Entreprise" color="primary" size="small" />
													</Stack>
												</Stack>
											</Stack>
										</Stack>
									</CardContent>
								</Card>

								{/* Stamp Card */}
								{companyData?.cachet_cropped && (
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<StampIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>
													Cachet de l&#39;entreprise
												</Typography>
											</Stack>
											<Divider sx={{ mb: 3 }} />
											<Box
												sx={{
													display: 'flex',
													justifyContent: 'center',
													p: 2,
													backgroundColor: 'grey.50',
													borderRadius: 2,
												}}
											>
												<Image
													alt="Cachet de l'entreprise"
													loading="eager"
													width={360}
													height={250}
													src={`${companyData.cachet_cropped}`}
													style={{ objectFit: 'contain' }}
												/>
											</Box>
										</CardContent>
									</Card>
								)}

								{/* General Information Card */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
											Informations générales
										</Typography>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<CalendarTodayIcon />}
												label="Date de création"
												value={companyData?.date_created}
											/>
											<Divider />
											<InfoRow icon={<PeopleIcon />} label="Nombre d'employés" value={companyData?.nbr_employe} />
											<Divider />
											<InfoRow icon={<LocationOnIcon />} label="Adresse" value={companyData?.adresse} />
											<Divider />
											<InfoRow icon={<LanguageIcon />} label="Site web" value={companyData?.site_web} />
										</Stack>
									</CardContent>
								</Card>

								{/* Administrative Information Card */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
											Informations administratives
										</Typography>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<AccountBalanceIcon />}
												label="Numéro du compte"
												value={companyData?.numero_du_compte}
											/>
											<Divider />
											<InfoRow icon={<FingerprintIcon />} label="ICE" value={companyData?.ICE} />
											<Divider />
											<InfoRow
												icon={<GavelIcon />}
												label="Registre de commerce"
												value={companyData?.registre_de_commerce}
											/>
											<Divider />
											<InfoRow
												icon={<ReceiptIcon />}
												label="Identifiant fiscal"
												value={companyData?.identifiant_fiscal}
											/>
											<Divider />
											<InfoRow
												icon={<AccountBalanceWalletIcon />}
												label="Taxe professionnelle"
												value={companyData?.tax_professionnelle}
											/>
											<Divider />
											<InfoRow icon={<BadgeIcon />} label="CNSS" value={companyData?.CNSS} />
										</Stack>
									</CardContent>
								</Card>

								{/* Responsible Person Card */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<PersonPinIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Responsable
											</Typography>
										</Stack>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={0}>
											<InfoRow icon={<PersonIcon />} label="Civilité" value={companyData?.civilite_responsable} />
											<Divider />
											<InfoRow icon={<PersonIcon />} label="Nom" value={companyData?.nom_responsable} />
											<Divider />
											<InfoRow icon={<PhoneAndroidIcon />} label="GSM" value={companyData?.gsm_responsable} />
										</Stack>
									</CardContent>
								</Card>

								{/* Contact Information Card */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
											Contact
										</Typography>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={0}>
											<InfoRow icon={<EmailIcon />} label="Email" value={companyData?.email} />
											<Divider />
											<InfoRow icon={<PhoneIcon />} label="Téléphone" value={companyData?.telephone} />
											<Divider />
											<InfoRow icon={<FaxIcon />} label="Fax" value={companyData?.fax} />
										</Stack>
									</CardContent>
								</Card>

								{/* Managers Card */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<AdminPanelSettingsIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Gestionnaires {companyData?.admins?.length ? `(${companyData.admins.length})` : ''}
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
															justifyContent="space-between"
															alignItems={isMobile ? 'flex-start' : 'center'}
															spacing={2}
														>
															<Stack direction="row" spacing={2} alignItems="center">
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
																	<Typography fontWeight={600} variant="body1">
																		{`${manager.first_name ?? ''} ${manager.last_name ?? ''}`.trim() ||
																			`Utilisateur ${manager.id}`}
																	</Typography>
																	{manager.id && (
																		<Typography variant="caption" color="text.secondary">
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
												<Typography color="text.secondary">Aucun gestionnaire renseigné</Typography>
											</Paper>
										)}
									</CardContent>
								</Card>
							</Stack>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default CompaniesViewClient;
