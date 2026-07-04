'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	AttachFile as AttachFileIcon,
	CalendarToday as CalendarTodayIcon,
	Clear as ClearIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Info as InfoIcon,
	InsertDriveFile as InsertDriveFileIcon,
	LocalShipping as LocalShippingIcon,
	Notes as NotesIcon,
	Payment as PaymentIcon,
	Person as PersonIcon,
	Public as PublicIcon,
	ReceiptLong as ReceiptLongIcon,
	RequestQuote as RequestQuoteIcon,
	Scale as ScaleIcon,
	UploadFile as UploadFileIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { useFormik } from 'formik';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import FormattedNumberInput from '@/components/formikElements/formattedNumberInput/formattedNumberInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import NoPermission from '@/components/shared/noPermission/noPermission';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getUserCompaniesState } from '@/store/selectors';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage, formatLocalDate, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { textInputTheme } from '@/utils/themes';
import { useGetFactureProFormaListQuery } from '@/store/services/factureProForma';
import {
	useAddLogistiqueMutation,
	useEditLogistiqueMutation,
	useGetLogistiqueQuery,
	useGetLogistiqueResponsablesQuery,
} from '@/store/services/logistique';
import { LOGISTIQUE_LIST, LOGISTIQUE_VIEW } from '@/utils/routes';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { DropDownType } from '@/types/accountTypes';
import type { FactureClass } from '@/models/classes';
import type { LogistiqueDocumentField, LogistiqueFormValues, LogistiqueOrder, LogistiqueResponsibleOption } from '@/types/logistiqueTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

interface Props extends SessionProps {
	company_id: number;
	id?: number;
}

const inputTheme = textInputTheme();
const managerRoles = new Set(['Caissier', 'Commercial', 'Logistique']);

const statusOptions: LogistiqueFormValues['statut'][] = [
	'Réception commande',
	'Commande fournisseur',
	'Proforma',
	"Titre d'Importation",
	'Validation',
	'Paiement demandé',
	'Paiement effectué',
	'SWIFT / Draft LC',
	'Envoi SWIFT / Draft LC',
	'Production',
	'Expédition',
	'Documents originaux',
	'Transit',
	'Dédouanement',
	'Réception locale',
	'Livraison client',
	'Clôture',
	'Annulé',
];

const tiStatusOptions: LogistiqueFormValues['statut_titre_importation'][] = [
	'À ouvrir',
	'Déposé',
	'En attente',
	'Validé',
	'Refusé',
	'Expiré',
	'Clôturé',
];

const paymentMethodOptions: LogistiqueFormValues['methode_paiement'][] = ['', 'LC', 'Virement', 'Remise documentaire'];
const currencyOptions = ['MAD', 'EUR', 'USD'];
const documentFields: LogistiqueDocumentField[] = [
	'titre_importation_file',
	'proforma_fournisseur_file',
	'justificatifs_file',
	'swift_file',
	'documents_originaux_file',
];
const acceptedDocumentTypes = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';

const emptyValues: LogistiqueFormValues = {
	proformas: [],
	fournisseur: '',
	devise: 'MAD',
	incoterm: '',
	transport: '',
	conditions_paiement: '',
	responsable: '',
	date_prevue: '',
	date_reelle: '',
	statut: 'Réception commande',
	poids_net: '0',
	poids_brut: '0',
	volume: '0',
	origine_marchandise: '',
	nature_marchandise: '',
	numero_domiciliation: '',
	banque: '',
	montant_titre_importation: '0',
	devise_titre_importation: 'MAD',
	date_titre_importation: '',
	date_validation_titre_importation: '',
	statut_titre_importation: 'À ouvrir',
	methode_paiement: '',
	date_paiement: '',
	montant_paiement: '0',
	reference_paiement: '',
	cout_transport: '0',
	frais_transit: '0',
	frais_douane: '0',
	tva: '0',
	livraison_locale: '0',
	autres_frais: '0',
	titre_importation_file: null,
	proforma_fournisseur_file: null,
	justificatifs_file: null,
	swift_file: null,
	documents_originaux_file: null,
};

