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
	Chip,
	Divider,
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
	CalendarToday as CalendarTodayIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Info as InfoIcon,
	LocalShipping as LocalShippingIcon,
	Payment as PaymentIcon,
	Person as PersonIcon,
	Public as PublicIcon,
	RequestQuote as RequestQuoteIcon,
	Scale as ScaleIcon,
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
import { LogistiqueDocumentsFormCard } from '@/components/pages/dashboard/logistique/logistique-documents-card';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getInitStateToken, getUserCompaniesState } from '@/store/selectors';
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
	useGetLogistiqueSourcePreviewQuery,
} from '@/store/services/logistique';
import { LOGISTIQUE_LIST, LOGISTIQUE_VIEW } from '@/utils/routes';
import {
	logistiqueCurrencyItemsList,
	logistiqueLegacyWorkflowStatusItemsList,
	logistiquePaymentMethodItemsList,
} from '@/utils/rawData';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { DropDownType } from '@/types/accountTypes';
import type { FactureClass } from '@/models/classes';
import type {
	LogistiqueDocumentField,
	LogistiqueFormValues,
	LogistiqueOrder,
	LogistiquePaymentStatus,
	LogistiqueResponsibleOption,
} from '@/types/logistiqueTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

interface Props extends SessionProps {
	company_id: number;
	id?: number;
}

const inputTheme = textInputTheme();
const managerRoles = new Set(['Caissier', 'Commercial', 'Logistique']);

const documentFields: LogistiqueDocumentField[] = [
	'titre_importation_file',
	'proforma_fournisseur_file',
	'justificatifs_file',
	'swift_file',
	'documents_originaux_file',
];
const acceptedDocumentTypes = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
const importTitleFields: Array<keyof LogistiqueFormValues> = [
	'numero_domiciliation',
	'banque',
	'montant_titre_importation',
	'devise_titre_importation',
	'date_titre_importation',
	'methode_paiement',
	'titre_importation_file',
];

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
	statut_titre_importation: 'À préparer',
	methode_paiement: '',
	date_paiement: '',
	montant_paiement: '0',
	devise_paiement: 'MAD',
	banque_paiement: '',
	reference_paiement: '',
	commentaire_paiement: '',
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

const isBlank = (value: unknown) => value === null || value === undefined || String(value).trim() === '';

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
	devise_paiement: order.devise_paiement ?? order.devise_titre_importation ?? 'MAD',
	banque_paiement: order.banque_paiement ?? '',
	reference_paiement: order.reference_paiement ?? '',
	commentaire_paiement: order.commentaire_paiement ?? '',
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

const toPayloadObject = (
	values: LogistiqueFormValues,
	isEditMode: boolean,
	excludeImportTitle = false,
	titleOnly = false,
) => {
	if (!isEditMode) {
		return {
			proformas: values.proformas,
			responsable: values.responsable ? Number(values.responsable) : null,
			date_prevue: nullableDate(values.date_prevue),
		};
	}

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
		delete payload.fournisseur;
		delete payload.devise;
		delete payload.incoterm;
		delete payload.conditions_paiement;
		delete payload.proforma_fournisseur_file;
		delete payload.date_paiement;
		delete payload.montant_paiement;
		delete payload.devise_paiement;
		delete payload.banque_paiement;
		delete payload.reference_paiement;
		delete payload.commentaire_paiement;
		delete payload.swift_file;
		delete payload.date_validation_titre_importation;
		delete payload.statut_titre_importation;
		if (excludeImportTitle) {
			importTitleFields.forEach((field) => delete payload[field]);
		}
		if (titleOnly) {
			Object.keys(payload).forEach((field) => {
				if (!importTitleFields.includes(field as keyof LogistiqueFormValues)) {
					delete payload[field];
				}
			});
		}
	}
	return payload;
};

const toPayload = (
	values: LogistiqueFormValues,
	isEditMode: boolean,
	excludeImportTitle = false,
	titleOnly = false,
): Partial<LogistiqueFormValues> | FormData => {
	const payload = toPayloadObject(values, isEditMode, excludeImportTitle, titleOnly);
	const hasFiles = documentFields.some((field) => payload[field] instanceof File);

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
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>{children}</Box>
		</CardContent>
	</Card>
);

