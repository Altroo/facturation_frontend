'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import { useAddDeviMutation, useEditDeviMutation, useGetDeviQuery, useGetNumDevisQuery } from '@/store/services/devi';
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
} from '@mui/material';
import {
	ArrowBack,
	Description as DescriptionIcon,
	Person as PersonIcon,
	Payment as PaymentIcon,
	Discount as DiscountIcon,
	CalendarToday as CalendarTodayIcon,
	Numbers as NumbersIcon,
	Receipt as ReceiptIcon,
	Notes as NotesIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { deviSchema } from '@/utils/formValidationSchemas';
import { setFormikAutoErrors } from '@/utils/helpers';
import { coordonneeTextInputTheme, customDropdownTheme } from '@/utils/themes';
import { DEVIS_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import type { DeviSchemaType } from '@/types/devisTypes';
import { Protected } from '@/components/layouts/protected/protected';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { useGetArticlesListQuery } from '@/store/services/article';
import { ArticleClass, ClientClass } from '@/models/Classes';
import { useGetClientsListQuery } from '@/store/services/client';
import { useAppSelector } from '@/utils/hooks';
import { getModePaiementState } from '@/store/selectors';
import { DropDownTypeTwo } from '@/types/accountTypes';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	company_id: number;
	id?: number;
	onSuccess: () => void;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, company_id, id, onSuccess } = props;
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetDeviQuery({ id: id! }, { skip: !token || !isEditMode });
	const [addData, { isLoading: isAddLoading, error: addError }] = useAddDeviMutation();
	const [updateData, { isLoading: isUpdateLoading, error: updateError }] = useEditDeviMutation();
	const { data: rawArticlesData, isLoading: isArticlesLoading } = useGetArticlesListQuery(
		{ company_id, with_pagination: false },
		{ skip: !token },
	);
	const articlesData = rawArticlesData as Array<Partial<ArticleClass>> | undefined;
	const { data: rawClientsData, isLoading: isClientsLoading } = useGetClientsListQuery(
		{ company_id, with_pagination: false },
		{ skip: !token },
	);
	const clientsData = rawClientsData as Array<Partial<ClientClass>> | undefined;
	const error = isEditMode ? dataError || updateError : addError;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const [isPending, setIsPending] = useState(false);
	const router = useRouter();

	const { data: generatedNumDevis, isLoading: isNumDevisLoading } = useGetNumDevisQuery(undefined, {
		skip: !token || isEditMode,
	});

	// Split numero_devis into number and year parts
	const initialNumDevis = isEditMode ? (rawData?.numero_devis ?? '') : (generatedNumDevis?.numero_devis ?? '');
	const [numDevisNumber, numDevisYear] = initialNumDevis ? initialNumDevis.split('/') : ['', ''];

	// get mode_paiement
	const modePaiement = useAppSelector(getModePaiementState);

	// Prepare client items for dropdown - show label but value is still the label
	const clientItems = useMemo(() => {
		if (!clientsData) return [];
		return clientsData.map((client) => {
			const label =
				client.client_type === 'PP' ? `${client.nom || ''} ${client.prenom || ''}`.trim() : client.raison_sociale || '';
			return {
				value: label,
				label: label,
			};
		}) as Array<DropDownTypeTwo>;
	}, [clientsData]);

	// Create a map to get client ID from label
	const clientLabelToId = useMemo(() => {
		if (!clientsData) return new Map<string, number>();
		const map = new Map<string, number>();
		clientsData.forEach((client) => {
			const label =
				client.client_type === 'PP' ? `${client.nom || ''} ${client.prenom || ''}`.trim() : client.raison_sociale || '';
			map.set(label, client.id!);
		});
		return map;
	}, [clientsData]);

	// Create a map to get client label from ID
	const clientIdToLabel = useMemo(() => {
		if (!clientsData) return new Map<number, string>();
		const map = new Map<number, string>();
		clientsData.forEach((client) => {
			const label =
				client.client_type === 'PP' ? `${client.nom || ''} ${client.prenom || ''}`.trim() : client.raison_sociale || '';
			map.set(client.id!, label);
		});
		return map;
	}, [clientsData]);

	// Prepare mode_paiement items for dropdown - show label but value is still the label
	const modePaiementItems = useMemo(() => {
		if (!modePaiement) return [];
		return modePaiement.map((mode) => ({
			value: mode.nom || '',
			label: mode.nom || '',
		})) as Array<DropDownTypeTwo>;
	}, [modePaiement]);

	// Create a map to get mode_paiement ID from label
	const modePaiementLabelToId = useMemo(() => {
		if (!modePaiement) return new Map<string, number>();
		const map = new Map<string, number>();
		modePaiement.forEach((mode) => {
			map.set(mode.nom || '', mode.id!);
		});
		return map;
	}, [modePaiement]);

	// Create a map to get mode_paiement label from ID
	const modePaiementIdToLabel = useMemo(() => {
		if (!modePaiement) return new Map<number, string>();
		const map = new Map<number, string>();
		modePaiement.forEach((mode) => {
			map.set(mode.id!, mode.nom || '');
		});
		return map;
	}, [modePaiement]);

	// Prepare remise type items
	const remiseTypeItems = useMemo(
		() =>
			[
				{ value: '', label: '' },
				{ value: 'Pourcentage', label: 'Pourcentage' },
				{ value: 'Fixe', label: 'Fixe' },
			] as Array<DropDownTypeTwo>,
		[],
	);

	const [devisNumberPart, setDevisNumberPart] = useState(numDevisNumber);
	const [devisYearPart, setDevisYearPart] = useState(numDevisYear);

	// Update state when numDevisNumber or numDevisYear changes
	useEffect(() => {
		setDevisNumberPart(numDevisNumber);
		setDevisYearPart(numDevisYear);
	}, [numDevisNumber, numDevisYear]);

	const formik = useFormik<DeviSchemaType>({
		initialValues: {
			numero_devis: initialNumDevis,
			client: rawData?.client ?? 0,
			date_devis: rawData?.date_devis ?? new Date().toISOString().split('T')[0],
			numero_demande_prix_client: rawData?.numero_demande_prix_client ?? null,
			mode_paiement: rawData?.mode_paiement ?? 0,
			remarque: rawData?.remarque ?? null,
			remise_type: rawData?.remise_type,
			remise: rawData?.remise,
			lignes: rawData?.lignes ?? [],
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(deviSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			try {
				// Join the numero_devis parts before submitting
				const submissionData: Partial<DeviSchemaType> = {
					...data,
					numero_devis: `${devisNumberPart}/${devisYearPart}`,
				};
				// Don't send mode_paiement if it's 0
				if (submissionData.mode_paiement === 0) {
					delete submissionData.mode_paiement;
				}
				// Only send remise_type and remise if remise_type is defined
				if (!submissionData.remise_type) {
					delete submissionData.remise_type;
					delete submissionData.remise;
				}
				if (isEditMode) {
					await updateData({ data: submissionData as DeviSchemaType, id }).unwrap();
				} else {
					await addData({ data: submissionData as DeviSchemaType }).unwrap();
				}
				onSuccess();
				if (!isEditMode) {
					setTimeout(() => {
						router.replace(DEVIS_LIST);
					}, 1000);
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	const isLoading =
		isClientsLoading ||
		isNumDevisLoading ||
		isArticlesLoading ||
		isAddLoading ||
		isUpdateLoading ||
		isPending ||
		(isEditMode && isDataLoading);

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
					<form>
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
										<CustomDropDownSelect
											id="client"
											label="Sélectionner un client *"
											items={clientItems}
											value={clientIdToLabel.get(formik.values.client) || null}
											onBlur={formik.handleBlur('client')}
											error={formik.touched.client && Boolean(formik.errors.client)}
											helperText={formik.touched.client ? formik.errors.client : ''}
											onChange={(e) => {
												const clientId = clientLabelToId.get(e.target.value as string) || 0;
												formik.setFieldValue('client', clientId);
											}}
											theme={customDropdownTheme()}
											startIcon={<PersonIcon fontSize="small" color="action" />}
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
										<CustomDropDownSelect
											id="mode_paiement"
											label="Mode de paiement *"
											items={modePaiementItems}
											value={modePaiementIdToLabel.get(formik.values.mode_paiement) || null}
											onBlur={formik.handleBlur('mode_paiement')}
											error={formik.touched.mode_paiement && Boolean(formik.errors.mode_paiement)}
											helperText={formik.touched.mode_paiement ? formik.errors.mode_paiement : ''}
											onChange={(e) => {
												const modePaiementId = modePaiementLabelToId.get(e.target.value as string) || 0;
												formik.setFieldValue('mode_paiement', modePaiementId);
											}}
											theme={customDropdownTheme()}
											startIcon={<PaymentIcon fontSize="small" color="action" />}
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

							{/* Discount */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<DiscountIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Remise
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<CustomDropDownSelect
											id="remise_type"
											label="Type de remise"
											items={remiseTypeItems}
											value={formik.values.remise_type || ''}
											onBlur={formik.handleBlur('remise_type')}
											error={formik.touched.remise_type && Boolean(formik.errors.remise_type)}
											helperText={formik.touched.remise_type ? formik.errors.remise_type : ''}
											onChange={(e) => {
												const value = e.target.value;
												formik.setFieldValue('remise_type', value === '' ? undefined : value);
												// Clear remise when remise_type is unset
												if (value === '') {
													formik.setFieldValue('remise', undefined);
												}
											}}
											theme={customDropdownTheme()}
											startIcon={<DiscountIcon fontSize="small" color="action" />}
										/>
										<CustomTextInput
											id="remise"
											type="number"
											label="Remise"
											value={
												formik.values.remise !== undefined && formik.values.remise !== null
													? String(formik.values.remise)
													: ''
											}
											onChange={(e) => {
												const value = e.target.value;
												if (value === '') {
													formik.setFieldValue('remise', undefined);
												} else {
													const numValue = parseInt(value, 10);
													formik.setFieldValue('remise', isNaN(numValue) ? undefined : numValue);
												}
											}}
											onBlur={formik.handleBlur('remise')}
											error={formik.touched.remise && Boolean(formik.errors.remise)}
											helperText={formik.touched.remise ? formik.errors.remise : ''}
											fullWidth={true}
											size="small"
											theme={inputTheme}
											startIcon={<DiscountIcon fontSize="small" color="action" />}
											slotProps={{
												input: {
													sx: {
														'& input[type=number]': {
															MozAppearance: 'textfield',
														},
														'& input[type=number]::-webkit-outer-spin-button': {
															WebkitAppearance: 'none',
															margin: 0,
														},
														'& input[type=number]::-webkit-inner-spin-button': {
															WebkitAppearance: 'none',
															margin: 0,
														},
													},
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
									buttonText={isEditMode ? 'Mettre à jour' : 'Ajouter des articles'}
									active={!isPending}
									onClick={formik.handleSubmit}
									loading={isPending}
									cssClass={Styles.submitButton}
								/>
							</Box>
						</Stack>
					</form>
				)}
			</Stack>
		</LocalizationProvider>
	);
};

interface Props extends SessionProps {
	company_id: number;
	id?: number;
}

const DevisForm: React.FC<Props> = ({ session, company_id, id }) => {
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);
	const isEditMode = id !== undefined;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? 'Modifier devis' : 'Ajouter un devis'}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Protected>
						<Box sx={{ width: '100%' }}>
							<FormikContent company_id={company_id} token={token} id={id} onSuccess={() => setShowDataUpdated(true)} />
						</Box>
					</Protected>
				</main>
			</NavigationBar>
			<Portal id="snackbar_portal">
				<CustomToast
					type="success"
					message={isEditMode ? 'Devis mise à jour' : 'Devis ajouter avec succès.'}
					setShow={setShowDataUpdated}
					show={showDataUpdated}
				/>
			</Portal>
		</Stack>
	);
};

export default DevisForm;
