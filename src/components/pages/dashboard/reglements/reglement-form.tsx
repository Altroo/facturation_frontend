'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	InputAdornment,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	AttachMoney as AttachMoneyIcon,
	CalendarToday as CalendarTodayIcon,
	Edit as EditIcon,
	Notes as NotesIcon,
	Payment as PaymentIcon,
	Receipt as ReceiptIcon,
	Warning as WarningIcon,
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
import { textInputTheme } from '@/utils/themes';
import { FACTURE_CLIENT_ADD, REGLEMENTS_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import type { DropDownType } from '@/types/accountTypes';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';
import { useAddReglementMutation, useEditReglementMutation, useGetReglementQuery } from '@/store/services/reglement';
import { useGetFactureClientForPaymentQuery } from '@/store/services/factureClient';
import { formatLocalDate, formatNumber, getLabelForKey, parseNumber, setFormikAutoErrors } from '@/utils/helpers';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import type { ReglementSchemaType } from '@/types/reglementTypes';
import { reglementSchema } from '@/utils/formValidationSchemas';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useInitAccessToken } from '@/contexts/InitContext';
import EntityCrudControls from '@/components/shared/entityCrudControls/entityCrudControls';
import {
	useAddModePaiementMutation,
	useDeleteModePaiementMutation,
	useEditModePaiementMutation,
	useGetModePaiementListQuery,
} from '@/store/services/parameter';
import NoPermission from '@/components/shared/noPermission/noPermission';

const inputTheme = textInputTheme();

type FormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	facture_client_id?: number;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, company_id, id, facture_client_id } = props;
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();

	// Fetch reglement data if editing
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetReglementQuery({ id: id! }, { skip: !token || !isEditMode });

	// Fetch factures available for payment
	const { data: facturesForPayment, isLoading: isFacturesLoading } = useGetFactureClientForPaymentQuery(
		{ company_id },
		{ skip: !token },
	);

	// Mutations
	const [addReglement, { isLoading: isAddLoading, error: addError }] = useAddReglementMutation();
	const [updateReglement, { isLoading: isUpdateLoading, error: updateError }] = useEditReglementMutation();

	// Modes Règlement
	const { data: modesReglementsData } = useGetModePaiementListQuery({ company_id }, { skip: !token });
	const [addModeReglement] = useAddModePaiementMutation();
	const [editModeReglement] = useEditModePaiementMutation();
	const [deleteModeReglement] = useDeleteModePaiementMutation();

	const [isPending, setIsPending] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

	// Initial date as YYYY-MM-DD
	const today = formatLocalDate(new Date());

	// Formik
	const formik = useFormik<ReglementSchemaType>({
		initialValues: {
			facture_client: rawData?.facture_client ?? facture_client_id ?? 0,
			mode_reglement: rawData?.mode_reglement ?? null,
			libelle: rawData?.libelle ?? '',
			montant: rawData?.montant ?? 0,
			date_reglement: rawData?.date_reglement ?? today,
			date_echeance: rawData?.date_echeance ?? today,
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(reglementSchema),
		onSubmit: async (data, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...payload } = data;
			try {
				if (isEditMode) {
					await updateReglement({ data: payload, id: id! }).unwrap();
					onSuccess(t.reglements.updateSuccess);
				} else {
					await addReglement({ data: payload }).unwrap();
					onSuccess(t.reglements.addSuccess);
				}
				if (!isEditMode) {
					router.replace(REGLEMENTS_LIST);
				}
			} catch (e) {
				if (!isEditMode) {
					onError(t.reglements.addError);
				} else {
					onError(t.reglements.updateError);
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

	// Factures dropdown items - showing only unpaid or partially paid
	const factureItems: DropDownType[] = useMemo(() => {
		const items: DropDownType[] = [];

		// If editing, and we have rawData, include the current facture first
		if (isEditMode && rawData?.facture_client && rawData?.facture_client_numero) {
			items.push({
				value: String(rawData.facture_client),
				code: `${rawData.facture_client_numero} - ${rawData.client_name ?? 'Client inconnu'}`,
			});
		}

		// Add factures from the for_payment endpoint (only unpaid/partially paid)
		if (facturesForPayment) {
			facturesForPayment.forEach((f) => {
				if (!items.some((item) => item.value === String(f.id))) {
					const remaining = parseNumber(f.remaining_amount);
					const deviseLabel = f.devise || 'MAD';
					items.push({
						value: String(f.id),
						code: `${f.numero_facture} - ${f.client_name ?? 'Client inconnu'} (Reste: ${formatNumber(remaining)} ${deviseLabel})`,
					});
				}
			});
		}

		return items;
	}, [facturesForPayment, isEditMode, rawData]);

	const selectedFacture = useMemo<DropDownType | null>(() => {
		const v = formik.values.facture_client;
		if (!v || factureItems.length === 0) return null;
		return factureItems.find((f) => f.value === String(v)) ?? null;
	}, [formik.values.facture_client, factureItems]);

	// Get remaining amount for selected facture
	const selectedFactureRemainingAmount = useMemo<number>(() => {
		const v = formik.values.facture_client;
		if (!v || !facturesForPayment) return 0;
		const facture = facturesForPayment.find((f) => f.id === v);
		if (!facture) return 0;
		const parsed = parseNumber(facture.remaining_amount);
		return parsed ?? 0;
	}, [formik.values.facture_client, facturesForPayment]);

	// Disable montant field when no facture is selected
	const isMontantDisabled = !formik.values.facture_client || formik.values.facture_client === 0;

	// Handle facture selection change - clear montant when facture is removed
	// Only call setFieldValue when montant actually differs to avoid needless state updates
	useEffect(() => {
		if ((!formik.values.facture_client || formik.values.facture_client === 0) && formik.values.montant !== 0) {
			formik.setFieldValue('montant', 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formik.values.facture_client, formik.values.montant]);

	// Modes Règlement dropdown items
	const modeReglementItems: DropDownType[] = useMemo(
		() =>
			(modesReglementsData ?? []).map((m) => ({
				value: String(m.id),
				code: m.nom,
			})),
		[modesReglementsData],
	);

	const selectedModeReglement = useMemo<DropDownType | null>(() => {
		const v = formik.values.mode_reglement;
		if (!v || modeReglementItems.length === 0) return null;
		return modeReglementItems.find((m) => m.value === String(v)) ?? null;
	}, [formik.values.mode_reglement, modeReglementItems]);

	// Collect validation errors from Formik
	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			facture_client: t.reglements.fieldFactureClient,
			mode_reglement: t.reglements.fieldModeReglement,
			libelle: t.reglements.fieldLibelle,
			montant: t.reglements.fieldMontant,
			date_reglement: t.reglements.fieldDateReglement,
			date_echeance: t.reglements.fieldDateEcheance,
			globalError: t.common.genericError,
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

	const isLoading = isAddLoading || isUpdateLoading || isPending || (isEditMode && isDataLoading) || isFacturesLoading;
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	// Financial info for edit mode
	// In edit mode, use rawData.devise; in create mode, get devise from selected facture
	const selectedFactureData = useMemo(() => {
		const v = formik.values.facture_client;
		if (!v || !facturesForPayment) return null;
		return facturesForPayment.find((f) => f.id === v) ?? null;
	}, [formik.values.facture_client, facturesForPayment]);

	const devise = rawData?.devise || selectedFactureData?.devise || 'MAD';
	const montantFacture =
		rawData?.montant_facture !== undefined && rawData?.montant_facture !== null
			? `${formatNumber(rawData.montant_facture)} ${devise}`
			: null;
	const totalReglementsFacture =
		rawData?.total_reglements_facture !== undefined && rawData?.total_reglements_facture !== null
			? `${formatNumber(rawData.total_reglements_facture)} ${devise}`
			: null;
	const resteAPayer =
		rawData?.reste_a_payer !== undefined && rawData?.reste_a_payer !== null
			? `${formatNumber(rawData.reste_a_payer)} ${devise}`
			: `0 ${devise}`;

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				<Stack
					direction={isMobile ? 'column' : 'row'}
					spacing={2}
					sx={{
						pt: 2,
						justifyContent: 'space-between',
					}}
				>
					<Button
						variant="outlined"
						startIcon={<ArrowBackIcon />}
						onClick={() => router.push(REGLEMENTS_LIST)}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
					>
						{t.reglements.backToList}
					</Button>
				</Stack>
				{hasValidationErrors && (
					<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 600,
							}}
						>
							{t.common.validationErrors}
						</Typography>
						<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
							{Object.entries(validationErrors).map(([key, errorText]) => (
								<li key={key}>
									<Typography variant="body2">
										{getLabelForKey(fieldLabels, key)} : {errorText}
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
							{/* Financial info card for edit mode */}
							{isEditMode && montantFacture !== null && (
								<Card elevation={2} sx={{ borderRadius: 2, bgcolor: 'grey.50' }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction="row"
											spacing={2}
											sx={{
												alignItems: 'center',
												mb: 2,
											}}
										>
											<AttachMoneyIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.reglements.infoFinancieres}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 3 }} />
										<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
											<Box>
												<Typography
													variant="body2"
													sx={{
														color: 'text.secondary',
													}}
												>
													{t.reglements.montantFacture}
												</Typography>
												<Typography
													variant="h6"
													sx={{
														fontWeight: 600,
													}}
												>
													{montantFacture}
												</Typography>
											</Box>
											<Box>
												<Typography
													variant="body2"
													sx={{
														color: 'text.secondary',
													}}
												>
													{t.reglements.totalReglements}
												</Typography>
												<Typography
													variant="h6"
													sx={{
														fontWeight: 600,
														color: 'success.main',
													}}
												>
													{totalReglementsFacture}
												</Typography>
											</Box>
											<Box>
												<Typography
													variant="body2"
													sx={{
														color: 'text.secondary',
													}}
												>
													{t.reglements.resteAPayer}
												</Typography>
												<Typography
													variant="h6"
													sx={{
														fontWeight: 600,
														color: 'error.main',
													}}
												>
													{resteAPayer}
												</Typography>
											</Box>
										</Stack>
									</CardContent>
								</Card>
							)}

							{/* Facture Selection Card */}
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
										<ReceiptIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.reglements.labelFactureClient}
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<CustomAutoCompleteSelect
											id="facture_client"
											size="small"
											noOptionsText={t.reglements.noFacture}
											label={t.reglements.fieldFactureClient}
											theme={theme}
											items={factureItems}
											value={selectedFacture}
											fullWidth
											onChange={(_, newValue) => {
												formik.setFieldValue('facture_client', newValue?.value ? Number(newValue.value) : 0);
											}}
											onBlur={formik.handleBlur('facture_client')}
											error={formik.touched.facture_client && Boolean(formik.errors.facture_client)}
											helperText={formik.touched.facture_client ? formik.errors.facture_client : ''}
											disabled={isEditMode}
											startIcon={<ReceiptIcon fontSize="small" />}
											endIcon={
												!isEditMode && (
													<Button
														size="small"
														variant="outlined"
														onClick={() => router.push(FACTURE_CLIENT_ADD(company_id))}
														sx={{ ml: 1 }}
													>
														Ajouter
													</Button>
												)
											}
										/>
									</Stack>
								</CardContent>
							</Card>

							{/* Payment Details Card */}
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
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<CustomAutoCompleteSelect
											id="mode_reglement"
											size="small"
											noOptionsText={t.reglements.noModeReglement}
											label={t.reglements.fieldModeReglement}
											theme={theme}
											items={modeReglementItems}
											value={selectedModeReglement}
											fullWidth
											onChange={(_, newValue) => {
												formik.setFieldValue('mode_reglement', newValue?.value ? Number(newValue.value) : null);
											}}
											onBlur={formik.handleBlur('mode_reglement')}
											error={formik.touched.mode_reglement && Boolean(formik.errors.mode_reglement)}
											helperText={formik.touched.mode_reglement ? formik.errors.mode_reglement : ''}
											startIcon={<PaymentIcon fontSize="small" />}
											endIcon={
												<EntityCrudControls
													label={t.reglements.fieldModeReglement.toLowerCase()}
													icon={<PaymentIcon fontSize="small" />}
													inputTheme={inputTheme}
													selectedItem={selectedModeReglement}
													addEntity={(args) => addModeReglement({ data: { ...args.data, company: company_id } })}
													editEntity={({ id: entityId, data }) =>
														editModeReglement({ id: entityId, data: { ...data, company: company_id } })
													}
													deleteEntity={({ id: entityId }) => deleteModeReglement({ id: entityId })}
													onAddSuccess={(newId) => {
														formik.setFieldValue('mode_reglement', newId);
													}}
													onDeleteSuccess={() => {
														formik.setFieldValue('mode_reglement', null);
													}}
												/>
											}
										/>
										<CustomTextInput
											id="montant"
											type="text"
											label={`Montant (${devise}) *`}
											value={String(formik.values.montant)}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												const raw = e.target.value;
												const parsed = parseNumber(raw);
												if (parsed !== null && parsed < 0) return;
												// Enforce max value as remaining amount
												if (
													parsed !== null &&
													selectedFactureRemainingAmount > 0 &&
													parsed > selectedFactureRemainingAmount
												) {
													formik.setFieldValue('montant', selectedFactureRemainingAmount);
													return;
												}
												formik.setFieldValue('montant', parsed === null ? raw : parsed);
											}}
											onBlur={formik.handleBlur('montant')}
											error={formik.touched.montant && Boolean(formik.errors.montant)}
											helperText={
												formik.touched.montant
													? formik.errors.montant
													: isMontantDisabled
														? t.reglements.helpSelectFacture
														: selectedFactureRemainingAmount > 0
															? `Maximum: ${formatNumber(selectedFactureRemainingAmount)} ${devise}`
															: ''
											}
											disabled={isMontantDisabled}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<AttachMoneyIcon fontSize="small" />}
											slotProps={{
												input: {
													inputProps: { min: 0, step: '0.01' },
												},
											}}
										/>
										<CustomTextInput
											id="libelle"
											type="text"
											label={t.reglements.fieldLibelle}
											value={formik.values.libelle ?? ''}
											onChange={formik.handleChange('libelle')}
											onBlur={formik.handleBlur('libelle')}
											error={formik.touched.libelle && Boolean(formik.errors.libelle)}
											helperText={formik.touched.libelle ? formik.errors.libelle : ''}
											fullWidth={false}
											size="small"
											theme={inputTheme}
											startIcon={<NotesIcon fontSize="small" />}
										/>
									</Stack>
								</CardContent>
							</Card>

							{/* Dates Card */}
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
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<DatePicker
											label={t.reglements.fieldDateReglement}
											value={formik.values.date_reglement ? new Date(formik.values.date_reglement) : null}
											onChange={(date) => formik.setFieldValue('date_reglement', date ? formatLocalDate(date) : '')}
											format="dd/MM/yyyy"
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
													slotProps: {
														htmlInput: {
															'data-testid': 'input-date_reglement',
														} as React.InputHTMLAttributes<HTMLInputElement>,
														input: {
															startAdornment: (
																<InputAdornment position="start">
																	<CalendarTodayIcon fontSize="small" color="action" />
																</InputAdornment>
															),
														},
													},
												},
											}}
										/>
										<DatePicker
											label={t.reglements.fieldDateEcheance}
											value={formik.values.date_echeance ? new Date(formik.values.date_echeance) : null}
											onChange={(date) => formik.setFieldValue('date_echeance', date ? formatLocalDate(date) : '')}
											format="dd/MM/yyyy"
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
													slotProps: {
														htmlInput: {
															'data-testid': 'input-date_echeance',
														} as React.InputHTMLAttributes<HTMLInputElement>,
														input: {
															startAdornment: (
																<InputAdornment position="start">
																	<CalendarTodayIcon fontSize="small" color="action" />
																</InputAdornment>
															),
														},
													},
												},
											}}
										/>
									</Stack>
								</CardContent>
							</Card>

							{/* Submit Button */}
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
								<PrimaryLoadingButton
									buttonText={isEditMode ? t.common.update : t.reglements.addTitle}
									active={!isPending}
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
									type="submit"
									startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
									loading={isPending}
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
	facture_client_id?: number;
}

const ReglementForm: React.FC<Props> = ({ session, company_id, id, facture_client_id }) => {
	const token = useInitAccessToken(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((comp) => comp.id === company_id);
	const { t } = useLanguage();

	const isEditMode = id !== undefined;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? t.reglements.editTitle : t.reglements.addTitle}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{company?.role === 'Caissier' || company?.role === 'Commercial' ? (
						<Box sx={{ width: '100%' }}>
							<FormikContent token={token} id={id} company_id={company_id} facture_client_id={facture_client_id} />
						</Box>
					) : (
						<NoPermission />
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default ReglementForm;
