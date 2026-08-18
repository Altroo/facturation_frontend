import type { PaginationResponseType } from '@/types/_initTypes';

export type LogistiqueStatut =
	| 'Brouillon'
	| 'À lancer'
	| 'En cours'
	| 'En attente externe'
	| 'Bloqué'
	| 'En retard'
	| 'À clôturer'
	| 'Clôturé'
	| 'Annulé'
	| 'Rouvert';

export type LogistiqueLegacyStatut =
	| 'Réception commande'
	| 'Commande fournisseur'
	| 'Proforma'
	| "Titre d'Importation"
	| 'Validation'
	| 'Paiement demandé'
	| 'Paiement effectué'
	| 'SWIFT / Draft LC'
	| 'Envoi SWIFT / Draft LC'
	| 'Production'
	| 'Expédition'
	| 'Documents originaux'
	| 'Transit'
	| 'Dédouanement'
	| 'Réception locale'
	| 'Livraison client'
	| 'Clôture'
	| 'Annulé';

export type LogistiqueLaunchStatus = 'À lancer' | 'En cours' | 'En attente proforma' | 'Bloquée' | 'Terminée';
export type LogistiqueProformaStatus = 'En attente' | 'En contrôle' | 'Correction demandée' | 'Validée' | 'Refusée';
export type LogistiqueSupplierProformaReviewAction = 'control' | 'request_correction' | 'validate' | 'reject';

export type LogistiquePaymentStatus = 'Non demandé' | 'En attente' | 'Validé';
export type LogistiqueEmailDeliveryStatus =
	'Non demandé' | 'Historique non vérifié' | 'En attente' | 'Envoi en cours' | 'Envoyé' | 'Échec';
export type LogistiqueImportTitleStatus = 'À préparer' | "Titre d'import validé – En attente de paiement";
export type LogistiqueBankPaymentStatus =
	'À préparer' | 'En validation' | 'Banque en cours' | 'Exécuté' | 'Confirmé' | 'Partiel' | 'Bloqué';
export type LogistiqueAccountingPaymentStatus =
	'Paiement à traiter' | 'Paiement en cours' | 'Paiement effectué – Justificatif à joindre' | 'Paiement validé';
export type LogistiquePaymentMethod = '' | 'LC' | 'Virement' | 'Remise documentaire';
export type LogistiqueDocumentField =
	| 'titre_importation_file'
	| 'proforma_fournisseur_file'
	| 'justificatifs_file'
	| 'swift_file'
	| 'documents_originaux_file';

export type LogistiqueLine = {
	id: number;
	proforma: number;
	proforma_numero: string;
	client: number;
	client_name: string | null;
	article: number;
	article_reference: string;
	designation: string;
	marque_name: string;
	project_reference: string;
	quantity: number | string;
	prix_achat: number | string;
	devise_prix_achat: string;
	prix_vente: number | string;
	devise_prix_vente: string;
	total_achat: number | string;
};

export type LogistiqueEvent = {
	id: number;
	action: string;
	old_value: string;
	new_value: string;
	note: string;
	user: number | null;
	user_name: string | null;
	date_created: string;
};

export type LogistiqueProformaDetail = {
	id: number;
	numero_facture: string;
	client_name: string | null;
	fournisseur: string;
	fournisseur_email: string;
	project_reference: string;
	date_facture: string;
	total_ttc_apres_remise: number | string;
	devise: string;
};

