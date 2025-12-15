'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import { useAddDeviMutation, useGetNumDevisQuery } from '@/store/services/devi';
import Styles from '@/styles/dashboard/devis/devis.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
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
	InputAdornment,
	Container,
	Paper,
} from '@mui/material';
import {
	ArrowBack,
	Description as DescriptionIcon,
	Person as PersonIcon,
	Payment as PaymentIcon,
	CalendarToday as CalendarTodayIcon,
	Numbers as NumbersIcon,
	Receipt as ReceiptIcon,
	Notes as NotesIcon,
	BusinessOutlined,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { deviAddSchema } from '@/utils/formValidationSchemas';
import { setFormikAutoErrors } from '@/utils/helpers';
import { coordonneeTextInputTheme } from '@/utils/themes';
import { CLIENTS_ADD, DEVIS_EDIT, DEVIS_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { DeviAddSchemaType, DeviSchemaType } from '@/types/devisTypes';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import type { ClientClass, ModePaiementClass } from '@/models/Classes';
import { useGetClientsListQuery } from '@/store/services/client';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getModePaiementState, getUserCompaniesState } from '@/store/selectors';
import { DropDownType } from '@/types/accountTypes';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import AddEntityModal from '@/components/desktop/modals/addEntityModal/addEntityModal';
import { useAddModePaiementMutation } from '@/store/services/parameter';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	company_id: number;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, company_id } = props;
	const { onSuccess, onError } = useToast();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [addData, { isLoading: isAddLoading, error: addError }] = useAddDeviMutation();
	const { data: rawClientsData, isLoading: isClientsLoading } = useGetClientsListQuery(
		{ company_id, with_pagination: false },
		{ skip: !token },
	);
	const [addModePaiement, { isLoading: isAddModePaiementLoading }] = useAddModePaiementMutation();
	const [openModePaiementModal, setOpenModePaiementModal] = useState(false);

	const clientsData = rawClientsData as Array<Partial<ClientClass>> | undefined;
	const error = addError;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const [isPending, setIsPending] = useState(false);
	const router = useRouter();

	const { data: generatedNumDevis, isLoading: isNumDevisLoading } = useGetNumDevisQuery(undefined, {
		skip: !token,
	});

	// Split numero_devis into number and year parts
	const initialNumDevis = generatedNumDevis?.numero_devis ?? '';
	const [numDevisNumber, numDevisYear] = initialNumDevis ? initialNumDevis.split('/') : ['', ''];

	// get mode_paiement
	const rawModePaiement = useAppSelector(getModePaiementState);
	const normalizedModePaiement: Array<ModePaiementClass> = Array.isArray(rawModePaiement)
		? rawModePaiement
		: Object.values(rawModePaiement ?? {});

	const formik = useFormik<DeviAddSchemaType>({
		initialValues: {
			numero_devis: initialNumDevis,
			client: 0,
			date_devis: new Date().toISOString().split('T')[0],
			numero_demande_prix_client: null,
			mode_paiement: null,
			remarque: null,
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(deviAddSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			try {
				// Join the numero_devis parts before submitting
				const submissionData: Partial<DeviSchemaType> = {
					...data,
					numero_devis: `${devisNumberPart}/${devisYearPart}`,
				};
				const response = await addData({ data: submissionData as DeviSchemaType }).unwrap();
				onSuccess('Devis ajouté avec succès.');
				if (response.id) {
					setTimeout(() => {
						router.replace(DEVIS_EDIT(response.id, company_id));
					}, 500);
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError("Échec de l'ajout du devis. Veuillez réessayer.");
			} finally {
				setIsPending(false);
			}
		},
	});

	// Prepare client items for dropdown - show label but value is still the label
	const clientItems = useMemo(() => {
		if (!clientsData) return [];
		return clientsData.map((client) => {
			const label =
				client.client_type === 'PP' ? `${client.nom || ''} ${client.prenom || ''}`.trim() : client.raison_sociale || '';
			return {
				code: label,
				value: String(client.id),
			};
		}) as Array<DropDownType>;
	}, [clientsData]);

	const modePaiementItems: DropDownType[] = useMemo(
		() =>
			normalizedModePaiement.map((c) => ({
				value: String(c.id),
				code: c.nom,
			})),
		[normalizedModePaiement],
	);

	const selectedModePaiement = useMemo<DropDownType | null>(() => {
		const v = formik.values.mode_paiement;
		if (!v || modePaiementItems.length === 0) return null;
		return modePaiementItems.find((c) => c.value === String(v)) ?? null;
	}, [formik.values.mode_paiement, modePaiementItems]);

	const [devisNumberPart, setDevisNumberPart] = useState(numDevisNumber);
	const [devisYearPart, setDevisYearPart] = useState(numDevisYear);

	// Update state when numDevisNumber or numDevisYear changes
	useEffect(() => {
		setDevisNumberPart(numDevisNumber);
		setDevisYearPart(numDevisYear);
	}, [numDevisNumber, numDevisYear]);

	const isLoading = isAddModePaiementLoading || isClientsLoading || isNumDevisLoading || isAddLoading || isPending;

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				<Stack direction={isMobile ? 'column' : 'row'} pt={2} justifyContent="space-between" spacing={2}>
					<Button
						variant="outlined"
						startIcon={<ArrowBack />}
						onClick={() => router.push(DEVIS_LIST)}
						sx={{ width: isMobile ? '100%' : 'auto' }}
					>
						Liste des devis
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
							{/* Document Information Card */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<DescriptionIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Informations du document
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<Stack direction="row" spacing={2} alignItems="flex-start">
											<Box sx={{ flex: 2 }}>
												<CustomTextInput
													id="numero_devis_number"
													type="text"
													label="Numéro *"
													value={devisNumberPart}
													onChange={(e) => setDevisNumberPart(e.target.value)}
													onBlur={formik.handleBlur('numero_devis')}
													error={formik.touched.numero_devis && Boolean(formik.errors.numero_devis)}
													helperText={
														formik.touched.numero_devis && formik.errors.numero_devis ? formik.errors.numero_devis : ''
													}
													fullWidth={true}
													size="small"
													theme={inputTheme}
													startIcon={<NumbersIcon fontSize="small" color="action" />}
												/>
											</Box>
											<Typography variant="h6" sx={{ px: 0.5, mt: 1 }}>
												/
											</Typography>
											<Box sx={{ flex: 1 }}>
												<CustomTextInput
													id="numero_devis_year"
													type="text"
													label="Année *"
													value={devisYearPart}
													onChange={(e) => setDevisYearPart(e.target.value)}
													fullWidth={true}
													size="small"
													theme={inputTheme}
													startIcon={<CalendarTodayIcon fontSize="small" color="action" />}
												/>
											</Box>
										</Stack>
										<DatePicker
											label="Date du devis *"
											value={formik.values.date_devis ? new Date(formik.values.date_devis) : null}
											onChange={(date) => {
												formik.setFieldValue('date_devis', date ? date.toISOString().split('T')[0] : '');
											}}
											format="dd/MM/yyyy"
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
													error: formik.touched.date_devis && Boolean(formik.errors.date_devis),
													helperText: formik.touched.date_devis ? formik.errors.date_devis : '',
													InputProps: {
														startAdornment: (
															<InputAdornment position="start">
																<CalendarTodayIcon fontSize="small" color="action" />
															</InputAdornment>
														),
													},
												},
											}}
										/>
									</Stack>
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
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<CustomAutoCompleteSelect
											size="small"
											id="client"
											noOptionsText="Aucun client trouvée"
											label="Sélectionner un client *"
											items={clientItems}
											theme={theme}
											value={clientItems.find((item) => item.value === String(formik.values.client)) || null}
											onBlur={formik.handleBlur('client')}
											error={formik.touched.client && Boolean(formik.errors.client)}
											helperText={formik.touched.client ? formik.errors.client : ''}
											onChange={(_, newValue) => {
												formik.setFieldValue('client', newValue ? Number(newValue.value) : 0);
											}}
											startIcon={<PersonIcon fontSize="small" color="action" />}
											endIcon={
												<Button size="small" variant="outlined" onClick={() => router.push(CLIENTS_ADD(company_id))}>
													Ajouter
												</Button>
											}
										/>
									</Stack>
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
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<CustomAutoCompleteSelect
											id="mode_paiement"
											size="small"
											noOptionsText="Aucun mode de paiement trouvé"
											label="Mode de paiement *"
											items={modePaiementItems}
											theme={theme}
											value={selectedModePaiement}
											fullWidth
											onChange={(_, newVal) => {
												formik.setFieldValue('mode_paiement', newVal ? Number(newVal.value) : null);
											}}
											onBlur={formik.handleBlur('mode_paiement')}
											error={formik.touched.mode_paiement && Boolean(formik.errors.mode_paiement)}
											helperText={formik.touched.mode_paiement ? formik.errors.mode_paiement : ''}
											startIcon={<PaymentIcon fontSize="small" color="action" />}
											endIcon={
												<Button
													size="small"
													variant="outlined"
													onClick={() => setOpenModePaiementModal(true)}
													sx={{ ml: 1 }}
												>
													Ajouter
												</Button>
											}
										/>
										<CustomTextInput
											id="numero_demande_prix_client"
											type="text"
											label="Numéro demande prix client"
											value={formik.values.numero_demande_prix_client || ''}
											onChange={formik.handleChange('numero_demande_prix_client')}
											onBlur={formik.handleBlur('numero_demande_prix_client')}
											error={
												formik.touched.numero_demande_prix_client && Boolean(formik.errors.numero_demande_prix_client)
											}
											helperText={
												formik.touched.numero_demande_prix_client ? formik.errors.numero_demande_prix_client : ''
											}
											fullWidth={true}
											size="small"
											theme={inputTheme}
											startIcon={<ReceiptIcon fontSize="small" color="action" />}
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
											value={formik.values.remarque || ''}
											onChange={formik.handleChange('remarque')}
											onBlur={formik.handleBlur('remarque')}
											error={formik.touched.remarque && Boolean(formik.errors.remarque)}
											helperText={formik.touched.remarque ? formik.errors.remarque : ''}
											fullWidth={true}
											size="small"
											theme={inputTheme}
											startIcon={<NotesIcon fontSize="small" color="action" />}
										/>
									</Stack>
								</CardContent>
							</Card>
							{/* Submit Button */}
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
								<PrimaryLoadingButton
									buttonText={'Ajouter des articles'}
									active={!isPending}
									type="submit"
									loading={isPending}
									cssClass={Styles.submitButton}
								/>
							</Box>
						</Stack>
					</form>
				)}
			</Stack>
			<AddEntityModal
				open={openModePaiementModal}
				setOpen={setOpenModePaiementModal}
				label="mode de paiement"
				icon={<PaymentIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={addModePaiement}
			/>
		</LocalizationProvider>
	);
};

interface Props extends SessionProps {
	company_id: number;
}

const DevisAddForm: React.FC<Props> = ({ session, company_id }) => {
	const token = getAccessTokenFromSession(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((comp) => comp.id === company_id);

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title="Ajouter un devis">
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{company?.role === 'Admin' ? (
						<Box sx={{ width: '100%' }}>
							<FormikContent company_id={company_id} token={token} />
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
									Vous n&#39;avez pas le droit d&#39;ajouter un devi. Veuillez contacter votre administrateur.
								</Typography>
							</Paper>
						</Container>
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default DevisAddForm;
