'use client';

import { purchaseLineFromArticle, withPurchaseLines } from '@/utils/logisticsPurchaseLines';
import { ArticleFormContent } from '../articles/articles-form';
import type { ArticleClass } from '@/models/classes';
import { logisticsFormPayload as payload } from '@/utils/apiHelpers';
import { useSupplierPurchaseDraft } from './use-supplier-purchase-draft';

import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { getInitStateToken } from '@/store/selectors';
import { useGetArticlesListQuery } from '@/store/services/article';
import { useGetCompanyQuery } from '@/store/services/company';
import {
	useAddLogistiqueMutation,
	useAddLogistiqueProcessNoteMutation,
	useExtractImportTitleMutation,
	useExtractSupplierProformaMutation,
	useGetLogistiqueResponsablesQuery,
	useGetLogistiqueSuppliersQuery,
	useGetNumLogistiqueQuery,
	usePurchaseActionMutation,
	useRecordLogistiquePaymentExecutionMutation,
	useRequestPurchasePaymentMutation,
	useValidateLogistiquePaymentMutation,
} from '@/store/services/logistique';
import { useGetEmplacementListQuery, useGetMarqueListQuery } from '@/store/services/parameter';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { LogistiqueDocumentField } from '@/types/logistiqueTypes';
import type { PurchaseFormValues, SupplierPurchaseFormContentProps } from '@/types/supplierPurchaseTypes';
import { getSupplierPurchaseSchema } from '@/utils/formValidationSchemas';
import {
	extractApiErrorMessage,
	formatLocalDate,
	listReturnUrl,
	logisticsChangeProposal,
	purchaseDraft,
	setFormikAutoErrors,
} from '@/utils/helpers';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { LOGISTIQUE_ADD, LOGISTIQUE_LIST, LOGISTIQUE_VIEW } from '@/utils/routes';
import { textInputTheme } from '@/utils/themes';
import { ArrowBack, Notes, Save, Send, Warning } from '@mui/icons-material';
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { useFormik } from 'formik';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { LogistiqueDocumentsFormCard } from './logistique-documents-card';
import FormCard, { full } from './supplier-purchase-form-card';
import SupplierPurchaseFormFields from './supplier-purchase-form-fields';
const inputTheme = textInputTheme();
const value = (input: unknown) => (input == null ? '' : String(input));
const today = () => formatLocalDate(new Date());
const proformaReadFields = [
	'numero_proforma_fournisseur',
	'date_proforma_fournisseur',
	'montant_proforma_fournisseur',
	'devise_proforma_fournisseur',
	'incoterm',
] as const;
type ProformaSuggestions = Partial<
	Record<(typeof proformaReadFields)[number], { previous: string; suggested: string }>
>;

