'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface } from '@/types/_initTypes';
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
	InputAdornment,
	Tooltip,
	IconButton,
	Alert,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Description as DescriptionIcon,
	Person as PersonIcon,
	Payment as PaymentIcon,
	Discount as DiscountIcon,
	CalendarToday as CalendarTodayIcon,
	Numbers as NumbersIcon,
	Receipt as ReceiptIcon,
	Notes as NotesIcon,
	Delete as DeleteIcon,
	Warning as WarningIcon,
	Edit as EditIcon,
	Add as AddIcon,
	LocalShipping as LocalShippingIcon,
	Refresh as RefreshIcon,
	AttachMoney as AttachMoneyIcon,
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
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import {
	getCompanyDocumentLabelForKey,
	parseNumber,
	setFormikAutoErrors,
	ValidatePricesHelper,
	formatLocalDate,
} from '@/utils/helpers';
import { textInputTheme, customDropdownTheme } from '@/utils/themes';
import { CLIENTS_ADD } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import type { ArticleClass, ClientClass } from '@/models/classes';
import { useGetClientsListQuery } from '@/store/services/client';
import { useGetCompanyQuery } from '@/store/services/company';
import { useToast } from '@/utils/hooks';
import type { DropDownType } from '@/types/accountTypes';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import { useGetArticlesListQuery } from '@/store/services/article';
import { bonDeLivraisonStatusItemsList, devisFactureStatusItemsList } from '@/utils/rawData';
import { useAddModePaiementMutation, useAddLivreParMutation, useGetModePaiementListQuery, useGetLivreParListQuery } from '@/store/services/parameter';
import FactureDevisTotalsCard from '@/components/shared/factureDevistotalCard/factureDevisTotalsCard';
import LinesGrid from '@/components/shared/linesGrid/linesGrid';
import type {
	DocumentFormConfig,
	DocumentFormSchema,
	DevisFormSchema,
	FactureFormSchema,
	DocumentFormData,
	DevisDocumentData,
	FactureDocumentData,
	BonDeLivraisonDocumentData,
	DocumentNumResponse,
	DevisNumResponse,
	FactureNumResponse,
	BonDeLivraisonNumResponse,
	DeviFactureLineFormValues,
	TypeFactureLivraisonDevisStatus,
	DocumentListClass,
	BonDeLivraisonFormSchema,
} from '@/types/companyDocumentsTypes';
import type { ValidateArticleLinesErrorType } from '@/types/devisTypes';
import { useDocumentLinesColumns } from './useDocumentLinesColumns';
import DocumentFormModals from './DocumentFormModals';
import type { SelectedArticlePopupValues } from '@/components/shared/addArticleModal/addArticleModal';

const inputFieldTheme = textInputTheme();

const SCROLL_TO_LINES_KEY = 'scrollToLinesOnNextMount';

// Generate stable row ID
export const generateRowId = (
	articleRef: number | string | Partial<ArticleClass> | undefined,
	index: number,
): string => {
	let id: string | number;
	if (articleRef == null) {
		id = 'na';
	} else if (typeof articleRef === 'number') {
		id = articleRef;
	} else if (typeof articleRef === 'string') {
		const n = Number(articleRef);
		id = Number.isFinite(n) ? n : articleRef;
	} else {
		const maybeId = (articleRef as Partial<ArticleClass>).id;
		id = maybeId != null ? maybeId : 'na';
	}
	return `${id}-${index}`;
};

// Helper to get numero from data
const getNumeroFromData = <TDocument extends DocumentListClass>(
	isEditMode: boolean,
	rawData: DocumentFormData | undefined,
	rawNumData: DocumentNumResponse | undefined,
	config: DocumentFormConfig<TDocument>,
): string => {
	if (isEditMode) {
		if (config.fields.numeroField === 'numero_devis') {
			return (rawData as DevisDocumentData | undefined)?.numero_devis ?? '';
		} else if (config.fields.numeroField === 'numero_bon_livraison') {
			return (rawData as BonDeLivraisonDocumentData | undefined)?.numero_bon_livraison ?? '';
		}
		return (rawData as FactureDocumentData | undefined)?.numero_facture ?? '';
	}
	if (config.fields.numeroField === 'numero_devis') {
		return (rawNumData as DevisNumResponse | undefined)?.numero_devis ?? '';
	} else if (config.fields.numeroField === 'numero_bon_livraison') {
		return (rawNumData as BonDeLivraisonNumResponse | undefined)?.numero_bon_livraison ?? '';
	}
	return (rawNumData as FactureNumResponse | undefined)?.numero_facture ?? '';
};

// Props for the shared component
export interface SharedDocumentFormContentProps<TDocument extends DocumentListClass = DocumentListClass> {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	config: DocumentFormConfig<TDocument>;
	role?: string;
	// Data from API
	rawData?: DocumentFormData;
	isDataLoading: boolean;
	dataError?: unknown;
	rawNumData?: DocumentNumResponse;
	isNumLoading: boolean;
	refetchNum?: () => Promise<unknown>;
	// Mutation functions
	addData: (params: { data: DocumentFormSchema }) => { unwrap: () => Promise<{ id?: number }> };
	isAddLoading: boolean;
	addError?: unknown;
	updateData: (params: { data: DocumentFormSchema; id: number }) => { unwrap: () => Promise<unknown> };
	isUpdateLoading: boolean;
	updateError?: unknown;
	patchStatut: (params: { id: number; data: { statut: TypeFactureLivraisonDevisStatus } }) => {
		unwrap: () => Promise<unknown>;
	};
	isPatchLoading: boolean;
	patchError?: unknown;
}

