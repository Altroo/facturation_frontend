'use client';

import React, { useMemo, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import {
	Box,
	Container,
	Divider,
	Paper,
	Stack,
	Tab,
	Tabs,
	Typography,
	Alert,
} from '@mui/material';
import {
	Business as BusinessIcon,
	Save as SaveIcon,
	TrendingUp as TrendingUpIcon,
	Receipt as ReceiptIcon,
	Percent as PercentIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { monthlyObjectivesSchema } from '@/utils/formValidationSchemas';

import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import NoPermission from '@/components/shared/noPermission/noPermission';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';

import { getAccessTokenFromSession } from '@/store/session';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getProfilState } from '@/store/selectors';
import {
	useGetAllMonthlyObjectivesSettingsQuery,
	useCreateMonthlyObjectivesSettingsMutation,
	useUpdateMonthlyObjectivesSettingsMutation,
} from '@/store/services/dashboard';
import type { MonthlyObjectivesSettings } from '@/store/services/dashboard';
import { parseNumber, setFormikAutoErrors, getLabelForKey } from '@/utils/helpers';
import { textInputTheme } from '@/utils/themes';

const inputTheme = textInputTheme();

type CompanyLike = {
	id: number;
	raison_sociale: string;
	role: string;
};

// Form values type
type MonthlyObjectivesFormValues = {
	objectif_ca: string | number;
	objectif_factures: number;
	objectif_conversion: string | number;
	globalError: string;
};

// Props for the FormikContent component
type FormikContentProps = {
	companyId: number;
	existingObjectives?: MonthlyObjectivesSettings | null;
};

const FormikContent: React.FC<FormikContentProps> = ({ companyId, existingObjectives }) => {
	const { onSuccess, onError } = useToast();
	const isEditMode = existingObjectives !== undefined && existingObjectives !== null;

	const [addData, { isLoading: isAddLoading, error: addError }] = useCreateMonthlyObjectivesSettingsMutation();
	const [updateData, { isLoading: isUpdateLoading, error: updateError }] = useUpdateMonthlyObjectivesSettingsMutation();

	const error = isEditMode ? updateError : addError;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const [isPending, setIsPending] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

	const formik = useFormik<MonthlyObjectivesFormValues>({
		initialValues: {
			objectif_ca: existingObjectives?.objectif_ca || '0',
			objectif_factures: existingObjectives?.objectif_factures || 0,
			objectif_conversion: existingObjectives?.objectif_conversion || '0',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(monthlyObjectivesSchema),
		onSubmit: async (data, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...payload } = data;

			try {
				const submitData = {
					company: companyId,
					objectif_ca: payload.objectif_ca.toString(),
					objectif_factures: payload.objectif_factures,
					objectif_conversion: payload.objectif_conversion.toString(),
				};

				if (isEditMode && existingObjectives) {
					await updateData({ id: existingObjectives.id, data: submitData }).unwrap();
					onSuccess('Objectifs mis à jour avec succès');
				} else {
					await addData(submitData).unwrap();
					onSuccess('Objectifs créés avec succès');
				}
			} catch (e) {
				if (isEditMode) {
					onError('La mise à jour des objectifs a échoué.');
				} else {
					onError('La création des objectifs a échoué.');
				}
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	// Collect validation errors from Formik
	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			objectif_ca: 'Objectif CA',
			objectif_factures: 'Objectif Factures',
			objectif_conversion: 'Objectif Conversion',
			globalError: 'Erreur globale',
		}),
		[],
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

	const isLoading = isAddLoading || isUpdateLoading || isPending;
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			{hasValidationErrors && (
				<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
					<Typography variant="subtitle2" fontWeight={600}>
						Erreurs de validation détectées:
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
						{/* Objectifs Mensuels Card */}
						<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
							<TrendingUpIcon color="primary" />
							<Typography variant="h6" fontWeight={700}>
								Objectifs Mensuels
							</Typography>
						</Stack>
						<Divider sx={{ mb: 3 }} />
						<Stack spacing={2.5}>
							<CustomTextInput
								id="objectif_ca"
								type="number"
								label="Objectif CA (MAD) *"
								value={String(formik.values.objectif_ca) ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									const raw = (e.target as HTMLInputElement).value;
									const parsed = parseNumber(raw);
									if (parsed !== null && parsed < 0) return;
									formik.setFieldValue('objectif_ca', parsed === null ? raw : parsed);
								}}
								onBlur={formik.handleBlur('objectif_ca')}
								error={formik.touched.objectif_ca && Boolean(formik.errors.objectif_ca)}
								helperText={formik.touched.objectif_ca ? formik.errors.objectif_ca : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<TrendingUpIcon fontSize="small" />}
								slotProps={{
									htmlInput: { step: 0.01 },
								}}
							/>

							<CustomTextInput
								id="objectif_factures"
								type="number"
								label="Objectif Factures (nombre) *"
								value={String(formik.values.objectif_factures) ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									const raw = (e.target as HTMLInputElement).value;
									const parsed = parseNumber(raw);
									if (parsed !== null && parsed < 0) return;
									formik.setFieldValue('objectif_factures', parsed === null ? raw : parsed);
								}}
								onBlur={formik.handleBlur('objectif_factures')}
								error={formik.touched.objectif_factures && Boolean(formik.errors.objectif_factures)}
								helperText={formik.touched.objectif_factures ? formik.errors.objectif_factures : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<ReceiptIcon fontSize="small" />}
							/>

							<CustomTextInput
								id="objectif_conversion"
								type="number"
								label="Objectif Conversion (%) *"
								value={String(formik.values.objectif_conversion) ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									const raw = (e.target as HTMLInputElement).value;
									const parsed = parseNumber(raw);
									if (parsed !== null && parsed < 0) return;
									formik.setFieldValue('objectif_conversion', parsed === null ? raw : parsed);
								}}
								onBlur={formik.handleBlur('objectif_conversion')}
								error={formik.touched.objectif_conversion && Boolean(formik.errors.objectif_conversion)}
								helperText={formik.touched.objectif_conversion ? formik.errors.objectif_conversion : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<PercentIcon fontSize="small" />}
								slotProps={{
									input: {
										inputProps: { step: '0.01', min: 0, max: 100 },
									},
								}}
							/>
						</Stack>

						{/* Submit Button */}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? 'Mettre à jour' : 'Créer les objectifs'}
								active={!isPending}
								type="submit"
								loading={isPending}
								startIcon={<SaveIcon />}
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									setHasAttemptedSubmit(true);
									if (!formik.isValid) {
										e.preventDefault();
										formik.handleSubmit();
										onError('Veuillez corriger les erreurs de validation avant de soumettre.');
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}
								}}
								cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
							/>
						</Box>
					</Stack>
				</form>
			)}
		</Stack>
	);
};

