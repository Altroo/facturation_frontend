'use client';

import React, { useMemo, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import {
	Box,
	Button,
	Stack,
	Typography,
	Card,
	CardContent,
	Divider,
	useTheme,
	useMediaQuery,
	ToggleButtonGroup,
	ToggleButton,
	Alert,
	IconButton,
	Tooltip,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Business as BusinessIcon,
	Notes as NotesIcon,
	Email as EmailIcon,
	Person as PersonIcon,
	PersonOutline as PersonOutlineIcon,
	LocationOn as LocationOnIcon,
	Phone as PhoneIcon,
	AccountBalance as AccountBalanceIcon,
	Fingerprint as FingerprintIcon,
	Badge as BadgeIcon,
	CreditCard as CreditCardIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Add as AddIcon,
	Warning as WarningIcon,
	Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { CLIENTS_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import type { DropDownType } from '@/types/accountTypes';
import { useToast, useLanguage } from '@/utils/hooks';
import {
	useAddClientMutation,
	useEditClientMutation,
	useGetClientQuery,
	useGetCodeClientQuery,
} from '@/store/services/client';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import type { TypeClientType, ClientSchemaType } from '@/types/clientTypes';
import { useAddCityMutation, useGetCitiesListQuery } from '@/store/services/parameter';
import { clientSchema, pmRequired, ppRequired } from '@/utils/formValidationSchemas';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ClientArticleWrapperForm from '@/components/pages/dashboard/shared/client-article-form/clientArticleWrapperForm';

const inputTheme = textInputTheme();

type FormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, company_id, id } = props;
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();

	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetClientQuery({ id: id! }, { skip: !token || !isEditMode });

	const {
		data: generatedCodeData,
		isLoading: isCodeLoading,
		refetch: refetchCodeClient,
	} = useGetCodeClientQuery({ company_id }, {
		skip: !token || isEditMode,
	});

	// Mutations
	const [addClient, { isLoading: isAddLoading, error: addError }] = useAddClientMutation();
	const [updateClient, { isLoading: isUpdateLoading, error: updateError }] = useEditClientMutation();

	// Cities
	const { data: citiesData } = useGetCitiesListQuery({ company_id }, { skip: !token });
	const [addCity] = useAddCityMutation();

	// Local state
	const [openCityModal, setOpenCityModal] = useState(false);

	const [isPending, setIsPending] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

	// Compute initial code_client: use server-generated when adding, else from clientData
	const initialCodeClient = isEditMode ? (rawData?.code_client ?? '') : (generatedCodeData?.code_client ?? '');

	// Formik
	const formik = useFormik<ClientSchemaType>({
		initialValues: {
			client_type: (rawData?.client_type as TypeClientType) ?? 'PM',
			code_client: initialCodeClient,
			company: company_id,
			raison_sociale: rawData?.raison_sociale ?? '',
			nom: rawData?.nom ?? '',
			prenom: rawData?.prenom ?? '',
			adresse: rawData?.adresse ?? null,
			ville: rawData?.ville ?? null,
			tel: rawData?.tel ?? null,
			email: rawData?.email ?? '',
			// default 60 unless backend gives another value
			delai_de_paiement: rawData?.delai_de_paiement ?? 60,
			remarque: rawData?.remarque ?? null,
			numero_du_compte: rawData?.numero_du_compte ?? null,
			ICE: rawData?.ICE ?? '',
			registre_de_commerce: rawData?.registre_de_commerce ?? '',
			identifiant_fiscal: rawData?.identifiant_fiscal ?? null,
			taxe_professionnelle: rawData?.taxe_professionnelle ?? null,
			CNSS: rawData?.CNSS ?? null,
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(clientSchema),
		onSubmit: async (data, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...newPayload } = data;
			try {
				// Build payload with irrelevant fields cleared
				const payload =
					data.client_type === 'PM'
						? {
								...newPayload,
								nom: null,
								prenom: null,
								tel: null,
							}
						: {
								...newPayload,
								raison_sociale: null,
								ICE: null,
								registre_de_commerce: null,
							};

				if (isEditMode) {
					await updateClient({ data: payload, id: id! }).unwrap();
					onSuccess(t.clients.updateSuccess);
				} else {
					await addClient({ data: payload }).unwrap();
					onSuccess(t.clients.addSuccess);
				}
				if (!isEditMode) {
					router.replace(CLIENTS_LIST);
				}
			} catch (e) {
				if (isEditMode) {
					onError(t.clients.updateError);
				} else {
					onError(t.clients.addError);
				}
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	// Error handling
	const error = isEditMode ? dataError || updateError : addError;
	const axiosError = error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;

	// Stable cityItems
	const cityItems: DropDownType[] = useMemo(
		() =>
			(citiesData ?? []).map((c) => ({
				value: String(c.id),
				code: c.nom,
			})),
		[citiesData],
	);

	// Derive selectedCity without local state or effects
	const selectedCity = useMemo<DropDownType | null>(() => {
		const v = formik.values.ville;
		if (!v || cityItems.length === 0) return null;
		return cityItems.find((c) => c.value === String(v)) ?? null;
	}, [formik.values.ville, cityItems]);

	// Required label helpers
	const isPM = formik.values.client_type === 'PM';
	const isRequiredPM = (field: (typeof pmRequired)[number]) => isPM && pmRequired.includes(field);
	const isRequiredPP = (field: (typeof ppRequired)[number]) => !isPM && ppRequired.includes(field);

	// Collect validation errors from Formik
	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			reference: t.articles.colReference,
			designation: t.articles.colDesignation,
			prix_achat: t.articles.colPrixAchat,
			prix_vente: t.articles.colPrixVente,
			tva: t.articles.fieldTva,
			categorie: t.articles.filterCategorie,
			emplacement: t.articles.filterEmplacement,
			unite: t.articles.filterUnite,
			marque: t.articles.filterMarque,
			remarque: t.clients.fieldRemarque,
			photo: t.articles.fieldPhoto,
			photo_cropped: t.articles.fieldPhotoCropped,
			globalError: t.common.genericError,
			raison_sociale: t.clients.fieldRaisonSociale,
			nom: t.clients.fieldNom,
			prenom: t.clients.fieldPrenom,
			adresse: t.clients.fieldAdresse,
			ville: t.clients.fieldVille,
			tel: t.clients.fieldTelephone,
			email: t.clients.fieldEmail,
			ICE: t.clients.fieldICE,
			registre_de_commerce: t.clients.fieldRegistreCommerce,
			identifiant_fiscal: t.clients.fieldIdentifiantFiscal,
			taxe_professionnelle: t.clients.fieldTaxeProfessionnelle,
			CNSS: t.clients.fieldCNSS,
			numero_du_compte: t.clients.fieldNumeroCompte,
			delai_de_paiement: t.clients.fieldDelaiPaiement,
		}),
		[t],
	);

	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) {
			Object.entries(formik.errors).forEach(([key, value]) => {
				if (key !== 'globalError' && typeof value === 'string') {
					errors[key] = value;
				}
			});
		}
		return errors;
	}, [formik.errors, hasAttemptedSubmit]);

	const hasValidationErrors = Object.keys(validationErrors).length > 0;

	const isLoading =
		isAddLoading ||
		isUpdateLoading ||
		isPending ||
		(isEditMode && isDataLoading) ||
		(!isEditMode && isCodeLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction={isMobile ? 'column' : 'row'} pt={2} justifyContent="space-between" spacing={2}>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => router.push(CLIENTS_LIST)}
					sx={{
						whiteSpace: 'nowrap',
						px: { xs: 1.5, sm: 2, md: 3 },
						py: { xs: 0.8, sm: 1, md: 1 },
						fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
					}}
				>
					{t.clients.backToList}
				</Button>
			</Stack>
			{hasValidationErrors && (
				<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
					<Typography variant="subtitle2" fontWeight={600}>
						{t.common.validationErrors}
					</Typography>
					<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
						{Object.entries(validationErrors).map(([key, error]) => (
							<li key={key}>
								<Typography variant="body2">
									{getLabelForKey(fieldLabels, key)} : {error}
								</Typography>
							</li>
						))}
					</ul>
				</Alert>
			)}
			{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
			{isLoading ? (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			) : shouldShowError ? (
				<ApiAlert errorDetails={axiosError?.data.details} />
			) : (
				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						{/* Client type selection */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<PersonIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.clients.typeSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />

								<ToggleButtonGroup
									value={formik.values.client_type}
									exclusive
									onChange={(_, val) => {
										if (val) {
											formik.setFieldValue('client_type', val);
											formik.setErrors({});
										}
									}}
									sx={{ mb: 2 }}
								>
									<ToggleButton value="PM">{t.clients.typePersonneMorale}</ToggleButton>
									<ToggleButton value="PP">{t.clients.typePersonnePhysique}</ToggleButton>
								</ToggleButtonGroup>

								<Stack spacing={2.5}>
									<Stack direction="row" spacing={1} alignItems="flex-start">
										<CustomTextInput
											id="code_client"
											type="text"
											label={t.clients.fieldCodeClient + ' *'}
											value={formik.values.code_client}
											onChange={formik.handleChange('code_client')}
											onBlur={formik.handleBlur('code_client')}
											error={formik.touched.code_client && Boolean(formik.errors.code_client)}
											helperText={formik.touched.code_client ? formik.errors.code_client : ''}
											fullWidth
											size="small"
											theme={inputTheme}
											startIcon={<BadgeIcon fontSize="small" />}
										/>
										{!isEditMode && (
											<Tooltip title={t.clients.resetCode}>
												<IconButton
													size="large"
													color="primary"
													onClick={async () => {
														const result = (await refetchCodeClient()) as { data?: { code_client: string } };
														if (result?.data?.code_client) {
															await formik.setFieldValue('code_client', result.data.code_client);
														}
													}}
													sx={{ mt: 1 }}
												>
													<RefreshIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										)}
									</Stack>
								</Stack>
							</CardContent>
						</Card>

						{/* Conditional core info */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<BusinessIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.clients.identitySection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />

								{isPM ? (
									<Stack spacing={2.5}>
										<CustomTextInput
											id="raison_sociale"
											type="text"
											value={formik.values.raison_sociale ?? ''}
											onChange={formik.handleChange('raison_sociale')}
											onBlur={formik.handleBlur('raison_sociale')}
											helperText={formik.touched.raison_sociale ? formik.errors.raison_sociale : ''}
											error={formik.touched.raison_sociale && Boolean(formik.errors.raison_sociale)}
											fullWidth={false}
											size="small"
											label={t.clients.fieldRaisonSociale + (isRequiredPM('raison_sociale') ? ' *' : '')}
											theme={inputTheme}
											startIcon={<BusinessIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="email"
											type="email"
											label={t.clients.fieldEmail}
											value={formik.values.email ?? ''}
											onChange={formik.handleChange('email')}
											onBlur={formik.handleBlur('email')}
											error={formik.touched.email && Boolean(formik.errors.email)}
											helperText={formik.touched.email ? formik.errors.email : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<EmailIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="ICE"
											type="text"
											label={t.clients.fieldICE + (isRequiredPM('ICE') ? ' *' : '')}
											value={formik.values.ICE ?? ''}
											onChange={formik.handleChange('ICE')}
											onBlur={formik.handleBlur('ICE')}
											error={formik.touched.ICE && Boolean(formik.errors.ICE)}
											helperText={formik.touched.ICE ? formik.errors.ICE : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<FingerprintIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="registre_de_commerce"
											type="text"
											label={t.clients.fieldRegistreCommerce}
											value={formik.values.registre_de_commerce ?? ''}
											onChange={formik.handleChange('registre_de_commerce')}
											onBlur={formik.handleBlur('registre_de_commerce')}
											error={formik.touched.registre_de_commerce && Boolean(formik.errors.registre_de_commerce)}
											helperText={formik.touched.registre_de_commerce ? formik.errors.registre_de_commerce : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<BadgeIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="adresse"
											type="text"
											label={t.clients.fieldAdresse}
											value={formik.values.adresse ?? ''}
											onChange={formik.handleChange('adresse')}
											onBlur={formik.handleBlur('adresse')}
											error={formik.touched.adresse && Boolean(formik.errors.adresse)}
											helperText={formik.touched.adresse ? formik.errors.adresse : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<LocationOnIcon fontSize="small" />}
										/>
									</Stack>
								) : (
									<Stack spacing={2.5}>
										<CustomTextInput
											id="nom"
											type="text"
											label={t.clients.fieldNom + (isRequiredPP('nom') ? ' *' : '')}
											value={formik.values.nom ?? ''}
											onChange={formik.handleChange('nom')}
											onBlur={formik.handleBlur('nom')}
											error={formik.touched.nom && Boolean(formik.errors.nom)}
											helperText={formik.touched.nom ? formik.errors.nom : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<PersonIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="prenom"
											type="text"
											label={t.clients.fieldPrenom + (isRequiredPP('prenom') ? ' *' : '')}
											value={formik.values.prenom ?? ''}
											onChange={formik.handleChange('prenom')}
											onBlur={formik.handleBlur('prenom')}
											error={formik.touched.prenom && Boolean(formik.errors.prenom)}
											helperText={formik.touched.prenom ? formik.errors.prenom : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<PersonOutlineIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="adresse"
											type="text"
											label={t.clients.fieldAdresse + (isRequiredPP('adresse') ? ' *' : '')}
											value={formik.values.adresse ?? ''}
											onChange={formik.handleChange('adresse')}
											onBlur={formik.handleBlur('adresse')}
											error={formik.touched.adresse && Boolean(formik.errors.adresse)}
											helperText={formik.touched.adresse ? formik.errors.adresse : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<LocationOnIcon fontSize="small" />}
										/>
									</Stack>
								)}
							</CardContent>
						</Card>

						{/* {t.clients.contactSection} */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<PhoneIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.clients.contactSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="tel"
										type="tel"
										label={t.clients.fieldTelephone + (isRequiredPP('tel') ? ' *' : '')}
										value={formik.values.tel ?? ''}
										onChange={formik.handleChange('tel')}
										onBlur={formik.handleBlur('tel')}
										error={formik.touched.tel && Boolean(formik.errors.tel)}
										helperText={formik.touched.tel ? formik.errors.tel : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<PhoneIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Administrative info */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<DescriptionIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.clients.adminSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="numero_du_compte"
										type="text"
										label={t.clients.fieldNumeroCompte}
										value={formik.values.numero_du_compte ?? ''}
										onChange={formik.handleChange('numero_du_compte')}
										onBlur={formik.handleBlur('numero_du_compte')}
										error={formik.touched.numero_du_compte && Boolean(formik.errors.numero_du_compte)}
										helperText={formik.touched.numero_du_compte ? formik.errors.numero_du_compte : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<AccountBalanceIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="identifiant_fiscal"
										type="text"
										label={t.clients.fieldIdentifiantFiscal}
										value={formik.values.identifiant_fiscal ?? ''}
										onChange={formik.handleChange('identifiant_fiscal')}
										onBlur={formik.handleBlur('identifiant_fiscal')}
										error={formik.touched.identifiant_fiscal && Boolean(formik.errors.identifiant_fiscal)}
										helperText={formik.touched.identifiant_fiscal ? formik.errors.identifiant_fiscal : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<CreditCardIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="taxe_professionnelle"
										type="text"
										label={t.clients.fieldTaxeProfessionnelle}
										value={formik.values.taxe_professionnelle ?? ''}
										onChange={formik.handleChange('taxe_professionnelle')}
										onBlur={formik.handleBlur('taxe_professionnelle')}
										error={formik.touched.taxe_professionnelle && Boolean(formik.errors.taxe_professionnelle)}
										helperText={formik.touched.taxe_professionnelle ? formik.errors.taxe_professionnelle : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<CreditCardIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="CNSS"
										type="text"
										label={t.clients.fieldCNSS}
										value={formik.values.CNSS ?? ''}
										onChange={formik.handleChange('CNSS')}
										onBlur={formik.handleBlur('CNSS')}
										error={formik.touched.CNSS && Boolean(formik.errors.CNSS)}
										helperText={formik.touched.CNSS ? formik.errors.CNSS : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<FingerprintIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* City + Payment */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<LocationOnIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.clients.villeSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomAutoCompleteSelect
										id="ville"
										size="small"
										noOptionsText={t.clients.noVille}
										label={t.clients.fieldVille + (isPM ? (isRequiredPM('ville') ? ' *' : '') : isRequiredPP('ville') ? ' *' : '')}
										items={cityItems}
										theme={theme}
										value={selectedCity}
										fullWidth
										onChange={(_, newVal) => {
											formik.setFieldValue('ville', newVal ? Number(newVal.value) : null);
										}}
									onBlur={formik.handleBlur('ville')}
										error={formik.touched.ville && Boolean(formik.errors.ville)}
										helperText={formik.touched.ville ? formik.errors.ville : ''}
										startIcon={<LocationOnIcon fontSize="small" />}
										endIcon={
											<Button size="small" variant="outlined" onClick={() => setOpenCityModal(true)} sx={{ ml: 1 }}>
												{t.common.add}
											</Button>
										}
									/>

									<CustomTextInput
										id="delai_de_paiement"
										type="number"
										label={t.clients.fieldDelaiPaiement + (
											isPM
												? isRequiredPM('delai_de_paiement')
													? ' *'
													: ''
												: isRequiredPP('delai_de_paiement')
													? ' *'
													: ''
										)}
										value={formik.values.delai_de_paiement === null ? '' : String(formik.values.delai_de_paiement)}
										onChange={(e) => {
											const value = e.target.value === '' ? null : Number(e.target.value);
											if (value !== null && value < 0) return;
											formik.setFieldValue('delai_de_paiement', value);
										}}
										onBlur={formik.handleBlur('delai_de_paiement')}
										error={formik.touched.delai_de_paiement && Boolean(formik.errors.delai_de_paiement)}
										helperText={formik.touched.delai_de_paiement ? formik.errors.delai_de_paiement : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<CreditCardIcon fontSize="small" />}
										slotProps={{
											input: {
												inputProps: { min: 0 },
											},
										}}
									/>
								</Stack>
							</CardContent>
						</Card>
						{/* Remark */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<NotesIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.clients.remarkSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="remarque"
										type="text"
										label={t.clients.fieldRemarque}
										value={formik.values.remarque ?? ''}
										onChange={formik.handleChange('remarque')}
										onBlur={formik.handleBlur('remarque')}
										error={formik.touched.remarque && Boolean(formik.errors.remarque)}
										helperText={formik.touched.remarque ? formik.errors.remarque : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<NotesIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>
						{/* Submit Button */}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? t.common.update : t.clients.addTitle}
								active={!isPending}
								type="submit"
								loading={isPending}
								startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									setHasAttemptedSubmit(true);
									if (!formik.isValid) {
										e.preventDefault();
										formik.handleSubmit();
										onError(t.common.correctErrors);
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}
								}}
								cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
							/>
						</Box>
					</Stack>
				</form>
			)}

			{/* Add City Modal */}
			<AddEntityModal
				open={openCityModal}
				setOpen={setOpenCityModal}
				label={t.clients.fieldVille.toLowerCase()}
				icon={<LocationOnIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={(args) => addCity({ data: { ...args.data, company: company_id } })}
				onSuccess={(newId) => {
					formik.setFieldValue('ville', newId);
				}}
			/>
		</Stack>
	);
};

interface Props extends SessionProps {
	company_id: number;
	id?: number;
}

const ClientsForm: React.FC<Props> = (props) => (
	<ClientArticleWrapperForm {...props} entityName="client" FormikComponent={FormikContent} />
);

export default ClientsForm;
