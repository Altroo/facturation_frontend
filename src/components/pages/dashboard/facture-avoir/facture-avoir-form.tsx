'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	FormControlLabel,
	IconButton,
	InputAdornment,
	Stack,
	Switch,
	Tooltip,
	Typography,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	CalendarToday as CalendarTodayIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Discount as DiscountIcon,
	Edit as EditIcon,
	Notes as NotesIcon,
	Numbers as NumbersIcon,
	Payment as PaymentIcon,
	Person as PersonIcon,
	Receipt as ReceiptIcon,
	Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { type FormikErrors, useFormik } from 'formik';
import type { GridColDef } from '@mui/x-data-grid';

import CompanyDocumentsWrapperForm from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm';
import { generateRowId } from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent';
import { useDocumentLinesColumns } from '@/components/pages/dashboard/shared/company-documents-form/useDocumentLinesColumns';
import LinesGrid from '@/components/shared/linesGrid/linesGrid';
import AddArticleModal, { type SelectedArticlePopupValues } from '@/components/shared/addArticleModal/addArticleModal';
import GlobalRemiseModal from '@/components/shared/globalRemiseModal/globalRemiseModal';
import FactureDevisTotalsCard from '@/components/shared/factureDevistotalCard/factureDevisTotalsCard';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';

import { useGetArticlesListQuery } from '@/store/services/article';
import { useGetClientsListQuery } from '@/store/services/client';
import { useGetFactureClientListQuery } from '@/store/services/factureClient';
import {
	useAddFactureAvoirMutation,
	useEditFactureAvoirMutation,
	useGetFactureAvoirQuery,
	useGetFactureAvoirFromFactureQuery,
	useGetNumFactureAvoirQuery,
	useLazyGetFactureAvoirFromFactureQuery,
	usePatchFactureAvoirStatutMutation,
} from '@/store/services/factureAvoir';
import { useGetModePaiementListQuery } from '@/store/services/parameter';
import type { ArticleClass, ClientClass, FactureAvoirClass, FactureClass } from '@/models/classes';
import type { SessionProps, PaginationResponseType } from '@/types/_initTypes';
import type { DropDownType } from '@/types/accountTypes';
import type { DeviFactureLineFormValues, TypeFactureLivraisonDevisStatus, TypeRemiseType } from '@/types/devisTypes';
import type { ValidateArticleLinesErrorType } from '@/types/devisTypes';
import { FACTURE_AVOIR_EDIT, FACTURE_AVOIR_LIST, FACTURE_AVOIR_VIEW } from '@/utils/routes';
import { extractApiErrorMessage, formatLocalDate, parseNumber } from '@/utils/helpers';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';

type FactureAvoirMotif = 'retour_marchandise' | 'erreur_facturation' | 'remise' | 'annulation' | 'autre';

type FactureAvoirFormValues = {
	numero_part: string;
	year_part: string;
	date_avoir: string;
	facture_origine: number | null;
	client: number | null;
	mode_paiement: number | null;
	motif_avoir: FactureAvoirMotif | '';
	numero_bon_commande_client: string;
	remarque: string;
	statut: TypeFactureLivraisonDevisStatus;
	remise_type: TypeRemiseType;
	remise: number;
	devise: string;
	lignes: DeviFactureLineFormValues[];
};

type FormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	role?: string;
};

const inputFieldTheme = textInputTheme();

const today = () => formatLocalDate(new Date());

const requiredLabel = (label: string) => (label.includes('*') ? label : `${label} *`);

const normalizeList = <T,>(raw: Array<Partial<T>> | PaginationResponseType<T> | undefined): Array<Partial<T>> => {
	if (!raw) return [];
	return Array.isArray(raw) ? raw : raw.results ?? [];
};

const getNumeroParts = (numero?: string | null) => {
	const [numeroPart = '', yearPart = ''] = (numero || '').split('/');
	return { numeroPart, yearPart };
};

const clientLabel = (client?: Partial<ClientClass> | null) =>
	client?.raison_sociale || [client?.prenom, client?.nom].filter(Boolean).join(' ') || client?.code_client || '';

