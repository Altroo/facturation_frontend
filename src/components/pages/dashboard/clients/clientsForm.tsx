'use client';

import React, { useMemo, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
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
	Modal,
	Container,
} from '@mui/material';
import { ArrowBack, BusinessOutlined } from '@mui/icons-material';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import BadgeIcon from '@mui/icons-material/Badge';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DescriptionIcon from '@mui/icons-material/Description';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { coordonneeTextInputTheme } from '@/utils/themes';
import { CLIENTS_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import type { DropDownType } from '@/types/accountTypes';
import { useAppSelector } from '@/utils/hooks';
import { getCitiesState, getUserCompaniesState } from '@/store/selectors';
import {
	useAddClientMutation,
	useEditClientMutation,
	useGetClientQuery,
	useGetCodeClientQuery,
} from '@/store/services/client';
import { setFormikAutoErrors } from '@/utils/helpers';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import type { client_type, ClientSchemaType } from '@/types/clientTypes';
import { useAddCityMutation, useGetCitiesListQuery } from '@/store/services/parameter';
import type { CitiesClass } from '@/models/Classes';
import { clientSchema, pmRequired, ppRequired } from '@/utils/formValidationSchemas';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	company_id: number;
	id?: number;
	onSuccess: () => void;
};

const FormikContent: React.FC<FormikContentProps> = ({ token, company_id, id, onSuccess }) => {
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();

	const {
		data: clientData,
		isLoading: isClientLoading,
		error: clientError,
	} = useGetClientQuery({ token, id: id! }, { skip: !token || !isEditMode });

	const { data: generatedCodeData, isLoading: isCodeLoading } = useGetCodeClientQuery(
		{ token },
		{ skip: !token || isEditMode },
	);

	// Mutations
	const [addClient, { isLoading: isAddLoading, error: addError }] = useAddClientMutation();
	const [updateClient, { isLoading: isUpdateLoading, error: updateError }] = useEditClientMutation();

	// Cities
	const rawCities = useAppSelector(getCitiesState);
	const normalizedCities: Array<CitiesClass> = Array.isArray(rawCities) ? rawCities : Object.values(rawCities ?? {});
	const { isLoading: isCitiesLoading } = useGetCitiesListQuery(token, { skip: !token });
	const [addCity, { isLoading: isAddCityLoading }] = useAddCityMutation();

	// Local state
	const [openCityModal, setOpenCityModal] = useState(false);
	const [newCityName, setNewCityName] = useState('');
	const [cityError, setCityError] = useState<string | null>(null);

	const [isPending, setIsPending] = useState(false);

	// Compute initial code_client: use server-generated when adding, else from clientData
	const initialCodeClient = isEditMode ? (clientData?.code_client ?? '') : (generatedCodeData?.code_client ?? '');

	// Formik
	const formik = useFormik<ClientSchemaType>({
		initialValues: {
			client_type: (clientData?.client_type as client_type) ?? 'PM',
			code_client: initialCodeClient,
			company: company_id,
			raison_sociale: clientData?.raison_sociale ?? '',
			nom: clientData?.nom ?? '',
			prenom: clientData?.prenom ?? '',
			adresse: clientData?.adresse ?? null,
			ville: clientData?.ville ?? null,
			tel: clientData?.tel ?? null,
			email: clientData?.email ?? '',
			// default 60 unless backend gives another value
			delai_de_paiement: clientData?.delai_de_paiement ?? 60,
			remarque: clientData?.remarque ?? null,
			numero_du_compte: clientData?.numero_du_compte ?? null,
			ICE: clientData?.ICE ?? '',
			registre_de_commerce: clientData?.registre_de_commerce ?? '',
			identifiant_fiscal: clientData?.identifiant_fiscal ?? null,
			taxe_professionnelle: clientData?.taxe_professionnelle ?? null,
			CNSS: clientData?.CNSS ?? null,
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
					await updateClient({ token, data: payload, id: id! }).unwrap();
				} else {
					await addClient({ token, data: payload }).unwrap();
				}

				onSuccess();
				if (!isEditMode) {
					setTimeout(() => {
						router.replace(CLIENTS_LIST);
					}, 1000);
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	// Error handling
	const error = isEditMode ? clientError || updateError : addError;
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
		isCitiesLoading ||
		isAddCityLoading ||
		(isEditMode && isClientLoading) ||
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
					startIcon={<ArrowBack />}
					onClick={() => router.push(CLIENTS_LIST)}
					sx={{ width: isMobile ? '100%' : 'auto' }}
				>
					Liste des clients
				</Button>
			</Stack>
			{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
			{isLoading ? (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			) : axiosError?.status === 404 ? (
				<Paper
					elevation={0}
					sx={{
						p: 3,
						backgroundColor: 'error.light',
						borderRadius: 2,
						border: '1px solid',
						borderColor: 'error.main',
					}}
				>
					<Typography color="error.main" variant="h6">
						{axiosError.data?.message}
					</Typography>
				</Paper>
			) : (
				<form>
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

						{/* City + Payment + Remark */}
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
										startIcon={<DescriptionIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Submit Button */}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? 'Mettre à jour' : 'Ajouter le client'}
								active={!isPending}
								onClick={formik.handleSubmit}
								loading={isPending}
								cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
							/>
						</Box>
					</Stack>
				</form>
			)}

			{/* Add City Modal */}
			<Modal open={openCityModal} onClose={() => setOpenCityModal(false)}>
				<Box
					sx={{
						p: 3,
						bgcolor: 'background.paper',
						borderRadius: 2,
						maxWidth: 420,
						width: '90%',
						mx: 'auto',
						mt: '15vh',
						boxShadow: 24,
					}}
				>
					<Typography variant="h6" mb={2}>
						Ajouter une ville
					</Typography>

					{/* Use CustomTextInput instead of TextField */}
					<CustomTextInput
						id="new_city"
						type="text"
						label="Nom de la ville"
						value={newCityName}
						onChange={(e) => {
							setNewCityName(e.target.value);
							if (cityError) setCityError(null);
						}}
						error={Boolean(cityError)}
						helperText={cityError ?? ''}
						fullWidth={true}
						size="small"
						theme={inputTheme}
						startIcon={<LocationOnIcon fontSize="small" />}
					/>

					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
						<Button onClick={() => setOpenCityModal(false)}>Annuler</Button>
						<Button
							variant="contained"
							onClick={async () => {
								if (!newCityName.trim()) {
									setCityError('Le nom de la ville est requis.');
									return;
								}
								try {
									await addCity({ token, data: { nom: newCityName.trim() } }).unwrap();
									setOpenCityModal(false);
									setNewCityName('');
									setCityError(null);
								} catch (e) {
									const payload =
										(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).error ??
										(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).data ??
										(e as ApiErrorResponseType);

									if (payload?.details?.city) {
										const messages = payload.details.city;
										const errorMsg = Array.isArray(messages) ? messages[0] : messages;
										setCityError(errorMsg);
									} else {
										setCityError('Erreur lors de l’ajout de la ville.');
									}
								}
							}}
						>
							Ajouter
						</Button>
					</Box>
				</Box>
			</Modal>
		</Stack>
	);
};

interface Props extends SessionProps {
	company_id: number;
	id?: number;
}

const ClientsForm: React.FC<Props> = ({ session, company_id, id }) => {
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((comp) => comp.id === company_id);

	const isEditMode = id !== undefined;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? 'Modifier le client' : 'Ajouter un client'}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{company?.role === 'Admin' ? (
						<Box sx={{ width: '100%' }}>
							<FormikContent token={token} id={id} company_id={company_id} onSuccess={() => setShowDataUpdated(true)} />
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
									<BusinessOutlined sx={{ fontSize: 48, color: '#0D070B', opacity: 0.6 }} />
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
			<Portal id="snackbar_portal">
				<CustomToast
					type="success"
					message={isEditMode ? 'Client mis à jour' : 'Client ajouté avec succès.'}
					setShow={setShowDataUpdated}
					show={showDataUpdated}
				/>
			</Portal>
		</Stack>
	);
};

export default ClientsForm;
