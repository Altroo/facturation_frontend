'use client';

import { useDeferredValue, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik, getIn } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	Divider,
	FormControlLabel,
	IconButton,
	InputAdornment,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add,
	ArrowBack,
	Business,
	CalendarToday,
	CheckCircle,
	Delete,
	Description,
	Email,
	Inventory,
	LocalShipping,
	Notes,
	Payment,
	Person,
	Public,
	Save,
	Scale,
	Warning,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import FormattedNumberInput from '@/components/formikElements/formattedNumberInput/formattedNumberInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NoPermission from '@/components/shared/noPermission/noPermission';
import { LogistiqueDocumentsFormCard } from './logistique-documents-card';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getInitStateToken, getUserCompaniesState } from '@/store/selectors';
import { useGetUserCompaniesQuery, useGetCompanyQuery } from '@/store/services/company';
import { useGetArticlesListQuery } from '@/store/services/article';
import { useGetMarqueListQuery, useGetEmplacementListQuery } from '@/store/services/parameter';
import {
	useAddLogistiqueMutation,
	useGetLogistiqueQuery,
	useGetLogistiqueResponsablesQuery,
	usePurchaseActionMutation,
	useExtractImportTitleMutation,
	useRequestPurchasePaymentMutation,
	useRecordLogistiquePaymentExecutionMutation,
	useValidateLogistiquePaymentMutation,
	useAddLogistiqueProcessNoteMutation,
	useGetLogistiqueSuppliersQuery,
	useAddLogistiqueSupplierMutation,
	useEditLogistiqueSupplierMutation,
} from '@/store/services/logistique';
import { extractApiErrorMessage, formatLocalDate, setFormikAutoErrors } from '@/utils/helpers';
import { textInputTheme } from '@/utils/themes';
import { logistiqueManagerRoles } from '@/utils/rawData';
import { LOGISTIQUE_ADD, LOGISTIQUE_LIST, LOGISTIQUE_VIEW } from '@/utils/routes';
import { listReturnUrl } from '@/utils/listReturn';
import { getSupplierPurchaseSchema, PURCHASE_CONDITIONS } from '@/utils/supplierPurchaseSchemas';
import type { PurchaseFormMode, PurchaseFormValues } from '@/types/supplierPurchaseTypes';
import type { LogistiqueDocumentField, LogistiqueFormProps, LogistiqueOrder } from '@/types/logistiqueTypes';
import type { DropDownType } from '@/types/accountTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const inputTheme = textInputTheme();
const titles: Record<PurchaseFormMode, string> = {
	dossier: 'Informations du dossier',
	proforma: 'Proforma fournisseur et conformité',
	titre: 'Titre d’importation',
	production: 'Préparation fournisseur',
	expedition: 'Expédition et documents',
	transit: 'Transit et douane',
	reception: 'Réception des marchandises',
	couts: 'Coûts du dossier',
	demande_paiement: 'Demande de paiement',
	paiement: 'Enregistrer le paiement',
	justificatif: 'Justificatif bancaire',
	remarque: 'Ajouter une remarque',
	repertoire: 'Contact fournisseur',
};
const allowedModes = new Set(Object.keys(titles));
const value = (input: unknown) => (input == null ? '' : String(input));
const today = () => formatLocalDate(new Date());
const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 };

function FormCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
	return (
		<Card elevation={2} sx={{ borderRadius: 2 }}>
			<CardContent sx={{ p: 3 }}>
				<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
					{icon}
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{title}
					</Typography>
				</Stack>
				<Divider sx={{ mb: 3 }} />
				<Box sx={grid}>{children}</Box>
			</CardContent>
		</Card>
	);
}

function payload(data: Record<string, unknown>): Record<string, unknown> | FormData {
	const entries = Object.entries(data).filter(([, entry]) => entry !== undefined);
	if (!entries.some(([, entry]) => entry instanceof File)) return Object.fromEntries(entries);
	const body = new FormData();
	for (const [key, entry] of entries)
		body.append(
			key,
			entry instanceof File
				? entry
				: entry == null
					? ''
					: typeof entry === 'object'
						? JSON.stringify(entry)
						: String(entry),
		);
	return body;
}