const stringValue = (value: string | number | null | undefined, fallback = '') => String(value ?? fallback);
const dateValue = (value: string | null | undefined) => value ?? '';
const nullableDate = (value: string) => (value ? value : null);
const numberString = (value: string) => (value === '' ? '0' : value);

const valuesFromOrder = (order?: LogistiqueOrder): LogistiqueFormValues => {
	if (!order) return emptyValues;
	return {
		proformas: order.proformas_detail?.map((proforma) => proforma.id) ?? [],
		fournisseur: order.fournisseur ?? '',
		devise: order.devise ?? 'MAD',
		incoterm: order.incoterm ?? '',
		transport: order.transport ?? '',
		conditions_paiement: order.conditions_paiement ?? '',
		responsable: order.responsable ? String(order.responsable) : '',
		date_prevue: dateValue(order.date_prevue),
		date_reelle: dateValue(order.date_reelle),
		statut: order.statut,
		poids_net: stringValue(order.poids_net, '0'),
		poids_brut: stringValue(order.poids_brut, '0'),
		volume: stringValue(order.volume, '0'),
		origine_marchandise: order.origine_marchandise ?? '',
		nature_marchandise: order.nature_marchandise ?? '',
		numero_domiciliation: order.numero_domiciliation ?? '',
		banque: order.banque ?? '',
		montant_titre_importation: stringValue(order.montant_titre_importation, '0'),
		devise_titre_importation: order.devise_titre_importation ?? 'MAD',
		date_titre_importation: dateValue(order.date_titre_importation),
		date_validation_titre_importation: dateValue(order.date_validation_titre_importation),
		statut_titre_importation: order.statut_titre_importation,
		methode_paiement: order.methode_paiement ?? '',
		date_paiement: dateValue(order.date_paiement),
		montant_paiement: stringValue(order.montant_paiement, '0'),
		reference_paiement: order.reference_paiement ?? '',
		cout_transport: stringValue(order.cout_transport, '0'),
		frais_transit: stringValue(order.frais_transit, '0'),
		frais_douane: stringValue(order.frais_douane, '0'),
		tva: stringValue(order.tva, '0'),
		livraison_locale: stringValue(order.livraison_locale, '0'),
		autres_frais: stringValue(order.autres_frais, '0'),
		titre_importation_file: null,
		proforma_fournisseur_file: null,
		justificatifs_file: null,
		swift_file: null,
		documents_originaux_file: null,
	};
};

const toPayloadObject = (values: LogistiqueFormValues, isEditMode: boolean) => {
	const payload: Record<string, unknown> = {
		...values,
		responsable: values.responsable ? Number(values.responsable) : null,
		date_prevue: nullableDate(values.date_prevue),
		date_reelle: nullableDate(values.date_reelle),
		date_titre_importation: nullableDate(values.date_titre_importation),
		date_validation_titre_importation: nullableDate(values.date_validation_titre_importation),
		date_paiement: nullableDate(values.date_paiement),
		poids_net: numberString(values.poids_net),
		poids_brut: numberString(values.poids_brut),
		volume: numberString(values.volume),
		montant_titre_importation: numberString(values.montant_titre_importation),
		montant_paiement: numberString(values.montant_paiement),
		cout_transport: numberString(values.cout_transport),
		frais_transit: numberString(values.frais_transit),
		frais_douane: numberString(values.frais_douane),
		tva: numberString(values.tva),
		livraison_locale: numberString(values.livraison_locale),
		autres_frais: numberString(values.autres_frais),
	};
	if (isEditMode) {
		delete payload.proformas;
	}
	return payload;
};

const toPayload = (values: LogistiqueFormValues, isEditMode: boolean): Partial<LogistiqueFormValues> | FormData => {
	const payload = toPayloadObject(values, isEditMode);
	const hasFiles = documentFields.some((field) => values[field] instanceof File);

	if (!hasFiles) {
		documentFields.forEach((field) => delete payload[field]);
		return payload as Partial<LogistiqueFormValues>;
	}

	const formData = new FormData();
	Object.entries(payload).forEach(([key, value]) => {
		if (documentFields.includes(key as LogistiqueDocumentField)) {
			if (value instanceof File) {
				formData.append(key, value);
			}
			return;
		}
		if (Array.isArray(value)) {
			value.forEach((item) => formData.append(key, String(item)));
			return;
		}
		if (value !== null && value !== undefined) {
			formData.append(key, String(value));
		}
	});
	return formData;
};

