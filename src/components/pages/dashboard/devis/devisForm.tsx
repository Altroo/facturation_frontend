'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
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
	Avatar,
	Tooltip,
	IconButton,
	Alert,
	Paper,
	Container,
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
	Delete as DeleteIcon,
	Warning as WarningIcon,
	BusinessOutlined,
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
import { deviAddSchema, deviSchema } from '@/utils/formValidationSchemas';
import { setFormikAutoErrors } from '@/utils/helpers';
import { coordonneeTextInputTheme, customDropdownTheme } from '@/utils/themes';
import { CLIENTS_ADD, DEVIS_LIST, DEVIS_EDIT } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { DeviLineFormValues, DeviSchemaType, TypeFactureDevisStatus } from '@/types/devisTypes';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { ArticleClass, ClientClass, type ModePaiementClass } from '@/models/Classes';
import { useGetClientsListQuery } from '@/store/services/client';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getModePaiementState, getUserCompaniesState } from '@/store/selectors';
import { DropDownType } from '@/types/accountTypes';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import { useGetArticlesListQuery } from '@/store/services/article';
import {
	useAddDeviMutation,
	useEditDeviMutation,
	useGetDeviQuery,
	usePatchStatutMutation,
	useGetNumDevisQuery,
} from '@/store/services/devi';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import AddArticleModal from '@/components/shared/addArticleModal/addArticleModal';
import GlobalRemiseModal from '@/components/shared/globalRemiseModal/globalRemiseModal';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { devisStatusItemsList, remiseTypeItemsList } from '@/utils/rawData';
import { useAddModePaiementMutation } from '@/store/services/parameter';
import AddEntityModal from '@/components/desktop/modals/addEntityModal/addEntityModal';
import FactureDevisTotalsCard from '@/components/shared/factureDevistotalCard/factureDevisTotalsCard';
import LinesGrid from '@/components/shared/linesGrid/linesGrid';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
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
	} = useGetDeviQuery({ id: id! }, { skip: !token || !isEditMode });

	const { data: rawNumDevisData, isLoading: isNumDevisLoading } = useGetNumDevisQuery(undefined, {
		skip: !token || isEditMode,
	});

	const [addData, { isLoading: isAddLoading, error: addError }] = useAddDeviMutation();
	const [updateData, { isLoading: isUpdateLoading, error: updateError }] = useEditDeviMutation();
	const [patchStatut, { isLoading: isPatchLoading, error: patchError }] = usePatchStatutMutation();
	const { data: rawArticlesData, isLoading: isArticlesLoading } = useGetArticlesListQuery(
		{ company_id, with_pagination: false, archived: false },
		{ skip: !token },
	);
	const articlesData = rawArticlesData as Array<Partial<ArticleClass>> | undefined;

	const getArticleById = useCallback(
		(articleId: number | undefined) => {
			if (!articleId || !articlesData) return undefined;
			return articlesData.find((a) => a.id === articleId);
		},
		[articlesData],
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
	const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

	// Split numero_devis into number and year parts
	const initialNumDevis = isEditMode ? (rawData?.numero_devis ?? '') : (rawNumDevisData?.numero_devis ?? '');
	const [numDevisNumberPart = '', numDevisYearPart = ''] = initialNumDevis.split('/');

	// get mode_paiement
	const rawModePaiement = useAppSelector(getModePaiementState);
	const normalizedModePaiement: Array<ModePaiementClass> = Array.isArray(rawModePaiement)
		? rawModePaiement
		: Object.values(rawModePaiement ?? {});

	const formik = useFormik<DeviSchemaType>({
		initialValues: {
			numero_devis: initialNumDevis,
			client: isEditMode ? (rawData?.client ?? 0) : 0,
			date_devis: isEditMode
				? (rawData?.date_devis ?? new Date().toISOString().split('T')[0])
				: new Date().toISOString().split('T')[0],
			numero_demande_prix_client: isEditMode ? (rawData?.numero_demande_prix_client ?? null) : null,
			mode_paiement: isEditMode ? (rawData?.mode_paiement ?? null) : null,
			remarque: isEditMode ? (rawData?.remarque ?? null) : null,
			remise_type: isEditMode ? rawData?.remise_type : undefined,
			remise: isEditMode ? rawData?.remise : undefined,
			lignes: isEditMode ? (rawData?.lignes ?? []) : [],
			globalError: '',
		},
		enableReinitialize: true,
		validationSchema: toFormikValidationSchema(isEditMode ? deviSchema : deviAddSchema),
		validateOnMount: true,
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			try {
				if (isEditMode) {
					// Edit mode
					const submissionData: Partial<DeviSchemaType> = {
						...data,
						numero_devis: `${devisNumberPart}/${devisYearPart}`,
					};
					if (!submissionData.remise_type) {
						delete submissionData.remise_type;
						delete submissionData.remise;
					}
					await updateData({ data: submissionData as DeviSchemaType, id: id! }).unwrap();
					onSuccess('Devis mis à jour avec succès.');
				} else {
					// Add mode
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
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(
					isEditMode
						? 'Échec de la mise à jour du devis. Veuillez réessayer.'
						: "Échec de l'ajout du devis. Veuillez réessayer.",
				);
			} finally {
				setIsPending(false);
			}
		},
	});

	// Prepare client items for dropdown
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

	const [devisNumberPart, setDevisNumberPart] = useState(numDevisNumberPart);
	const [devisYearPart, setDevisYearPart] = useState(numDevisYearPart);

	// Update state when num devis changes
	useEffect(() => {
		setDevisNumberPart(numDevisNumberPart);
		setDevisYearPart(numDevisYearPart);
	}, [numDevisNumberPart, numDevisYearPart]);

	// Calculate totals
	const totals = useMemo(() => {
		let rawTotalHT = 0;
		let rawTotalTVA = 0;

		const lignes = (formik.values.lignes as DeviLineFormValues[]) || [];

		lignes.forEach((ligne) => {
			const article = getArticleById(ligne.article);
			if (!article) return;

			const prixVente = Number(ligne.prix_vente ?? 0);
			const quantity = Number(ligne.quantity ?? 1);
			const baseHT = prixVente * (isFinite(quantity) ? quantity : 1);

			let discountedHT = baseHT;
			const remiseVal = Number(ligne.remise ?? 0);
			if (remiseVal > 0 && ligne.remise_type) {
				if (ligne.remise_type === 'Pourcentage') {
					discountedHT = baseHT * (1 - remiseVal / 100);
				} else if (ligne.remise_type === 'Fixe') {
					discountedHT = Math.max(0, baseHT - remiseVal);
				}
			}

			const tvaRate = Number(article.tva ?? 0);
			const lineTVA = discountedHT * (tvaRate / 100);

			if (Number.isFinite(discountedHT)) rawTotalHT += discountedHT;
			if (Number.isFinite(lineTVA)) rawTotalTVA += lineTVA;
		});

		const rawTotalTTC = rawTotalHT + rawTotalTVA;

		let finalTotalHT = rawTotalHT;
		let finalTotalTVA = rawTotalTVA;
		let finalTotalTTC = rawTotalTTC;

		const globalRemiseVal = Number(formik.values.remise ?? 0);
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
	}, [formik.values.lignes, formik.values.remise, formik.values.remise_type, getArticleById]);

	// Validation function for line changes
	const validateLineChange = useCallback(
		(index: number, field: keyof DeviLineFormValues, value: string | number): string | null => {
			const lignes = (formik.values.lignes as DeviLineFormValues[]) || [];
			const ligne = lignes[index];
			if (!ligne) return null;

			if (field === 'prix_vente') {
				const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
				const achat = Number(ligne.prix_achat ?? 0);
				if (Number.isFinite(numValue) && numValue < achat) {
					return `Le prix de vente (${numValue.toFixed(2)} MAD) doit être supérieur ou égal au prix d'achat (${achat.toFixed(2)} MAD)`;
				}
			}

			if (field === 'remise') {
				const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
				if (!Number.isFinite(numValue) || numValue < 0) {
					return 'La remise doit être positive ou nulle';
				}

				const currentRemiseType = ligne.remise_type;
				const remiseValue = numValue ?? 0;

				if (currentRemiseType === 'Pourcentage' && remiseValue > 100) {
					return 'La remise en pourcentage doit être entre 0 et 100';
				}

				if (currentRemiseType === 'Fixe') {
					const basePrice = Number(ligne.prix_vente ?? 0) * Number(ligne.quantity ?? 1);
					if (remiseValue > basePrice) {
						return `La remise fixe (${remiseValue.toFixed(2)} MAD) ne peut pas dépasser le total HT de la ligne (${basePrice.toFixed(2)} MAD)`;
					}
				}
			}

			return null;
		},
		[formik.values.lignes],
	);

	// Handle line changes with validation
	const handleLineChange = useCallback(
		(index: number, field: keyof DeviLineFormValues, value: string | number) => {
			// Validation logic (unchanged)
			setValidationErrors((prevErrors) => {
				const newErrors = { ...prevErrors };
				const errorKey = `ligne_${index}_${field}`;
				const remiseErrorKey = `ligne_${index}_remise`;

				if (field === 'remise_type') {
					delete newErrors[remiseErrorKey];
					if (value) {
						const lignes = formik.values.lignes as DeviLineFormValues[];
						if (lignes[index]?.remise && lignes[index].remise > 0) {
							const newRemiseType = value as 'Pourcentage' | 'Fixe' | '';
							const ligne = lignes[index];
							const article = articlesData?.find((a) => a.id === ligne.article);
							let remiseError: string | null = null;
							const remiseValue = ligne.remise ?? 0;

							if (newRemiseType === 'Pourcentage' && remiseValue > 100) {
								remiseError = 'La remise en pourcentage doit être entre 0 et 100';
							} else if (newRemiseType === 'Fixe') {
								const basePrice = ligne.prix_vente * ligne.quantity;
								const tvaRate = article?.tva || 20;
								const lineTotalWithTVA = basePrice * (1 + tvaRate / 100);
								if (remiseValue > lineTotalWithTVA) {
									remiseError = `La remise fixe (${remiseValue.toFixed(2)} MAD) ne peut pas dépasser le total de la ligne (${lineTotalWithTVA.toFixed(2)} MAD)`;
								}
							}

							if (remiseError) {
								newErrors[remiseErrorKey] = remiseError;
							} else {
								delete newErrors[remiseErrorKey];
							}
						}
					}
				} else {
					const validationError = validateLineChange(index, field, value);
					if (validationError) {
						newErrors[errorKey] = validationError;
					} else {
						delete newErrors[errorKey];
					}
				}

				return newErrors;
			});

			// Update formik state
			const currentLines = (formik.values.lignes as DeviLineFormValues[]) || [];
			const updatedLines = [...currentLines];
			updatedLines[index] = { ...updatedLines[index], [field]: value };

			if (field === 'remise_type' && !value) {
				updatedLines[index].remise = 0;
			}

			formik.setFieldValue('lignes', updatedLines);
		},
		[articlesData, validateLineChange, formik],
	);

	// Validate global remise
	const validateGlobalRemise = (type: string, value: number): string | null => {
		if (!Number.isFinite(value) || value < 0) {
			return 'La remise doit être positive ou nulle';
		}

		if (type === 'Pourcentage' && value > 100) {
			return 'La remise en pourcentage doit être entre 0 et 100';
		}

		if (type === 'Fixe') {
			let totalHTBeforeGlobal = 0;
			const lignes = (formik.values.lignes as DeviLineFormValues[]) || [];
			lignes.forEach((ligne) => {
				const article = getArticleById(ligne.article);
				if (!article) return;

				const prixVente = Number(ligne.prix_vente ?? 0);
				const quantity = Number(ligne.quantity ?? 1);
				const baseHT = prixVente * (isFinite(quantity) ? quantity : 1);

				let discountedHT = baseHT;
				const remiseVal = Number(ligne.remise ?? 0);
				if (remiseVal > 0 && ligne.remise_type) {
					if (ligne.remise_type === 'Pourcentage') {
						discountedHT = baseHT * (1 - remiseVal / 100);
					} else if (ligne.remise_type === 'Fixe') {
						discountedHT = Math.max(0, baseHT - remiseVal);
					}
				}

				if (Number.isFinite(discountedHT)) totalHTBeforeGlobal += discountedHT;
			});

			if (value > totalHTBeforeGlobal) {
				return `La remise fixe globale (${value.toFixed(2)} MAD) ne peut pas dépasser le total HT du devis (${totalHTBeforeGlobal.toFixed(2)} MAD)`;
			}
		}

		return null;
	};

	// Handle adding articles
	const handleAddArticles = () => {
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
					remise_type: '' as const,
					remise: 0,
				};
			})
			.filter((line) => line !== null) as DeviLineFormValues[];

		formik.setFieldValue('lignes', [...formik.values.lignes, ...newLines]);
		setShowAddArticleModal(false);
		setSelectedArticles(new Set());
	};

	// Handle delete line
	const handleDeleteLine = (index: number) => {
		setDeleteLineIndex(index);
		setShowDeleteConfirm(true);
	};

	const confirmDeleteLine = () => {
		if (deleteLineIndex !== null) {
			const updatedLines = formik.values.lignes.filter((_, i) => i !== deleteLineIndex);
			formik.setFieldValue('lignes', updatedLines);

			const newErrors = { ...validationErrors };
			Object.keys(newErrors).forEach((key) => {
				if (key.startsWith(`ligne_${deleteLineIndex}_`)) {
					delete newErrors[key];
				}
			});

			const reindexedErrors: { [key: string]: string } = {};
			Object.entries(newErrors).forEach(([key, value]) => {
				const match = key.match(/^ligne_(\d+)_(.+)$/);
				if (match) {
					const lineIndex = parseInt(match[1]);
					const field = match[2];
					if (lineIndex > deleteLineIndex) {
						reindexedErrors[`ligne_${lineIndex - 1}_${field}`] = value;
					} else {
						reindexedErrors[key] = value;
					}
				} else {
					reindexedErrors[key] = value;
				}
			});

			setValidationErrors(reindexedErrors);
		}
		setShowDeleteConfirm(false);
		setDeleteLineIndex(null);
	};

	const handleLineChangeRef = useRef(handleLineChange);
	useEffect(() => {
		handleLineChangeRef.current = handleLineChange;
	}, [handleLineChange]);

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
							<Avatar
								src={article?.photo as string | undefined}
								alt={article?.reference as string | undefined}
								variant="rounded"
								sx={{ width: 40, height: 40 }}
							/>
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
				renderCell: (params: GridRenderCellParams) => {
					const rowIndex = Number(params.id);
					const value = (formik.values.lignes as DeviLineFormValues[])[rowIndex]?.prix_vente ?? 0;
					const errorKey = `ligne_${rowIndex}_prix_vente`;
					const hasError = !!validationErrors[errorKey];
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Tooltip title={validationErrors[errorKey] || ''} arrow>
								<Box sx={{ width: '100%' }}>
									<CustomTextInput
										id={`prix_vente_${rowIndex}`}
										type="number"
										value={String(value)}
										onChange={(e) =>
											handleLineChangeRef.current(
												rowIndex,
												'prix_vente',
												parseFloat((e.target as HTMLInputElement).value) || 0,
											)
										}
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
				},
			},
			{
				field: 'quantity',
				headerName: 'Quantité',
				width: 120,
				renderCell: (params: GridRenderCellParams) => {
					const rowIndex = Number(params.id);
					const value = (formik.values.lignes as DeviLineFormValues[])[rowIndex]?.quantity ?? 1;
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<CustomTextInput
								id={`quantity_${rowIndex}`}
								type="number"
								value={String(value)}
								onChange={(e) =>
									handleLineChangeRef.current(rowIndex, 'quantity', parseInt((e.target as HTMLInputElement).value) || 1)
								}
								fullWidth
								size="small"
								theme={inputTheme}
								slotProps={{ input: { style: { textAlign: 'center' } } }}
							/>
						</Box>
					);
				},
			},
			{
				field: 'remise_type',
				headerName: 'Type remise',
				width: 210,
				renderCell: (params: GridRenderCellParams) => {
					const rowIndex = Number(params.id);
					const value = (formik.values.lignes as DeviLineFormValues[])[rowIndex]?.remise_type ?? '';
					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<CustomDropDownSelect
								id={`remise_type_${rowIndex}`}
								label=""
								size="small"
								items={remiseTypeItemsList}
								value={value}
								onChange={(e) => handleLineChangeRef.current(rowIndex, 'remise_type', e.target.value)}
								theme={customDropdownTheme()}
							/>
						</Box>
					);
				},
			},
			{
				field: 'remise',
				headerName: 'Remise',
				width: 170,
				renderCell: (params: GridRenderCellParams) => {
					const rowIndex = Number(params.id);
					const ligne = (formik.values.lignes as DeviLineFormValues[])[rowIndex];
					const value = ligne?.remise ?? 0;
					const errorKey = `ligne_${rowIndex}_remise`;
					const hasError = !!validationErrors[errorKey];
					const remiseTypeValue = ligne?.remise_type;

					return (
						<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
							<Tooltip title={validationErrors[errorKey] || ''} arrow>
								<Box sx={{ width: '100%' }}>
									<CustomTextInput
										id={`remise_${rowIndex}`}
										type="number"
										value={String(value)}
										onChange={(e) =>
											handleLineChangeRef.current(
												rowIndex,
												'remise',
												parseFloat((e.target as HTMLInputElement).value) || 0,
											)
										}
										fullWidth
										size="small"
										theme={inputTheme}
										error={hasError}
										disabled={!remiseTypeValue}
										endIcon={
											remiseTypeValue && (
												<InputAdornment position="end">
													{remiseTypeValue === 'Pourcentage' ? '%' : 'MAD'}
												</InputAdornment>
											)
										}
										slotProps={{ input: { style: { textAlign: 'center' } } }}
									/>
								</Box>
							</Tooltip>
						</Box>
					);
				},
			},
			{
				field: 'actions',
				headerName: 'Actions',
				width: 100,
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams) => {
					const rowIndex = Number(params.id);
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[getArticleById, validationErrors],
	);

	// Get existing article IDs to prevent duplicates
	const existingArticleIds = useMemo(() => {
		return new Set((formik.values.lignes as DeviLineFormValues[]).map((l) => l.article));
	}, [formik.values.lignes]);

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
			onError('Échec de la mise à jour du statut du devis.');
		}
	};

	// Handle global remise apply with validation
	const handleApplyGlobalRemise = (type: 'Pourcentage' | 'Fixe' | '', value: number) => {
		if (!type || value === 0) {
			formik.setFieldValue('remise_type', '');
			formik.setFieldValue('remise', 0);
			const newErrors = { ...validationErrors };
			delete newErrors['global_remise'];
			setValidationErrors(newErrors);
			setShowGlobalRemiseModal(false);
			return;
		}

		const validationError = validateGlobalRemise(type, value);
		const newErrors = { ...validationErrors };

		if (validationError) {
			newErrors['global_remise'] = validationError;
			setValidationErrors(newErrors);
			onError(validationError);
		} else {
			delete newErrors['global_remise'];
			setValidationErrors(newErrors);
			formik.setFieldValue('remise_type', type);
			formik.setFieldValue('remise', value);
			setShowGlobalRemiseModal(false);
		}
	};

	const isLoading =
		isAddModePaiementLoading ||
		isPatchLoading ||
		isClientsLoading ||
		isUpdateLoading ||
		isAddLoading ||
		isPending ||
		isDataLoading ||
		isArticlesLoading ||
		isNumDevisLoading;

	const hasValidationErrors = Object.keys(validationErrors).length > 0;

	const dataGridRowsRef = useRef<Array<DeviLineFormValues & { id: number }>>([]);

	const dataGridRows = useMemo(() => {
		const newRows = Array.isArray(formik.values.lignes)
			? (formik.values.lignes as DeviLineFormValues[]).map((ligne, index) => ({
					...ligne,
					id: index,
				}))
			: [];

		// Only update ref if content actually changed
		if (JSON.stringify(dataGridRowsRef.current) !== JSON.stringify(newRows)) {
			dataGridRowsRef.current = newRows;
		}

		return dataGridRowsRef.current;
	}, [formik.values.lignes]);

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

							{/* Statut du devis - only in edit mode */}
							{isEditMode && (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<DescriptionIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Statut du devis
											</Typography>
										</Stack>
										<Divider sx={{ mb: 3 }} />
										<Stack spacing={2.5}>
											<CustomDropDownSelect
												id="statut_devis"
												label="Statut"
												items={devisStatusItemsList}
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

							{/* Lines Card - only in edit mode */}
							{isEditMode && (
								<LinesGrid
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
												disabled={formik.values.lignes.length === 0}
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
					body="Êtes-vous sûr de vouloir supprimer cette ligne du devis ?"
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

const DevisForm: React.FC<Props> = ({ session, company_id, id }) => {
	const token = getAccessTokenFromSession(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((comp) => comp.id === company_id);
	const isEditMode = !!id;

	const title = isEditMode ? 'Modifier devis' : 'Ajouter un devis';

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={title}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{company?.role === 'Admin' ? (
						<Box sx={{ width: '100%' }}>
							<FormikContent company_id={company_id} token={token} id={id} isEditMode={isEditMode} />
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
										? `Vous n'avez pas le droit de modifier ce devis. Veuillez contacter votre administrateur.`
										: `Vous n'avez pas le droit d'ajouter un devis. Veuillez contacter votre administrateur.`}
								</Typography>
							</Paper>
						</Container>
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default DevisForm;