export default function SupplierPurchaseForm(props: LogistiqueFormProps) {
	const token = useInitAccessToken(props.session);
	const query = useSearchParams();
	const requested = query.get('etape') ?? 'dossier';
	const mode: PurchaseFormMode = allowedModes.has(requested) ? (requested as PurchaseFormMode) : 'dossier';
	const companiesState = useAppSelector(getUserCompaniesState);
	const { data: companies, isLoading: loadingCompanies } = useGetUserCompaniesQuery(undefined, { skip: !token });
	const {
		data: order,
		isLoading: loadingOrder,
		error,
		refetch,
	} = useGetLogistiqueQuery({ id: props.id ?? 0 }, { skip: !token || !props.id });
	const company = (companies ?? companiesState)?.find((entry) => entry.id === props.company_id);
	const title = !props.id && mode === 'dossier' ? 'Nouveau dossier fournisseur' : titles[mode];
	const currentUser = useAppSelector(getInitStateToken).user.pk;
	const isAccounting = ['paiement', 'justificatif'].includes(mode);
	const canManage = !!company?.role && logistiqueManagerRoles.has(company.role);
	const assignedAccountant = company?.role === 'Comptable' && order?.paiement_assigne_a === currentUser;
	const canAccess = isAccounting ? assignedAccountant : canManage || (mode === 'remarque' && assignedAccountant);
	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={title}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{loadingCompanies || loadingOrder || !token ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : error ? (
						<Alert severity="error">
							{extractApiErrorMessage(error, 'Impossible de charger le dossier.')}
							<Button onClick={() => refetch()}>Réessayer</Button>
						</Alert>
					) : !canAccess || (props.id && !order) ? (
						<NoPermission />
					) : (
						<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
							<PurchaseFormik
								key={`${props.company_id}-${props.id ?? 'new'}-${mode}-${query.get('echeance_id') ?? ''}`}
								{...props}
								token={token}
								mode={mode}
								order={order}
								echeanceId={Number(query.get('echeance_id') ?? 0)}
							/>
						</LocalizationProvider>
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
}

function PurchaseFormik({
	company_id,
	id,
	token,
	mode,
	order,
	echeanceId,
}: LogistiqueFormProps & { token: string; mode: PurchaseFormMode; order?: LogistiqueOrder; echeanceId: number }) {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
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
	const { currentData: supplierData } = useGetLogistiqueSuppliersQuery(
		{ company_id },
		{ skip: !token || !['dossier', 'repertoire'].includes(mode) },
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
	const [purchase] = usePurchaseActionMutation();
	const [extract, { isLoading: extracting }] = useExtractImportTitleMutation();
	const [requestPayment] = useRequestPurchasePaymentMutation();
	const [recordPayment] = useRecordLogistiquePaymentExecutionMutation();
	const [validatePayment] = useValidateLogistiquePaymentMutation();
	const [addNote] = useAddLogistiqueProcessNoteMutation();
	const [addSupplier] = useAddLogistiqueSupplierMutation();
	const [editSupplier] = useEditLogistiqueSupplierMutation();
	const initialValues: PurchaseFormValues = {
		fournisseur_record: '',
		fournisseur: order?.fournisseur ?? '',
		fournisseur_email: order?.fournisseur_email ?? '',
		marque: value(order?.marque),
		responsable: value(order?.responsable ?? userId),
		date_prevue: order?.date_prevue ?? '',
		date_commande_client: order?.date_commande_client ?? '',
		numero_proforma_fournisseur: order?.numero_proforma_fournisseur ?? '',
		date_proforma_fournisseur: order?.date_proforma_fournisseur ?? '',
		montant_proforma_fournisseur: value(order?.montant_proforma_fournisseur),
		devise_proforma_fournisseur: order?.devise_proforma_fournisseur ?? 'EUR',
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
		decision: 'control',
		numero_domiciliation: order?.numero_domiciliation ?? '',
		banque: order?.banque ?? '',
		montant_titre_importation: value(order?.montant_titre_importation || order?.montant_proforma_fournisseur),
		devise_titre_importation: order?.devise_titre_importation ?? order?.devise_proforma_fournisseur ?? 'EUR',
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
		note: '',
		reference_reception: '',
		nom: '',
		email_contact: '',
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
		montant_paye: value(installment?.montant_prevu),
		reference_paiement: '',
		commentaire_paiement: '',
		lignes:
			order?.lignes?.map((line) => ({
				article: line.article,
				article_reference: line.article_reference,
				designation: line.designation,
				quantity: value(line.quantity),
				prix_achat: value(line.prix_achat),
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
				existingProformaFile: !!order?.proforma_fournisseur_file,
				existingTitleFile: !!order?.titre_importation_file,
				managedReceipt,
				maxPayment: Number(installment?.montant_prevu),
			}),
		),
		onSubmit: async (values, { setFieldError }) => {
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
						date_prevue: values.date_prevue || null,
						date_commande_client: values.date_commande_client || null,
					};
					if (!id) {
						const result = await add({ company_id, data: { ...data, marque: data.marque ?? undefined } }).unwrap();
						onSuccess('Dossier créé.');
						router.replace(LOGISTIQUE_VIEW(result.orders[0].id, company_id));
						return;
					}
					await purchase({ id, data: { action: 'dossier', ...data } }).unwrap();
				} else if (mode === 'repertoire') {
					const existing = suppliers.find((supplier) => supplier.nom.toLowerCase() === values.nom.trim().toLowerCase());
					const data = { company_id, nom: values.nom.trim(), email: values.email_contact.trim() };
					await (existing ? editSupplier({ ...data, id: existing.id }) : addSupplier(data)).unwrap();
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
							methode_paiement: installment!.methode_paiement,
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
								'volume',
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
				onSuccess('Modifications enregistrées.');
				router.push(id ? LOGISTIQUE_VIEW(id, company_id) : LOGISTIQUE_ADD(company_id));
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
	const locked =
		order?.statut_global === 'Annulé' ||
		order?.statut === 'Clôture' ||
		(mode === 'proforma' && order?.is_proforma_step_complete);
	const disabled = formik.isSubmitting || extracting || !!locked;
	const errorFor = (name: string) =>
		attempted || getIn(formik.touched, name) ? (getIn(formik.errors, name) as string | undefined) : undefined;
	const text = (
		name: string,
		label: string,
		icon: ReactNode = <Description fontSize="small" />,
		required = false,
		multiline = false,
		helper?: string,
		readOnly = false,
	) => (
		<CustomTextInput
			id={name}
			name={name}
			type={multiline ? 'textarea' : 'text'}
			label={label}
			value={value(getIn(formik.values, name))}
			onChange={formik.handleChange(name)}
			onBlur={formik.handleBlur(name)}
			helperText={errorFor(name) ?? helper}
			error={!!errorFor(name)}
			required={required}
			disabled={disabled || readOnly}
			fullWidth
			size="small"
			theme={inputTheme}
			startIcon={icon}
			minRows={multiline ? 3 : undefined}
			ai={multiline}
		/>
	);
	const number = (
		name: string,
		label: string,
		icon: ReactNode = <Payment fontSize="small" />,
		decimals = 2,
		required = false,
	) => (
		<FormattedNumberInput
			id={name}
			type="text"
			label={label}
			value={value(getIn(formik.values, name))}
			onChange={formik.handleChange(name)}
			onBlur={formik.handleBlur(name)}
			helperText={errorFor(name)}
			error={!!errorFor(name)}
			required={required}
			disabled={disabled}
			fullWidth
			size="small"
			theme={inputTheme}
			startIcon={icon}
			decimals={decimals}
		/>
	);
	const date = (name: string, label: string, required = false, helper?: string, readOnly = false) => (
		<DatePicker
			label={label}
			value={getIn(formik.values, name) ? new Date(`${getIn(formik.values, name)}T00:00:00`) : null}
			onChange={(entry) => {
				void formik.setFieldValue(name, entry && !Number.isNaN(entry.getTime()) ? formatLocalDate(entry) : '');
			}}
			format="dd/MM/yyyy"
			disabled={disabled || readOnly}
			slotProps={{
				textField: {
					size: 'small',
					fullWidth: true,
					required,
					error: !!errorFor(name),
					helperText: errorFor(name) ?? helper,
					onBlur: () => formik.setFieldTouched(name, true),
					slotProps: {
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<CalendarToday fontSize="small" color="action" />
								</InputAdornment>
							),
						},
					},
				},
			}}
		/>
	);
	const select = (
		name: string,
		label: string,
		items: string[],
		icon: ReactNode = <Description fontSize="small" />,
		required = false,
	) => (
		<CustomDropDownSelect
			id={name}
			label={label}
			items={items}
			value={value(getIn(formik.values, name))}
			onChange={(event) => formik.setFieldValue(name, event.target.value)}
			onBlur={() => formik.setFieldTouched(name, true)}
			helperText={errorFor(name)}
			error={!!errorFor(name)}
			required={required}
			disabled={disabled}
			size="small"
			theme={inputTheme}
			startIcon={icon}
		/>
	);
	const autocomplete = (
		name: string,
		label: string,
		items: DropDownType[],
		required = false,
		icon: ReactNode = <Description fontSize="small" />,
	) => (
		<CustomAutoCompleteSelect
			id={name}
			label={label}
			items={items}
			value={items.find((item) => String(item.value) === value(getIn(formik.values, name))) ?? null}
			onChange={(_, entry) => formik.setFieldValue(name, entry?.value ?? '')}
			onBlur={() => formik.setFieldTouched(name, true)}
			helperText={errorFor(name)}
			error={!!errorFor(name)}
			required={required}
			disabled={disabled}
			fullWidth
			size="small"
			theme={inputTheme}
			startIcon={icon}
			noOptionsText="Aucune option disponible"
		/>
	);
	const checkbox = (name: keyof PurchaseFormValues, label: string) => (
		<FormControlLabel
			label={label}
			control={
				<Checkbox
					checked={!!formik.values[name]}
					disabled={disabled}
					onChange={(_, checked) => formik.setFieldValue(name, checked)}
				/>
			}
		/>
	);
	const full = (children: ReactNode) => <Box sx={{ gridColumn: { md: '1 / -1' } }}>{children}</Box>;
	const articlesTotal = formik.values.lignes.reduce(
		(sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.prix_achat) || 0),
		0,
	);
	const responsibleItems: DropDownType[] = responsibles
		.filter((entry) => logistiqueManagerRoles.has(entry.role))
		.map((entry) => ({
			value: String(entry.id),
			code: entry.label,
		}));
	if (!responsibleItems.some((entry) => entry.value === formik.values.responsable))
		responsibleItems.push({ value: formik.values.responsable, code: order?.responsable_name ?? 'Vous-même' });
	const locationItems: DropDownType[] = locations.map((entry) => ({ value: String(entry.id), code: entry.nom }));
	const decisionLabels: Record<string, string> = {
		control: 'Enregistrer le contrôle',
		request_correction: 'Demander une correction',
		validate: 'Valider la proforma',
		reject: 'Refuser la proforma',
	};
	const decisionItems: DropDownType[] = Object.entries(decisionLabels).map(([choice, label]) => ({
		value: choice,
		code: label,
	}));
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
			montant_titre_importation: '',
			devise_titre_importation: '',
			date_titre_importation: '',
		}));
		try {
			const body = new FormData();
			body.append('file', file);
			const result = await extract({ id, data: body }).unwrap();
			if (sequence !== extractionSequence.current) return;
			await formik.setValues((previous) => ({ ...previous, ...result.fields }));
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
	const sections: ReactNode[] = [];
	if (mode === 'dossier')
		sections.push(
			<FormCard key="dossier" title="Informations du dossier" icon={<Business color="primary" />}>
				<CustomAutoCompleteSelect
					id="fournisseur_record"
					label="Fournisseur enregistré"
					items={suppliers.map((supplier) => ({ value: String(supplier.id), code: supplier.nom }))}
					value={
						suppliers
							.filter((supplier) => String(supplier.id) === formik.values.fournisseur_record)
							.map((supplier) => ({ value: String(supplier.id), code: supplier.nom }))[0] ?? null
					}
					onChange={(_, entry) => {
						void formik.setFieldValue('fournisseur_record', entry?.value ?? '');
						const supplier = suppliers.find((supplier) => String(supplier.id) === entry?.value);
						if (supplier) {
							void formik.setFieldValue('fournisseur', supplier.nom);
							void formik.setFieldValue('fournisseur_email', supplier.email);
						}
					}}
					disabled={disabled}
					fullWidth
					size="small"
					theme={inputTheme}
					startIcon={<Business fontSize="small" />}
					noOptionsText="Aucun fournisseur enregistré"
					helperText="Choisissez un fournisseur du répertoire ou saisissez son nom ci-dessous."
				/>
				{text('fournisseur', 'Fournisseur', <Business fontSize="small" />, true)}
				<CustomAutoCompleteSelect
					id="marque"
					label="Marque"
					items={brands.map((brand) => ({ value: String(brand.id), code: brand.nom }))}
					value={
						brands
							.filter((brand) => String(brand.id) === formik.values.marque)
							.map((brand) => ({ value: String(brand.id), code: brand.nom }))[0] ?? null
					}
					onChange={(_, entry) => {
						void formik.setFieldValue('marque', entry?.value ?? '');
					}}
					onBlur={() => formik.setFieldTouched('marque', true)}
					disabled={disabled}
					fullWidth
					size="small"
					theme={inputTheme}
					startIcon={<Business fontSize="small" />}
					noOptionsText="Aucune marque enregistrée"
				/>
				{text('fournisseur_email', 'E-mail du fournisseur', <Email fontSize="small" />)}
				{autocomplete('responsable', 'Responsable du dossier', responsibleItems, true, <Person fontSize="small" />)}
				{date(
					'date_prevue',
					'Date prévue de fin du dossier',
					false,
					'Facultative ; date à laquelle le dossier doit être terminé.',
				)}
				{date(
					'date_commande_client',
					'Date de commande client',
					false,
					'Facultative ; aucun document client à sélectionner.',
				)}
			</FormCard>,
		);
	if (mode === 'proforma') {
		sections.push(
			<FormCard key="proforma" title="Proforma fournisseur" icon={<Description color="primary" />}>
				{text('numero_proforma_fournisseur', 'N° de proforma fournisseur', <Description fontSize="small" />, true)}
				{date('date_proforma_fournisseur', 'Date de la proforma fournisseur', true)}
				{number('montant_proforma_fournisseur', 'Montant total fournisseur', <Payment fontSize="small" />, 2, true)}
				{select(
					'devise_proforma_fournisseur',
					'Devise de la proforma fournisseur',
					['MAD', 'EUR', 'USD'],
					<Public fontSize="small" />,
					true,
				)}
				{text(
					'incoterm',
					'Incoterm',
					<Description fontSize="small" />,
					true,
					false,
					'Indiqué par le fournisseur, par exemple EXW, FCA ou FOB.',
				)}
				{number('delai_proforma_jours', 'Délai fournisseur (jours)', <CalendarToday fontSize="small" />, 0, true)}
			</FormCard>,
		);
		sections.push(
			<FormCard key="lignes" title="Articles de la proforma fournisseur" icon={<Inventory color="primary" />}>
				{full(
					<Typography variant="body2" color="text.secondary">
						Renseignez les quantités et prix d’achat du document fournisseur.
					</Typography>,
				)}
				{formik.values.lignes.map((line, index) => {
					const selected = line.article
						? { value: String(line.article), code: `${line.article_reference} : ${line.designation}` }
						: null;
					const options: DropDownType[] = (articles ?? [])
						.filter((article) => article.id)
						.map((article) => ({
							value: String(article.id),
							code: `${article.reference ?? ''} : ${article.designation ?? ''}`,
						}));
					if (selected && !options.some((entry) => entry.value === selected.value)) options.unshift(selected);
					return (
						<Box
							key={index}
							sx={{ gridColumn: { md: '1 / -1' }, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
						>
							<Stack spacing={2}>
								<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
									<CustomAutoCompleteSelect
										id={`lignes.${index}.article`}
										label="Article : référence et désignation"
										serverFiltered
										items={options}
										value={selected}
										onInputChange={(_, input, reason) => {
											if (reason === 'input') setSearch(input);
										}}
										onChange={(_, entry) => {
											const article = articles?.find((item) => String(item.id) === entry?.value);
											void formik.setFieldValue(`lignes.${index}`, {
												...line,
												article: article?.id ?? null,
												article_reference: article?.reference ?? '',
												designation: article?.designation ?? '',
											});
										}}
										onBlur={() => formik.setFieldTouched(`lignes.${index}.article`, true)}
										helperText={errorFor(`lignes.${index}.article`)}
										error={!!errorFor(`lignes.${index}.article`)}
										disabled={disabled}
										required
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<Inventory fontSize="small" />}
										noOptionsText={loadingArticles ? 'Recherche en cours…' : 'Aucun article trouvé'}
									/>
									<IconButton
										aria-label={`Retirer l’article ${index + 1}`}
										disabled={disabled}
										onClick={() =>
											formik.setFieldValue(
												'lignes',
												formik.values.lignes.filter((_, position) => position !== index),
											)
										}
									>
										<Delete fontSize="small" />
									</IconButton>
								</Stack>
								<Box sx={grid}>
									{number(`lignes.${index}.quantity`, 'Quantité achetée', <Inventory fontSize="small" />, 3, true)}
									{number(
										`lignes.${index}.prix_achat`,
										`Prix unitaire d’achat (${formik.values.devise_proforma_fournisseur})`,
										<Payment fontSize="small" />,
										2,
										true,
									)}
								</Box>
							</Stack>
						</Box>
					);
				})}
				{full(
					<Typography variant="subtitle2">
						Total des articles :{' '}
						{articlesTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
						{formik.values.devise_proforma_fournisseur}
					</Typography>,
				)}
				{formik.values.lignes.length > 0 &&
					formik.values.lignes.every((line) => line.quantity && line.prix_achat) &&
					Number(formik.values.montant_proforma_fournisseur) > 0 &&
					Math.abs(articlesTotal - Number(formik.values.montant_proforma_fournisseur)) >= 0.01 &&
					full(
						<Alert severity="warning">
							Le total des articles diffère du montant de la proforma fournisseur. Vérifiez les quantités, les prix, les
							remises et les frais du document avant de valider.
						</Alert>,
					)}
				{full(
					<Button
						variant="outlined"
						startIcon={<Add />}
						disabled={disabled}
						onClick={() =>
							formik.setFieldValue('lignes', [
								...formik.values.lignes,
								{
									article: null,
									article_reference: '',
									designation: '',
									quantity: '1',
									prix_achat: '',
									expected_emplacement: null,
								},
							])
						}
					>
						Ajouter un article
					</Button>,
				)}
			</FormCard>,
		);
		sections.push(
			<FormCard key="controle" title="Conditions d’achat et contrôle" icon={<CheckCircle color="primary" />}>
				{full(
					autocomplete(
						'condition_achat',
						'Conditions d’achat',
						PURCHASE_CONDITIONS.map(([choice, label]) => ({ value: choice, code: label })),
						true,
						<Payment fontSize="small" />,
					),
				)}
				{formik.values.condition_achat === 'advance100' &&
					full(
						<Alert severity={Number(formik.values.montant_proforma_fournisseur) >= 18000 ? 'error' : 'info'}>
							Le paiement intégral d’avance est réservé aux montants inférieurs à 18 000{' '}
							{formik.values.devise_proforma_fournisseur}, sans conversion.
						</Alert>,
					)}
				{text('origine_marchandise', 'Origine de la marchandise', <Public fontSize="small" />)}
				{text('nature_marchandise', 'Nature de la marchandise', <Inventory fontSize="small" />)}
				{number('poids_net', 'Poids net (kg)', <Scale fontSize="small" />)}
				{number('poids_brut', 'Poids brut (kg)', <Scale fontSize="small" />)}
				{number('volume', 'Volume (m³)', <Scale fontSize="small" />, 3)}
				{full(
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						{checkbox('ecart_prix_proforma', 'Anomalie de prix')}
						{checkbox('ecart_quantite_proforma', 'Anomalie de quantité')}
						{checkbox('ecart_autre_proforma', 'Autre anomalie')}
					</Stack>,
				)}
				{full(text('notes_ecarts_proforma', 'Détail des anomalies / motif', <Notes fontSize="small" />, false, true))}
				{full(autocomplete('decision', 'Décision', decisionItems, true, <CheckCircle fontSize="small" />))}
			</FormCard>,
		);
	}
	if (mode === 'titre')
		sections.push(
			<FormCard key="titre" title="Informations du titre d’importation" icon={<Description color="primary" />}>
				{full(
					<Typography variant="body2" color="text.secondary">
						Joignez le titre d’importation ci-dessous. Les informations lues sont proposées dans les champs ;
						vérifiez-les avant d’enregistrer.
					</Typography>,
				)}
				{text('numero_domiciliation', 'N° de domiciliation', <Description fontSize="small" />, true)}
				{text('banque', 'Banque', <Business fontSize="small" />, true)}
				{number('montant_titre_importation', 'Montant du titre d’importation', <Payment fontSize="small" />, 2, true)}
				{select(
					'devise_titre_importation',
					'Devise du titre d’importation',
					['MAD', 'EUR', 'USD'],
					<Public fontSize="small" />,
					true,
				)}
				{date('date_titre_importation', 'Date du titre d’importation', true)}
			</FormCard>,
		);
	if (mode === 'production')
		sections.push(
			<FormCard key="production" title="Préparation fournisseur" icon={<LocalShipping color="primary" />}>
				{date('date_expedition_prevue', 'Date d’expédition prévue', true, 'Date annoncée par le fournisseur.')}
				{!order?.production_confirmee_le &&
					checkbox('confirmer_production', 'Le fournisseur a confirmé le début de production')}
				{full(
					text(
						'remarque',
						'Remarque sur le retard',
						<Notes fontSize="small" />,
						false,
						true,
						'Expliquez le retard si la date d’expédition prévue a été dépassée.',
					),
				)}
			</FormCard>,
		);
	if (mode === 'expedition')
		sections.push(
			<FormCard key="expedition" title="Expédition et documents" icon={<LocalShipping color="primary" />}>
				{date('date_expedition_reelle', 'Date réelle d’expédition', true, undefined, !!order?.date_expedition_reelle)}
				{text(
					'transport',
					'Transport',
					<LocalShipping fontSize="small" />,
					false,
					false,
					'Par exemple : maritime, aérien ou routier.',
				)}
				{checkbox('documents_originaux_requis', 'Documents originaux requis')}
				{formik.values.documents_originaux_requis &&
					select('statut_documents_originaux', 'État des documents originaux', [
						'Demandé',
						'Réceptionné',
						'Retourné pour correction',
						'Refusé',
					])}
				{full(text('remarque', 'Remarque sur l’expédition / le retard', <Notes fontSize="small" />, false, true))}
			</FormCard>,
		);
	if (mode === 'transit')
		sections.push(
			<FormCard key="transit" title="Transit et douane" icon={<LocalShipping color="primary" />}>
				{transitAfterReceipt
					? full(
							<Alert severity="info">
								Le dossier reste à l’étape « {order?.statut} ». Vous pouvez compléter les informations de transit et les
								pièces jointes.
							</Alert>,
						)
					: select('statut', 'Phase du dossier', ['Transit', 'Dédouanement'], <LocalShipping fontSize="small" />, true)}
				{date('date_arrivee_maroc', 'Date d’arrivée au Maroc', false, undefined, !!order?.date_arrivee_maroc)}
				{date(
					'documents_remis_banque_le',
					'Documents remis à la banque le',
					false,
					undefined,
					!!order?.documents_remis_banque_le,
				)}
				{number('cout_transport', `Transport (${order?.devise})`, <LocalShipping fontSize="small" />)}
				{number('frais_transit', `Frais de transit (${order?.devise})`, <LocalShipping fontSize="small" />)}
				{number('frais_douane', `Droits de douane (${order?.devise})`)}
				{number('tva', `TVA (${order?.devise})`)}
				{full(text('remarque', 'Remarque', <Notes fontSize="small" />, false, true))}
			</FormCard>,
		);
	if (mode === 'reception')
		sections.push(
			<FormCard key="reception" title="Réception des marchandises" icon={<Inventory color="primary" />}>
				{managedReceipt &&
					full(
						text(
							'reference_reception',
							'Référence de réception',
							<Description fontSize="small" />,
							false,
							false,
							'Référence du bon de réception ou du document reçu, si disponible.',
						),
					)}
				{managedReceipt
					? formik.values.reception_lignes.map((line, index) => (
							<Box key={line.logistics_line} sx={{ gridColumn: { md: '1 / -1' } }}>
								<Stack spacing={2}>
									{text(
										`reception_lignes.${index}.designation`,
										'Article reçu',
										<Inventory fontSize="small" />,
										false,
										false,
										`Référence : ${line.article_reference} · Restant : ${line.remaining_quantity}`,
										true,
									)}
									<Box sx={grid}>
										{number(
											`reception_lignes.${index}.quantity`,
											'Quantité reçue maintenant',
											<Inventory fontSize="small" />,
											3,
										)}
										{autocomplete(
											`reception_lignes.${index}.emplacement`,
											'Emplacement de réception',
											locationItems,
											false,
											<Inventory fontSize="small" />,
										)}
									</Box>
								</Stack>
							</Box>
						))
					: date('date_reelle', 'Date réelle de réception', true)}
				{full(text('note', 'Note de réception', <Notes fontSize="small" />, false, true))}
			</FormCard>,
		);
	if (mode === 'couts')
		sections.push(
			<FormCard key="couts" title="Coûts du dossier" icon={<Payment color="primary" />}>
				{number('cout_transport', `Transport (${order?.devise})`, <LocalShipping fontSize="small" />)}
				{number('frais_transit', `Frais de transit (${order?.devise})`)}
				{number('frais_douane', `Droits de douane (${order?.devise})`)}
				{number('tva', `TVA (${order?.devise})`)}
				{number('livraison_locale', `Livraison locale (${order?.devise})`, <LocalShipping fontSize="small" />)}
				{number('autres_frais', `Autres frais (${order?.devise})`)}
				{full(text('remarque', 'Remarque sur les frais', <Notes fontSize="small" />, false, true))}
			</FormCard>,
		);
	if (['demande_paiement', 'paiement', 'justificatif'].includes(mode))
		sections.push(
			<FormCard key="paiement" title={titles[mode]} icon={<Payment color="primary" />}>
				{full(
					<Alert severity="info">
						{installment
							? `${Number(installment.pourcentage)} % : ${Number(installment.montant_prevu).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${installment.devise} par ${installment.methode_paiement}`
							: 'Échéance introuvable. Retournez au dossier.'}
					</Alert>,
				)}
				{mode === 'demande_paiement' && date('date_echeance', 'Date d’échéance', true)}
				{mode === 'paiement' && (
					<>
						{date('date_paiement', 'Date du paiement effectué', true)}
						{number('montant_paye', `Montant payé (${installment?.devise})`, <Payment fontSize="small" />, 2, true)}
						{text('reference_paiement', 'Référence bancaire', <Description fontSize="small" />)}
						{full(text('commentaire_paiement', 'Commentaire', <Notes fontSize="small" />, false, true))}
					</>
				)}
				{mode === 'justificatif' &&
					full(
						<Typography variant="body2">
							Joignez le justificatif du paiement effectué. Le créateur du dossier sera prévenu après validation.
						</Typography>,
					)}
			</FormCard>,
		);
	if (mode === 'remarque')
		sections.push(
			<FormCard key="remarque" title="Remarque sur le dossier" icon={<Notes color="primary" />}>
				{full(text('remarque', 'Remarque', <Notes fontSize="small" />, true, true))}
			</FormCard>,
		);
	if (mode === 'repertoire')
		sections.push(
			<FormCard key="repertoire" title="Contact fournisseur" icon={<Business color="primary" />}>
				{text('nom', 'Nom du fournisseur', <Business fontSize="small" />, true)}
				{text('email_contact', 'E-mail de contact', <Email fontSize="small" />)}
			</FormCard>,
		);

	const validationEntries = Object.entries(formik.errors).map(([name, entry]) => [
		name,
		typeof entry === 'string' ? entry : 'Vérifiez les informations des lignes.',
	]);
	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
			<Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ pt: 2, justifyContent: 'space-between' }}>
				<Button
					variant="outlined"
					startIcon={<ArrowBack />}
					onClick={() => router.push(listReturnUrl(`${LOGISTIQUE_LIST}?company_id=${company_id}`))}
					sx={{ width: isMobile ? '100%' : 'auto' }}
				>
					Retour à la liste
				</Button>
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
			</Stack>
			{id && (
				<Alert severity="info">
					Dossier {order?.numero_commande} · {order?.fournisseur}
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
					{sections}
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
							buttonText="Enregistrer"
							active={!disabled && (!['demande_paiement', 'paiement', 'justificatif'].includes(mode) || !!installment)}
							loading={formik.isSubmitting}
							onClick={() => {
								setAttempted(true);
							}}
							cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
							type="submit"
							startIcon={<Save />}
						/>
					</Box>
				</Stack>
			</form>
		</Stack>
	);
}