export type LogistiquePaymentInstallment = {
	id: number;
	date_echeance: string;
	montant_prevu: number | string;
	devise: string;
	statut_traitement: LogistiqueAccountingPaymentStatus;
	date_paiement: string | null;
	montant_paye: number | string;
	banque: string;
	reference_bancaire: string;
	methode_paiement: LogistiquePaymentMethod;
	commentaire: string;
	justificatif_file: string | null;
	execution_enregistree_le: string | null;
	execution_enregistree_par: number | null;
	execution_enregistree_par_name: string | null;
	paiement_valide_le: string | null;
	paiement_valide_par: number | null;
	paiement_valide_par_name: string | null;
	preuve_email_statut: LogistiqueEmailDeliveryStatus;
	preuve_email_destinataire: string;
	preuve_email_erreur: string;
	preuve_email_tentatives: number;
	preuve_email_relance_disponible: boolean;
	preuve_email_demandee_par: number | null;
	preuve_envoyee_fournisseur_le: string | null;
	reception_confirmee_le: string | null;
	reception_confirmee_par: number | null;
	reception_confirmee_par_name: string | null;
};

export type LogistiqueOrder = {
	id: number;
	company: number;
	numero_commande: string;
	fournisseur: string;
	fournisseur_email: string;
	marque: number | null;
	marque_name: string | null;
	devise: string;
	incoterm: string;
	transport: string;
	conditions_paiement: string;
	responsable: number | null;
	responsable_name: string | null;
	date_prevue: string | null;
	date_reelle: string | null;
	statut: LogistiqueLegacyStatut;
	statut_global: LogistiqueStatut;
	statut_commande_lancement: LogistiqueLaunchStatus;
	proforma_demandee_le: string | null;
	proforma_demandee_par: number | null;
	proforma_demandee_par_name: string | null;
	prochaine_relance_proforma: string | null;
	is_launch_step_complete: boolean;
	statut_proforma_conformite: LogistiqueProformaStatus;
	numero_proforma_fournisseur: string;
	date_proforma_fournisseur: string | null;
	montant_proforma_fournisseur: number | string;
	devise_proforma_fournisseur: string;
	delai_proforma_jours: number | null;
	ecart_prix_proforma: boolean;
	ecart_quantite_proforma: boolean;
	notes_ecarts_proforma: string;
	proforma_controlee_le: string | null;
	proforma_controlee_par: number | null;
	proforma_controlee_par_name: string | null;
	proforma_validee_le: string | null;
	proforma_validee_par: number | null;
	proforma_validee_par_name: string | null;
	is_proforma_step_complete: boolean;
	poids_net: number | string;
	poids_brut: number | string;
	volume: number | string;
	origine_marchandise: string;
	nature_marchandise: string;
	numero_domiciliation: string;
	banque: string;
	montant_titre_importation: number | string;
	devise_titre_importation: string;
	date_titre_importation: string | null;
	date_validation_titre_importation: string | null;
	statut_titre_importation: LogistiqueImportTitleStatus;
	methode_paiement: LogistiquePaymentMethod;
	statut_paiement: LogistiquePaymentStatus;
	statut_banque_paiement: LogistiqueBankPaymentStatus;
	statut_traitement_paiement: LogistiqueAccountingPaymentStatus;
	paiement_assigne_a: number | null;
	paiement_assigne_a_name: string | null;
	demande_paiement_envoyee_le: string | null;
	demande_paiement_envoyee_par: number | null;
	demande_paiement_envoyee_par_name: string | null;
	demande_paiement_email_statut: LogistiqueEmailDeliveryStatus;
	demande_paiement_email_destinataires: string[];
	demande_paiement_email_erreur: string;
	demande_paiement_email_tentatives: number;
	demande_paiement_email_relance_disponible: boolean;
	paiement_valide_le: string | null;
	paiement_valide_par: number | null;
	paiement_valide_par_name: string | null;
	date_paiement: string | null;
	montant_paiement: number | string;
	devise_paiement: string;
	banque_paiement: string;
	reference_paiement: string;
	commentaire_paiement: string;
	date_upload_swift: string | null;
	swift_envoye_fournisseur_le: string | null;
	paiement_confirme_reception_le: string | null;
	paiement_confirme_reception_par: number | null;
	solde_restant: number | string;
	cout_achat: number | string;
	cout_transport: number | string;
	frais_transit: number | string;
	frais_douane: number | string;
	tva: number | string;
	livraison_locale: number | string;
	autres_frais: number | string;
	cout_total: number | string;
	titre_importation_file: string | null;
	proforma_fournisseur_file: string | null;
	justificatifs_file: string | null;
	swift_file: string | null;
	documents_originaux_file: string | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
	proformas_count: number;
	lignes_count: number;
	clients_display: string;
	projects_display: string;
	alerts: string[];
	lignes?: LogistiqueLine[];
	events?: LogistiqueEvent[];
	proformas_detail?: LogistiqueProformaDetail[];
	echeancier_paiement?: LogistiquePaymentInstallment[];
};

