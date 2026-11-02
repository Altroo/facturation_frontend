import type { ArticleClass, EmplacementClass, MarqueClass } from '@/models/classes';
import type { DropDownType } from '@/types/accountTypes';
import type { TranslationDictionary } from '@/types/languageTypes';
import type {
	LogistiqueFormProps,
	LogistiqueOrder,
	LogistiquePaymentInstallment,
	LogistiqueResponsibleOption,
	LogistiqueSupplier,
} from '@/types/logistiqueTypes';
import type { FormikProps } from 'formik';
import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';
export type PurchaseFormMode =
	| 'dossier'
	| 'proforma'
	| 'titre'
	| 'production'
	| 'expedition'
	| 'transit'
	| 'reception'
	| 'couts'
	| 'demande_paiement'
	| 'paiement'
	| 'justificatif'
	| 'remarque';

export type PurchaseDecision = 'control' | 'request_correction' | 'validate' | 'reject';

export type PurchaseLineValues = {
	article: number | null;
	article_reference: string;
	designation: string;
	quantity: string;
	prix_achat: string;
	expected_emplacement: number | null;
};

export type PurchaseReceiptLineValues = {
	logistics_line: number;
	article: number;
	article_reference: string;
	designation: string;
	remaining_quantity: string;
	quantity: string;
	emplacement: string;
};

export type PurchaseFormValues = {
	fournisseur_record: string;
	fournisseur: string;
	fournisseur_email: string;
	marque: string;
	responsable: string;
	date_prevue: string;
	date_commande_client: string;
	numero_proforma_fournisseur: string;
	date_proforma_fournisseur: string;
	montant_proforma_fournisseur: string;
	devise_proforma_fournisseur: string;
	condition_achat: string;
	incoterm: string;
	delai_proforma_jours: string;
	origine_marchandise: string;
	nature_marchandise: string;
	poids_net: string;
	poids_brut: string;
	volume: string;
	ecart_prix_proforma: boolean;
	ecart_quantite_proforma: boolean;
	ecart_autre_proforma: boolean;
	notes_ecarts_proforma: string;
	numero_domiciliation: string;
	banque: string;
	montant_titre_importation: string;
	devise_titre_importation: string;
	date_titre_importation: string;
	date_expedition_prevue: string;
	date_expedition_reelle: string;
	date_arrivee_maroc: string;
	documents_remis_banque_le: string;
	date_reelle: string;
	transport: string;
	documents_originaux_requis: boolean;
	statut_documents_originaux: string;
	cout_transport: string;
	frais_transit: string;
	frais_douane: string;
	tva: string;
	livraison_locale: string;
	autres_frais: string;
	remarque: string;
	note: string;
	reference_reception: string;
	echeance_id: string;
	date_echeance: string;
	date_paiement: string;
	methode_paiement: string;
	montant_paye: string;
	reference_paiement: string;
	commentaire_paiement: string;
	lignes: PurchaseLineValues[];
	reception_lignes: PurchaseReceiptLineValues[];
	proforma_fournisseur_file: File | null;
	titre_importation_file: File | null;
	documents_originaux_file: File | null;
	justificatifs_file: File | null;
	swift_file: File | null;
	fichier: File | null;
	decision: PurchaseDecision;
	confirmer_production: boolean;
	statut: string;
};

export type SupplierPurchaseSchemaContext = {
	approvedCorrection?: boolean;
	existingProformaFile?: boolean;
	existingTitleFile?: boolean;
	managedReceipt?: boolean;
	maxPayment?: number;
};

export type SupplierPurchaseFormContentProps = LogistiqueFormProps & {
	token: string;
	mode: PurchaseFormMode;
	order?: LogistiqueOrder;
	echeanceId: number;
	correctionId?: number;
	proposalMode?: boolean;
};

export type SupplierPurchaseFormFieldsProps = {
	attempted: boolean;
	formik: FormikProps<PurchaseFormValues>;
	t: TranslationDictionary;
	disabled: boolean;
	isCorrection: boolean;
	responsibles: LogistiqueResponsibleOption[];
	order: LogistiqueOrder | undefined;
	locations: EmplacementClass[];
	mode: PurchaseFormMode;
	id: number | undefined;
	numberPreview: { numero_commande: string } | undefined;
	numberPreviewError: unknown;
	suppliers: LogistiqueSupplier[];
	filteredBrands: MarqueClass[];
	brands: MarqueClass[];
	articles: Partial<ArticleClass>[];
	setSearch: Dispatch<SetStateAction<string>>;
	addNewArticle: () => Promise<void>;
	loadingArticles: boolean;
	hasAnomaly: boolean;
	transitAfterReceipt: boolean;
	managedReceipt: boolean;
	installment: LogistiquePaymentInstallment | undefined;
};

export type SupplierPurchaseDraftOptions = Pick<
	SupplierPurchaseFormContentProps,
	'company_id' | 'id' | 'token' | 'mode'
> & {
	userId: number | null;
	formik: Pick<FormikProps<PurchaseFormValues>, 'values' | 'setValues'>;
	setApiError: Dispatch<SetStateAction<string>>;
};

export type SupplierPurchaseProformaFieldsProps = Pick<
	SupplierPurchaseFormFieldsProps,
	'formik' | 'articles' | 'setSearch' | 'disabled' | 'addNewArticle' | 'loadingArticles' | 'hasAnomaly'
> & {
	text: (
		name: string,
		label: string,
		icon?: ReactNode,
		required?: boolean,
		multiline?: boolean,
		helper?: string,
		readOnly?: boolean,
	) => ReactElement;
	date: (name: string, label: string, required?: boolean, helper?: string, readOnly?: boolean) => ReactElement;
	number: (name: string, label: string, icon?: ReactNode, decimals?: number, required?: boolean) => ReactElement;
	select: (name: string, label: string, items: string[], icon?: ReactNode, required?: boolean) => ReactElement;
	t: TranslationDictionary;
	errorFor: (name: string) => string | undefined;
	articlesTotal: number;
	autocomplete: (
		name: string,
		label: string,
		items: DropDownType[],
		required?: boolean,
		icon?: ReactNode,
	) => ReactElement;
	checkbox: (name: keyof PurchaseFormValues, label: string) => ReactElement;
	decisionItems: DropDownType[];
};