const buildLinePayload = (lines: DeviFactureLineFormValues[]) =>
	lines.map((line) => ({
		id: typeof line.id === 'number' ? line.id : undefined,
		article: line.article,
		prix_achat: Number(line.prix_achat || 0),
		devise_prix_achat: line.devise_prix_achat || 'MAD',
		prix_vente: Number(line.prix_vente || 0),
		devise_prix_vente: line.devise_prix_vente || 'MAD',
		quantity: Number(line.quantity || 1),
		remise_type: line.remise_type || '',
		remise: Number(line.remise || 0),
	}));

const FormikContent: React.FC<FormikContentProps> = ({ token, company_id, id, isEditMode, role }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const theme = useTheme();
	const searchParams = useSearchParams();
	const factureOrigineParam = searchParams.get('facture_origine_id');
	const initialOriginId = factureOrigineParam && !Number.isNaN(Number(factureOrigineParam)) ? Number(factureOrigineParam) : null;
	const [validationErrors, setValidationErrors] = useState<ValidateArticleLinesErrorType>({});
	const [showAddArticleModal, setShowAddArticleModal] = useState(false);
	const [showGlobalRemiseModal, setShowGlobalRemiseModal] = useState(false);
	const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
	const [isFreeMode, setIsFreeMode] = useState(!initialOriginId);
	const topRef = useRef<HTMLDivElement | null>(null);

	const { data: rawData, isLoading: isDataLoading, error: dataError } = useGetFactureAvoirQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);
	const { data: numData, isLoading: isNumLoading, refetch: refetchNum } = useGetNumFactureAvoirQuery(
		{ company_id },
		{ skip: !token || isEditMode },
	);
	const { data: initialPrefillData, isFetching: isInitialOriginLoading } = useGetFactureAvoirFromFactureQuery(
		{ id: initialOriginId! },
		{ skip: !token || isEditMode || !initialOriginId },
	);
	const { data: rawArticlesData, isLoading: isArticlesLoading } = useGetArticlesListQuery(
		{ company_id, with_pagination: false, archived: false },
		{ skip: !token },
	);
	const { data: rawClientsData } = useGetClientsListQuery(
		{ company_id, with_pagination: false, archived: false },
		{ skip: !token },
	);
	const { data: rawFacturesData } = useGetFactureClientListQuery(
		{ company_id, with_pagination: false },
		{ skip: !token },
	);
	const { data: modesPaiement } = useGetModePaiementListQuery({ company_id }, { skip: !token });
	const [loadFromFacture, { isFetching: isManualOriginLoading }] = useLazyGetFactureAvoirFromFactureQuery();
	const [addFactureAvoir, { isLoading: isAddLoading, error: addError }] = useAddFactureAvoirMutation();
	const [editFactureAvoir, { isLoading: isUpdateLoading, error: updateError }] = useEditFactureAvoirMutation();
	const [patchStatut, { isLoading: isPatchLoading }] = usePatchFactureAvoirStatutMutation();

	const articles = useMemo(() => normalizeList<ArticleClass>(rawArticlesData), [rawArticlesData]);
	const clients = useMemo(() => normalizeList<ClientClass>(rawClientsData), [rawClientsData]);
	const factures = useMemo(() => normalizeList<FactureClass>(rawFacturesData), [rawFacturesData]);
	const isLocked = isEditMode && rawData?.statut !== 'Brouillon';
	const isPending = isAddLoading || isUpdateLoading || isPatchLoading || isManualOriginLoading || isInitialOriginLoading;

	const currentNumero = rawData?.numero_avoir ?? numData?.numero_avoir ?? '';
	const initialNumeroParts = getNumeroParts(currentNumero);

	const motifItems = useMemo<DropDownType[]>(
		() => [
			{ value: 'retour_marchandise', code: t.facturesAvoir.motifRetour },
			{ value: 'erreur_facturation', code: t.facturesAvoir.motifErreur },
			{ value: 'remise', code: t.facturesAvoir.motifRemise },
			{ value: 'annulation', code: t.facturesAvoir.motifAnnulation },
			{ value: 'autre', code: t.facturesAvoir.motifAutre },
		],
		[t],
	);
	const originItems = useMemo<DropDownType[]>(
		() =>
			factures.map((facture) => ({
				value: String(facture.id),
				code: `${facture.numero_facture ?? ''} - ${facture.client_name ?? ''}`.trim(),
			})),
		[factures],
	);
	const clientItems = useMemo<DropDownType[]>(
		() =>
			clients.map((client) => ({
				value: String(client.id),
				code: clientLabel(client),
				archived: Boolean(client.archived),
			})),
		[clients],
	);
	const modePaiementItems = useMemo<DropDownType[]>(
		() => (modesPaiement ?? []).map((mode) => ({ value: String(mode.id), code: mode.nom })),
		[modesPaiement],
	);

	const formik = useFormik<FactureAvoirFormValues>({
		initialValues: {
			numero_part: initialNumeroParts.numeroPart,
			year_part: initialNumeroParts.yearPart,
			date_avoir: rawData?.date_avoir ?? (initialPrefillData?.date_avoir as string | undefined) ?? today(),
			facture_origine: rawData?.facture_origine ?? initialPrefillData?.facture_origine ?? initialOriginId,
			client: rawData?.client ?? initialPrefillData?.client ?? null,
			mode_paiement: rawData?.mode_paiement ?? initialPrefillData?.mode_paiement ?? null,
			motif_avoir: (rawData?.motif_avoir as FactureAvoirMotif | undefined) ?? '',
			numero_bon_commande_client: rawData?.numero_bon_commande_client ?? initialPrefillData?.numero_bon_commande_client ?? '',
			remarque: rawData?.remarque ?? '',
			statut: rawData?.statut ?? 'Brouillon',
			remise_type: rawData?.remise_type ?? initialPrefillData?.remise_type ?? '',
			remise: Number(rawData?.remise ?? initialPrefillData?.remise ?? 0),
			devise: rawData?.devise ?? initialPrefillData?.devise ?? 'MAD',
			lignes: (rawData?.lignes ?? initialPrefillData?.lignes ?? []) as DeviFactureLineFormValues[],
		},
		enableReinitialize: true,
		validate: (values) => {
			const errors: FormikErrors<FactureAvoirFormValues> = {};
			if (!values.motif_avoir) errors.motif_avoir = t.facturesAvoir.motifRequired;
			if (!isEditMode && !isFreeMode && !values.facture_origine) errors.facture_origine = t.facturesAvoir.originRequired;
			if ((isEditMode || isFreeMode || values.facture_origine) && !values.client) errors.client = t.facturesAvoir.clientRequired;
			if (!values.date_avoir) errors.date_avoir = t.validation.required;
			if (!values.lignes.length) errors.lignes = t.facturesAvoir.linesRequired;
			return errors;
		},
		onSubmit: async (values) => {
			if (isLocked) {
				onError(t.facturesAvoir.onlyDraftEditable);
				return;
			}
			try {
				const payload = {
					date_avoir: values.date_avoir,
					facture_origine: values.facture_origine,
					client: values.client,
					mode_paiement: values.mode_paiement,
					motif_avoir: values.motif_avoir,
					numero_bon_commande_client: values.numero_bon_commande_client || null,
					remarque: values.remarque || null,
					remise_type: values.remise_type,
					remise: values.remise,
					devise: values.devise,
					lignes: buildLinePayload(values.lignes),
				} as unknown as Partial<FactureAvoirClass>;

				if (isEditMode && id) {
					await editFactureAvoir({ id, data: payload }).unwrap();
					if (values.statut !== rawData?.statut) {
						await patchStatut({ id, data: { statut: values.statut } }).unwrap();
					}
					onSuccess(t.facturesAvoir.updateSuccess);
					router.push(FACTURE_AVOIR_VIEW(id, company_id));
				} else {
					const created = await addFactureAvoir({ data: payload }).unwrap();
					onSuccess(t.facturesAvoir.addSuccess);
					router.push(FACTURE_AVOIR_EDIT(created.id, company_id));
				}
			} catch (err) {
				onError(extractApiErrorMessage(err, isEditMode ? t.facturesAvoir.updateError : t.facturesAvoir.addError));
			}
		},
	});

	const selectedOrigin = originItems.find((item) => item.value === String(formik.values.facture_origine)) ?? null;
	const selectedClient = clientItems.find((item) => item.value === String(formik.values.client)) ?? null;
	const selectedModePaiement = modePaiementItems.find((item) => item.value === String(formik.values.mode_paiement)) ?? null;
	const selectedMotif = motifItems.find((item) => item.value === formik.values.motif_avoir) ?? null;

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			date_avoir: t.facturesAvoir.fieldDate,
			facture_origine: t.facturesAvoir.fieldFactureOrigine,
			client: t.documentForm.fieldClientLabel,
			motif_avoir: t.facturesAvoir.fieldMotif,
			lignes: t.documentForm.fieldLignesLabel,
		}),
		[t],
	);
	const validationEntries = useMemo(() => {
		const entries: Array<[string, string]> = [];
		Object.entries(formik.errors).forEach(([key, value]) => {
			if (typeof value === 'string') entries.push([key, value]);
		});
		Object.entries(validationErrors).forEach(([key, value]) => entries.push([key, String(value)]));
		return entries;
	}, [formik.errors, validationErrors]);
	const showValidationAlert = validationEntries.length > 0 && formik.submitCount > 0;

	useEffect(() => {
		if (!showValidationAlert) return;
		onError(t.common.correctErrors);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [formik.submitCount, onError, showValidationAlert, t]);

	const applyOrigin = useCallback(
		async (originId: number | null) => {
			if (!originId) return;
			try {
				const data = await loadFromFacture({ id: originId }).unwrap();
				setIsFreeMode(false);
				await formik.setValues((prev) => ({
					...prev,
					facture_origine: data.facture_origine ?? originId,
					client: data.client ?? prev.client,
					mode_paiement: data.mode_paiement ?? prev.mode_paiement,
					date_avoir: (data.date_avoir as string | undefined) ?? prev.date_avoir,
					numero_bon_commande_client: data.numero_bon_commande_client ?? '',
					remise_type: data.remise_type ?? '',
					remise: Number(data.remise ?? 0),
					devise: data.devise ?? prev.devise,
					lignes: ((data.lignes ?? []) as DeviFactureLineFormValues[]).map((line) => ({
						...line,
						remise_type: line.remise_type || '',
						remise: Number(line.remise || 0),
					})),
				}));
				setValidationErrors({});
			} catch (err) {
				onError(extractApiErrorMessage(err, t.facturesAvoir.addError));
			}
		},
		[formik, loadFromFacture, onError, t],
	);

	const getLines = useCallback(() => formik.values.lignes, [formik.values.lignes]);
	const getArticleById = useCallback(
		(articleRef: number | string | Partial<ArticleClass> | undefined) => {
			const articleId = typeof articleRef === 'object' && articleRef !== null ? articleRef.id : Number(articleRef);
			return articles.find((article) => article.id === articleId);
		},
		[articles],
	);

	const handleLineChange = useCallback(
		(index: number, field: keyof DeviFactureLineFormValues, value: string | number) => {
			if (isLocked) return;
			const updatedLines = [...formik.values.lignes];
			updatedLines[index] = { ...updatedLines[index], [field]: value };
			if (field === 'remise_type' && !value) updatedLines[index].remise = 0;
			void formik.setFieldValue('lignes', updatedLines);
		},
		[formik, isLocked],
	);
	const handleLineChangeRef = useRef(handleLineChange);
	useEffect(() => {
		handleLineChangeRef.current = handleLineChange;
	}, [handleLineChange]);

	const handleDeleteLine = useCallback(
		(index: number) => {
			if (isLocked) return;
			void formik.setFieldValue(
				'lignes',
				formik.values.lignes.filter((_, i) => i !== index),
			);
		},
		[formik, isLocked],
	);

	const { linesColumns } = useDocumentLinesColumns({
		getLines,
		validationErrors,
		role,
		devise: formik.values.devise,
		handleLineChangeRef,
		handleDeleteLine,
		getArticleById,
	});

	const rows = useMemo(
		() =>
			formik.values.lignes.map((ligne, index) => ({
				...ligne,
				id: generateRowId(ligne.article, index),
				rowIndex: index,
			})),
		[formik.values.lignes],
	);

	const existingArticleIds = useMemo(() => new Set(formik.values.lignes.map((line) => line.article)), [formik.values.lignes]);
	const existingArticleLineValues = useMemo(
		() =>
			formik.values.lignes.reduce<Record<number, { quantity: number; remise_type: TypeRemiseType; remise: number }>>((acc, line) => {
				acc[line.article] = {
					quantity: Number(line.quantity || 1),
					remise_type: line.remise_type || '',
					remise: Number(line.remise || 0),
				};
				return acc;
			}, {}),
		[formik.values.lignes],
	);

	const handleAddArticles = useCallback(
		(selectedArticlesData: SelectedArticlePopupValues[]) => {
			const currentLines = [...formik.values.lignes];
			const lineIndexByArticleId = new Map<number, number>();
			currentLines.forEach((line, index) => lineIndexByArticleId.set(line.article, index));
			selectedArticlesData.forEach((selection) => {
				const article = getArticleById(selection.articleId) ?? selection.articleData;
				if (!article) return;
				const parsedQuantity = parseNumber(String(selection.quantity)) ?? 1;
				const remiseType = (selection.remise_type || '') as TypeRemiseType;
				const parsedRemise = parseNumber(String(selection.remise)) ?? 0;
				const nextLine: DeviFactureLineFormValues = {
					article: selection.articleId,
					reference: article.reference || '',
					designation: article.designation || '',
					prix_achat: Number(article.prix_achat || 0),
					devise_prix_achat: article.devise_prix_achat || 'MAD',
					prix_vente: Number(article.prix_vente || 0),
					devise_prix_vente: article.devise_prix_vente || article.devise_prix_achat || 'MAD',
					quantity: parsedQuantity > 0 ? parsedQuantity : 1,
					remise_type: remiseType,
					remise: remiseType ? Math.max(0, parsedRemise) : 0,
				};
				const existingIndex = lineIndexByArticleId.get(selection.articleId);
				if (existingIndex !== undefined) {
					currentLines[existingIndex] = { ...currentLines[existingIndex], ...nextLine };
				} else {
					currentLines.push(nextLine);
				}
			});
			void formik.setFieldValue('lignes', currentLines);
			setShowAddArticleModal(false);
			setSelectedArticles(new Set());
		},
		[formik, getArticleById],
	);

	const totals = useMemo(() => {
		let rawTotalHT = 0;
		const linesData: Array<{ lineHT: number; tvaRate: number }> = [];
		formik.values.lignes.forEach((line) => {
			const article = getArticleById(line.article);
			const quantity = Number(line.quantity || 1);
			const prixVente = Number(line.prix_vente || 0);
			let lineHT = prixVente * quantity;
			const remise = Number(line.remise || 0);
			if (line.remise_type === 'Pourcentage') lineHT *= 1 - remise / 100;
			if (line.remise_type === 'Fixe') lineHT = Math.max(0, lineHT - remise);
			const tvaRate = Number(article?.tva || 0);
			rawTotalHT += lineHT;
			linesData.push({ lineHT, tvaRate });
		});

		let finalTotalHT = rawTotalHT;
		if (formik.values.remise_type === 'Pourcentage') finalTotalHT = rawTotalHT * (1 - Number(formik.values.remise || 0) / 100);
		if (formik.values.remise_type === 'Fixe') finalTotalHT = Math.max(0, rawTotalHT - Number(formik.values.remise || 0));

		const ratio = rawTotalHT > 0 ? finalTotalHT / rawTotalHT : 0;
		const totalTVA = linesData.reduce((sum, line) => sum + line.lineHT * ratio * (line.tvaRate / 100), 0);
		return {
			totalHT: rawTotalHT,
			totalTVA,
			totalTTC: rawTotalHT + totalTVA,
			totalTTCApresRemise: finalTotalHT + totalTVA,
		};
	}, [formik.values.lignes, formik.values.remise, formik.values.remise_type, getArticleById]);

	const handleApplyGlobalRemise = useCallback(
		(type: 'Pourcentage' | 'Fixe' | '', value: number) => {
			void formik.setFieldValue('remise_type', type);
			void formik.setFieldValue('remise', value);
		},
		[formik],
	);

	const apiError = addError || updateError || dataError;
	const dataGridColumns = linesColumns as GridColDef[];
	const isLoading = isDataLoading || isNumLoading || isInitialOriginLoading;
	const effectiveFreeMode = isEditMode ? !formik.values.facture_origine : isFreeMode;
	const isOriginRequired = !effectiveFreeMode;
	const isClientRequired = effectiveFreeMode || isEditMode || Boolean(formik.values.facture_origine);

	if (isLoading) return <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack ref={topRef} spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => router.push(FACTURE_AVOIR_LIST)}
					sx={{
						alignSelf: 'flex-start',
						whiteSpace: 'nowrap',
						px: { xs: 1.5, sm: 2, md: 3 },
						py: { xs: 0.8, sm: 1, md: 1 },
						fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
					}}
				>
					{t.facturesAvoir.backToList}
				</Button>
				{Boolean(apiError) && (
					<Alert severity="error">
						{extractApiErrorMessage(apiError, isEditMode ? t.facturesAvoir.updateError : t.facturesAvoir.addError)}
					</Alert>
				)}
				{showValidationAlert && (
					<Alert severity="error">
						<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
							{t.common.validationErrors}
						</Typography>
						<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
							{validationEntries.map(([key, error]) => (
								<li key={key}>
									<Typography variant="body2">
										{fieldLabels[key] || key} : {error}
									</Typography>
								</li>
							))}
						</ul>
					</Alert>
				)}
				{isLocked && <Alert severity="info">{t.facturesAvoir.onlyDraftEditable}</Alert>}
				{(isEditMode || formik.values.lignes.length > 0) && (
					<FactureDevisTotalsCard totals={totals} devise={formik.values.devise} isMobile={false} />
				)}
				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<DescriptionIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{t.documentForm.documentInfoSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
										<Box sx={{ flex: 2 }}>
											<CustomTextInput
												id="numero_part"
												type="text"
												label={t.documentForm.fieldNumero}
												value={formik.values.numero_part}
												onChange={formik.handleChange('numero_part')}
												fullWidth
												size="small"
												theme={inputFieldTheme}
												startIcon={<NumbersIcon fontSize="small" color="action" />}
												disabled
											/>
										</Box>
										<Typography variant="h6" sx={{ px: 0.5, mt: 1 }}>
											/
										</Typography>
										<Box sx={{ flex: 1 }}>
											<CustomTextInput
												id="year_part"
												type="text"
												label={t.documentForm.fieldAnnee}
												value={formik.values.year_part}
												onChange={formik.handleChange('year_part')}
												fullWidth
												size="small"
												theme={inputFieldTheme}
												startIcon={<CalendarTodayIcon fontSize="small" color="action" />}
												disabled
											/>
										</Box>
										{!isEditMode && (
											<Tooltip title={t.documentForm.resetNumero}>
												<IconButton
													size="large"
													color="primary"
													onClick={async () => {
														const result = (await refetchNum()) as { data?: { numero_avoir?: string } };
														const parts = getNumeroParts(result?.data?.numero_avoir);
														await formik.setFieldValue('numero_part', parts.numeroPart);
														await formik.setFieldValue('year_part', parts.yearPart);
													}}
													aria-label={t.documentForm.resetNumero}
													sx={{ mt: 1 }}
												>
													<RefreshIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										)}
									</Stack>
									<DatePicker
										label={t.facturesAvoir.fieldDate}
										value={formik.values.date_avoir ? new Date(formik.values.date_avoir) : null}
										onChange={(date) => void formik.setFieldValue('date_avoir', date ? formatLocalDate(date) : '')}
										format="dd/MM/yyyy"
										disabled={isLocked}
										slotProps={{
											textField: {
												size: 'small',
												fullWidth: true,
												required: true,
												error: formik.touched.date_avoir && Boolean(formik.errors.date_avoir),
												helperText: formik.touched.date_avoir ? formik.errors.date_avoir : '',
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
									<CustomAutoCompleteSelect
										id="motif_avoir"
										size="small"
										noOptionsText={t.common.noData}
										label={requiredLabel(t.facturesAvoir.fieldMotif)}
										items={motifItems}
										theme={theme}
										value={selectedMotif}
										fullWidth
										onChange={(_, newValue) => void formik.setFieldValue('motif_avoir', newValue?.value ?? '')}
										onBlur={formik.handleBlur('motif_avoir')}
										error={formik.touched.motif_avoir && Boolean(formik.errors.motif_avoir)}
										helperText={formik.touched.motif_avoir ? String(formik.errors.motif_avoir || '') : ''}
										disabled={isLocked}
										startIcon={<DescriptionIcon fontSize="small" color="action" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<ReceiptIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{t.facturesAvoir.originLabel}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<FormControlLabel
										control={
											<Switch
												checked={effectiveFreeMode}
												onChange={(_, checked) => {
													setIsFreeMode(checked);
													if (checked) {
														void formik.setFieldValue('facture_origine', null);
														void formik.setFieldValue('client', null);
														void formik.setFieldValue('lignes', []);
													}
												}}
												disabled={isEditMode || isLocked}
											/>
										}
										label={t.facturesAvoir.fieldAvoirLibre}
									/>
									<CustomAutoCompleteSelect
										id="facture_origine"
										size="small"
										noOptionsText={t.facturesAvoir.freeOriginLabel}
										label={isOriginRequired ? requiredLabel(t.facturesAvoir.selectOrigin) : t.facturesAvoir.selectOrigin}
										items={originItems}
										theme={theme}
										value={selectedOrigin}
										fullWidth
										onChange={(_, newValue) => {
											const originId = newValue ? Number(newValue.value) : null;
											void formik.setFieldValue('facture_origine', originId);
											if (originId) void applyOrigin(originId);
										}}
										onBlur={formik.handleBlur('facture_origine')}
										error={!effectiveFreeMode && formik.touched.facture_origine && Boolean(formik.errors.facture_origine)}
										helperText={!effectiveFreeMode && formik.touched.facture_origine ? String(formik.errors.facture_origine || '') : ''}
										disabled={isEditMode || isLocked || effectiveFreeMode}
										startIcon={<ReceiptIcon fontSize="small" color="action" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<PersonIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										Client
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<CustomAutoCompleteSelect
									id="client"
									size="small"
									noOptionsText={t.documentForm.noClientFound}
									label={isClientRequired ? requiredLabel(t.facturesAvoir.selectClient) : t.facturesAvoir.selectClient}
									items={clientItems}
									theme={theme}
									value={selectedClient}
									fullWidth
									onChange={(_, newValue) => void formik.setFieldValue('client', newValue ? Number(newValue.value) : null)}
									onBlur={formik.handleBlur('client')}
									error={formik.touched.client && Boolean(formik.errors.client)}
									helperText={formik.touched.client ? String(formik.errors.client || '') : ''}
									disabled={!effectiveFreeMode || isLocked}
									startIcon={<PersonIcon fontSize="small" color="action" />}
								/>
							</CardContent>
						</Card>

						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<PaymentIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{t.documentForm.paymentSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomAutoCompleteSelect
										id="mode_paiement"
										size="small"
										noOptionsText={t.documentForm.noModePaiement}
										label={t.documentForm.modePaiementLabel}
										items={modePaiementItems}
										theme={theme}
										value={selectedModePaiement}
										fullWidth
										onChange={(_, newValue) => void formik.setFieldValue('mode_paiement', newValue ? Number(newValue.value) : null)}
										disabled={isLocked}
										startIcon={<PaymentIcon fontSize="small" color="action" />}
									/>
									<CustomTextInput
										id="numero_bon_commande_client"
										type="text"
										label={t.facturesAvoir.fieldNumeroBonCommande}
										value={formik.values.numero_bon_commande_client}
										onChange={formik.handleChange('numero_bon_commande_client')}
										fullWidth
										size="small"
										theme={inputFieldTheme}
										startIcon={<ReceiptIcon fontSize="small" color="action" />}
										disabled={isLocked}
									/>
								</Stack>
							</CardContent>
						</Card>

						<Box>
							<LinesGrid
								title={t.facturesAvoir.linesTitle}
								rows={rows}
								columns={dataGridColumns}
								onAddClick={() => {
									if (!isLocked) setShowAddArticleModal(true);
								}}
								isLoading={isArticlesLoading}
							/>
						</Box>

						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<DiscountIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{t.documentForm.remiseGlobaleSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<Button
										disabled={formik.values.lignes.length === 0 || isLocked}
										variant="outlined"
										startIcon={<DiscountIcon />}
										onClick={() => setShowGlobalRemiseModal(true)}
										fullWidth
									>
										{t.documentForm.applyGlobalRemise}
									</Button>
									<Button
										variant="outlined"
										color="error"
										startIcon={<DeleteIcon />}
										onClick={() => {
											void formik.setFieldValue('remise_type', '');
											void formik.setFieldValue('remise', 0);
										}}
										fullWidth
										disabled={!formik.values.remise || formik.values.remise <= 0 || isLocked}
									>
										{t.documentForm.removeGlobalRemise}
									</Button>
									{formik.values.remise_type && formik.values.remise > 0 && (
										<Typography variant="body2" sx={{ color: 'text.secondary' }}>
											Remise appliquée: {formik.values.remise}
											{formik.values.remise_type === 'Pourcentage' ? '%' : ` ${formik.values.devise}`}
										</Typography>
									)}
								</Stack>
							</CardContent>
						</Card>

						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<NotesIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										Remarque
									</Typography>
								</Stack>
								<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
								<CustomTextInput
									id="remarque"
									type="textarea"
									label={t.documentForm.remarqueLabel}
									value={formik.values.remarque || ''}
									onChange={formik.handleChange('remarque')}
									onBlur={formik.handleBlur('remarque')}
									fullWidth
									size="small"
									theme={inputFieldTheme}
									startIcon={<NotesIcon fontSize="small" color="action" />}
									disabled={isLocked}
								/>
							</CardContent>
						</Card>

						{isEditMode && (
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<DescriptionIcon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											{t.facturesAvoir.fieldStatut}
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<CustomDropDownSelect
											id="statut"
											label={t.documentForm.fieldStatut}
											items={['Brouillon', 'Envoyé', 'Accepté', 'Refusé', 'Annulé', 'Expiré']}
											value={formik.values.statut}
											onChange={(event) => void formik.setFieldValue('statut', event.target.value)}
											size="small"
											theme={customDropdownTheme()}
											startIcon={<DescriptionIcon fontSize="small" color="action" />}
											disabled={isLocked}
										/>
									</Stack>
								</CardContent>
							</Card>
						)}

						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? t.common.update : t.common.add}
								active={!isLocked && !isPending}
								type="submit"
								loading={isPending}
								startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
								onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
									if (showValidationAlert) {
										event.preventDefault();
										onError(t.common.correctErrors);
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}
								}}
								cssClass={Styles.submitButton}
							/>
						</Box>
					</Stack>
				</form>
				<AddArticleModal
					open={showAddArticleModal && !isLocked}
					onClose={() => setShowAddArticleModal(false)}
					companyId={company_id}
					selectedArticles={selectedArticles}
					setSelectedArticles={setSelectedArticles}
					onAdd={handleAddArticles}
					existingArticleIds={existingArticleIds}
					existingArticleLineValues={existingArticleLineValues}
					documentDevise={formik.values.devise}
				/>
				<GlobalRemiseModal
					open={showGlobalRemiseModal && !isLocked}
					onClose={() => setShowGlobalRemiseModal(false)}
					currentType={formik.values.remise_type || ''}
					currentValue={formik.values.remise || 0}
					onApply={handleApplyGlobalRemise}
					devise={formik.values.devise}
				/>
			</Stack>
		</LocalizationProvider>
	);
};

interface Props extends SessionProps {
	company_id: number;
	id?: number;
}

const FactureAvoirForm: React.FC<Props> = ({ session, company_id, id }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperForm
			session={session}
			company_id={company_id}
			id={id}
			documentConfig={{
				addTitle: t.facturesAvoir.addTitle,
				editTitle: t.facturesAvoir.editTitle,
			}}
			FormComponent={FormikContent}
		/>
	);
};

export default FactureAvoirForm;