export type LogistiqueStats = {
	commandes_en_cours: number;
	total_commandes: number;
	retards: number;
	paiements_en_attente: number;
	livraisons: number;
	couts_logistiques: number | string;
	swift_manquant: number;
	documents_non_recus: number;
	transit_non_lance: number;
	kpi_fournisseurs: Array<{
		fournisseur: string;
		total_commandes: number;
		cout_total: number | string;
	}>;
	fournisseurs: Array<{
		fournisseur: string;
	}>;
	kpi_marques: Array<{
		marque: number;
		marque__nom: string;
		total_commandes: number;
		cout_total: number | string;
	}>;
	marques: Array<{
		id: number;
		nom: string;
	}>;
	statuts_workflow: Array<{
		statut: LogistiqueStatut;
		total: number;
	}>;
	statuts_paiement: Array<{
		statut_paiement: LogistiquePaymentStatus;
		total: number;
	}>;
	couts_detail: {
		achat: number | string;
		transport: number | string;
		transit: number | string;
		douane: number | string;
		tva: number | string;
		livraison_locale: number | string;
		autres: number | string;
		total: number | string;
	};
	monthly_flow: Array<{
		month: string;
		commandes: number;
		livraisons: number;
		paiements: number;
		cout_total: number | string;
	}>;
};

export type LogistiqueListResponse = PaginationResponseType<LogistiqueOrder> & {
	stats: LogistiqueStats;
};

export type LogistiqueCreateResponse = {
	created: number;
	orders: LogistiqueOrder[];
};

export type LogistiqueResponsibleOption = {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	role: string;
	label: string;
};

export type LogistiqueSourcePreviewProforma = {
	id: number;
	numero_facture: string;
	source_devis: number | null;
	source_devis_numero: string;
	client_name: string;
	fournisseur: string;
	fournisseur_email: string;
	project_reference: string;
	date_facture: string;
	total_ttc_apres_remise: number | string;
	devise: string;
	articles_count: number;
	total_quantity: number | string;
	total_achat: number | string;
};

export type LogistiqueSourcePreview = {
	proformas: LogistiqueSourcePreviewProforma[];
};

export type LogistiqueFormValues = {
	proformas: number[];
	fournisseur: string;
	devise: string;
	incoterm: string;
	transport: string;
	conditions_paiement: string;
	responsable: string;
	date_prevue: string;
	date_reelle: string;
	statut: LogistiqueLegacyStatut;
	poids_net: string;
	poids_brut: string;
	volume: string;
	origine_marchandise: string;
	nature_marchandise: string;
	numero_domiciliation: string;
	banque: string;
	montant_titre_importation: string;
	devise_titre_importation: string;
	date_titre_importation: string;
	date_validation_titre_importation: string;
	statut_titre_importation: LogistiqueImportTitleStatus;
	methode_paiement: LogistiquePaymentMethod;
	date_paiement: string;
	montant_paiement: string;
	devise_paiement: string;
	banque_paiement: string;
	reference_paiement: string;
	commentaire_paiement: string;
	cout_transport: string;
	frais_transit: string;
	frais_douane: string;
	tva: string;
	livraison_locale: string;
	autres_frais: string;
	titre_importation_file: File | null;
	proforma_fournisseur_file: File | null;
	justificatifs_file: File | null;
	swift_file: File | null;
	documents_originaux_file: File | null;
};