const MonthlyObjectivesView: React.FC<SessionProps> = ({ session }) => {
	const token = getAccessTokenFromSession(session);
	const profil = useAppSelector(getProfilState);
	const is_staff = profil?.is_staff || false;
	const { data: companiesData, isLoading: isLoadingCompanies } = useGetUserCompaniesQuery(undefined, { skip: !token });
	const { data: objectivesData, isLoading: isLoadingObjectives } = useGetAllMonthlyObjectivesSettingsQuery(
		undefined,
		{ skip: !token },
	);
	const [selectedIndex, setSelectedIndex] = useState(0);

	const companies = useMemo(() => (companiesData ?? []) as CompanyLike[], [companiesData]);
	const selectedCompany = useMemo(() => companies?.[selectedIndex] ?? null, [companies, selectedIndex]);

	const objectives = useMemo(() => {
		if (!objectivesData || !selectedCompany) return undefined;
		return objectivesData.find((obj) => obj.company === selectedCompany.id);
	}, [objectivesData, selectedCompany]);

	const handleChange = (_: React.SyntheticEvent, newValue: number) => {
		setSelectedIndex(newValue);
	};

	if (isLoadingCompanies || isLoadingObjectives) {
		return <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;
	}

	if (!is_staff) {
		return (
			<Stack
				direction="column"
				spacing={2}
				className={Styles.flexRootStack}
				mt="40px"
				sx={{ overflowX: 'auto', overflowY: 'hidden' }}
			>
				<NavigationBar title="Paramètres - Objectifs Mensuels">
					<NoPermission />
				</NavigationBar>
			</Stack>
		);
	}

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			mt="40px"
			sx={{ overflowX: 'auto', overflowY: 'hidden' }}
		>
			<NavigationBar title="Paramètres - Objectifs Mensuels">
				{!companies || companies.length === 0 ? (
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
								<BusinessIcon sx={{ fontSize: 48, color: '#0D070B', opacity: 0.6 }} />
							</Box>
							<Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
								Aucune entreprise trouvée
							</Typography>
							<Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
								Vous n&#39;avez pas encore d&#39;entreprises associées à votre compte.
							</Typography>
						</Paper>
					</Container>
				) : (
					<>
						<Paper
							elevation={0}
							sx={{
								width: '100%',
								borderBottom: 1,
								borderColor: 'divider',
								mb: 2,
								bgcolor: 'background.paper',
								borderRadius: '8px 8px 0 0',
							}}
						>
							<Tabs
								value={selectedIndex}
								onChange={handleChange}
								variant="scrollable"
								allowScrollButtonsMobile
								scrollButtons="auto"
								aria-label="companies tabs"
								sx={{
									'& .MuiTabs-indicator': {
										height: 3,
										borderRadius: '3px 3px 0 0',
									},
									'& .MuiTab-root': {
										textTransform: 'none',
										fontSize: '0.95rem',
										fontWeight: 500,
										minHeight: 56,
										px: 3,
										transition: 'all 0.2s ease',
										'&:hover': {
											backgroundColor: 'action.hover',
										},
										'&.Mui-selected': {
											fontWeight: 600,
										},
									},
									'& .MuiTabs-scrollButtons': {
										'&.Mui-disabled': {
											opacity: 0.3,
										},
									},
								}}
							>
								{companies.map((company) => (
									<Tab key={company.id} label={company.raison_sociale} />
								))}
							</Tabs>
						</Paper>
						{selectedCompany ? (
							<FormikContent companyId={selectedCompany.id} existingObjectives={objectives} />
						) : null}
					</>
				)}
			</NavigationBar>
		</Stack>
	);
};

export default MonthlyObjectivesView;