export default function SupplierPurchaseFormContent({
	company_id,
	id,
	token,
	mode,
	order,
	echeanceId,
	correctionId,
	proposalMode = false,
}: SupplierPurchaseFormContentProps) {
	const isCorrection = !!correctionId || proposalMode;
	const router = useRouter();
	const query = useSearchParams();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const userId = useAppSelector(getInitStateToken).user.pk;
	const [attempted, setAttempted] = useState(false);
	const [apiError, setApiError] = useState('');
	const errorSummary = useRef<HTMLDivElement>(null);
	const [warnings, setWarnings] = useState<string[]>([]);
	const [proformaRead, setProformaRead] = useState(false);
	const [originalFiles, setOriginalFiles] = useState<File[]>([]);
	const [search, setSearch] = useState('');
	const [articleModalOpen, setArticleModalOpen] = useState(false);
	const [createdArticles, setCreatedArticles] = useState<ArticleClass[]>([]);
	const addNewArticle = async () => {
		setArticleModalOpen(true);
	};
	const deferredSearch = useDeferredValue(search);
	const [selectedDocument, setSelectedDocument] = useState<LogistiqueDocumentField>(
		mode === 'proforma'
			? 'proforma_fournisseur_file'
			: mode === 'titre'
				? 'titre_importation_file'
				: mode === 'justificatif'
					? 'swift_file'
					: 'justificatifs_file',
	);
	const transitAfterReceipt = ['Réception locale', 'Livraison client', 'Clôture'].includes(order?.statut ?? '');
	const extractionSequence = useRef(0);
	const proformaSuggestions = useRef<ProformaSuggestions>({});
	const { data: company } = useGetCompanyQuery({ id: company_id }, { skip: !token });
	const { currentData: numberPreview, error: numberPreviewError } = useGetNumLogistiqueQuery(
		{ company_id },
		{ skip: !token || !!id || mode !== 'dossier', refetchOnMountOrArgChange: true },
	);
	const { currentData: supplierData } = useGetLogistiqueSuppliersQuery(
		{ company_id },
		{ skip: !token || mode !== 'dossier' },
	);
	const suppliers = Array.isArray(supplierData) ? supplierData : (supplierData?.results ?? []);
	const { data: brands = [] } = useGetMarqueListQuery({ company_id }, { skip: !token });
	const { data: responsibles = [] } = useGetLogistiqueResponsablesQuery(
		{ company_id },
		{ skip: !token || mode !== 'dossier' },
	);
	const { data: locations = [] } = useGetEmplacementListQuery({ company_id }, { skip: !token || mode !== 'reception' });
	const { data: articleData, isFetching: loadingArticles } = useGetArticlesListQuery(
		{ company_id, with_pagination: true, page: 1, pageSize: 30, search: deferredSearch },
		{ skip: !token || mode !== 'proforma' },
	);
	const fetchedArticles = !articleData ? [] : Array.isArray(articleData) ? articleData : articleData.results;
	const articles = [
		...createdArticles.filter((item) => !fetchedArticles.some((entry) => entry.id === item.id)),
		...fetchedArticles,
	];
	const installment = order?.echeancier_paiement?.find((entry) => entry.id === echeanceId);
	const productLines =
		order?.lignes?.filter(
			(line) => (line.type_article ?? 'Produit').toLowerCase() === 'produit' && Number(line.remaining_quantity) > 0,
		) ?? [];
	const managedReceipt =
		!!company?.stock_management_enabled &&
		(order?.lignes?.some((line) => (line.type_article ?? 'Produit').toLowerCase() === 'produit') ?? false);
	const [add] = useAddLogistiqueMutation();
	const [purchaseAction] = usePurchaseActionMutation();
	const purchase = ({ id: targetId, data }: { id: number; data: Record<string, unknown> | FormData }) => {
		if (data instanceof FormData) {
			data.set('etape', query.get('etape_correction') ?? mode);
			if (correctionId) data.set('correction_id', String(correctionId));
		} else
			data = {
				...data,
				etape: query.get('etape_correction') ?? mode,
				...(correctionId ? { correction_id: correctionId } : {}),
			};
		if (proposalMode)
			data = logisticsChangeProposal(
				data,
				query.get('etape_correction') ?? mode,
				formik.values.correction_remarque ?? '',
			);
		return purchaseAction({ id: targetId, data });
	};
	const [extractTitle, { isLoading: extractingTitle }] = useExtractImportTitleMutation();
	const [extractProforma, { isLoading: extractingProforma }] = useExtractSupplierProformaMutation();
	const extracting = extractingTitle || extractingProforma;
	const [requestPayment] = useRequestPurchasePaymentMutation();
	const [recordPayment] = useRecordLogistiquePaymentExecutionMutation();
	const [validatePayment] = useValidateLogistiquePaymentMutation();
	const [addNote] = useAddLogistiqueProcessNoteMutation();
	const initialValues: PurchaseFormValues = {
		correction_remarque: '',
		date_validite_titre_du: value(order?.date_validite_titre_du),
		date_validite_titre_au: value(order?.date_validite_titre_au),
		cout_achat_mad: value(order?.cout_achat_mad),
		autres_frais_virement_actif: order?.autres_frais_virement_actif ?? false,
		autres_frais_virement: value(order?.autres_frais_virement),
		description_frais_virement: value(order?.description_frais_virement),
		autres_frais_cash_actif: order?.autres_frais_cash_actif ?? false,
		autres_frais_cash: value(order?.autres_frais_cash),
		description_frais_cash: value(order?.description_frais_cash),
		bon_reception_file: null,
		fournisseur_record: value(order?.fournisseur_record),
		fournisseur: order?.fournisseur ?? '',
		fournisseur_email: order?.fournisseur_email ?? '',
		marque: value(order?.marque),
		responsable: value(order?.responsable ?? userId),
		date_prevue: order?.date_prevue ?? '',
		date_commande_client: order?.date_commande_client ?? '',
		numero_proforma_fournisseur: order?.numero_proforma_fournisseur ?? '',
		date_proforma_fournisseur: order?.date_proforma_fournisseur ?? '',
		montant_proforma_fournisseur: value(order?.montant_proforma_fournisseur),
		devise_proforma_fournisseur: order?.numero_proforma_fournisseur
			? order.devise_proforma_fournisseur || 'EUR'
			: 'EUR',
		condition_achat: order?.condition_achat ?? '',
		incoterm: order?.incoterm ?? '',
		delai_proforma_jours: value(order?.delai_proforma_jours),
		origine_marchandise: order?.origine_marchandise ?? '',
		nature_marchandise: order?.nature_marchandise ?? '',
		poids_net: value(order?.poids_net),
		poids_brut: value(order?.poids_brut),
		volume: value(order?.volume),
		ecart_prix_proforma: order?.ecart_prix_proforma ?? false,
		ecart_quantite_proforma: order?.ecart_quantite_proforma ?? false,
		ecart_autre_proforma: order?.ecart_autre_proforma ?? false,
		notes_ecarts_proforma: order?.notes_ecarts_proforma ?? '',
		decision: 'validate',
		numero_domiciliation: order?.numero_domiciliation ?? '',
		banque: order?.banque ?? '',
		montant_titre_importation: value(
			Number(order?.montant_titre_importation) > 0
				? order?.montant_titre_importation
				: order?.montant_proforma_fournisseur,
		),
		devise_titre_importation: order?.date_titre_importation ? order.devise_titre_importation || 'EUR' : 'EUR',
		date_titre_importation: order?.date_titre_importation ?? '',
		date_expedition_prevue: order?.date_expedition_prevue ?? '',
		confirmer_production: false,
		date_expedition_reelle: order?.date_expedition_reelle ?? '',
		date_arrivee_maroc: order?.date_arrivee_maroc ?? '',
		documents_remis_banque_le: order?.documents_remis_banque_le ?? '',
		date_reelle: order?.date_reelle ?? '',
		transport: order?.transport ?? '',
		documents_originaux_requis: order?.documents_originaux_requis ?? false,
		statut_documents_originaux: order?.statut_documents_originaux ?? '',
		cout_transport: value(order?.cout_transport),
		frais_transit: value(order?.frais_transit),
		frais_douane: value(order?.frais_douane),
		tva: value(order?.tva),
		livraison_locale: value(order?.livraison_locale),
		autres_frais: value(order?.autres_frais),
		remarque: '',
		note: isCorrection
			? (order?.receptions?.find(
					(entry) => entry.id === Number(query.get('reception_id') ?? order?.receptions?.[0]?.id),
				)?.note ?? '')
			: '',
		reference_reception: isCorrection
			? (order?.receptions?.find(
					(entry) => entry.id === Number(query.get('reception_id') ?? order?.receptions?.[0]?.id),
				)?.reference ?? '')
			: '',
		statut:
			mode === 'transit'
				? transitAfterReceipt
					? order!.statut
					: order?.statut === 'Dédouanement'
						? 'Dédouanement'
						: 'Transit'
				: '',
		echeance_id: value(echeanceId),
		date_echeance: installment?.date_echeance ?? today(),
		date_paiement: today(),
		methode_paiement: installment?.methode_paiement ?? '',
		montant_paye: value(installment?.montant_prevu),
		reference_paiement: isCorrection ? (installment?.reference_bancaire ?? '') : '',
		commentaire_paiement: isCorrection ? (installment?.commentaire ?? '') : '',
		lignes:
			order?.lignes?.map((line) => ({
				article: line.article,
				origin_name: line.expected_emplacement_name ?? '',
				brand_name: line.marque_name ?? '',
				article_reference: line.article_reference,
				designation: line.designation,
				quantity: line.proforma || line.source_line || line.client ? '' : value(line.quantity),
				prix_achat: line.proforma || line.source_line || line.client ? '' : value(line.prix_achat),
				expected_emplacement: line.expected_emplacement,
			})) ?? [],
		reception_lignes: productLines.map((line) => ({
			logistics_line: line.id,
			article: line.article,
			article_reference: line.article_reference,
			designation: line.designation,
			remaining_quantity: value(line.remaining_quantity),
			quantity: '',
			emplacement: value(line.expected_emplacement),
		})),
		proforma_fournisseur_file: null,
		titre_importation_file: null,
		documents_originaux_file: null,
		justificatifs_file: null,
		swift_file: null,
		fichier: null,
	};
	const formik = useFormik<PurchaseFormValues>({
		initialValues,
		validateOnMount: true,
		validate: (values) =>
			proposalMode && !values.correction_remarque?.trim() ? { correction_remarque: t.validation.required } : {},
		validationSchema: toFormikValidationSchema(
			getSupplierPurchaseSchema(mode, {
				approvedCorrection: isCorrection,
				existingProformaFile: !!order?.proforma_fournisseur_file,
				existingTitleFile: !!order?.titre_importation_file,
				managedReceipt,
				maxPayment: Number(installment?.montant_prevu),
			}),
		),
		onSubmit: async (values, { setFieldError }) => {
			if (!draftReady) return;
			setApiError('');
			const optionalNumbers = new Set<keyof PurchaseFormValues>([
				'poids_net',
				'poids_brut',
				'volume',
				'cout_transport',
				'frais_transit',
				'frais_douane',
				'tva',
				'livraison_locale',
				'autres_frais',
				'autres_frais_virement',
				'autres_frais_cash',
			]);
			const pick = (keys: (keyof PurchaseFormValues)[]) =>
				Object.fromEntries(
					keys
						.filter((key) => values[key] !== '' || optionalNumbers.has(key))
						.map((key) => [key, values[key] === '' && optionalNumbers.has(key) ? '0' : values[key]]),
				);
			try {
				if (mode === 'dossier') {
					const data = {
						fournisseur_record: suppliers.some(
							(supplier) =>
								String(supplier.id) === values.fournisseur_record &&
								supplier.nom.toLowerCase() === values.fournisseur.trim().toLowerCase(),
						)
							? Number(values.fournisseur_record)
							: undefined,
						fournisseur: values.fournisseur,
						fournisseur_email: values.fournisseur_email,
						responsable: Number(values.responsable),
						marque: values.marque ? Number(values.marque) : null,
					};
					if (!id) {
						const result = await add({ company_id, data: { ...data, marque: data.marque ?? undefined } }).unwrap();
						onSuccess('Dossier créé.');
						router.replace(LOGISTIQUE_VIEW(result.orders[0].id, company_id));
						return;
					}
					await purchase({
						id,
						data: { action: order?.can_adopt_supplier_workflow ? 'adopter_parcours_fournisseur' : 'dossier', ...data },
					}).unwrap();
				} else if (isCorrection && mode === 'paiement') {
					await purchase({
						id: id!,
						data: {
							action: 'corriger_paiement',
							echeance_id: echeanceId,
							reference_paiement: values.reference_paiement,
							commentaire_paiement: values.commentaire_paiement,
						},
					}).unwrap();
				} else if (isCorrection && mode === 'reception' && managedReceipt) {
					await purchase({
						id: id!,
						data: {
							action: 'corriger_reception',
							reception_id: Number(query.get('reception_id') ?? order?.receptions?.[0]?.id),
							reference: values.reference_reception,
							note: values.note,
						},
					}).unwrap();
				} else if (mode === 'demande_paiement')
					await requestPayment({ id: id!, echeance_id: echeanceId, date_echeance: values.date_echeance }).unwrap();
				else if (mode === 'paiement')
					await recordPayment({
						id: id!,
						data: {
							echeance_id: echeanceId,
							date_paiement: values.date_paiement,
							montant_paye: values.montant_paye,
							devise_paiement: installment!.devise,
							banque_paiement: order!.banque,
							methode_paiement: values.methode_paiement,
							reference_paiement: values.reference_paiement,
							commentaire_paiement: values.commentaire_paiement,
						},
					}).unwrap();
				else if (mode === 'justificatif')
					await validatePayment({
						id: id!,
						data: payload({ echeance_id: echeanceId, swift_file: values.swift_file }) as FormData,
					}).unwrap();
				else if (mode === 'remarque')
					await addNote({
						id: id!,
						data: (() => {
							const data = new FormData();
							data.append('remarque', values.remarque);
							if (values.fichier) data.append('fichier', values.fichier);
							return data;
						})(),
					}).unwrap();
				else {
					let data: Record<string, unknown>;
					if (mode === 'proforma')
						data = {
							action: 'proforma',
							...pick([
								'numero_proforma_fournisseur',
								'date_proforma_fournisseur',
								'montant_proforma_fournisseur',
								'devise_proforma_fournisseur',
								'condition_achat',
								'incoterm',
								'delai_proforma_jours',
								'poids_net',
								'poids_brut',
								'ecart_prix_proforma',
								'ecart_quantite_proforma',
								'ecart_autre_proforma',
								'decision',
							]),
							origine_marchandise: values.origine_marchandise,
							nature_marchandise: values.nature_marchandise,
							notes_ecarts_proforma: values.notes_ecarts_proforma,
							lignes: values.lignes.map(({ article, quantity, prix_achat, expected_emplacement }) => ({
								article,
								quantity,
								prix_achat,
								expected_emplacement,
							})),
							...(values.proforma_fournisseur_file
								? { proforma_fournisseur_file: values.proforma_fournisseur_file }
								: {}),
						};
					else if (mode === 'titre')
						data = {
							action: 'titre',
							...pick([
								'numero_domiciliation',
								'banque',
								'montant_titre_importation',
								'devise_titre_importation',
								'date_titre_importation',
								'date_validite_titre_du',
								'date_validite_titre_au',
							]),
							...(values.titre_importation_file ? { titre_importation_file: values.titre_importation_file } : {}),
						};
					else if (mode === 'production')
						data = {
							action: 'progression',
							date_expedition_prevue: values.date_expedition_prevue,
							confirmer_production: values.confirmer_production,
							remarque: values.remarque,
						};
					else if (mode === 'expedition')
						data = {
							action: 'progression',
							statut: order?.date_expedition_reelle ? order.statut : 'Expédition',
							date_expedition_reelle: values.date_expedition_reelle,
							transport: values.transport,
							documents_originaux_requis: values.documents_originaux_requis,
							statut_documents_originaux: values.documents_originaux_requis ? values.statut_documents_originaux : '',
							remarque: values.remarque,
							...(values.documents_originaux_file ? { documents_originaux_file: values.documents_originaux_file } : {}),
							...(values.justificatifs_file ? { justificatifs_file: values.justificatifs_file } : {}),
						};
					else if (mode === 'transit')
						data = {
							action: 'progression',
							description_frais_virement: values.description_frais_virement ?? '',
							description_frais_cash: values.description_frais_cash ?? '',
							...pick([
								'date_arrivee_maroc',
								'documents_remis_banque_le',
								'cout_transport',
								'frais_transit',
								'frais_douane',
								'autres_frais_virement_actif',
								'autres_frais_virement',
								'description_frais_virement',
								'autres_frais_cash_actif',
								'autres_frais_cash',
								'description_frais_cash',
							]),
							statut: transitAfterReceipt || order?.statut === 'Dédouanement' ? order!.statut : 'Transit',
							remarque: values.remarque,
							...(originalFiles.length ? { documents_originaux_files: originalFiles } : {}),
							...(values.justificatifs_file ? { justificatifs_file: values.justificatifs_file } : {}),
						};
					else if (mode === 'reception')
						data = managedReceipt
							? {
									action: 'reception',
									reference: values.reference_reception,
									note: values.note,
									lines: values.reception_lignes
										.filter((line) => Number(line.quantity) > 0)
										.map((line) => ({
											logistics_line: line.logistics_line,
											article: line.article,
											quantity: line.quantity,
											emplacement: Number(line.emplacement),
										})),
								}
							: {
									action: 'progression',
									date_reelle: values.date_reelle,
									statut: 'Réception locale',
									remarque: values.note,
								};
					else
						data = {
							action: 'progression',
							cout_achat_mad: values.cout_achat_mad?.trim() ? values.cout_achat_mad : null,
							...(values.justificatifs_file ? { justificatifs_file: values.justificatifs_file } : {}),
							...pick([
								'cout_transport',
								'frais_transit',
								'frais_douane',
								'livraison_locale',
								'autres_frais',
								'cout_achat_mad',
							]),
							remarque: values.remarque,
						};
					if (mode === 'reception' && values.bon_reception_file) data.bon_reception_file = values.bon_reception_file;
					await purchase({ id: id!, data: payload(data) }).unwrap();
				}
				onSuccess(proposalMode ? 'Modifications proposées, en attente de validation.' : 'Modifications enregistrées.');
				if (draftKey) void purchaseDraft(draftKey, 'delete').catch(() => undefined);
				router.push(
					id
						? `${LOGISTIQUE_VIEW(id, company_id)}${proposalMode ? `&etape=${query.get('etape_correction') ?? mode}` : ''}`
						: LOGISTIQUE_ADD(company_id),
				);
			} catch (failure) {
				const message = extractApiErrorMessage(
					failure,
					'Impossible d’enregistrer. Vérifiez les informations du formulaire.',
				);
				setApiError(message);
				onError(message);
				setFormikAutoErrors({ e: failure, setFieldError });
			}
		},
	});
	const hasValidationErrors = Object.keys(formik.errors).length > 0;
	useEffect(() => {
		if (!formik.submitCount || formik.isSubmitting || (!hasValidationErrors && !apiError)) return;
		const frame = requestAnimationFrame(() => {
			errorSummary.current?.focus({ preventScroll: true });
			errorSummary.current?.scrollIntoView?.({ behavior: 'instant', block: 'start' });
		});
		return () => cancelAnimationFrame(frame);
	}, [formik.submitCount, formik.isSubmitting, hasValidationErrors, apiError]);
	const { draftKey, draftReady } = useSupplierPurchaseDraft({
		company_id,
		id,
		token,
		mode,
		userId,
		formik,
		setApiError,
	});

	const hasAnomaly =
		formik.values.ecart_prix_proforma || formik.values.ecart_quantite_proforma || formik.values.ecart_autre_proforma;
	const selectedSupplier = suppliers.find((supplier) => String(supplier.id) === formik.values.fournisseur_record);
	const filteredBrands = selectedSupplier
		? brands.filter((brand) => selectedSupplier.marques?.includes(brand.id))
		: brands;
	const locked =
		order?.statut_global === 'Annulé' ||
		order?.statut === 'Clôture' ||
		(mode === 'proforma' && order?.is_proforma_step_complete && !isCorrection);
	const disabled = formik.isSubmitting || extracting || !!locked || !draftReady;
	const requiredFileNames: LogistiqueDocumentField[] =
		mode === 'reception'
			? isCorrection && managedReceipt
				? []
				: ['bon_reception_file']
			: mode === 'couts'
				? ['justificatifs_file']
				: mode === 'proforma'
					? ['proforma_fournisseur_file']
					: mode === 'titre'
						? ['titre_importation_file']
						: mode === 'expedition' || mode === 'transit'
							? ['documents_originaux_file', 'justificatifs_file']
							: mode === 'justificatif'
								? ['swift_file']
								: mode === 'remarque'
									? ['justificatifs_file']
									: [];
	const documentLabels: Record<LogistiqueDocumentField, string> = {
		bon_reception_file: 'Bon de réception',
		proforma_fournisseur_file: 'Proforma fournisseur',
		titre_importation_file: 'Titre d’importation',
		documents_originaux_file: 'Documents originaux',
		justificatifs_file: mode === 'remarque' ? 'Fichier joint à la remarque' : 'Justificatif',
		swift_file: 'Justificatif bancaire',
	};
	const originalUrls = [
		...(order?.documents_originaux_file ? [order.documents_originaux_file] : []),
		...(order?.documents ?? [])
			.filter((document) => document.champ === 'documents_originaux_files')
			.map((document) => document.url),
	];
	const items = requiredFileNames.map((field) => ({
		field,
		label: documentLabels[field],
		file: mode === 'remarque' ? formik.values.fichier : formik.values[field],
		currentUrl:
			mode === 'remarque' ? undefined : field === 'swift_file' ? installment?.justificatif_file : order?.[field],
		error: attempted && typeof formik.errors[field] === 'string' ? formik.errors[field] : undefined,
		multiple:
			mode === 'transit' && field === 'documents_originaux_file'
				? { files: originalFiles, currentUrls: originalUrls, onChange: setOriginalFiles }
				: undefined,
	}));
	async function changeDocument(field: LogistiqueDocumentField, file: File | null) {
		if (mode === 'proforma') {
			const sequence = ++extractionSequence.current;
			const suggestions = proformaSuggestions.current;
			proformaSuggestions.current = {};
			setProformaRead(false);
			setWarnings([]);
			await formik.setValues((previous) => {
				const next = { ...previous, proforma_fournisseur_file: file };
				for (const key of proformaReadFields) {
					const suggestion = suggestions[key];
					if (suggestion && previous[key] === suggestion.suggested) next[key] = suggestion.previous;
				}
				return next;
			});
			if (file && sequence === extractionSequence.current) await readSupplierProforma(file);
			return;
		}
		await formik.setFieldValue(mode === 'remarque' ? 'fichier' : field, file);
		if (mode !== 'titre') return;
		const sequence = ++extractionSequence.current;
		setWarnings([]);
		if (!file || !id) return;
		// A replacement document must not silently reuse values from the previous title.
		await formik.setValues((previous) => ({
			...previous,
			numero_domiciliation: '',
			banque: '',
			montant_titre_importation: value(order?.montant_proforma_fournisseur),
			devise_titre_importation: 'EUR',
			date_titre_importation: '',
		}));
		try {
			const body = new FormData();
			body.append('file', file);
			const result = await extractTitle({ id, data: body }).unwrap();
			if (sequence !== extractionSequence.current) return;
			await formik.setValues((previous) => ({
				...previous,
				...Object.fromEntries(Object.entries(result.fields).filter(([, entry]) => entry !== '' && entry != null)),
			}));
			setWarnings(result.warnings);
		} catch (failure) {
			if (sequence === extractionSequence.current)
				setWarnings([
					extractApiErrorMessage(
						failure,
						'Lecture automatique indisponible. Renseignez les informations manuellement.',
					),
				]);
		}
	}

	async function readSupplierProforma(file?: File) {
		if (!id) return;
		const sequence = ++extractionSequence.current;
		setProformaRead(false);
		setWarnings([]);
		const body = new FormData();
		if (file) body.append('file', file);
		try {
			const result = await extractProforma(file ? { id, data: body } : { id }).unwrap();
			if (sequence !== extractionSequence.current) return;
			const validated = order?.is_proforma_step_complete;
			const amount = result.fields.montant_proforma_fournisseur;
			const currency = result.fields.devise_proforma_fournisseur;
			const accountingMismatch =
				validated &&
				((amount && Number(amount) !== Number(order.montant_proforma_fournisseur)) ||
					(currency && currency !== order.devise_proforma_fournisseur));
			await formik.setValues((previous) => {
				const next = { ...previous };
				for (const key of proformaReadFields) {
					if (validated && (key === 'montant_proforma_fournisseur' || key === 'devise_proforma_fournisseur')) continue;
					const suggested = result.fields[key];
					if (!suggested) continue;
					const prior = proformaSuggestions.current[key];
					proformaSuggestions.current[key] = {
						previous: prior && previous[key] === prior.suggested ? prior.previous : previous[key],
						suggested,
					};
					next[key] = suggested;
				}
				return next;
			});
			if (sequence !== extractionSequence.current) return;
			const readWarnings = [
				...result.warnings,
				...(accountingMismatch
					? [
							'Le montant ou la devise du document diffère de l’échéancier validé. Vérifiez cet écart avec la comptabilité.',
						]
					: []),
			];
			setWarnings(readWarnings);
			setProformaRead(readWarnings.length === 0 && proformaReadFields.some((key) => Boolean(result.fields[key])));
		} catch (failure) {
			if (sequence === extractionSequence.current) {
				setWarnings([
					extractApiErrorMessage(
						failure,
						'Lecture de la proforma indisponible. Vérifiez les informations et corrigez les champs manuellement.',
					),
				]);
			}
		}
	}

	const validationEntries = Object.entries(formik.errors).map(([name, entry]) => [
		name,
		typeof entry === 'string' ? entry : 'Vérifiez les informations des lignes.',
	]);
	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
			<Dialog open={articleModalOpen} onClose={() => setArticleModalOpen(false)} maxWidth="lg" fullWidth>
				<DialogTitle>Ajouter un article</DialogTitle>
				<DialogContent>
					{articleModalOpen && (
						<ArticleFormContent
							logisticsOrderId={id}
							token={token}
							company_id={company_id}
							onCancel={() => setArticleModalOpen(false)}
							onCreated={(article) => {
								setCreatedArticles((previous) => [...previous, article]);
								const line = purchaseLineFromArticle(article, formik.values.devise_proforma_fournisseur);
								void formik.setValues((previous) => {
									const empty = previous.lignes.findIndex((entry) => !entry.article);
									const lines =
										empty < 0
											? [...previous.lignes, line]
											: previous.lignes.map((entry, index) => (index === empty ? line : entry));
									return withPurchaseLines(previous, lines, articles);
								});
								setArticleModalOpen(false);
							}}
						/>
					)}
				</DialogContent>
			</Dialog>
			<Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ pt: 2, justifyContent: 'space-between' }}>
				{id && (
					<Button
						variant="outlined"
						startIcon={<ArrowBack />}
						onClick={() => router.push(LOGISTIQUE_VIEW(id, company_id))}
						sx={{ width: isMobile ? '100%' : 'auto' }}
					>
						Retour au dossier
					</Button>
				)}
				<Button
					variant="outlined"
					startIcon={<ArrowBack />}
					onClick={() => router.push(listReturnUrl(`${LOGISTIQUE_LIST}?company_id=${company_id}`))}
					sx={{ width: isMobile ? '100%' : 'auto' }}
				>
					Retour à la liste
				</Button>
			</Stack>
			{id && (
				<Alert severity="info">
					Dossier {order?.numero_commande} · {order?.fournisseur}
				</Alert>
			)}
			{order?.can_adopt_supplier_workflow && (
				<Alert severity="info">
					Confirmez le fournisseur et le responsable pour poursuivre. Les documents et l’historique du dossier seront
					conservés. Les quantités et les prix seront renseignés ensuite depuis la proforma fournisseur.
				</Alert>
			)}
			{mode === 'proforma' && order?.lignes?.some((line) => line.proforma || line.source_line || line.client) && (
				<Alert severity="info">
					Vérifiez les articles proposés et saisissez les quantités et les prix d’achat de la proforma fournisseur.
				</Alert>
			)}
			{locked && <Alert severity="info">Ce formulaire est verrouillé. Consultez le dossier pour poursuivre.</Alert>}
			{apiError && (
				<Alert ref={errorSummary} tabIndex={-1} sx={{ scrollMarginTop: 96 }} severity="error" icon={<Warning />}>
					{apiError}
				</Alert>
			)}
			{attempted && validationEntries.length > 0 && (
				<Alert ref={errorSummary} tabIndex={-1} sx={{ scrollMarginTop: 96 }} severity="error" icon={<Warning />}>
					<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
						Vérifiez les informations du formulaire.
					</Typography>
					<ul style={{ margin: '8px 0', paddingLeft: 20 }}>
						{validationEntries.map(([name, message]) => (
							<li key={name}>{message}</li>
						))}
					</ul>
				</Alert>
			)}
			<form
				onSubmit={(event) => {
					setAttempted(true);
					formik.handleSubmit(event);
				}}
				noValidate
			>
				<Stack spacing={3}>
					<SupplierPurchaseFormFields
						attempted={attempted}
						formik={formik}
						t={t}
						disabled={disabled}
						isCorrection={isCorrection}
						responsibles={responsibles}
						order={order}
						locations={locations}
						mode={mode}
						id={id}
						numberPreview={numberPreview}
						numberPreviewError={numberPreviewError}
						suppliers={suppliers}
						filteredBrands={filteredBrands}
						brands={brands}
						articles={articles}
						setSearch={setSearch}
						addNewArticle={addNewArticle}
						loadingArticles={loadingArticles}
						hasAnomaly={hasAnomaly}
						transitAfterReceipt={transitAfterReceipt}
						managedReceipt={managedReceipt}
						installment={installment}
					/>
					{proposalMode && (
						<FormCard title="Motif de la modification" icon={<Notes color="primary" />}>
							{full(
								<CustomTextInput
									id="correction_remarque"
									name="correction_remarque"
									type="textarea"
									theme={inputTheme}
									startIcon={<Notes fontSize="small" />}
									label="Motif de la modification"
									placeholder="Expliquez pourquoi ces valeurs doivent être corrigées"
									helperText={
										(attempted || formik.touched.correction_remarque) && formik.errors.correction_remarque
											? formik.errors.correction_remarque
											: 'Les valeurs actuelles seront conservées jusqu’à la validation de votre proposition.'
									}
									error={!!formik.errors.correction_remarque && (attempted || !!formik.touched.correction_remarque)}
									size="small"
									fullWidth
									minRows={3}
									required
									value={formik.values.correction_remarque ?? ''}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={disabled}
								/>,
							)}
						</FormCard>
					)}
					{items.length > 0 && (
						<LogistiqueDocumentsFormCard
							items={items}
							selectedField={selectedDocument}
							onSelectedFieldChangeAction={setSelectedDocument}
							onFileChangeAction={(field, file) => {
								void changeDocument(field, file);
							}}
							onClearFileAction={(field) => {
								void changeDocument(field, null);
							}}
							isLoading={disabled}
						/>
					)}
					{mode === 'proforma' && order?.proforma_fournisseur_file && !formik.values.proforma_fournisseur_file && (
						<Button type="button" onClick={() => void readSupplierProforma()} disabled={disabled}>
							Relire la proforma jointe
						</Button>
					)}
					{extractingTitle && <Alert severity="info">Lecture du titre d’importation en cours…</Alert>}
					{extractingProforma && <Alert severity="info">Lecture de la proforma fournisseur en cours…</Alert>}
					{proformaRead && (
						<Alert severity="info">
							Vérifiez les champs préremplis et les articles avec la proforma avant de continuer.
						</Alert>
					)}
					{warnings.map((warning, index) => (
						<Alert severity="warning" key={index}>
							{warning}
						</Alert>
					))}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
						<PrimaryLoadingButton
							buttonText={
								proposalMode
									? 'Soumettre les modifications'
									: mode === 'proforma' && !isCorrection
										? 'Valider la proforma'
										: 'Enregistrer'
							}
							active={!disabled && (!['demande_paiement', 'paiement', 'justificatif'].includes(mode) || !!installment)}
							loading={formik.isSubmitting}
							onClick={() => {
								setAttempted(true);
							}}
							cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
							type="submit"
							startIcon={proposalMode ? <Send /> : <Save />}
						/>
					</Box>
				</Stack>
			</form>
		</Stack>
	);
}