type FormCardProps = {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
};

const FormCard: React.FC<FormCardProps> = ({ title, icon, children }) => (
	<Card elevation={2} sx={{ borderRadius: 2 }}>
		<CardContent sx={{ p: 3 }}>
			<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
				{icon}
				<Typography variant="h6" sx={{ fontWeight: 700 }}>
					{title}
				</Typography>
			</Stack>
			<Divider sx={{ mb: 3 }} />
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
				{children}
			</Box>
		</CardContent>
	</Card>
);

const DateField = ({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) => (
	<DatePicker
		label={label}
		value={value ? new Date(value) : null}
		onChange={(date) => onChange(date ? formatLocalDate(date) : '')}
		format="dd/MM/yyyy"
		slotProps={{
			textField: {
				size: 'small',
				fullWidth: true,
				slotProps: {
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
);

type DocumentUploadFieldProps = {
	id: LogistiqueDocumentField;
	label: string;
	file: File | null;
	currentUrl?: string | null;
	onChange: (file: File | null) => void;
	onClear: () => void;
	uploadLabel: string;
	replaceLabel: string;
	selectedLabel: string;
	currentLabel: string;
	openLabel: string;
};

const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({
	id,
	label,
	file,
	currentUrl,
	onChange,
	onClear,
	uploadLabel,
	replaceLabel,
	selectedLabel,
	currentLabel,
	openLabel,
}) => (
	<Box
		sx={{
			border: '1px solid',
			borderColor: 'divider',
			borderRadius: 2,
			p: 2,
			minHeight: 118,
			display: 'flex',
			flexDirection: 'column',
			gap: 1.5,
			justifyContent: 'space-between',
		}}
	>
		<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
			<InsertDriveFileIcon color="primary" fontSize="small" />
			<Typography variant="subtitle2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
				{label}
			</Typography>
		</Stack>
		<input
			id={id}
			type="file"
			accept={acceptedDocumentTypes}
			hidden
			onChange={(event) => onChange(event.target.files?.[0] ?? null)}
		/>
		<Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
			<Button component="label" htmlFor={id} variant="outlined" size="small" startIcon={<UploadFileIcon />}>
				{currentUrl || file ? replaceLabel : uploadLabel}
			</Button>
			{currentUrl && !file && (
				<Button
					component="a"
					href={currentUrl}
					target="_blank"
					rel="noopener noreferrer"
					variant="text"
					size="small"
					startIcon={<AttachFileIcon />}
				>
					{openLabel}
				</Button>
			)}
			{file && (
				<IconButton size="small" color="error" onClick={onClear} aria-label={`clear-${id}`}>
					<ClearIcon fontSize="small" />
				</IconButton>
			)}
		</Stack>
		<Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
			{file ? `${selectedLabel}: ${file.name}` : currentUrl ? currentLabel : '-'}
		</Typography>
	</Box>
);

const LogistiqueForm: React.FC<Props> = ({ session, company_id, id }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const token = useInitAccessToken(session);
	const companiesState = useAppSelector(getUserCompaniesState);
	const { data: companiesData, isLoading: isCompaniesLoading } = useGetUserCompaniesQuery(undefined, { skip: !token });
	const companies = companiesData ?? companiesState;
	const company = companies?.find((item) => item.id === company_id);
	const isEditMode = id !== undefined;
	const canManage = company?.role ? managerRoles.has(company.role) : false;
	const { data: responsablesData, isLoading: isResponsablesLoading } = useGetLogistiqueResponsablesQuery(
		{ company_id },
		{ skip: !token || !canManage },
	);

	const {
		data: order,
		isLoading: isOrderLoading,
		error: dataError,
	} = useGetLogistiqueQuery({ id: id! }, { skip: !token || !isEditMode });
	const { data: proformasData, isLoading: isProformasLoading } = useGetFactureProFormaListQuery(
		{ company_id },
		{ skip: !token || isEditMode },
	);
	const [addLogistique, { isLoading: isAddLoading, error: addError }] = useAddLogistiqueMutation();
	const [editLogistique, { isLoading: isEditLoading, error: updateError }] = useEditLogistiqueMutation();
	const [isPending, setIsPending] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

	const proformas = useMemo(() => {
		if (!proformasData) return [] as Partial<FactureClass>[];
		return Array.isArray(proformasData) ? proformasData : proformasData.results;
	}, [proformasData]);
	const responsableOptions = useMemo<DropDownType[]>(
		() =>
			(responsablesData ?? []).map((responsable: LogistiqueResponsibleOption) => ({
				value: String(responsable.id),
				code: responsable.label,
			})),
		[responsablesData],
	);

	const initialValues = useMemo(() => valuesFromOrder(order), [order]);
	const error = isEditMode ? dataError || updateError : addError;
	const axiosError = error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;

	const formik = useFormik<LogistiqueFormValues>({
		initialValues,
		enableReinitialize: true,
		validateOnMount: true,
		validate: (values) => {
			const errors: Partial<Record<keyof LogistiqueFormValues, string>> = {};
			if (!isEditMode && values.proformas.length === 0) {
				errors.proformas = t.validation.required;
			}
			return errors;
		},
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			try {
				if (isEditMode && id) {
					await editLogistique({ id, data: toPayload(values, true) }).unwrap();
					onSuccess(t.logistique.updateSuccess);
					router.push(LOGISTIQUE_VIEW(id, company_id));
				} else {
					const response = await addLogistique({ company_id, data: toPayload(values, false) }).unwrap();
					onSuccess(t.logistique.addSuccess);
					const firstOrder = response.orders[0];
					router.push(firstOrder ? LOGISTIQUE_VIEW(firstOrder.id, company_id) : LOGISTIQUE_LIST);
				}
			} catch (e) {
				onError(extractApiErrorMessage(e, isEditMode ? t.logistique.updateError : t.logistique.addError));
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			proformas: t.logistique.fieldProformas,
			fournisseur: t.logistique.fieldFournisseur,
			responsable: t.logistique.fieldResponsable,
			transport: t.logistique.fieldTransport,
			statut: t.logistique.fieldStatut,
			titre_importation_file: t.logistique.fieldTitreImportationFile,
			proforma_fournisseur_file: t.logistique.fieldProformaFournisseurFile,
			justificatifs_file: t.logistique.fieldJustificatifsFile,
			swift_file: t.logistique.fieldSwiftFile,
			documents_originaux_file: t.logistique.fieldDocumentsOriginauxFile,
			globalError: t.common.genericError,
		}),
		[t],
	);
	const selectedResponsable = useMemo(
		() => responsableOptions.find((option) => option.value === formik.values.responsable) ?? null,
		[responsableOptions, formik.values.responsable],
	);
	const documentLabels = useMemo<Record<LogistiqueDocumentField, string>>(
		() => ({
			titre_importation_file: t.logistique.fieldTitreImportationFile,
			proforma_fournisseur_file: t.logistique.fieldProformaFournisseurFile,
			justificatifs_file: t.logistique.fieldJustificatifsFile,
			swift_file: t.logistique.fieldSwiftFile,
			documents_originaux_file: t.logistique.fieldDocumentsOriginauxFile,
		}),
		[t],
	);

	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) {
			Object.entries(formik.errors).forEach(([key, value]) => {
				if (typeof value === 'string') {
					errors[key] = value;
				}
			});
		}
		return errors;
	}, [formik.errors, hasAttemptedSubmit]);

	const isLoading = isCompaniesLoading || isOrderLoading || isProformasLoading || isResponsablesLoading || isAddLoading || isEditLoading || isPending;
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;
	const title = isEditMode ? t.logistique.editTitle : t.logistique.addTitle;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={title}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{canManage ? (
						<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
							<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
								<Stack
									direction={isMobile ? 'column' : 'row'}
									spacing={2}
									sx={{ pt: 2, justifyContent: 'space-between' }}
								>
									<Button
										variant="outlined"
										startIcon={<ArrowBackIcon />}
										onClick={() => router.push(LOGISTIQUE_LIST)}
										sx={{ width: isMobile ? '100%' : 'auto' }}
									>
										{t.logistique.backToList}
									</Button>
								</Stack>

								{Object.keys(validationErrors).length > 0 && (
									<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
										<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
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

								{isLoading ? (
									<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
								) : shouldShowError ? (
									<ApiAlert errorDetails={axiosError?.data.details} />
								) : (
									<form onSubmit={formik.handleSubmit}>
										<Stack spacing={3}>
											{!isEditMode && (
												<FormCard title={t.logistique.sourceSection} icon={<RequestQuoteIcon color="primary" />}>
													<Autocomplete
														multiple
														options={proformas}
														value={proformas.filter((proforma) => formik.values.proformas.includes(proforma.id as number))}
														getOptionLabel={(option) =>
															`${option.numero_facture ?? ''}${option.client_name ? ` - ${option.client_name}` : ''}`
														}
														isOptionEqualToValue={(option, value) => option.id === value.id}
														onChange={(_, selected) =>
															formik.setFieldValue('proformas', selected.map((item) => item.id).filter(Boolean))
														}
														renderInput={(params) => (
															<TextField
																{...params}
																size="small"
																label={t.logistique.fieldProformas}
																error={Boolean(formik.touched.proformas && formik.errors.proformas)}
																helperText={
																	formik.touched.proformas && formik.errors.proformas
																		? String(formik.errors.proformas)
																		: undefined
																}
																slotProps={{
																	...params.slotProps,
																	input: {
																		...params.slotProps.input,
																		startAdornment: (
																			<>
																				<InputAdornment position="start">
																					<DescriptionIcon fontSize="small" />
																				</InputAdornment>
																				{params.slotProps.input.startAdornment}
																			</>
																		),
																	},
																}}
															/>
														)}
														noOptionsText={t.logistique.noProforma}
														sx={{ gridColumn: { md: '1 / -1' } }}
													/>
												</FormCard>
											)}

											<FormCard title={t.logistique.generalSection} icon={<InfoIcon color="primary" />}>
												<CustomTextInput
													id="fournisseur"
													type="text"
													label={t.logistique.fieldFournisseur}
													value={formik.values.fournisseur}
													onChange={formik.handleChange('fournisseur')}
													onBlur={formik.handleBlur('fournisseur')}
													fullWidth
													size="small"
													theme={inputTheme}
													startIcon={<ReceiptLongIcon fontSize="small" />}
												/>
												<CustomDropDownSelect
													id="devise"
													label={t.logistique.fieldDevise}
													items={currencyOptions}
													value={formik.values.devise}
													onChange={(event) => formik.setFieldValue('devise', event.target.value)}
													size="small"
													theme={inputTheme}
													startIcon={<PaymentIcon fontSize="small" />}
												/>
												<CustomTextInput
													id="incoterm"
													type="text"
													label={t.logistique.fieldIncoterm}
													value={formik.values.incoterm}
													onChange={formik.handleChange('incoterm')}
													fullWidth
													size="small"
													theme={inputTheme}
													startIcon={<PublicIcon fontSize="small" />}
												/>
												<CustomTextInput
													id="transport"
													type="text"
													label={t.logistique.fieldTransport}
													value={formik.values.transport}
													onChange={formik.handleChange('transport')}
													fullWidth
													size="small"
													theme={inputTheme}
													startIcon={<LocalShippingIcon fontSize="small" />}
												/>
												<CustomAutoCompleteSelect
													id="responsable"
													label={t.logistique.fieldResponsable}
													items={responsableOptions}
													value={selectedResponsable}
													onChange={(_, value) => formik.setFieldValue('responsable', value?.value ?? '')}
													noOptionsText={t.logistique.noResponsable}
													fullWidth
													size="small"
													theme={inputTheme}
													startIcon={<PersonIcon fontSize="small" />}
												/>
												<CustomDropDownSelect
													id="statut"
													label={t.logistique.fieldStatut}
													items={statusOptions}
													value={formik.values.statut}
													onChange={(event) => formik.setFieldValue('statut', event.target.value)}
													size="small"
													theme={inputTheme}
													startIcon={<InfoIcon fontSize="small" />}
												/>
												<DateField
													label={t.logistique.fieldDatePrevue}
													value={formik.values.date_prevue}
													onChange={(value) => formik.setFieldValue('date_prevue', value)}
												/>
												<DateField
													label={t.logistique.fieldDateReelle}
													value={formik.values.date_reelle}
													onChange={(value) => formik.setFieldValue('date_reelle', value)}
												/>
												<CustomTextInput
													id="origine_marchandise"
													type="text"
													label={t.logistique.fieldOrigine}
													value={formik.values.origine_marchandise}
													onChange={formik.handleChange('origine_marchandise')}
													fullWidth
													size="small"
													theme={inputTheme}
													startIcon={<PublicIcon fontSize="small" />}
												/>
												<CustomTextInput
													id="nature_marchandise"
													type="text"
													label={t.logistique.fieldNature}
													value={formik.values.nature_marchandise}
													onChange={formik.handleChange('nature_marchandise')}
													fullWidth
													size="small"
													theme={inputTheme}
													startIcon={<DescriptionIcon fontSize="small" />}
												/>
												<FormattedNumberInput
													id="poids_net"
													type="text"
													label={t.logistique.fieldPoidsNet}
													value={formik.values.poids_net}
													onChange={formik.handleChange('poids_net')}
													fullWidth
													size="small"
													theme={inputTheme}
													startIcon={<ScaleIcon fontSize="small" />}
												/>
												<FormattedNumberInput
													id="poids_brut"
													type="text"
													label={t.logistique.fieldPoidsBrut}
													value={formik.values.poids_brut}
													onChange={formik.handleChange('poids_brut')}
													fullWidth
													size="small"
													theme={inputTheme}
													startIcon={<ScaleIcon fontSize="small" />}
												/>
												<FormattedNumberInput
													id="volume"
													type="text"
													label={t.logistique.fieldVolume}
													value={formik.values.volume}
													onChange={formik.handleChange('volume')}
													fullWidth
													size="small"
													theme={inputTheme}
													startIcon={<ScaleIcon fontSize="small" />}
												/>
												<Box sx={{ gridColumn: { md: '1 / -1' } }}>
													<CustomTextInput
														id="conditions_paiement"
														type="textarea"
														label={t.logistique.fieldConditionsPaiement}
														value={formik.values.conditions_paiement}
														onChange={formik.handleChange('conditions_paiement')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<NotesIcon fontSize="small" />}
													/>
												</Box>
											</FormCard>

											<FormCard title={t.logistique.importSection} icon={<DescriptionIcon color="primary" />}>
												<CustomTextInput id="numero_domiciliation" type="text" label={t.logistique.fieldNumeroDomiciliation} value={formik.values.numero_domiciliation} onChange={formik.handleChange('numero_domiciliation')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
												<CustomTextInput id="banque" type="text" label={t.logistique.fieldBanque} value={formik.values.banque} onChange={formik.handleChange('banque')} fullWidth size="small" theme={inputTheme} startIcon={<PaymentIcon fontSize="small" />} />
												<FormattedNumberInput id="montant_titre_importation" type="text" label={t.logistique.fieldMontantTI} value={formik.values.montant_titre_importation} onChange={formik.handleChange('montant_titre_importation')} fullWidth size="small" theme={inputTheme} startIcon={<PaymentIcon fontSize="small" />} />
												<CustomDropDownSelect id="devise_titre_importation" label={t.logistique.fieldDeviseTI} items={currencyOptions} value={formik.values.devise_titre_importation} onChange={(event) => formik.setFieldValue('devise_titre_importation', event.target.value)} size="small" theme={inputTheme} startIcon={<PaymentIcon fontSize="small" />} />
												<DateField label={t.logistique.fieldDateTI} value={formik.values.date_titre_importation} onChange={(value) => formik.setFieldValue('date_titre_importation', value)} />
												<DateField label={t.logistique.fieldDateValidationTI} value={formik.values.date_validation_titre_importation} onChange={(value) => formik.setFieldValue('date_validation_titre_importation', value)} />
												<CustomDropDownSelect id="statut_titre_importation" label={t.logistique.fieldStatutTI} items={tiStatusOptions} value={formik.values.statut_titre_importation} onChange={(event) => formik.setFieldValue('statut_titre_importation', event.target.value)} size="small" theme={inputTheme} startIcon={<InfoIcon fontSize="small" />} />
											</FormCard>

											<FormCard title={t.logistique.documentsSection} icon={<AttachFileIcon color="primary" />}>
												{documentFields.map((field) => (
													<DocumentUploadField
														key={field}
														id={field}
														label={documentLabels[field]}
														file={formik.values[field]}
														currentUrl={order?.[field] ?? null}
														onChange={(file) => formik.setFieldValue(field, file)}
														onClear={() => formik.setFieldValue(field, null)}
														uploadLabel={t.logistique.uploadDocument}
														replaceLabel={t.logistique.replaceDocument}
														selectedLabel={t.logistique.selectedFile}
														currentLabel={t.logistique.currentDocument}
														openLabel={t.logistique.openDocument}
													/>
												))}
											</FormCard>

											<FormCard title={t.logistique.paymentSection} icon={<PaymentIcon color="primary" />}>
												<CustomDropDownSelect id="methode_paiement" label={t.logistique.fieldMethodePaiement} items={paymentMethodOptions} value={formik.values.methode_paiement} onChange={(event) => formik.setFieldValue('methode_paiement', event.target.value)} size="small" theme={inputTheme} startIcon={<PaymentIcon fontSize="small" />} />
												<DateField label={t.logistique.fieldDatePaiement} value={formik.values.date_paiement} onChange={(value) => formik.setFieldValue('date_paiement', value)} />
												<FormattedNumberInput id="montant_paiement" type="text" label={t.logistique.fieldMontantPaiement} value={formik.values.montant_paiement} onChange={formik.handleChange('montant_paiement')} fullWidth size="small" theme={inputTheme} startIcon={<PaymentIcon fontSize="small" />} />
												<CustomTextInput id="reference_paiement" type="text" label={t.logistique.fieldReferencePaiement} value={formik.values.reference_paiement} onChange={formik.handleChange('reference_paiement')} fullWidth size="small" theme={inputTheme} startIcon={<ReceiptLongIcon fontSize="small" />} />
											</FormCard>

											<FormCard title={t.logistique.costsSection} icon={<LocalShippingIcon color="primary" />}>
												<FormattedNumberInput id="cout_transport" type="text" label={t.logistique.fieldCoutTransport} value={formik.values.cout_transport} onChange={formik.handleChange('cout_transport')} fullWidth size="small" theme={inputTheme} startIcon={<LocalShippingIcon fontSize="small" />} />
												<FormattedNumberInput id="frais_transit" type="text" label={t.logistique.fieldFraisTransit} value={formik.values.frais_transit} onChange={formik.handleChange('frais_transit')} fullWidth size="small" theme={inputTheme} startIcon={<LocalShippingIcon fontSize="small" />} />
												<FormattedNumberInput id="frais_douane" type="text" label={t.logistique.fieldFraisDouane} value={formik.values.frais_douane} onChange={formik.handleChange('frais_douane')} fullWidth size="small" theme={inputTheme} startIcon={<LocalShippingIcon fontSize="small" />} />
												<FormattedNumberInput id="tva" type="text" label={t.logistique.fieldTva} value={formik.values.tva} onChange={formik.handleChange('tva')} fullWidth size="small" theme={inputTheme} startIcon={<PaymentIcon fontSize="small" />} />
												<FormattedNumberInput id="livraison_locale" type="text" label={t.logistique.fieldLivraisonLocale} value={formik.values.livraison_locale} onChange={formik.handleChange('livraison_locale')} fullWidth size="small" theme={inputTheme} startIcon={<LocalShippingIcon fontSize="small" />} />
												<FormattedNumberInput id="autres_frais" type="text" label={t.logistique.fieldAutresFrais} value={formik.values.autres_frais} onChange={formik.handleChange('autres_frais')} fullWidth size="small" theme={inputTheme} startIcon={<PaymentIcon fontSize="small" />} />
											</FormCard>

											<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
												<PrimaryLoadingButton
													buttonText={isEditMode ? t.common.update : t.common.save}
													active={!isPending}
													onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
														setHasAttemptedSubmit(true);
														if (!formik.isValid) {
															event.preventDefault();
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
					) : (
						<NoPermission />
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default LogistiqueForm;
