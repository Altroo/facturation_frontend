'use client';

import React, { useMemo, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Box,
	Button,
	Stack,
	Typography,
	Card,
	CardContent,
	Divider,
	Paper,
	useTheme,
	useMediaQuery,
	ToggleButtonGroup,
	ToggleButton,
	Container,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	BusinessOutlined as BusinessOutlinedIcon,
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
	EditOutlined as EditOutlinedIcon,
	AddOutlined as AddOutlinedIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { coordonneeTextInputTheme } from '@/utils/themes';
import { CLIENTS_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import type { DropDownType } from '@/types/accountTypes';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getCitiesState, getUserCompaniesState } from '@/store/selectors';
import {
	useAddClientMutation,
	useEditClientMutation,
	useGetClientQuery,
	useGetCodeClientQuery,
} from '@/store/services/client';
import { setFormikAutoErrors } from '@/utils/helpers';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import type { TypeClientType, ClientSchemaType } from '@/types/clientTypes';
import { useAddCityMutation } from '@/store/services/parameter';
import type { CitiesClass } from '@/models/classes';
import { clientSchema, pmRequired, ppRequired } from '@/utils/formValidationSchemas';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	company_id: number;
	id?: number;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, company_id, id } = props;
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();

	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetClientQuery({ id: id! }, { skip: !token || !isEditMode });

	const { data: generatedCodeData, isLoading: isCodeLoading } = useGetCodeClientQuery(undefined, {
		skip: !token || isEditMode,
	});

	// Mutations
	const [addClient, { isLoading: isAddLoading, error: addError }] = useAddClientMutation();
	const [updateClient, { isLoading: isUpdateLoading, error: updateError }] = useEditClientMutation();

	// Cities
	const rawCities = useAppSelector(getCitiesState);
	const normalizedCities: Array<CitiesClass> = Array.isArray(rawCities) ? rawCities : Object.values(rawCities ?? {});
	const [addCity, { isLoading: isAddCityLoading }] = useAddCityMutation();

	// Local state
	const [openCityModal, setOpenCityModal] = useState(false);

	const [isPending, setIsPending] = useState(false);

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
			setIsPending(true);
			try {
				// Build payload with irrelevant fields cleared
				const payload =
					data.client_type === 'PM'
						? {
								...data,
								nom: null,
								prenom: null,
								adresse: null,
								tel: null,
							}
						: {
								...data,
								raison_sociale: null,
								ICE: null,
								registre_de_commerce: null,
							};

				if (isEditMode) {
					await updateClient({ data: payload, id: id! }).unwrap();
					onSuccess('Le client a été mis à jour avec succès.');
				} else {
					await addClient({ data: payload }).unwrap();
					onSuccess('Le client a été ajouté avec succès.');
				}
				if (!isEditMode) {
					setTimeout(() => {
						router.replace(CLIENTS_LIST);
					}, 500);
				}
			} catch (e) {
				if (isEditMode) {
					onError('La mise à jour du client a échoué. Veuillez réessayer.');
				} else {
					onError("L'ajout du client a échoué. Veuillez réessayer.");
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
			normalizedCities.map((c) => ({
				value: String(c.id),
				code: c.nom,
			})),
		[normalizedCities],
	);

	// Derive selectedCity without local state or effects
	const selectedCity = useMemo<DropDownType | null>(() => {
		const v = formik.values.ville;
		if (!v || cityItems.length === 0) return null;
		return cityItems.find((c) => c.value === String(v)) ?? null;
	}, [formik.values.ville, cityItems]);

	const isLoading =
		isAddLoading ||
		isUpdateLoading ||
		isPending ||
		isAddCityLoading ||
		(isEditMode && isDataLoading) ||
		(!isEditMode && isCodeLoading);

	// Required label helpers
	const isPM = formik.values.client_type === 'PM';
	const isRequiredPM = (field: (typeof pmRequired)[number]) => isPM && pmRequired.includes(field);
	const isRequiredPP = (field: (typeof ppRequired)[number]) => !isPM && ppRequired.includes(field);

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
					Liste des clients
				</Button>
			</Stack>
			{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
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
				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						{/* Client type selection */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<PersonIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Type de client
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
									<ToggleButton value="PM">Personne morale</ToggleButton>
									<ToggleButton value="PP">Personne physique</ToggleButton>
								</ToggleButtonGroup>

								<Stack spacing={2.5}>
									<CustomTextInput
										id="code_client"
										type="text"
										label="Code client"
										value={formik.values.code_client}
										onChange={formik.handleChange('code_client')}
										onBlur={formik.handleBlur('code_client')}
										error={formik.touched.code_client && Boolean(formik.errors.code_client)}
										helperText={formik.touched.code_client ? (formik.errors.code_client as string) : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<BadgeIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Conditional core info */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<BusinessIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Informations générales
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
											helperText={formik.touched.raison_sociale ? (formik.errors.raison_sociale as string) : ''}
											error={formik.touched.raison_sociale && Boolean(formik.errors.raison_sociale)}
											fullWidth={false}
											size="small"
											label={`Raison sociale${isRequiredPM('raison_sociale') ? ' *' : ''}`}
											theme={inputTheme}
											startIcon={<BusinessIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="email"
											type="email"
											label="Email"
											value={formik.values.email ?? ''}
											onChange={formik.handleChange('email')}
											onBlur={formik.handleBlur('email')}
											error={formik.touched.email && Boolean(formik.errors.email)}
											helperText={formik.touched.email ? (formik.errors.email as string) : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<EmailIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="ICE"
											type="text"
											label={`ICE${isRequiredPM('ICE') ? ' *' : ''}`}
											value={formik.values.ICE ?? ''}
											onChange={formik.handleChange('ICE')}
											onBlur={formik.handleBlur('ICE')}
											error={formik.touched.ICE && Boolean(formik.errors.ICE)}
											helperText={formik.touched.ICE ? (formik.errors.ICE as string) : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<FingerprintIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="registre_de_commerce"
											type="text"
											label={`Registre de commerce${isRequiredPM('registre_de_commerce') ? ' *' : ''}`}
											value={formik.values.registre_de_commerce ?? ''}
											onChange={formik.handleChange('registre_de_commerce')}
											onBlur={formik.handleBlur('registre_de_commerce')}
											error={formik.touched.registre_de_commerce && Boolean(formik.errors.registre_de_commerce)}
											helperText={
												formik.touched.registre_de_commerce ? (formik.errors.registre_de_commerce as string) : ''
											}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<BadgeIcon fontSize="small" />}
										/>
									</Stack>
								) : (
									<Stack spacing={2.5}>
										<CustomTextInput
											id="nom"
											type="text"
											label={`Nom${isRequiredPP('nom') ? ' *' : ''}`}
											value={formik.values.nom ?? ''}
											onChange={formik.handleChange('nom')}
											onBlur={formik.handleBlur('nom')}
											error={formik.touched.nom && Boolean(formik.errors.nom)}
											helperText={formik.touched.nom ? (formik.errors.nom as string) : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<PersonIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="prenom"
											type="text"
											label={`Prénom${isRequiredPP('prenom') ? ' *' : ''}`}
											value={formik.values.prenom ?? ''}
											onChange={formik.handleChange('prenom')}
											onBlur={formik.handleBlur('prenom')}
											error={formik.touched.prenom && Boolean(formik.errors.prenom)}
											helperText={formik.touched.prenom ? (formik.errors.prenom as string) : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<PersonOutlineIcon fontSize="small" />}
										/>

										<CustomTextInput
											id="adresse"
											type="text"
											label={`Adresse${isRequiredPP('adresse') ? ' *' : ''}`}
											value={formik.values.adresse ?? ''}
											onChange={formik.handleChange('adresse')}
											onBlur={formik.handleBlur('adresse')}
											error={formik.touched.adresse && Boolean(formik.errors.adresse)}
											helperText={formik.touched.adresse ? (formik.errors.adresse as string) : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<LocationOnIcon fontSize="small" />}
										/>
									</Stack>
								)}
							</CardContent>
						</Card>

						{/* Contact */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<PhoneIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Contact
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="tel"
										type="tel"
										label={`${isPM ? 'Téléphone' : 'Téléphone'}${isRequiredPP('tel') ? ' *' : ''}`}
										value={formik.values.tel ?? ''}
										onChange={formik.handleChange('tel')}
										onBlur={formik.handleBlur('tel')}
										error={formik.touched.tel && Boolean(formik.errors.tel)}
										helperText={formik.touched.tel ? (formik.errors.tel as string) : ''}
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
										Informations administratives
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="numero_du_compte"
										type="text"
										label="Numéro du compte"
										value={formik.values.numero_du_compte ?? ''}
										onChange={formik.handleChange('numero_du_compte')}
										onBlur={formik.handleBlur('numero_du_compte')}
										error={formik.touched.numero_du_compte && Boolean(formik.errors.numero_du_compte)}
										helperText={formik.touched.numero_du_compte ? (formik.errors.numero_du_compte as string) : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<AccountBalanceIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="identifiant_fiscal"
										type="text"
										label="Identifiant fiscal"
										value={formik.values.identifiant_fiscal ?? ''}
										onChange={formik.handleChange('identifiant_fiscal')}
										onBlur={formik.handleBlur('identifiant_fiscal')}
										error={formik.touched.identifiant_fiscal && Boolean(formik.errors.identifiant_fiscal)}
										helperText={formik.touched.identifiant_fiscal ? (formik.errors.identifiant_fiscal as string) : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<CreditCardIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="taxe_professionnelle"
										type="text"
										label="Taxe professionnelle"
										value={formik.values.taxe_professionnelle ?? ''}
										onChange={formik.handleChange('taxe_professionnelle')}
										onBlur={formik.handleBlur('taxe_professionnelle')}
										error={formik.touched.taxe_professionnelle && Boolean(formik.errors.taxe_professionnelle)}
										helperText={
											formik.touched.taxe_professionnelle ? (formik.errors.taxe_professionnelle as string) : ''
										}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<CreditCardIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="CNSS"
										type="text"
										label="CNSS"
										value={formik.values.CNSS ?? ''}
										onChange={formik.handleChange('CNSS')}
										onBlur={formik.handleBlur('CNSS')}
										error={formik.touched.CNSS && Boolean(formik.errors.CNSS)}
										helperText={formik.touched.CNSS ? (formik.errors.CNSS as string) : ''}
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
										Ville et paiement
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomAutoCompleteSelect
										id="ville"
										size="small"
										noOptionsText="Aucun ville trouvé"
										label={`Ville${isPM ? (isRequiredPM('ville') ? ' *' : '') : isRequiredPP('ville') ? ' *' : ''}`}
										items={cityItems}
										theme={theme}
										value={selectedCity}
										fullWidth
										onChange={(_, newVal) => {
											formik.setFieldValue('ville', newVal ? Number(newVal.value) : null);
										}}
										onBlur={formik.handleBlur('nbr_employe')}
										error={formik.touched.ville && Boolean(formik.errors.ville)}
										helperText={formik.touched.ville ? formik.errors.ville : ''}
										startIcon={<LocationOnIcon fontSize="small" />}
										endIcon={
											<Button size="small" variant="outlined" onClick={() => setOpenCityModal(true)} sx={{ ml: 1 }}>
												Ajouter
											</Button>
										}
									/>

									<CustomTextInput
										id="delai_de_paiement"
										type="number"
										label={`Délai de paiement (jours)${
											isPM
												? isRequiredPM('delai_de_paiement')
													? ' *'
													: ''
												: isRequiredPP('delai_de_paiement')
													? ' *'
													: ''
										}`}
										value={formik.values.delai_de_paiement === null ? '' : String(formik.values.delai_de_paiement)}
										onChange={(e) =>
											formik.setFieldValue('delai_de_paiement', e.target.value === '' ? null : Number(e.target.value))
										}
										onBlur={formik.handleBlur('delai_de_paiement')}
										error={formik.touched.delai_de_paiement && Boolean(formik.errors.delai_de_paiement)}
										helperText={formik.touched.delai_de_paiement ? (formik.errors.delai_de_paiement as string) : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<CreditCardIcon fontSize="small" />}
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
										Remarque
									</Typography>
								</Stack>
								<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="remarque"
										type="text"
										label="Remarque"
										value={formik.values.remarque ?? ''}
										onChange={formik.handleChange('remarque')}
										onBlur={formik.handleBlur('remarque')}
										error={formik.touched.remarque && Boolean(formik.errors.remarque)}
										helperText={formik.touched.remarque ? (formik.errors.remarque as string) : ''}
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
								buttonText={isEditMode ? 'Mettre à jour' : 'Ajouter le client'}
								active={!isPending}
								type="submit"
								loading={isPending}
								startIcon={isEditMode ? <EditOutlinedIcon /> : <AddOutlinedIcon />}
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
				label="ville"
				icon={<LocationOnIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={addCity}
			/>
		</Stack>
	);
};

interface Props extends SessionProps {
	company_id: number;
	id?: number;
}

const ClientsForm: React.FC<Props> = ({ session, company_id, id }) => {
	const token = getAccessTokenFromSession(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((comp) => comp.id === company_id);

	const isEditMode = id !== undefined;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? 'Modifier le client' : 'Ajouter un client'}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{company?.role === 'Admin' ? (
						<Box sx={{ width: '100%' }}>
							<FormikContent token={token} id={id} company_id={company_id} />
						</Box>
					) : (
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
									<BusinessOutlinedIcon sx={{ fontSize: 48, color: '#0D070B', opacity: 0.6 }} />
								</Box>
								<Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
									{isEditMode
										? "Vous n'avez pas le droit de modifier ce client. Veuillez contacter votre administrateur."
										: "Vous n'avez pas le droit d'ajouter un client. Veuillez contacter votre administrateur."}
								</Typography>
							</Paper>
						</Container>
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default ClientsForm;
