'use client';

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
import { Alert, Box, Button, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useFormik } from 'formik';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useRef, useState } from 'react';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { LogistiqueDocumentsFormCard } from './logistique-documents-card';
import FormCard, { full } from './supplier-purchase-form-card';
import SupplierPurchaseFormFields from './supplier-purchase-form-fields';
const inputTheme = textInputTheme();
const value = (input: unknown) => (input == null ? '' : String(input));
const today = () => formatLocalDate(new Date());

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
	const [correctionReason, setCorrectionReason] = useState('');
	const router = useRouter();
	const query = useSearchParams();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const userId = useAppSelector(getInitStateToken).user.pk;
	const [attempted, setAttempted] = useState(false);
	const [apiError, setApiError] = useState('');
	const [warnings, setWarnings] = useState<string[]>([]);
	const [search, setSearch] = useState('');
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
	const articles = !articleData ? [] : Array.isArray(articleData) ? articleData : articleData.results;
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
		if (proposalMode) data = logisticsChangeProposal(data, query.get('etape_correction') ?? mode, correctionReason);
		return purchaseAction({ id: targetId, data });
	};
	const [extract, { isLoading: extracting }] = useExtractImportTitleMutation();
	const [requestPayment] = useRequestPurchasePaymentMutation();
	const [recordPayment] = useRecordLogistiquePaymentExecutionMutation();
	const [validatePayment] = useValidateLogistiquePaymentMutation();
	const [addNote] = useAddLogistiqueProcessNoteMutation();
	const initialValues: PurchaseFormValues = {
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
		decision: isCorrection ? 'validate' : 'control',
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
			if (proposalMode && !correctionReason.trim()) {
				setApiError('Expliquez le motif de la modification.');
				return;
			}
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
							...pick([
								'date_arrivee_maroc',
								'documents_remis_banque_le',
								'cout_transport',
								'frais_transit',
								'frais_douane',
								'tva',
							]),
							statut: transitAfterReceipt ? order!.statut : values.statut,
							remarque: values.remarque,
							...(values.documents_originaux_file ? { documents_originaux_file: values.documents_originaux_file } : {}),
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
							...pick(['cout_transport', 'frais_transit', 'frais_douane', 'tva', 'livraison_locale', 'autres_frais']),
							remarque: values.remarque,
						};
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
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		},
	});
	const { draftKey, draftReady, addNewArticle } = useSupplierPurchaseDraft({
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
		mode === 'proforma'
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
		proforma_fournisseur_file: 'Proforma fournisseur',
		titre_importation_file: 'Titre d’importation',
		documents_originaux_file: 'Documents originaux',
		justificatifs_file: mode === 'remarque' ? 'Fichier joint à la remarque' : 'Justificatif',
		swift_file: 'Justificatif bancaire',
	};
	const items = requiredFileNames.map((field) => ({
		field,
		label: documentLabels[field],
		file: mode === 'remarque' ? formik.values.fichier : formik.values[field],
		currentUrl: mode === 'remarque' ? undefined : order?.[field],
	}));
	async function changeDocument(field: LogistiqueDocumentField, file: File | null) {
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
			const result = await extract({ id, data: body }).unwrap();
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

	const validationEntries = Object.entries(formik.errors).map(([name, entry]) => [
		name,
		typeof entry === 'string' ? entry : 'Vérifiez les informations des lignes.',
	]);
	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
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
				<Alert severity="error" icon={<Warning />}>
					{apiError}
				</Alert>
			)}
			{attempted && validationEntries.length > 0 && (
				<Alert severity="error" icon={<Warning />}>
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
			<form onSubmit={formik.handleSubmit} noValidate>
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
									type="textarea"
									theme={inputTheme}
									startIcon={<Notes fontSize="small" />}
									label="Motif de la modification"
									placeholder="Expliquez pourquoi ces valeurs doivent être corrigées"
									helperText="Les valeurs actuelles seront conservées jusqu’à la validation de votre proposition."
									size="small"
									fullWidth
									minRows={3}
									required
									value={correctionReason}
									onChange={(event) => setCorrectionReason(event.target.value)}
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
					{extracting && <Alert severity="info">Lecture du titre d’importation en cours…</Alert>}
					{warnings.map((warning, index) => (
						<Alert severity="warning" key={index}>
							{warning}
						</Alert>
					))}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
						<PrimaryLoadingButton
							buttonText={proposalMode ? 'Soumettre les modifications' : 'Enregistrer'}
							active={
								!disabled &&
								(!proposalMode || (!!correctionReason.trim() && formik.dirty)) &&
								(!['demande_paiement', 'paiement', 'justificatif'].includes(mode) || !!installment)
							}
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