const DateField = ({
	label,
	value,
	onChange,
	error,
	helperText,
	required,
	disabled,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: boolean;
	helperText?: string;
	required?: boolean;
	disabled?: boolean;
}) => (
	<DatePicker
		label={label}
		value={value ? new Date(value) : null}
		onChange={(date) => onChange(date ? formatLocalDate(date) : '')}
		format="dd/MM/yyyy"
		disabled={disabled}
		slotProps={{
			textField: {
				size: 'small',
				fullWidth: true,
				error,
				helperText,
				required,
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

const formatAmount = (value: string | number, devise?: string) => {
	const parsed = Number(
		String(value ?? '0')
			.replace(/\s/g, '')
			.replace(',', '.'),
	);
	const formatted = Number.isFinite(parsed)
		? parsed.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
		: String(value);
	return devise ? `${formatted} ${devise}` : formatted;
};

const paymentColor = (status?: LogistiquePaymentStatus | null) => {
	if (status === 'Validé') return 'success' as const;
	if (status === 'En attente') return 'warning' as const;
	return 'default' as const;
};

const LogistiqueForm: React.FC<Props> = ({ session, company_id, id }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const token = useInitAccessToken(session);
	const currentUserId = useAppSelector(getInitStateToken).user.pk;
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
		{ company_id, statut: 'Accepté' },
		{ skip: !token || isEditMode },
	);
	const [addLogistique, { isLoading: isAddLoading, error: addError }] = useAddLogistiqueMutation();
	const [editLogistique, { isLoading: isEditLoading, error: updateError }] = useEditLogistiqueMutation();
	const [isPending, setIsPending] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [selectedDocumentField, setSelectedDocumentField] = useState<LogistiqueDocumentField>('titre_importation_file');

	const proformas = useMemo(() => {
		if (!proformasData) return [] as Partial<FactureClass>[];
		const items = Array.isArray(proformasData) ? proformasData : proformasData.results;
		return items.filter((proforma) => !proforma.has_logistics_dossier);
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
	const isOrderResponsible = Boolean(currentUserId && order?.responsable === currentUserId);
	const isImportTitleLocked = Boolean(isEditMode && order && order.statut_paiement !== 'Non demandé');
	const canEditImportTitle = Boolean(isEditMode && isOrderResponsible && !isImportTitleLocked);
	const isTitleOnlyEditor = Boolean(isEditMode && isOrderResponsible && !canManage);
	const canAccessForm =
		canManage || Boolean(isEditMode && (isOrderLoading || (isOrderResponsible && !isImportTitleLocked)));
	const editableDocumentFields = useMemo(
		() =>
			documentFields.filter(
				(field) => {
					if (field === 'proforma_fournisseur_file' || field === 'swift_file') return false;
					if (field === 'titre_importation_file') return canEditImportTitle;
					return canManage;
				},
			),
		[canEditImportTitle, canManage],
	);
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
			if (!isEditMode && values.proformas.length > 1) {
				errors.proformas = t.logistique.selectSingleProforma;
			}
			if (!isEditMode && isBlank(values.date_prevue)) {
				errors.date_prevue = t.validation.required;
			}
			if (!isEditMode && isBlank(values.responsable)) {
				errors.responsable = t.validation.required;
			}
			return errors;
		},
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			try {
				if (isEditMode && id) {
					await editLogistique({
						id,
						data: toPayload(values, true, !canEditImportTitle, isTitleOnlyEditor),
					}).unwrap();
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

	const selectedProformaIds = formik.values.proformas;
	const {
		data: sourcePreview,
		isFetching: isSourcePreviewLoading,
		error: sourcePreviewError,
	} = useGetLogistiqueSourcePreviewQuery(
		{ company_id, proformas: selectedProformaIds },
		{ skip: !token || isEditMode || selectedProformaIds.length === 0 },
	);

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			proformas: t.logistique.fieldProformas,
			fournisseur: t.logistique.fieldFournisseur,
			devise: t.logistique.fieldDevise,
			incoterm: t.logistique.fieldIncoterm,
			responsable: t.logistique.fieldResponsable,
			transport: t.logistique.fieldTransport,
			conditions_paiement: t.logistique.fieldConditionsPaiement,
			date_prevue: t.logistique.fieldDatePrevue,
			statut: t.logistique.fieldStatut,
			poids_net: t.logistique.fieldPoidsNet,
			poids_brut: t.logistique.fieldPoidsBrut,
			volume: t.logistique.fieldVolume,
			origine_marchandise: t.logistique.fieldOrigine,
			nature_marchandise: t.logistique.fieldNature,
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
	const getFieldError = (field: keyof LogistiqueFormValues) => {
		const errorText = formik.errors[field];
		if (typeof errorText !== 'string' || (!formik.touched[field] && !hasAttemptedSubmit)) {
			return undefined;
		}
		return errorText;
	};
	const hasFieldError = (field: keyof LogistiqueFormValues) => Boolean(getFieldError(field));
	const sourcePreviewAxiosError = sourcePreviewError
		? (sourcePreviewError as ResponseDataInterface<ApiErrorResponseType>)
		: undefined;
	const selectedSource = sourcePreview?.proformas[0];

	const isLoading =
		isCompaniesLoading ||
		isOrderLoading ||
		isProformasLoading ||
		isResponsablesLoading ||
		isAddLoading ||
		isEditLoading ||
		isPending;
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;
	const title = isEditMode ? t.logistique.editTitle : t.logistique.addTitle;
	const canSubmitCurrentForm = !isPending && (isEditMode || (!isSourcePreviewLoading && !sourcePreviewError));

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={title}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{canAccessForm ? (
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
														options={proformas}
														value={proformas.find((proforma) => formik.values.proformas[0] === proforma.id) ?? null}
														getOptionLabel={(option) =>
															`${option.numero_bon_commande_client ? `${option.numero_bon_commande_client} - ` : ''}${option.numero_facture ?? ''}${option.client_name ? ` - ${option.client_name}` : ''}`
														}
														isOptionEqualToValue={(option, value) => option.id === value.id}
														onChange={(_, selected) => {
															setHasAttemptedSubmit(false);
															formik.setErrors({});
															void formik.setFieldValue('proformas', selected?.id ? [selected.id] : []);
														}}
														renderInput={(params) => (
															<TextField
																{...params}
																size="small"
																label={
																	<Box component="span">
																		{t.logistique.fieldProformas}{' '}
																		<Box component="span" sx={{ color: 'error.main' }}>
																			*
																		</Box>
																	</Box>
																}
																error={hasFieldError('proformas')}
																helperText={getFieldError('proformas')}
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
													<CustomAutoCompleteSelect
														id="responsable"
														label={t.logistique.fieldResponsable}
														items={responsableOptions}
														value={selectedResponsable}
														onChange={(_, value) => formik.setFieldValue('responsable', value?.value ?? '')}
														onBlur={formik.handleBlur('responsable')}
														noOptionsText={t.logistique.noResponsable}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<PersonIcon fontSize="small" />}
														required
														error={hasFieldError('responsable')}
														helperText={getFieldError('responsable')}
													/>
													<DateField
														label={t.logistique.fieldDatePrevue}
														value={formik.values.date_prevue}
														onChange={(value) => formik.setFieldValue('date_prevue', value)}
														required
														error={hasFieldError('date_prevue')}
														helperText={getFieldError('date_prevue')}
													/>
												</FormCard>
											)}

											{!isEditMode && selectedProformaIds.length > 0 && (
												<FormCard title={t.logistique.brandSplitSection} icon={<InfoIcon color="primary" />}>
													{isSourcePreviewLoading ? (
														<Box sx={{ gridColumn: { md: '1 / -1' }, minHeight: 120, position: 'relative' }}>
															<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
														</Box>
													) : sourcePreviewAxiosError ? (
														<Box sx={{ gridColumn: { md: '1 / -1' } }}>
															<ApiAlert errorDetails={sourcePreviewAxiosError.data?.details} />
														</Box>
													) : selectedSource ? (
														<Stack spacing={2.5} sx={{ gridColumn: { md: '1 / -1' } }}>
															<Alert severity="info" icon={<InfoIcon />}>
																{t.logistique.brandSplitHelp}
															</Alert>
															<Box
																sx={{
																	display: 'grid',
																	gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
																	gap: 2,
																}}
															>
																	{[
																		[t.logistique.fieldFournisseur, selectedSource.fournisseur],
																		[t.logistique.fieldSupplierEmail, selectedSource.fournisseur_email],
																	[t.logistique.colClients, selectedSource.client_name],
																	[t.logistique.fieldClientOrder, selectedSource.project_reference],
																	[t.logistique.fieldArticlesCount, selectedSource.articles_count],
																	[t.documentForm.colQuantite, selectedSource.total_quantity],
																	[
																		t.logistique.fieldCoutAchat,
																		formatAmount(selectedSource.total_achat, selectedSource.devise),
																	],
																].map(([label, value]) => (
																	<Box
																		key={label}
																		sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
																	>
																		<Typography variant="caption" color="text.secondary">
																			{label}
																		</Typography>
																		<Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>
																			{value || '-'}
																		</Typography>
																	</Box>
																))}
															</Box>
															<Typography variant="body2" color="text.secondary">
																{t.logistique.linkedSources}: {selectedSource.numero_facture}
															</Typography>
														</Stack>
													) : null}
												</FormCard>
											)}

											{isEditMode && (
												<>
													<Card elevation={3} sx={{ borderRadius: 2, bgcolor: 'primary.50' }}>
														<CardContent sx={{ p: 3 }}>
															<Box
																sx={{
																	display: 'grid',
																	gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
																	gap: 2.5,
																}}
															>
																<Box sx={{ textAlign: 'center', px: 2, py: 1.5, minHeight: 88 }}>
																	<Typography
																		variant="subtitle2"
																		sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}
																	>
																		{t.logistique.colNumero.toUpperCase()}
																	</Typography>
																	<Typography
																		variant="h6"
																		sx={{ fontWeight: 800, overflowWrap: 'anywhere', lineHeight: 1.25 }}
																	>
																		{order?.numero_commande ?? '-'}
																	</Typography>
																</Box>
																<Box sx={{ textAlign: 'center', px: 2, py: 1.5, minHeight: 88 }}>
																	<Typography
																		variant="subtitle2"
																		sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}
																	>
																		{t.logistique.fieldFournisseur.toUpperCase()}
																	</Typography>
																	<Typography
																		variant="h6"
																		sx={{ fontWeight: 800, overflowWrap: 'anywhere', lineHeight: 1.25 }}
																	>
																		{order?.fournisseur ?? '-'}
																	</Typography>
																</Box>
																<Box
																	sx={{
																		textAlign: 'center',
																		px: 2,
																		py: 1.5,
																		minHeight: 88,
																		display: 'flex',
																		flexDirection: 'column',
																		alignItems: 'center',
																	}}
																>
																	<Typography
																		variant="subtitle2"
																		sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}
																	>
																		{t.logistique.colPaiement.toUpperCase()}
																	</Typography>
																	<Chip
																		label={order?.statut_paiement ?? '-'}
																		color={paymentColor(order?.statut_paiement)}
																		variant="outlined"
																		sx={{ maxWidth: '100%' }}
																	/>
																</Box>
																<Box sx={{ textAlign: 'center', px: 2, py: 1.5, minHeight: 88 }}>
																	<Typography
																		variant="subtitle2"
																		sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}
																	>
																		{t.logistique.colCoutTotal.toUpperCase()}
																	</Typography>
																	<Typography
																		variant="h5"
																		color="primary"
																		sx={{ fontWeight: 900, overflowWrap: 'anywhere', lineHeight: 1.2 }}
																	>
																		{formatAmount(order?.cout_total ?? 0, order?.devise ?? formik.values.devise)}
																	</Typography>
																</Box>
															</Box>
														</CardContent>
													</Card>

													<FormCard title={t.logistique.fieldGlobalStatus} icon={<InfoIcon color="primary" />}>
														<Chip
															label={order?.statut_global || '-'}
															size="medium"
															color="info"
															variant="outlined"
															sx={{
																alignSelf: 'center',
																justifySelf: 'start',
																maxWidth: '100%',
																'& .MuiChip-label': { whiteSpace: 'normal' },
															}}
														/>
													</FormCard>

											{canManage && (
											<FormCard title={t.logistique.generalSection} icon={<InfoIcon color="primary" />}>
														<CustomDropDownSelect
															id="devise"
															label={t.logistique.fieldDevise}
															items={logistiqueCurrencyItemsList}
															value={formik.values.devise}
															onChange={(event) => formik.setFieldValue('devise', event.target.value)}
															size="small"
															theme={inputTheme}
															startIcon={<PaymentIcon fontSize="small" />}
															disabled
															error={hasFieldError('devise')}
															helperText={getFieldError('devise')}
														/>
														<CustomDropDownSelect
															id="statut"
															label={t.logistique.fieldStatut}
															items={logistiqueLegacyWorkflowStatusItemsList}
															value={formik.values.statut}
															onChange={(event) => formik.setFieldValue('statut', event.target.value)}
															size="small"
															theme={inputTheme}
															startIcon={<InfoIcon fontSize="small" />}
														/>
														<CustomTextInput
															id="transport"
															type="text"
															label={t.logistique.fieldTransport}
															value={formik.values.transport}
															onChange={formik.handleChange('transport')}
															onBlur={formik.handleBlur('transport')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<LocalShippingIcon fontSize="small" />}
															error={hasFieldError('transport')}
															helperText={getFieldError('transport')}
														/>
														<CustomAutoCompleteSelect
															id="responsable"
															label={t.logistique.fieldResponsable}
															items={responsableOptions}
															value={selectedResponsable}
															onChange={(_, value) => formik.setFieldValue('responsable', value?.value ?? '')}
															onBlur={formik.handleBlur('responsable')}
															noOptionsText={t.logistique.noResponsable}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<PersonIcon fontSize="small" />}
															error={hasFieldError('responsable')}
															helperText={getFieldError('responsable')}
														/>
														<DateField
															label={t.logistique.fieldDatePrevue}
															value={formik.values.date_prevue}
															onChange={(value) => formik.setFieldValue('date_prevue', value)}
															required
															error={hasFieldError('date_prevue')}
															helperText={getFieldError('date_prevue')}
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
															onBlur={formik.handleBlur('origine_marchandise')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<PublicIcon fontSize="small" />}
															required
															error={hasFieldError('origine_marchandise')}
															helperText={getFieldError('origine_marchandise')}
														/>
														<CustomTextInput
															id="nature_marchandise"
															type="text"
															label={t.logistique.fieldNature}
															value={formik.values.nature_marchandise}
															onChange={formik.handleChange('nature_marchandise')}
															onBlur={formik.handleBlur('nature_marchandise')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<DescriptionIcon fontSize="small" />}
															required
															error={hasFieldError('nature_marchandise')}
															helperText={getFieldError('nature_marchandise')}
														/>
														<FormattedNumberInput
															id="poids_net"
															type="text"
															label={t.logistique.fieldPoidsNet}
															value={formik.values.poids_net}
															onChange={formik.handleChange('poids_net')}
															onBlur={formik.handleBlur('poids_net')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<ScaleIcon fontSize="small" />}
															error={hasFieldError('poids_net')}
															helperText={getFieldError('poids_net')}
														/>
														<FormattedNumberInput
															id="poids_brut"
															type="text"
															label={t.logistique.fieldPoidsBrut}
															value={formik.values.poids_brut}
															onChange={formik.handleChange('poids_brut')}
															onBlur={formik.handleBlur('poids_brut')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<ScaleIcon fontSize="small" />}
															error={hasFieldError('poids_brut')}
															helperText={getFieldError('poids_brut')}
														/>
														<FormattedNumberInput
															id="volume"
															type="text"
															label={t.logistique.fieldVolume}
															value={formik.values.volume}
															onChange={formik.handleChange('volume')}
															onBlur={formik.handleBlur('volume')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<ScaleIcon fontSize="small" />}
															error={hasFieldError('volume')}
															helperText={getFieldError('volume')}
														/>
											</FormCard>
											)}

											{canEditImportTitle && (
									<FormCard title={t.logistique.importSection} icon={<DescriptionIcon color="primary" />}>
												{isImportTitleLocked && (
													<Alert severity="info" sx={{ gridColumn: { md: '1 / -1' } }}>
														{t.logistique.importTitleLocked}
													</Alert>
												)}
												<CustomTextInput
															id="numero_domiciliation"
															type="text"
															label={t.logistique.fieldNumeroDomiciliation}
															value={formik.values.numero_domiciliation}
															onChange={formik.handleChange('numero_domiciliation')}
															fullWidth
															size="small"
															theme={inputTheme}
													startIcon={<DescriptionIcon fontSize="small" />}
												disabled={isImportTitleLocked}
													/>
													<CustomDropDownSelect
														id="methode_paiement"
														label={t.logistique.fieldMethodePaiement}
														items={logistiquePaymentMethodItemsList}
														value={formik.values.methode_paiement}
														onChange={(event) => formik.setFieldValue('methode_paiement', event.target.value)}
														size="small"
														theme={inputTheme}
														startIcon={<PaymentIcon fontSize="small" />}
														disabled={isImportTitleLocked}
													/>
														<CustomTextInput
															id="banque"
															type="text"
															label={t.logistique.fieldBanque}
															value={formik.values.banque}
															onChange={formik.handleChange('banque')}
															fullWidth
															size="small"
															theme={inputTheme}
													startIcon={<PaymentIcon fontSize="small" />}
													disabled={isImportTitleLocked}
														/>
														<FormattedNumberInput
															id="montant_titre_importation"
															type="text"
															label={t.logistique.fieldMontantTI}
															value={formik.values.montant_titre_importation}
															onChange={formik.handleChange('montant_titre_importation')}
															fullWidth
															size="small"
															theme={inputTheme}
													startIcon={<PaymentIcon fontSize="small" />}
													disabled={isImportTitleLocked}
														/>
														<CustomDropDownSelect
															id="devise_titre_importation"
															label={t.logistique.fieldDeviseTI}
															items={logistiqueCurrencyItemsList}
															value={formik.values.devise_titre_importation}
															onChange={(event) => formik.setFieldValue('devise_titre_importation', event.target.value)}
															size="small"
															theme={inputTheme}
													startIcon={<PaymentIcon fontSize="small" />}
													disabled={isImportTitleLocked}
														/>
														<DateField
															label={t.logistique.fieldDateTI}
															value={formik.values.date_titre_importation}
													onChange={(value) => formik.setFieldValue('date_titre_importation', value)}
													disabled={isImportTitleLocked}
														/>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 40 }}>
													<Typography variant="body2" color="text.secondary">
														{t.logistique.fieldStatutTI}
													</Typography>
													<Chip label={formik.values.statut_titre_importation} size="small" variant="outlined" />
												</Box>
											</FormCard>
											)}

											{editableDocumentFields.length > 0 && (
											<LogistiqueDocumentsFormCard
														items={editableDocumentFields.map((field) => ({
															field,
															label: documentLabels[field],
															file: formik.values[field],
															currentUrl: order?.[field] ?? null,
														}))}
														selectedField={selectedDocumentField}
														onSelectedFieldChange={setSelectedDocumentField}
														onFileChange={(field, file) => formik.setFieldValue(field, file)}
														onClearFile={(field) => formik.setFieldValue(field, null)}
														isLoading={isPending}
												accept={acceptedDocumentTypes}
											/>
											)}

											{canManage && (
											<FormCard title={t.logistique.costsSection} icon={<LocalShippingIcon color="primary" />}>
														<FormattedNumberInput
															id="cout_transport"
															type="text"
															label={t.logistique.fieldCoutTransport}
															value={formik.values.cout_transport}
															onChange={formik.handleChange('cout_transport')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<LocalShippingIcon fontSize="small" />}
														/>
														<FormattedNumberInput
															id="frais_transit"
															type="text"
															label={t.logistique.fieldFraisTransit}
															value={formik.values.frais_transit}
															onChange={formik.handleChange('frais_transit')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<LocalShippingIcon fontSize="small" />}
														/>
														<FormattedNumberInput
															id="frais_douane"
															type="text"
															label={t.logistique.fieldFraisDouane}
															value={formik.values.frais_douane}
															onChange={formik.handleChange('frais_douane')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<LocalShippingIcon fontSize="small" />}
														/>
														<FormattedNumberInput
															id="tva"
															type="text"
															label={t.logistique.fieldTva}
															value={formik.values.tva}
															onChange={formik.handleChange('tva')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<PaymentIcon fontSize="small" />}
														/>
														<FormattedNumberInput
															id="livraison_locale"
															type="text"
															label={t.logistique.fieldLivraisonLocale}
															value={formik.values.livraison_locale}
															onChange={formik.handleChange('livraison_locale')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<LocalShippingIcon fontSize="small" />}
														/>
														<FormattedNumberInput
															id="autres_frais"
															type="text"
															label={t.logistique.fieldAutresFrais}
															value={formik.values.autres_frais}
															onChange={formik.handleChange('autres_frais')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<PaymentIcon fontSize="small" />}
														/>
											</FormCard>
											)}
												</>
											)}

											<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
												<PrimaryLoadingButton
													buttonText={isEditMode ? t.common.update : t.common.save}
													active={canSubmitCurrentForm}
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
