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
	| 'remarque'
	| 'repertoire';

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
	montant_paye: string;
	reference_paiement: string;
	commentaire_paiement: string;
	nom: string;
	email_contact: string;
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
	existingProformaFile?: boolean;
	existingTitleFile?: boolean;
	managedReceipt?: boolean;
	maxPayment?: number;
};