const CompanyDocumentFormContent = <TDocument extends DocumentListClass = DocumentListClass>(
	props: SharedDocumentFormContentProps<TDocument>,
): React.JSX.Element => {
	const {
		token,
		company_id,
		id,
		isEditMode,
		config,
		refetchNum,
		role,
		rawData,
		isDataLoading,
		dataError,
		rawNumData,
		isNumLoading,
		addData,
		isAddLoading,
		addError,
		updateData,
		isUpdateLoading,
		updateError,
		patchStatut,
		isPatchLoading,
		patchError,
	} = props;

	const { onSuccess, onError } = useToast();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();

	// Single articles query — fetch ALL articles (including archived) for both
	// the picker and the map lookups.  The non-archived subset for the picker
	// is derived client-side via useMemo, eliminating a second network request.
	const { data: rawAllArticlesData, isLoading: isArticlesLoading } = useGetArticlesListQuery(
		{ company_id, with_pagination: false },
		{ skip: !token },
	);
	const allArticlesData = rawAllArticlesData as Array<Partial<ArticleClass>> | undefined;

	// Derive non-archived articles for the picker (avoids a second API call)
	const articlesData = useMemo(
		() => allArticlesData?.filter((a) => !a.archived),
		[allArticlesData],
	);

	// Keep isAllArticlesLoading as an alias so downstream code doesn't break
	const isAllArticlesLoading = isArticlesLoading;

	// Derived articles map — recomputes when data arrives, driving
	// getArticleById identity change which propagates to columns, rows & totals.
	const articlesMap = useMemo(() => {
		const m = new Map<number, Partial<ArticleClass>>();
		(allArticlesData || []).forEach((a) => {
			if (a?.id != null) m.set(a.id, a);
		});
		return m;
	}, [allArticlesData]);

	const getArticleById = useCallback(
		(articleRef: number | string | Partial<ArticleClass> | undefined): Partial<ArticleClass> | undefined => {
			if (articleRef == null) return undefined;
			let idNum: number | undefined;
			if (typeof articleRef === 'number') {
				idNum = articleRef;
			} else if (typeof articleRef === 'string') {
				const parsed = Number(articleRef);
				idNum = Number.isFinite(parsed) ? parsed : undefined;
			} else {
				const maybeId = (articleRef as Partial<ArticleClass>).id;
				idNum = maybeId != null ? Number(maybeId) : undefined;
			}
			if (idNum == null || !Number.isFinite(idNum)) return undefined;
			return articlesMap.get(Number(idNum));
		},
		[articlesMap],
	);

	// Clients query
	const { data: rawClientsData } = useGetClientsListQuery(
		{ company_id, with_pagination: false },
		{ skip: !token },
	);

	// Company query for uses_foreign_currency flag
	const { data: companyData } = useGetCompanyQuery({ id: company_id }, { skip: !token });
	const usesForeignCurrency = companyData?.uses_foreign_currency === true;
	const clientsData = rawClientsData as Array<Partial<ClientClass>> | undefined;

	// Mode paiement
	const [addModePaiement] = useAddModePaiementMutation();
	const [openModePaiementModal, setOpenModePaiementModal] = useState(false);
	const { data: modePaiementData } = useGetModePaiementListQuery({ company_id }, { skip: !token });

	// Livre par
	const [addLivrePar] = useAddLivreParMutation();
	const [openLivreParModal, setOpenLivreParModal] = useState(false);
	const { data: livreParData } = useGetLivreParListQuery({ company_id }, { skip: !token });

	// Error handling
	const error = isEditMode ? dataError || updateError || patchError : addError;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const [isPending, setIsPending] = useState(false);

	// Modal states
	const [showAddArticleModal, setShowAddArticleModal] = useState(false);
	const [showGlobalRemiseModal, setShowGlobalRemiseModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLineIndex, setDeleteLineIndex] = useState<number | null>(null);
	const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
	const [validationErrors, setValidationErrors] = useState<ValidateArticleLinesErrorType>({});
	const topRef = useRef<HTMLDivElement | null>(null);
	const linesGridRef = useRef<HTMLDivElement | null>(null);
	const prevRawNumDataRef = useRef<DocumentNumResponse | undefined>(rawNumData);
	// Split numero into parts
	const initialNum = getNumeroFromData(isEditMode, rawData, rawNumData, config);
	const [numNumberPart = '', numYearPart = ''] = initialNum.split('/');

	// Build initial values based on document type
	const getInitialValues = (): DocumentFormSchema => {
		const today = formatLocalDate(new Date());
		const devisData = rawData as DevisDocumentData | undefined;
		const factureData = rawData as FactureDocumentData | undefined;
		const bonDeLivraisonData = rawData as BonDeLivraisonDocumentData | undefined;

		if (config.documentType === 'devis') {
			return {
				numero_part: numNumberPart,
				year_part: numYearPart,
				client: isEditMode ? (rawData?.client ?? null) : null,
				date_devis: isEditMode
					? (devisData?.date_devis ?? today)
					: today,
				numero_demande_prix_client: isEditMode ? (devisData?.numero_demande_prix_client ?? null) : null,
				mode_paiement: isEditMode ? (rawData?.mode_paiement ?? null) : null,
				remarque: isEditMode ? (rawData?.remarque ?? null) : null,
				remise_type: isEditMode ? rawData?.remise_type : undefined,
				remise: isEditMode ? rawData?.remise : undefined,
				devise: isEditMode ? (rawData?.devise ?? 'MAD') : 'MAD',
				lignes: isEditMode ? (rawData?.lignes ?? []) : [],
				globalError: '',
			} as DevisFormSchema;
		} else if (config.documentType === 'facture-client' || config.documentType === 'facture-pro-forma') {
			return {
				numero_part: numNumberPart,
				year_part: numYearPart,
				client: isEditMode ? (rawData?.client ?? null) : null,
				date_facture: isEditMode
					? (factureData?.date_facture ?? today)
					: today,
				numero_bon_commande_client: isEditMode ? (factureData?.numero_bon_commande_client ?? null) : null,
				mode_paiement: isEditMode ? (rawData?.mode_paiement ?? null) : null,
				remarque: isEditMode ? (rawData?.remarque ?? null) : null,
				remise_type: isEditMode ? rawData?.remise_type : undefined,
				remise: isEditMode ? rawData?.remise : undefined,
				devise: isEditMode ? (rawData?.devise ?? 'MAD') : 'MAD',
				lignes: isEditMode ? (rawData?.lignes ?? []) : [],
				globalError: '',
			} as FactureFormSchema;
		} else {
			return {
				numero_part: numNumberPart,
				year_part: numYearPart,
				client: isEditMode ? (rawData?.client ?? null) : null,
				date_bon_livraison: isEditMode
					? (bonDeLivraisonData?.date_bon_livraison ?? today)
					: today,
				numero_bon_commande_client: isEditMode ? (factureData?.numero_bon_commande_client ?? null) : null,
				mode_paiement: isEditMode ? (rawData?.mode_paiement ?? null) : null,
				livre_par: isEditMode ? (bonDeLivraisonData?.livre_par ?? null) : null,
				remarque: isEditMode ? (rawData?.remarque ?? null) : null,
				remise_type: isEditMode ? rawData?.remise_type : undefined,
				remise: isEditMode ? rawData?.remise : undefined,
				devise: isEditMode ? (rawData?.devise ?? 'MAD') : 'MAD',
				lignes: isEditMode ? (rawData?.lignes ?? []) : [],
				globalError: '',
			} as BonDeLivraisonFormSchema;
		}
	};

	const formik = useFormik<DocumentFormSchema>({
		initialValues: getInitialValues(),
		enableReinitialize: true,
		validationSchema: toFormikValidationSchema(isEditMode ? config.validation.editSchema : config.validation.addSchema),
		validateOnMount: false,
		onSubmit: async (data, { setFieldError }) => {
			// Check if articles list is empty
			if (isEditMode) {
				if (!data.lignes || data.lignes.length === 0) {
					setValidationErrors((prev) => ({
						...prev,
						lignes_empty: 'Vous devez ajouter au moins un article',
					}));
					onError('Vous devez ajouter au moins un article');
					topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
					return;
				}
				// Clear articles validation error if it exists
				setValidationErrors((prev) => {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { lignes_empty, ...rest } = prev;
					return rest;
				});
			}
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...payload } = data;

			try {
				if (isEditMode) {
					// Convert ligne values to proper numbers for backend (only in edit mode)
					const normalizedLignes = (payload.lignes ?? []).map((ligne) => ({
						...ligne,
						prix_achat: parseNumber(ligne.prix_achat ?? ''),
						prix_vente: parseNumber(ligne.prix_vente ?? ''),
						quantity: parseNumber(ligne.quantity ?? '') ?? 1,
						remise: parseNumber(ligne.remise ?? '') ?? 0,
					}));

					// Normalize global remise
					const normalizedRemise = parseNumber(payload.remise ?? '');

					const submissionData = {
						...payload,
						lignes: normalizedLignes,
						remise: normalizedRemise,
						...(config.documentType === 'devis'
							? { numero_devis: `${data.numero_part}/${data.year_part}` }
							: config.documentType === 'facture-client' || config.documentType === 'facture-pro-forma'
								? { numero_facture: `${data.numero_part}/${data.year_part}` }
								: { numero_bon_livraison: `${data.numero_part}/${data.year_part}` }),
					} as DocumentFormSchema;
					await updateData({ data: submissionData, id: id! }).unwrap();
					onSuccess(config.labels.updateSuccessMessage);
				} else {
					// In add mode, exclude lignes and remise fields as they're not part of initial creation
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { lignes, remise, remise_type, ...payloadWithoutLines } = payload;
					const submissionData = {
						...payloadWithoutLines,
						...(config.documentType === 'devis'
							? { numero_devis: `${data.numero_part}/${data.year_part}` }
							: config.documentType === 'facture-client' || config.documentType === 'facture-pro-forma'
								? { numero_facture: `${data.numero_part}/${data.year_part}` }
								: { numero_bon_livraison: `${data.numero_part}/${data.year_part}` }),
					} as DocumentFormSchema;
					const response = await addData({ data: submissionData }).unwrap();
					onSuccess(config.labels.addSuccessMessage);
					if (response.id) {
						sessionStorage.setItem(SCROLL_TO_LINES_KEY, 'true');
						router.replace(config.routes.editRoute(response.id!, company_id));
					}
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? config.labels.updateErrorMessage : config.labels.addErrorMessage);
			} finally {
				setIsPending(false);
			}
		},
	});

	// Update numero_part and year_part when rawNumData changes (after refetch)
	useEffect(() => {
		if (!isEditMode && rawNumData && prevRawNumDataRef.current !== rawNumData) {
			prevRawNumDataRef.current = rawNumData;
			const newNum = getNumeroFromData(isEditMode, rawData, rawNumData, config);
			const [newNumberPart = '', newYearPart = ''] = newNum.split('/');
			formik.setFieldValue('numero_part', newNumberPart);
			formik.setFieldValue('year_part', newYearPart);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rawNumData, isEditMode, rawData, config]);

	const getLines = useCallback((): DeviFactureLineFormValues[] => {
		return Array.isArray(formik.values.lignes) ? (formik.values.lignes as DeviFactureLineFormValues[]) : [];
	}, [formik.values.lignes]);

	// Client items for dropdown
	const clientItems = useMemo(() => {
		if (!clientsData) return [];
		return clientsData.map((client) => {
			const label =
				client.client_type === 'Personne physique'
					? `${client.nom || ''} ${client.prenom || ''}`.trim()
					: client.raison_sociale || '';
			return { code: label, value: String(client.id), archived: !!client.archived };
		}) as Array<DropDownType>;
	}, [clientsData]);

	// Mode paiement items
	const modePaiementItems: DropDownType[] = useMemo(
		() => (modePaiementData ?? []).map((c) => ({ value: String(c.id), code: c.nom })),
		[modePaiementData],
	);

	const selectedModePaiement = useMemo<DropDownType | null>(() => {
		const v = formik.values.mode_paiement;
		if (!v || modePaiementItems.length === 0) return null;
		return modePaiementItems.find((c) => c.value === String(v)) ?? null;
	}, [formik.values.mode_paiement, modePaiementItems]);

	// Livre par items
	const livreParItems: DropDownType[] = useMemo(
		() => (livreParData ?? []).map((c) => ({ value: String(c.id), code: c.nom })),
		[livreParData],
	);

	const livreParValue = (formik.values as { livre_par?: number | null }).livre_par;
	const selectedLivrePar = useMemo<DropDownType | null>(() => {
		if (!livreParValue || livreParItems.length === 0) return null;
		return livreParItems.find((c) => c.value === String(livreParValue)) ?? null;
	}, [livreParValue, livreParItems]);

	// Calculate total HT before global remise
	const calculateTotalHTBeforeGlobal = useCallback((): number => {
		let total = 0;
		const lignes = getLines();
		lignes.forEach((ligne) => {
			const prixVente = parseNumber(ligne.prix_vente ?? '') ?? 0;
			const quantity = parseNumber(ligne.quantity ?? '') ?? 1;
			const baseHT = prixVente * (isFinite(quantity) ? quantity : 1);
			let discountedHT = baseHT;
			const remiseVal = parseNumber(ligne.remise ?? '') ?? 0;
			if (remiseVal > 0 && ligne.remise_type) {
				if (ligne.remise_type === 'Pourcentage') {
					discountedHT = baseHT * (1 - remiseVal / 100);
				} else if (ligne.remise_type === 'Fixe') {
					discountedHT = Math.max(0, baseHT - remiseVal);
				}
			}
			if (Number.isFinite(discountedHT)) total += discountedHT;
		});
		return total;
	}, [getLines]);

	// Calculate totals
	const totals = useMemo(() => {
		if (isAllArticlesLoading) {
			return {
				totalHT: 0,
				totalTVA: 0,
				totalTTC: 0,
				totalHTAfterRemise: 0,
				totalTVAAfterRemise: 0,
				totalTTCApresRemise: 0,
			};
		}
		let rawTotalHT = 0;
		const linesData: Array<{ lineHT: number; tvaRate: number }> = [];
		const lignes = getLines();
		lignes.forEach((ligne) => {
			const article = getArticleById(ligne.article);
			const prixVente = parseNumber(ligne.prix_vente ?? '') ?? 0;
			const quantity = parseNumber(ligne.quantity ?? '') ?? 1;
			const baseHT = prixVente * (isFinite(quantity) ? quantity : 1);
			let discountedHT = baseHT;
			const remiseVal = parseNumber(ligne.remise ?? '') ?? 0;
			if (remiseVal > 0 && ligne.remise_type) {
				if (ligne.remise_type === 'Pourcentage') discountedHT = baseHT * (1 - remiseVal / 100);
				else if (ligne.remise_type === 'Fixe') discountedHT = Math.max(0, baseHT - remiseVal);
			}
			const tvaRate = parseNumber(article?.tva ?? '') ?? 0;
			if (Number.isFinite(discountedHT)) {
				rawTotalHT += discountedHT;
				linesData.push({ lineHT: discountedHT, tvaRate });
			}
		});

		// Apply global remise on HT
		let finalTotalHT = rawTotalHT;
		const globalRemiseVal = parseNumber(formik.values.remise ?? '') ?? 0;
		if (globalRemiseVal > 0 && formik.values.remise_type) {
			if (formik.values.remise_type === 'Pourcentage') finalTotalHT = rawTotalHT * (1 - globalRemiseVal / 100);
			else if (formik.values.remise_type === 'Fixe') finalTotalHT = Math.max(0, rawTotalHT - globalRemiseVal);
		}

		// Recalculate TVA on HT après remise (per-line for mixed TVA rates)
		const ratio = rawTotalHT > 0 ? finalTotalHT / rawTotalHT : 0;
		let finalTotalTVA = 0;
		for (const { lineHT, tvaRate } of linesData) {
			const adjustedLineHT = lineHT * ratio;
			finalTotalTVA += adjustedLineHT * (tvaRate / 100);
		}

		const finalTotalTTC = finalTotalHT + finalTotalTVA;

		return {
			totalHT: Math.max(0, Number.isFinite(rawTotalHT) ? rawTotalHT : 0),
			totalTVA: Math.max(0, Number.isFinite(finalTotalTVA) ? finalTotalTVA : 0),
			totalTTC: Math.max(0, Number.isFinite(finalTotalTTC) ? finalTotalTTC : 0),
			totalHTAfterRemise: Math.max(0, Number.isFinite(finalTotalHT) ? finalTotalHT : 0),
			totalTVAAfterRemise: Math.max(0, Number.isFinite(finalTotalTVA) ? finalTotalTVA : 0),
			totalTTCApresRemise: Math.max(0, Number.isFinite(finalTotalTTC) ? finalTotalTTC : 0),
		};
	}, [isAllArticlesLoading, getLines, formik.values.remise, formik.values.remise_type, getArticleById]);

	// Handle line changes with validation
	const handleLineChange = useCallback(
		(index: number, field: keyof DeviFactureLineFormValues, value: string | number) => {
			const lignes = getLines();
			const ligne = lignes[index];
			if (!ligne) return;

			setValidationErrors((prevErrors) => {
				const newErrors = { ...prevErrors };
				const errorKey = `ligne_${index}_${String(field)}`;
				const remiseErrorKey = `ligne_${index}_remise`;

				if (field === 'remise_type') {
					delete newErrors[remiseErrorKey];
					if (value && (parseNumber(ligne.remise ?? '') ?? 0) > 0) {
						const newRemiseType = value as 'Pourcentage' | 'Fixe' | '';
						const prixVente = parseNumber(ligne.prix_vente ?? '') ?? 0;
						const quantity = parseNumber(ligne.quantity ?? '') ?? 1;
						const baseAmount = prixVente * (isFinite(quantity) ? quantity : 1);
						const remiseError = ValidatePricesHelper.validateRemise(
							parseNumber(ligne.remise ?? '') ?? NaN,
							newRemiseType,
							baseAmount,
						);
						if (remiseError) newErrors[remiseErrorKey] = remiseError;
					}
				} else if (field === 'prix_vente') {
					const pv = parseNumber(value);
					const prixAchat = parseNumber(ligne.prix_achat ?? '') ?? 0;
					const numValue = pv === null ? NaN : pv;
					const error = ValidatePricesHelper.validatePrixVente(numValue, prixAchat);
					if (error) newErrors[errorKey] = error;
					else delete newErrors[errorKey];
					if ((parseNumber(ligne.remise ?? '') ?? 0) > 0 && ligne.remise_type) {
						const quantity = parseNumber(ligne.quantity ?? '') ?? 1;
						const baseAmount = (pv === null ? 0 : pv) * (isFinite(quantity) ? quantity : 1);
						const remiseError = ValidatePricesHelper.validateRemise(
							parseNumber(ligne.remise ?? '') ?? NaN,
							ligne.remise_type,
							baseAmount,
						);
						if (remiseError) newErrors[remiseErrorKey] = remiseError;
						else delete newErrors[remiseErrorKey];
					}
				} else if (field === 'quantity') {
					if ((parseNumber(ligne.remise ?? '') ?? 0) > 0 && ligne.remise_type) {
						const q = parseNumber(value);
						const prixVente = parseNumber(ligne.prix_vente ?? '') ?? 0;
						const quantity = q === null ? NaN : q;
						const baseAmount = prixVente * (isFinite(quantity) ? quantity : 1);
						const remiseError = ValidatePricesHelper.validateRemise(
							parseNumber(ligne.remise ?? '') ?? NaN,
							ligne.remise_type,
							baseAmount,
						);
						if (remiseError) newErrors[remiseErrorKey] = remiseError;
						else delete newErrors[remiseErrorKey];
					}
				} else if (field === 'remise') {
					const r = parseNumber(value);
					const prixVente = parseNumber(ligne.prix_vente ?? '') ?? 0;
					const quantity = parseNumber(ligne.quantity ?? '') ?? 1;
					const baseAmount = prixVente * (isFinite(quantity) ? quantity : 1);
					const error = ValidatePricesHelper.validateRemise(r ?? NaN, ligne.remise_type, baseAmount);
					if (error) newErrors[errorKey] = error;
					else delete newErrors[errorKey];
				} else {
					delete newErrors[errorKey];
				}
				return newErrors;
			});

			const updatedLines = [...lignes];
			updatedLines[index] = { ...updatedLines[index], [field]: value };
			if (field === 'remise_type' && !value) updatedLines[index].remise = 0;
			formik.setFieldValue('lignes', updatedLines);
		},
		[getLines, formik],
	);

	// Handle adding/updating articles from popup selections
	const handleAddArticles = useCallback((selectedArticlesData: SelectedArticlePopupValues[]) => {
		const currentLines = getLines();
		const updatedLines = [...currentLines];
		const lineIndexByArticleId = new Map<number, number>();

		currentLines.forEach((line, index) => {
			if (!lineIndexByArticleId.has(line.article)) {
				lineIndexByArticleId.set(line.article, index);
			}
		});

		selectedArticlesData.forEach((selection) => {
			const article = getArticleById(selection.articleId);
			if (!article) return;

			const parsedQuantity = parseNumber(selection.quantity) ?? 1;
			const normalizedQuantity = parsedQuantity < 0.01 ? 1 : parsedQuantity;
			const normalizedRemiseType = (selection.remise_type || '') as '' | 'Pourcentage' | 'Fixe';
			const parsedRemise = parseNumber(selection.remise) ?? 0;
			const normalizedRemise = parsedRemise < 0 ? 0 : parsedRemise;

			const existingIndex = lineIndexByArticleId.get(selection.articleId);
			if (existingIndex !== undefined) {
				updatedLines[existingIndex] = {
					...updatedLines[existingIndex],
					quantity: normalizedQuantity,
					remise_type: normalizedRemiseType,
					remise: normalizedRemiseType ? normalizedRemise : 0,
				};
				return;
			}

			updatedLines.push({
				article: selection.articleId,
				reference: (article.reference as string) || '',
				designation: article.designation || '',
				prix_achat: article.prix_achat || 0,
				devise_prix_achat: article.devise_prix_achat || 'MAD',
				prix_vente: article.prix_vente || 0,
				devise_prix_vente: article.devise_prix_vente || article.devise_prix_achat || 'MAD',
				quantity: normalizedQuantity,
				remise_type: normalizedRemiseType,
				remise: normalizedRemiseType ? normalizedRemise : 0,
			} as DeviFactureLineFormValues);
		});

		formik.setFieldValue('lignes', updatedLines);

		// Clear lignes_empty validation error when articles are added
		setValidationErrors((prev) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { lignes_empty, ...rest } = prev;
			return rest;
		});

		setShowAddArticleModal(false);
		setSelectedArticles(new Set());
	}, [getArticleById, getLines, formik]);

	// Handle delete line
	const handleDeleteLine = useCallback((index: number) => {
		setDeleteLineIndex(index);
		setShowDeleteConfirm(true);
	}, []);

	const confirmDeleteLine = useCallback(() => {
		if (deleteLineIndex === null) return;
		const currentLines = getLines();
		const updatedLines = currentLines.filter((_, i) => i !== deleteLineIndex);
		formik.setFieldValue('lignes', updatedLines);
		setValidationErrors((prevErrors) => {
			const newErrors: ValidateArticleLinesErrorType = {};
			Object.entries(prevErrors).forEach(([key, value]) => {
				const match = key.match(/^ligne_(\d+)_(.+)$/);
				if (match) {
					const lineIndex = parseInt(match[1]);
					const field = match[2];
					if (lineIndex === deleteLineIndex) return;
					if (lineIndex > deleteLineIndex) newErrors[`ligne_${lineIndex - 1}_${field}`] = value;
					else newErrors[key] = value;
				} else {
					newErrors[key] = value;
				}
			});
			return newErrors;
		});
		setShowDeleteConfirm(false);
		setDeleteLineIndex(null);
	}, [deleteLineIndex, getLines, formik]);

	const handleLineChangeRef = useRef(handleLineChange);
	useEffect(() => {
		handleLineChangeRef.current = handleLineChange;
	}, [handleLineChange]);

	// Sync formik.errors.lignes with validationErrors state for red border highlighting
	useEffect(() => {
		const lignesErrors = formik.errors.lignes;
		if (lignesErrors && Array.isArray(lignesErrors)) {
			setValidationErrors((prevErrors) => {
				const newErrors = { ...prevErrors };
				lignesErrors.forEach((lineError: unknown, index: number) => {
					if (lineError && typeof lineError === 'object') {
						Object.entries(lineError as Record<string, string>).forEach(([field, message]) => {
							if (message) {
								const errorKey = `ligne_${index}_${field}`;
								newErrors[errorKey] = message;
							}
						});
					}
				});
				return newErrors;
			});
		}
	}, [formik.errors.lignes]);

	const { linesColumns } = useDocumentLinesColumns({
		getLines,
		validationErrors,
		role,
		devise: formik.values.devise ?? 'MAD',
		handleLineChangeRef,
		handleDeleteLine,
		getArticleById,
	});

	const existingArticleIds = useMemo(() => new Set(getLines().map((l) => l.article)), [getLines]);

	const existingArticleLineValues = useMemo(() => {
		const lineValues: Record<number, { quantity: string | number; remise_type: '' | 'Pourcentage' | 'Fixe'; remise: string | number }> = {};
		getLines().forEach((line) => {
			if (lineValues[line.article]) return;
			lineValues[line.article] = {
				quantity: line.quantity ?? 1,
				remise_type: (line.remise_type || '') as '' | 'Pourcentage' | 'Fixe',
				remise: line.remise ?? 0,
			};
		});
		return lineValues;
	}, [getLines]);

	const handleStatutChange = async (newValue: string) => {
		try {
			if (!newValue) return;
			await patchStatut({ id: id!, data: { statut: newValue as TypeFactureLivraisonDevisStatus } }).unwrap();
			onSuccess('Statut mis à jour avec succès.');
		} catch {
			onError('Échec de la mise à jour du statut.');
		}
	};

	const handleApplyGlobalRemise = useCallback(
		(type: 'Pourcentage' | 'Fixe' | '', value: number) => {
			if (!type || value === 0) {
				formik.setFieldValue('remise_type', '');
				formik.setFieldValue('remise', 0);
				setValidationErrors((prev) => {
					const n = { ...prev };
					delete n['global_remise'];
					return n;
				});
				setShowGlobalRemiseModal(false);
				return;
			}
			const totalHTBeforeGlobal = calculateTotalHTBeforeGlobal();
			const validationError = ValidatePricesHelper.validateGlobalRemise(value, type, totalHTBeforeGlobal);
			if (validationError) {
				setValidationErrors((prev) => ({ ...prev, global_remise: validationError }));
				onError(validationError);
			} else {
				setValidationErrors((prev) => {
					const n = { ...prev };
					delete n['global_remise'];
					return n;
				});
				formik.setFieldValue('remise_type', type);
				formik.setFieldValue('remise', value);
				setShowGlobalRemiseModal(false);
			}
		},
		[formik, calculateTotalHTBeforeGlobal, onError],
	);

	const dataGridRows = useMemo(() => {
		const lignes = getLines();
		return lignes.map((ligne, index) => {
			const article = getArticleById(ligne.article);
			return {
				...ligne,
				id: generateRowId(ligne.article, index),
				rowIndex: index,
				// Embed article fields so the DataGrid re-renders cells
				// (marque, catégorie, photo) once articles data arrives.
				marque_name: article?.marque_name ?? '',
				categorie_name: article?.categorie_name ?? '',
				photo: article?.photo ?? null,
				archived: article?.archived ?? false,
			};
		});
	}, [getLines, getArticleById]);

	// Get date value based on document type
	const getDateValue = (): string => {
		if (config.documentType === 'devis') {
			return (formik.values as DevisFormSchema).date_devis;
		} else if (config.documentType === 'facture-client' || config.documentType === 'facture-pro-forma') {
			return (formik.values as FactureFormSchema).date_facture;
		}
		return (formik.values as BonDeLivraisonFormSchema).date_bon_livraison;
	};

	// Get extra field value based on document type
	const getExtraFieldValue = (): string => {
		if (config.fields.extraField === 'numero_demande_prix_client') {
			return (formik.values as DevisFormSchema).numero_demande_prix_client || '';
		}
		return (formik.values as FactureFormSchema).numero_bon_commande_client || '';
	};

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			numero_part: 'Numéro',
			year_part: 'Année',
			client: 'Client',
			date_devis: 'Date',
			date_facture: 'Date',
			date_bon_livraison: 'Date',
			numero_demande_prix_client: 'N° demande prix client',
			numero_bon_commande_client: 'N° bon commande client',
			mode_paiement: 'Mode de paiement',
			livre_par: 'Livreur',
			remarque: 'Remarque',
			remise_type: 'Type remise',
			remise: 'Remise',
			globalError: 'Erreur globale',
			global_remise: 'Remise globale',
			lignes: 'Lignes',
			lignes_empty: 'Articles',
			// line fields
			prix_vente: 'Prix de vente',
			prix_achat: "Prix d'achat",
			quantity: 'Quantité',
			designation: 'Désignation',
			reference: 'Référence',
			marque: 'Marque',
			categorie: 'Catégorie',
			remise_field: 'Remise', // generic fallback for remise field naming
		}),
		[],
	);

	const combinedValidationEntries = useMemo(() => {
		const entriesMap = new Map<string, string>();
		// First add custom validation errors
		Object.entries(validationErrors).forEach(([k, v]) => entriesMap.set(k, String(v)));
		// Then add formik errors (avoiding duplicates)
		Object.entries(formik.errors).forEach(([k, v]) => {
			if (k === 'lignes' && Array.isArray(v)) {
				// Process ligne errors properly
				v.forEach((lineError, index) => {
					if (lineError && typeof lineError === 'object') {
						Object.entries(lineError).forEach(([field, message]) => {
							if (message && typeof message === 'string') {
								const errorKey = `ligne_${index}_${field}`;
								if (!entriesMap.has(errorKey)) {
									entriesMap.set(errorKey, message);
								}
							}
						});
					}
				});
			} else if (typeof v === 'string') {
				if (!entriesMap.has(k)) {
					entriesMap.set(k, v);
				}
			}
			// Skip non-string, non-lignes entries to avoid [object object] issues
		});
		return Array.from(entriesMap.entries());
	}, [validationErrors, formik.errors]);

	const hasValidationErrors = combinedValidationEntries.length > 0;
	const hasLineValidationErrors = Object.keys(validationErrors).length > 0;

	// Show Alert only after a submit attempt or when line-level/custom validation errors exist
	const showValidationAlert = hasValidationErrors && (formik.submitCount > 0 || hasLineValidationErrors);

	// scroll to top when submit attempted and there are errors
	useEffect(() => {
		if (formik.submitCount > 0 && hasValidationErrors) {
			onError('Veuillez corriger les erreurs de validation avant de soumettre.');
			topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, [formik.submitCount, hasValidationErrors, onError]);

	// Core loading: blocks the entire form.  Only wait for the document
	// detail (edit) or numero generation (add) plus active mutations.
	// Articles & clients load in the background – their dropdowns show
	// individual loading states, but the form skeleton renders immediately.
	const isLoading =
		isPatchLoading ||
		isUpdateLoading ||
		isAddLoading ||
		isPending ||
		isDataLoading ||
		isNumLoading;
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	// After creation, scroll to the "Lignes" section once data is ready
	useEffect(() => {
		if (!isEditMode || isLoading || !linesGridRef.current) return;
		if (sessionStorage.getItem(SCROLL_TO_LINES_KEY) !== 'true') return;
		sessionStorage.removeItem(SCROLL_TO_LINES_KEY);
		// Small delay so the grid has finished painting
		const id = requestAnimationFrame(() => {
			linesGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		});
		return () => cancelAnimationFrame(id);
	}, [isEditMode, isLoading]);

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack ref={topRef} spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				<Stack direction={isMobile ? 'column' : 'row'} pt={2} justifyContent="space-between" spacing={2}>
					<Button
						variant="outlined"
						startIcon={<ArrowBackIcon />}
						onClick={() => router.push(config.routes.listRoute)}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
					>
						{config.labels.listLabel}
					</Button>
				</Stack>

				{showValidationAlert && (
					<Alert severity="error" icon={<WarningIcon />}>
						<Typography variant="subtitle2" fontWeight={600}>
							Erreurs de validation détectées:
						</Typography>
						<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
							{combinedValidationEntries.map(([key, error]) => (
								<li key={key}>
									<Typography variant="body2">
										{getCompanyDocumentLabelForKey(fieldLabels, key)} : {error}
									</Typography>
								</li>
							))}
						</ul>
					</Alert>
				)}

				{isEditMode && !shouldShowError && (
					<FactureDevisTotalsCard
						totals={{
							totalHT: totals.totalHT,
							totalTVA: totals.totalTVA,
							totalTTC: totals.totalTTC,
							totalTTCApresRemise: totals.totalTTCApresRemise,
						}}
						devise={formik.values.devise}
						isMobile={isMobile}
						isLoading={isAllArticlesLoading}
					/>
				)}

				{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}

				{isLoading ? (
					<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
				) : shouldShowError ? (
					<ApiAlert errorDetails={axiosError?.data.details} />
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
													id="numero_part"
													type="text"
													label="Numéro *"
													value={formik.values.numero_part}
													onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
														if (/^\d*$/.test(e.target.value)) formik.setFieldValue('numero_part', e.target.value);
													}}
													onBlur={formik.handleBlur('numero_part')}
													error={formik.touched.numero_part && Boolean(formik.errors.numero_part)}
													helperText={
														formik.touched.numero_part && formik.errors.numero_part ? formik.errors.numero_part : ''
													}
													fullWidth
													size="small"
													theme={inputFieldTheme}
													startIcon={<NumbersIcon fontSize="small" color="action" />}
													slotProps={{ input: { inputProps: { inputMode: 'numeric', pattern: '[0-9]*' } } }}
												/>
											</Box>
											<Typography variant="h6" sx={{ px: 0.5, mt: 1 }}>
												/
											</Typography>
											<Box sx={{ flex: 1 }}>
												<CustomTextInput
													id="year_part"
													type="text"
													label="Année *"
													value={formik.values.year_part}
													onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
														if (/^\d{0,2}$/.test(e.target.value)) formik.setFieldValue('year_part', e.target.value);
													}}
													onBlur={formik.handleBlur('year_part')}
													error={formik.touched.year_part && Boolean(formik.errors.year_part)}
													helperText={
														formik.touched.year_part && formik.errors.year_part ? formik.errors.year_part : ''
													}
													fullWidth
													size="small"
													theme={inputFieldTheme}
													startIcon={<CalendarTodayIcon fontSize="small" color="action" />}
													slotProps={{
														input: { inputProps: { inputMode: 'numeric', pattern: '[0-9]{2}', maxLength: 2 } },
													}}
												/>
											</Box>
											{!isEditMode && refetchNum && (
												<Tooltip title="Réinitialiser le numéro">
													<IconButton
														size="large"
														color="primary"
														onClick={async () => {
															// Reset ref to force useEffect to run after refetch
															prevRawNumDataRef.current = undefined;
															const result = (await refetchNum()) as { data?: DocumentNumResponse };
															// Directly update fields from refetch result
															if (result?.data) {
																const newNum = getNumeroFromData(isEditMode, rawData, result.data, config);
																const [newNumberPart = '', newYearPart = ''] = newNum.split('/');
																await formik.setFieldValue('numero_part', newNumberPart);
																await formik.setFieldValue('year_part', newYearPart);
															}
														}}
														sx={{ mt: 1 }}
														aria-label="Réinitialiser le numéro"
													>
														<RefreshIcon fontSize="small" />
													</IconButton>
												</Tooltip>
											)}
										</Stack>
										<DatePicker
											label={config.labels.dateLabel}
											value={getDateValue() ? new Date(getDateValue()) : null}
											onChange={(date) =>
												formik.setFieldValue(config.fields.dateField, date ? formatLocalDate(date) : '')
											}
											format="dd/MM/yyyy"
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
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

							{/* Statut - only in edit mode */}
							{isEditMode && (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<DescriptionIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												{config.labels.statusLabel}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 3 }} />
										<Stack spacing={2.5}>
											<CustomDropDownSelect
												id="statut"
												label="Statut"
												items={
													config.documentType === 'bon-de-livraison'
														? bonDeLivraisonStatusItemsList
														: devisFactureStatusItemsList
												}
												value={rawData?.statut || ''}
												onChange={(e) => handleStatutChange(e.target.value)}
												size="small"
												theme={customDropdownTheme()}
												startIcon={<DescriptionIcon fontSize="small" color="action" />}
											/>
										</Stack>
									</CardContent>
								</Card>
							)}

							{/* Client Card */}
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
											onChange={(_, newValue) => formik.setFieldValue('client', newValue ? Number(newValue.value) : 0)}
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

							{/* Currency Card - Only show if company uses foreign currency */}
							{usesForeignCurrency && (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<AttachMoneyIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Devise
											</Typography>
										</Stack>
										<Divider sx={{ mb: 3 }} />
										<Stack spacing={2.5}>
											<CustomDropDownSelect
												id="devise"
												size="small"
												label="Devise du document"
												items={[
													{ value: 'MAD', code: 'MAD - Dirham Marocain' },
													{ value: 'EUR', code: 'EUR - Euro' },
													{ value: 'USD', code: 'USD - Dollar Américain' },
												]}
												value={formik.values.devise ?? 'MAD'}
												onChange={(e) => formik.setFieldValue('devise', e.target.value)}
												theme={customDropdownTheme()}
												startIcon={<AttachMoneyIcon fontSize="small" color="action" />}
												disabled={getLines().length > 0}
												helperText={
													getLines().length > 0
														? 'La devise ne peut pas être modifiée une fois des lignes ajoutées'
														: 'Définit la devise pour tous les articles de ce document'
												}
											/>
										</Stack>
									</CardContent>
								</Card>
							)}

							{/* Payment Card */}
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
											label="Mode de paiement"
											items={modePaiementItems}
											theme={theme}
											value={selectedModePaiement}
											fullWidth
											onChange={(_, newVal) =>
												formik.setFieldValue('mode_paiement', newVal ? Number(newVal.value) : null)
											}
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
										{config.documentType === 'bon-de-livraison' && (
											<CustomAutoCompleteSelect
												id="livre_par"
												size="small"
												noOptionsText="Aucun livreur trouvé"
												label="Livré par"
												items={livreParItems}
												theme={theme}
												value={selectedLivrePar}
												fullWidth
												onChange={(_, newVal) =>
													formik.setFieldValue('livre_par', newVal ? Number(newVal.value) : null)
												}
												onBlur={formik.handleBlur('livre_par')}
												error={
													(formik.touched as { livre_par?: boolean }).livre_par &&
													Boolean((formik.errors as { livre_par?: string }).livre_par)
												}
												helperText={
													(formik.touched as { livre_par?: boolean }).livre_par
														? (formik.errors as { livre_par?: string }).livre_par
														: ''
												}
												startIcon={<LocalShippingIcon fontSize="small" color="action" />}
												endIcon={
													<Button
														size="small"
														variant="outlined"
														onClick={() => setOpenLivreParModal(true)}
														sx={{ ml: 1 }}
													>
														Ajouter
													</Button>
												}
											/>
										)}
										<CustomTextInput
											id={config.fields.extraField}
											type="text"
											label={config.fields.extraFieldLabel}
											value={getExtraFieldValue()}
											onChange={formik.handleChange(config.fields.extraField)}
											onBlur={formik.handleBlur(config.fields.extraField)}
											fullWidth
											size="small"
											theme={inputFieldTheme}
											startIcon={<ReceiptIcon fontSize="small" color="action" />}
										/>
									</Stack>
								</CardContent>
							</Card>

							{/* Lines Grid - only in edit mode */}
							{isEditMode && (
								<Box ref={linesGridRef}>
									<LinesGrid
										title={config.labels.linesLabel}
										rows={dataGridRows}
										columns={linesColumns}
										onAddClick={() => setShowAddArticleModal(true)}
										isLoading={isArticlesLoading}
									/>
								</Box>
							)}

							{/* Global Remise - only in edit mode */}
							{isEditMode && (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<DiscountIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Remise globale
											</Typography>
										</Stack>
										<Divider sx={{ mb: 3 }} />
										<Stack spacing={2.5}>
											<Button
												disabled={getLines().length === 0}
												variant="outlined"
												startIcon={<DiscountIcon />}
												onClick={() => setShowGlobalRemiseModal(true)}
												fullWidth
											>
												Appliquer une remise globale
											</Button>
											<Button
												variant="outlined"
												color="error"
												startIcon={<DeleteIcon />}
												onClick={() => {
													formik.setFieldValue('remise_type', '');
													formik.setFieldValue('remise', 0);
													const n = { ...validationErrors };
													delete n['global_remise'];
													setValidationErrors(n);
												}}
												fullWidth
												disabled={!(formik.values.remise && formik.values.remise > 0)}
											>
												Supprimer la remise globale
											</Button>
											{formik.values.remise_type && formik.values.remise && formik.values.remise > 0 && (
												<Typography variant="body2" color="text.secondary">
													Remise appliquée: {formik.values.remise}
													{formik.values.remise_type === 'Pourcentage' ? '%' : ` ${formik.values.devise}`}
												</Typography>
											)}
										</Stack>
									</CardContent>
								</Card>
							)}

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
											fullWidth
											size="small"
											theme={inputFieldTheme}
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
									type="submit"
									loading={isPending}
									startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
									onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
										if (showValidationAlert) {
											e.preventDefault();
											onError('Veuillez corriger les erreurs de validation avant de soumettre.');
											window.scrollTo({ top: 0, behavior: 'smooth' });
										}
									}}
									cssClass={Styles.submitButton}
								/>
							</Box>
						</Stack>
					</form>
				)}
			</Stack>

			<DocumentFormModals
				isEditMode={isEditMode}
				config={config}
				showAddArticleModal={showAddArticleModal}
				setShowAddArticleModal={setShowAddArticleModal}
				isArticlesLoading={isArticlesLoading}
				articlesData={articlesData}
				selectedArticles={selectedArticles}
				setSelectedArticles={setSelectedArticles}
				handleAddArticles={handleAddArticles}
				existingArticleIds={existingArticleIds}
				existingArticleLineValues={existingArticleLineValues}
				documentDevise={formik.values.devise ?? 'MAD'}
				showGlobalRemiseModal={showGlobalRemiseModal}
				setShowGlobalRemiseModal={setShowGlobalRemiseModal}
				currentRemiseType={formik.values.remise_type || ''}
				currentRemiseValue={formik.values.remise || 0}
				handleApplyGlobalRemise={handleApplyGlobalRemise}
				showDeleteConfirm={showDeleteConfirm}
				setShowDeleteConfirm={setShowDeleteConfirm}
				confirmDeleteLine={confirmDeleteLine}
				openModePaiementModal={openModePaiementModal}
				setOpenModePaiementModal={setOpenModePaiementModal}
				addModePaiement={(args) => addModePaiement({ data: { ...args.data, company: company_id } })}
				onModePaiementSuccess={(newId) => formik.setFieldValue('mode_paiement', newId)}
				openLivreParModal={openLivreParModal}
				setOpenLivreParModal={setOpenLivreParModal}
				addLivrePar={(args) => addLivrePar({ data: { ...args.data, company: company_id } })}
				onLivreParSuccess={(newId) => formik.setFieldValue('livre_par', newId)}
			/>
		</LocalizationProvider>
	);
};

export default CompanyDocumentFormContent;
