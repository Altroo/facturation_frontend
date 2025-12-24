'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
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
	Avatar,
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
import { factureClientProformaSchema, factureClientProformaAddSchema } from '@/utils/formValidationSchemas';
import { parseNumber, safeParseForInput, setFormikAutoErrors, ValidatePricesHelper } from '@/utils/helpers';
import { coordonneeTextInputTheme, customDropdownTheme } from '@/utils/themes';
import { CLIENTS_ADD, FACTURE_PRO_FORMA_LIST, FACTURE_PRO_FORMA_EDIT } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import type {
	DeviFactureLineFormValues,
	TypeFactureDevisStatus,
	ValidateArticleLinesErrorType,
} from '@/types/devisTypes';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import type { ArticleClass, ClientClass, ModePaiementClass } from '@/models/classes';
import { useGetClientsListQuery } from '@/store/services/client';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getModePaiementState } from '@/store/selectors';
import type { DropDownType } from '@/types/accountTypes';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import { useGetArticlesListQuery } from '@/store/services/article';
import {
	useAddFactureProFormaMutation,
	useEditFactureProFormaMutation,
	useGetFactureProFormaQuery,
	usePatchStatutMutation,
	useGetNumFactureProFormaQuery,
} from '@/store/services/factureProForma';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import AddArticleModal from '@/components/shared/addArticleModal/addArticleModal';
import GlobalRemiseModal from '@/components/shared/globalRemiseModal/globalRemiseModal';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { devisFactureStatusItemsList, remiseTypeItemsList } from '@/utils/rawData';
import { useAddModePaiementMutation } from '@/store/services/parameter';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import FactureDevisTotalsCard from '@/components/shared/factureDevistotalCard/factureDevisTotalsCard';
import LinesGrid from '@/components/shared/linesGrid/linesGrid';
import { generateRowId } from '@/components/pages/dashboard/devis/devis-form';
import type { FactureClientProFormaSchemaType } from '@/types/factureProFormaTypes';
import Image from 'next/image';
import CompanyDocumentsWrapperForm from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, company_id, id, isEditMode } = props;
	const { onSuccess, onError } = useToast();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();

	// Queries
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetFactureProFormaQuery({ id: id! }, { skip: !token || !isEditMode });

	const { data: rawNumData, isLoading: isNumLoading } = useGetNumFactureProFormaQuery(undefined, {
		skip: !token || isEditMode,
	});

	const [addData, { isLoading: isAddLoading, error: addError }] = useAddFactureProFormaMutation();
	const [updateData, { isLoading: isUpdateLoading, error: updateError }] = useEditFactureProFormaMutation();
	const [patchStatut, { isLoading: isPatchLoading, error: patchError }] = usePatchStatutMutation();
	const { data: rawArticlesData, isLoading: isArticlesLoading } = useGetArticlesListQuery(
		{ company_id, with_pagination: false, archived: false },
		{ skip: !token },
	);
	const articlesData = rawArticlesData as Array<Partial<ArticleClass>> | undefined;

	// Create ref to store map (doesn't trigger re-renders)
	const articlesMapRef = useRef<Map<number, Partial<ArticleClass>>>(new Map());
	const [articlesMapSize, setArticlesMapSize] = useState<number>(0);

	// Update ref when data changes
	useEffect(() => {
		const m = new Map<number, Partial<ArticleClass>>();
		(articlesData || []).forEach((a) => {
			if (a?.id != null) m.set(a.id, a);
		});
		articlesMapRef.current = m;
		setArticlesMapSize(m.size);
	}, [articlesData]);

	// Use ref in callback - stable reference
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
			return articlesMapRef.current.get(Number(idNum));
		},
		[],
	);

	const { data: rawClientsData, isLoading: isClientsLoading } = useGetClientsListQuery(
		{ company_id, with_pagination: false },
		{ skip: !token },
	);

	const [addModePaiement, { isLoading: isAddModePaiementLoading }] = useAddModePaiementMutation();
	const [openModePaiementModal, setOpenModePaiementModal] = useState(false);

	const clientsData = rawClientsData as Array<Partial<ClientClass>> | undefined;
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

	// Validation errors state
	const [validationErrors, setValidationErrors] = useState<ValidateArticleLinesErrorType>({});

	// Split numero_facture into number and year parts
	const initialNum = isEditMode ? (rawData?.numero_facture ?? '') : (rawNumData?.numero_facture ?? '');
	const [numNumberPart = '', numYearPart = ''] = initialNum.split('/');

	// get mode_paiement
	const rawModePaiement = useAppSelector(getModePaiementState);
	const normalizedModePaiement: Array<ModePaiementClass> = Array.isArray(rawModePaiement)
		? rawModePaiement
		: Object.values(rawModePaiement ?? {});

	const formik = useFormik<FactureClientProFormaSchemaType>({
		initialValues: {
			numero_part: numNumberPart,
			year_part: numYearPart,
			client: isEditMode ? (rawData?.client ?? null) : null,
			date_facture: isEditMode
				? (rawData?.date_facture ?? new Date().toISOString().split('T')[0])
				: new Date().toISOString().split('T')[0],
			numero_bon_commande_client: isEditMode ? (rawData?.numero_bon_commande_client ?? null) : null,
			mode_paiement: isEditMode ? (rawData?.mode_paiement ?? null) : null,
			remarque: isEditMode ? (rawData?.remarque ?? null) : null,
			remise_type: isEditMode ? rawData?.remise_type : undefined,
			remise: isEditMode ? rawData?.remise : undefined,
			lignes: isEditMode ? (rawData?.lignes ?? []) : [],
			globalError: '',
		},
		enableReinitialize: true,
		validationSchema: toFormikValidationSchema(
			isEditMode ? factureClientProformaSchema : factureClientProformaAddSchema,
		),
		validateOnMount: true,
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			try {
				if (isEditMode) {
					// Edit mode
					const submissionData: Partial<FactureClientProFormaSchemaType> = {
						...data,
						numero_facture: `${data.numero_part}/${data.year_part}`,
					};
					if (!submissionData.remise_type) {
						delete submissionData.remise_type;
						delete submissionData.remise;
					}
					await updateData({ data: submissionData as FactureClientProFormaSchemaType, id: id! }).unwrap();
					onSuccess('Facture pro-forma mis à jour avec succès.');
				} else {
					// Add mode
					const submissionData: Partial<FactureClientProFormaSchemaType> = {
						...data,
						numero_facture: `${data.numero_part}/${data.year_part}`,
					};
					const response = await addData({ data: submissionData as FactureClientProFormaSchemaType }).unwrap();
					onSuccess('Facture pro-forma ajouté avec succès.');
					if (response.id) {
						setTimeout(() => {
							router.replace(FACTURE_PRO_FORMA_EDIT(response.id, company_id));
						}, 500);
					}
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(
					isEditMode
						? 'Échec de la mise à jour de facture pro-forma. Veuillez réessayer.'
						: "Échec de l'ajout de facture pro-forma. Veuillez réessayer.",
				);
			} finally {
				setIsPending(false);
			}
		},
	});

	const getLines = useCallback((): DeviFactureLineFormValues[] => {
		return Array.isArray(formik.values.lignes) ? (formik.values.lignes as DeviFactureLineFormValues[]) : [];
	}, [formik.values.lignes]);

	// Calculate total HT before global remise (used in multiple places)
	const calculateTotalHTBeforeGlobal = useCallback((): number => {
		let total = 0;
		const lignes = getLines();

		lignes.forEach((ligne) => {
			const article = getArticleById(ligne.article);
			if (!article) return;

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
	}, [getLines, getArticleById]);

	// Prepare client items for dropdown
	const clientItems = useMemo(() => {
		if (!clientsData) return [];
		return clientsData.map((client) => {
			const label =
				client.client_type === 'Personne physique'
					? `${client.nom || ''} ${client.prenom || ''}`.trim()
					: client.raison_sociale || '';
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

	// Calculate totals
	const totals = useMemo(() => {
		// If articles are still loading and map is empty, avoid incorrect calculation
		if (isArticlesLoading && articlesMapRef.current.size === 0) {
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
		let rawTotalTVA = 0;

		const lignes = getLines();

		lignes.forEach((ligne) => {
			const article = getArticleById(ligne.article);
			if (!article) return;

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

			const tvaRate = parseNumber(article.tva ?? '') ?? 0;
			const lineTVA = discountedHT * (tvaRate / 100);

			if (Number.isFinite(discountedHT)) rawTotalHT += discountedHT;
			if (Number.isFinite(lineTVA)) rawTotalTVA += lineTVA;
		});

		const rawTotalTTC = rawTotalHT + rawTotalTVA;

		let finalTotalHT = rawTotalHT;
		let finalTotalTVA = rawTotalTVA;
		let finalTotalTTC = rawTotalTTC;

		const globalRemiseVal = parseNumber(formik.values.remise ?? '') ?? 0;
		if (globalRemiseVal > 0 && formik.values.remise_type) {
			if (formik.values.remise_type === 'Pourcentage') {
				finalTotalHT = rawTotalHT * (1 - globalRemiseVal / 100);
			} else if (formik.values.remise_type === 'Fixe') {
				finalTotalHT = Math.max(0, rawTotalHT - globalRemiseVal);
			}

			const ratio = rawTotalHT > 0 ? finalTotalHT / rawTotalHT : 0;
			finalTotalTVA = rawTotalTVA * ratio;
			finalTotalTTC = finalTotalHT + finalTotalTVA;
		}

		return {
			totalHT: Math.max(0, Number.isFinite(rawTotalHT) ? rawTotalHT : 0),
			totalTVA: Math.max(0, Number.isFinite(rawTotalTVA) ? rawTotalTVA : 0),
			totalTTC: Math.max(0, Number.isFinite(rawTotalTTC) ? rawTotalTTC : 0),
			totalHTAfterRemise: Math.max(0, Number.isFinite(finalTotalHT) ? finalTotalHT : 0),
			totalTVAAfterRemise: Math.max(0, Number.isFinite(finalTotalTVA) ? finalTotalTVA : 0),
			totalTTCApresRemise: Math.max(0, Number.isFinite(finalTotalTTC) ? finalTotalTTC : 0),
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isArticlesLoading, getLines, formik.values.remise, formik.values.remise_type, getArticleById, articlesMapSize]);

	// Handle line changes with validation
	const handleLineChange = useCallback(
		(index: number, field: keyof DeviFactureLineFormValues, value: string | number) => {
			const lignes = getLines();
			const ligne = lignes[index];
			if (!ligne) return;

			// Update validation errors using parseNumber for all numeric reads
			setValidationErrors((prevErrors) => {
				const newErrors = { ...prevErrors };
				const errorKey = `ligne_${index}_${String(field)}`;
				const remiseErrorKey = `ligne_${index}_remise`;

				if (field === 'remise_type') {
					// Clear remise error when type changes
					delete newErrors[remiseErrorKey];

					// Re-validate remise with new type if remise exists
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

						if (remiseError) {
							newErrors[remiseErrorKey] = remiseError;
						}
					}
				} else if (field === 'prix_vente') {
					// Validate prix_vente using parseNumber
					const pv = parseNumber(value);
					const prixAchat = parseNumber(ligne.prix_achat ?? '') ?? 0;
					const numValue = pv === null ? NaN : pv;
					const error = ValidatePricesHelper.validatePrixVente(numValue, prixAchat);

					if (error) {
						newErrors[errorKey] = error;
					} else {
						delete newErrors[errorKey];
					}

					// Re-validate line remise if it exists (base amount changed)
					if ((parseNumber(ligne.remise ?? '') ?? 0) > 0 && ligne.remise_type) {
						const quantity = parseNumber(ligne.quantity ?? '') ?? 1;
						const baseAmount = (pv === null ? 0 : pv) * (isFinite(quantity) ? quantity : 1);
						const remiseError = ValidatePricesHelper.validateRemise(
							parseNumber(ligne.remise ?? '') ?? NaN,
							ligne.remise_type,
							baseAmount,
						);

						if (remiseError) {
							newErrors[remiseErrorKey] = remiseError;
						} else {
							delete newErrors[remiseErrorKey];
						}
					}
				} else if (field === 'quantity') {
					// Re-validate line remise if it exists (base amount changed)
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

						if (remiseError) {
							newErrors[remiseErrorKey] = remiseError;
						} else {
							delete newErrors[remiseErrorKey];
						}
					}
				} else if (field === 'remise') {
					// Validate remise using parseNumber
					const r = parseNumber(value);
					const prixVente = parseNumber(ligne.prix_vente ?? '') ?? 0;
					const quantity = parseNumber(ligne.quantity ?? '') ?? 1;
					const baseAmount = prixVente * (isFinite(quantity) ? quantity : 1);
					const error = ValidatePricesHelper.validateRemise(r ?? NaN, ligne.remise_type, baseAmount);

					if (error) {
						newErrors[errorKey] = error;
					} else {
						delete newErrors[errorKey];
					}
				} else {
					delete newErrors[errorKey];
				}

				return newErrors;
			});

			// Update formik state (preserve raw string when caller passed it)
			const updatedLines = [...lignes];
			updatedLines[index] = { ...updatedLines[index], [field]: value };

			// Reset remise if remise_type is cleared
			if (field === 'remise_type' && !value) {
				updatedLines[index].remise = 0;
			}

			formik.setFieldValue('lignes', updatedLines);
		},
		[getLines, formik],
	);

	// Handle adding articles
	const handleAddArticles = useCallback(() => {
		const selectedIds = Array.from(selectedArticles ?? new Set());
		const newLines = selectedIds
			.map((articleId) => {
				const article = getArticleById(articleId);
				if (!article) return null;

				return {
					article: articleId,
					designation: article.designation || '',
					prix_achat: article.prix_achat || 0,
					prix_vente: article.prix_vente || 0,
					quantity: 1,
					remise_type: '' as '' | 'Pourcentage' | 'Fixe' | undefined,
					remise: 0,
				} as DeviFactureLineFormValues;
			})
			.filter((line): line is DeviFactureLineFormValues => line !== null);

		const currentLines = getLines();
		formik.setFieldValue('lignes', [...currentLines, ...newLines]);
		setShowAddArticleModal(false);
		setSelectedArticles(new Set());
	}, [selectedArticles, getArticleById, getLines, formik]);

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

		// Clean up validation errors
		setValidationErrors((prevErrors) => {
			const newErrors: ValidateArticleLinesErrorType = {};

			Object.entries(prevErrors).forEach(([key, value]) => {
				const match = key.match(/^ligne_(\d+)_(.+)$/);
				if (match) {
					const lineIndex = parseInt(match[1]);
					const field = match[2];

					// Skip errors for deleted line
					if (lineIndex === deleteLineIndex) return;

					// Re-index errors for lines after deleted one
					if (lineIndex > deleteLineIndex) {
						newErrors[`ligne_${lineIndex - 1}_${field}`] = value;
					} else {
						newErrors[key] = value;
					}
				} else {
					// Keep non-line errors
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

	const getRowIndexFromParams = useCallback(
		(params: GridRenderCellParams): number => {
			const idStr = String(params.id);
			const lines = getLines();
			const idx = lines.findIndex((l, i) => generateRowId(l.article, i) === idStr);
			return idx >= 0 ? idx : 0;
		},
		[getLines],
	);

	const [renderPrixVenteCell, renderQuantityCell, renderRemiseCell] = useMemo<
		[
			(params: GridRenderCellParams) => React.JSX.Element,
			(params: GridRenderCellParams) => React.JSX.Element,
			(params: GridRenderCellParams) => React.JSX.Element,
		]
	>(() => {
		const prix = (params: GridRenderCellParams) => {
			const rowIndex = getRowIndexFromParams(params);
			const rawValue = getLines()[rowIndex]?.prix_vente ?? '';
			const inputValue = String(safeParseForInput(String(rawValue ?? '')));
			const errorKey = `ligne_${rowIndex}_prix_vente`;
			const helperText = validationErrors[errorKey] || '';
			const hasError = !!validationErrors[errorKey];

			return (
				<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
					<Tooltip title={helperText} arrow>
						<Box sx={{ width: '100%' }}>
							<CustomTextInput
								id={`prix_vente_${rowIndex}`}
								type="number"
								value={inputValue}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									const raw = (e.target as HTMLInputElement).value;
									const parsed = parseNumber(raw);
									handleLineChangeRef.current(rowIndex, 'prix_vente', parsed === null ? raw : parsed);
								}}
								fullWidth
								size="small"
								theme={inputTheme}
								error={hasError}
								slotProps={{ input: { style: { textAlign: 'center' } } }}
							/>
						</Box>
					</Tooltip>
				</Box>
			);
		};

		const quantity = (params: GridRenderCellParams) => {
			const rowIndex = getRowIndexFromParams(params);
			const rawValue = getLines()[rowIndex]?.quantity ?? '';
			const inputValue = String(safeParseForInput(String(rawValue ?? '')));
			const errorKey = `ligne_${rowIndex}_quantity`;
			const hasError = !!validationErrors[errorKey];

			return (
				<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
					<Tooltip title={validationErrors[errorKey] || ''} arrow>
						<Box sx={{ width: '100%' }}>
							<CustomTextInput
								id={`quantity_${rowIndex}`}
								type="number"
								value={inputValue}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									const raw = (e.target as HTMLInputElement).value;
									const parsed = parseNumber(raw);
									handleLineChangeRef.current(rowIndex, 'quantity', parsed === null ? raw : parsed);
								}}
								fullWidth
								size="small"
								theme={inputTheme}
								slotProps={{ input: { style: { textAlign: 'center' } } }}
								error={hasError}
							/>
						</Box>
					</Tooltip>
				</Box>
			);
		};

		const remise = (params: GridRenderCellParams) => {
			const rowIndex = getRowIndexFromParams(params);
			const rawValue = getLines()[rowIndex]?.remise ?? '';
			const inputValue = String(safeParseForInput(String(rawValue ?? '')));
			const errorKey = `ligne_${rowIndex}_remise`;
			const helperText = validationErrors[errorKey] || '';
			const hasError = !!validationErrors[errorKey];
			const remiseTypeValue = getLines()[rowIndex]?.remise_type;

			return (
				<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
					<Tooltip title={helperText} arrow>
						<Box sx={{ width: '100%' }}>
							<CustomTextInput
								id={`remise_${rowIndex}`}
								type="number"
								value={inputValue}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									const raw = (e.target as HTMLInputElement).value;
									const parsed = parseNumber(raw);
									handleLineChangeRef.current(rowIndex, 'remise', parsed === null ? raw : parsed);
								}}
								fullWidth
								size="small"
								theme={inputTheme}
								error={hasError}
								disabled={!remiseTypeValue}
								endIcon={
									remiseTypeValue && (
										<InputAdornment position="end">{remiseTypeValue === 'Pourcentage' ? '%' : 'MAD'}</InputAdornment>
									)
								}
								slotProps={{ input: { style: { textAlign: 'center' } } }}
							/>
						</Box>
					</Tooltip>
				</Box>
			);
		};

		return [prix, quantity, remise];
	}, [getLines, getRowIndexFromParams, validationErrors, handleLineChangeRef]);

	// Lines DataGrid columns
	const linesColumns: GridColDef[] = useMemo(
		() => [
			{
				field: 'photo',
				headerName: 'Photo',
				width: 70,
				renderCell: (params: GridRenderCellParams) => {
					const article = getArticleById(params.row.article);
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<DarkTooltip
								title={
									article?.photo ? (
										<Box
											sx={{ width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
										>
											<Image
												src={article.photo as string}
												alt={article.reference as string}
												width={260}
												height={260}
												style={{ objectFit: 'contain', display: 'block' }}
											/>
										</Box>
									) : (
										''
									)
								}
								placement="right"
								arrow
								enterDelay={100}
								leaveDelay={200}
								slotProps={{ tooltip: { sx: { pointerEvents: 'auto' } } }}
							>
								<Avatar
									src={(article?.photo as string) ?? undefined}
									alt={article?.reference as string | undefined}
									variant="rounded"
									sx={{ width: 40, height: 40 }}
								/>
							</DarkTooltip>
						</Box>
					);
				},
				sortable: false,
				filterable: false,
				editable: false,
			},
			{
				field: 'reference',
				headerName: 'Référence',
				width: 110,
				renderCell: (params: GridRenderCellParams) => {
					const article = getArticleById(params.row.article);
					const value = article?.reference ?? '';
					return (
						<DarkTooltip title={value}>
							<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
								<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
									{value}
								</Typography>
							</Box>
						</DarkTooltip>
					);
				},
			},
			{
				field: 'designation',
				headerName: 'Désignation',
				width: 150,
				renderCell: (params: GridRenderCellParams) => {
					const value = params.row.designation ?? '';
					return (
						<DarkTooltip title={value}>
							<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
								<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
									{value}
								</Typography>
							</Box>
						</DarkTooltip>
					);
				},
			},
			{
				field: 'marque',
				headerName: 'Marque',
				width: 130,
				renderCell: (params: GridRenderCellParams) => {
					const article = getArticleById(params.row.article);
					const value = article?.marque_name ?? '';
					return (
						<DarkTooltip title={value}>
							<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
								<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
									{value}
								</Typography>
							</Box>
						</DarkTooltip>
					);
				},
			},
			{
				field: 'categorie',
				headerName: 'Catégorie',
				width: 130,
				renderCell: (params: GridRenderCellParams) => {
					const article = getArticleById(params.row.article);
					const value = article?.categorie_name ?? '';
					return (
						<DarkTooltip title={value}>
							<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
								<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
									{value}
								</Typography>
							</Box>
						</DarkTooltip>
					);
				},
			},
			{
				field: 'prix_achat',
				headerName: "Prix d'achat",
				width: 120,
				renderCell: (params: GridRenderCellParams) => {
					const value = Number(params.row.prix_achat ?? 0).toFixed(2) + ' MAD';
					return (
						<DarkTooltip title={value}>
							<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
								<Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%', color: 'grey.500' }}>
									{value}
								</Typography>
							</Box>
						</DarkTooltip>
					);
				},
			},
			{
				field: 'prix_vente',
				headerName: 'Prix de vente',
				width: 150,
				renderCell: renderPrixVenteCell,
			},
			{
				field: 'quantity',
				headerName: 'Quantité',
				width: 120,
				renderCell: renderQuantityCell,
			},
			{
				field: 'remise_type',
				headerName: 'Type remise',
				width: 210,
				renderCell: (params: GridRenderCellParams) => {
					const rowIndex = getRowIndexFromParams(params);
					const value = getLines()[rowIndex]?.remise_type ?? '';
					const errorKey = `ligne_${rowIndex}_remise`;
					const helperText = validationErrors[errorKey] || '';
					const hasError = !!validationErrors[errorKey];
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Tooltip title={helperText} arrow>
								<CustomDropDownSelect
									id={`remise_type_${rowIndex}`}
									label=""
									size="small"
									error={hasError}
									items={remiseTypeItemsList}
									value={value}
									onChange={(e) => handleLineChangeRef.current(rowIndex, 'remise_type', e.target.value)}
									theme={customDropdownTheme()}
								/>
							</Tooltip>
						</Box>
					);
				},
			},
			{
				field: 'remise',
				headerName: 'Remise',
				width: 170,
				renderCell: renderRemiseCell,
			},
			{
				field: 'actions',
				headerName: 'Actions',
				width: 100,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams) => {
					const rowIndex = getRowIndexFromParams(params);
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Tooltip title="Supprimer">
								<IconButton size="small" color="error" onClick={() => handleDeleteLine(rowIndex)}>
									<DeleteIcon />
								</IconButton>
							</Tooltip>
						</Box>
					);
				},
			},
		],
		[
			renderPrixVenteCell,
			renderQuantityCell,
			renderRemiseCell,
			getArticleById,
			getRowIndexFromParams,
			getLines,
			validationErrors,
			handleDeleteLine,
		],
	);

	// Get existing article IDs to prevent duplicates
	const existingArticleIds = useMemo(() => {
		return new Set(getLines().map((l) => l.article));
	}, [getLines]);

	const deleteConfirmActions = [
		{
			active: true,
			text: 'Oui',
			onClick: confirmDeleteLine,
		},
		{
			active: false,
			text: 'Non',
			onClick: () => setShowDeleteConfirm(false),
		},
	];

	const handleStatutChange = async (newValue: string) => {
		try {
			if (!newValue) return;
			await patchStatut({ id: id!, data: { statut: newValue as TypeFactureDevisStatus } }).unwrap();
			onSuccess('Statut mis à jour avec succès.');
		} catch {
			onError('Échec de la mise à jour du statut.');
		}
	};

	// Handle global remise apply with validation
	const handleApplyGlobalRemise = useCallback(
		(type: 'Pourcentage' | 'Fixe' | '', value: number) => {
			if (!type || value === 0) {
				formik.setFieldValue('remise_type', '');
				formik.setFieldValue('remise', 0);
				setValidationErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors['global_remise'];
					return newErrors;
				});
				setShowGlobalRemiseModal(false);
				return;
			}

			const totalHTBeforeGlobal = calculateTotalHTBeforeGlobal();
			const validationError = ValidatePricesHelper.validateGlobalRemise(value, type, totalHTBeforeGlobal);

			if (validationError) {
				setValidationErrors((prev) => ({
					...prev,
					global_remise: validationError,
				}));
				onError(validationError);
			} else {
				setValidationErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors['global_remise'];
					return newErrors;
				});
				formik.setFieldValue('remise_type', type);
				formik.setFieldValue('remise', value);
				setShowGlobalRemiseModal(false);
			}
		},
		[formik, calculateTotalHTBeforeGlobal, onError],
	);

	const isLoading =
		isAddModePaiementLoading ||
		isPatchLoading ||
		isClientsLoading ||
		isUpdateLoading ||
		isAddLoading ||
		isPending ||
		isDataLoading ||
		isArticlesLoading ||
		isNumLoading;

	const hasValidationErrors = Object.keys(validationErrors).length > 0;

	const dataGridRows = useMemo(() => {
		const lignes = getLines();
		return lignes.map((ligne, index) => ({
			...ligne,
			id: generateRowId(ligne.article, index), // Stable ID using article + index
			rowIndex: index, // Keep actual index for operations
		}));
	}, [getLines]);

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				<Stack direction={isMobile ? 'column' : 'row'} pt={2} justifyContent="space-between" spacing={2}>
					<Button
						variant="outlined"
						startIcon={<ArrowBackIcon />}
						onClick={() => router.push(FACTURE_PRO_FORMA_LIST)}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
					>
						Liste des factures pro-forma
					</Button>
				</Stack>

				{hasValidationErrors && (
					<Alert severity="error" icon={<WarningIcon />}>
						<Typography variant="subtitle2" fontWeight={600}>
							Erreurs de validation détectées:
						</Typography>
						<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
							{Object.entries(validationErrors).map(([key, error]) => (
								<li key={key}>
									<Typography variant="body2">{error}</Typography>
								</li>
							))}
						</ul>
					</Alert>
				)}

				{isEditMode && (
					<FactureDevisTotalsCard
						totals={{
							totalHT: totals.totalHT,
							totalTVA: totals.totalTVA,
							totalTTC: totals.totalTTC,
							totalTTCApresRemise: totals.totalTTCApresRemise,
						}}
						isMobile={isMobile}
					/>
				)}

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
													id="numero_facture_number"
													type="text"
													label="Numéro *"
													value={formik.values.numero_part}
													onChange={formik.handleChange('numero_part')}
													onBlur={formik.handleBlur('numero_part')}
													error={formik.touched.numero_part && Boolean(formik.errors.numero_part)}
													helperText={
														formik.touched.numero_part && formik.errors.numero_part ? formik.errors.numero_part : ''
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
													value={formik.values.year_part}
													onChange={formik.handleChange('year_part')}
													onBlur={formik.handleBlur('year_part')}
													error={formik.touched.year_part && Boolean(formik.errors.year_part)}
													helperText={
														formik.touched.year_part && formik.errors.year_part ? formik.errors.year_part : ''
													}
													fullWidth={true}
													size="small"
													theme={inputTheme}
													startIcon={<CalendarTodayIcon fontSize="small" color="action" />}
												/>
											</Box>
										</Stack>
										<DatePicker
											label="Date du facture *"
											value={formik.values.date_facture ? new Date(formik.values.date_facture) : null}
											onChange={(date) => {
												formik.setFieldValue('date_facture', date ? date.toISOString().split('T')[0] : '');
											}}
											format="dd/MM/yyyy"
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
													error: formik.touched.date_facture && Boolean(formik.errors.date_facture),
													helperText: formik.touched.date_facture ? formik.errors.date_facture : '',
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
												Statut du facture pro-forma
											</Typography>
										</Stack>
										<Divider sx={{ mb: 3 }} />
										<Stack spacing={2.5}>
											<CustomDropDownSelect
												id="statut"
												label="Statut"
												items={devisFactureStatusItemsList}
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
											label="Mode de paiement"
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
											id="numero_bon_commande_client"
											type="text"
											label="Numéro bon commande client"
											value={formik.values.numero_bon_commande_client || ''}
											onChange={formik.handleChange('numero_bon_commande_client')}
											onBlur={formik.handleBlur('numero_bon_commande_client')}
											error={
												formik.touched.numero_bon_commande_client && Boolean(formik.errors.numero_bon_commande_client)
											}
											helperText={
												formik.touched.numero_bon_commande_client ? formik.errors.numero_bon_commande_client : ''
											}
											fullWidth={true}
											size="small"
											theme={inputTheme}
											startIcon={<ReceiptIcon fontSize="small" color="action" />}
										/>
									</Stack>
								</CardContent>
							</Card>

							{/* Lines Card - only in edit mode */}
							{isEditMode && (
								<LinesGrid
									title="Lignes du facture pro-forma"
									rows={dataGridRows}
									columns={linesColumns}
									onAddClick={() => setShowAddArticleModal(true)}
									isLoading={isArticlesLoading}
								/>
							)}

							{/* Discount & Global Remise - only in edit mode */}
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
													const newErrors = { ...validationErrors };
													delete newErrors['global_remise'];
													setValidationErrors(newErrors);
												}}
												fullWidth
												disabled={!(formik.values.remise && formik.values.remise > 0)}
											>
												Supprimer la remise globale
											</Button>
											{formik.values.remise_type && formik.values.remise && formik.values.remise > 0 && (
												<Typography variant="body2" color="text.secondary">
													Remise appliquée: {formik.values.remise}
													{formik.values.remise_type === 'Pourcentage' ? '%' : ' MAD'}
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
									type="submit"
									loading={isPending}
									startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
									onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
										if (hasValidationErrors && isEditMode) {
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

			{/* Add Article Modal - only in edit mode */}
			{isEditMode && (
				<AddArticleModal
					open={showAddArticleModal}
					loading={isArticlesLoading}
					onClose={() => {
						setShowAddArticleModal(false);
						setSelectedArticles(new Set());
					}}
					articles={(articlesData || []).map((a) => ({
						...a,
						designation: a.designation ?? undefined,
						reference: a.reference ?? undefined,
						marque_name: a.marque_name ?? undefined,
						categorie_name: a.categorie_name ?? undefined,
					}))}
					selectedArticles={selectedArticles}
					setSelectedArticles={setSelectedArticles}
					onAdd={handleAddArticles}
					existingArticleIds={existingArticleIds}
				/>
			)}

			{/* Global Remise Modal - only in edit mode */}
			{isEditMode && (
				<GlobalRemiseModal
					open={showGlobalRemiseModal}
					onClose={() => setShowGlobalRemiseModal(false)}
					currentType={formik.values.remise_type || ''}
					currentValue={formik.values.remise || 0}
					onApply={handleApplyGlobalRemise}
				/>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<ActionModals
					title="Supprimer la ligne"
					body="Êtes-vous sûr de vouloir supprimer cette ligne du facture pro-forma ?"
					actions={deleteConfirmActions}
				/>
			)}

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
	id?: number;
}

const FactureProFormaForm: React.FC<Props> = ({ session, company_id, id }) => {
	return (
		<CompanyDocumentsWrapperForm
			session={session}
			company_id={company_id}
			id={id}
			documentConfig={{
				addTitle: 'Ajouter une facture pro-forma',
				editTitle: 'Modifier facture pro-forma',
				addDeniedMessage:
					"Vous n'avez pas le droit d'ajouter une facture pro-forma. Veuillez contacter votre administrateur.",
				editDeniedMessage:
					"Vous n'avez pas le droit de modifier cette facture pro-forma. Veuillez contacter votre administrateur.",
			}}
			FormComponent={FormikContent}
		/>
	);
};

export default FactureProFormaForm;
