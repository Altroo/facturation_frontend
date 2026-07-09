import type { PaginationResponseType } from '@/types/_initTypes';

export type LogistiqueStatut =
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

export type LogistiquePaymentStatus = 'Non demandé' | 'En attente' | 'Validé' | 'Rejeté';
export type LogistiqueImportTitleStatus = 'À ouvrir' | 'Déposé' | 'En attente' | 'Validé' | 'Refusé' | 'Expiré' | 'Clôturé';
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
	project_reference: string;
	date_facture: string;
	total_ttc_apres_remise: number | string;
	devise: string;
};

export type LogistiqueOrder = {
	id: number;
	company: number;
	numero_commande: string;
	fournisseur: string;
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
	statut: LogistiqueStatut;
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
	demande_paiement_envoyee_le: string | null;
	demande_paiement_envoyee_par: number | null;
	demande_paiement_envoyee_par_name: string | null;
	paiement_valide_le: string | null;
	paiement_valide_par: number | null;
	paiement_valide_par_name: string | null;
	date_paiement: string | null;
	montant_paiement: number | string;
	reference_paiement: string;
	date_upload_swift: string | null;
	swift_envoye_fournisseur_le: string | null;
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

export type LogistiqueBrandDetailFormValue = {
	marque: number;
	date_prevue: string;
	date_reelle: string;
	origine_marchandise: string;
	nature_marchandise: string;
};

export type LogistiqueSourcePreviewBrand = {
	marque: number;
	marque_name: string;
	devise: string;
	proforma_ids: number[];
	proforma_numbers: string[];
	source_devis_numbers: string[];
	client_names: string[];
	project_references: string[];
	articles_count: number;
	total_quantity: number | string;
	total_achat: number | string;
};

export type LogistiqueSourcePreviewProforma = {
	id: number;
	numero_facture: string;
	source_devis: number | null;
	source_devis_numero: string;
	client_name: string;
	project_reference: string;
	date_facture: string;
	total_ttc_apres_remise: number | string;
	devise: string;
};

export type LogistiqueSourcePreview = {
	proformas: LogistiqueSourcePreviewProforma[];
	brands: LogistiqueSourcePreviewBrand[];
};

export type LogistiqueFormValues = {
	proformas: number[];
	brand_details: LogistiqueBrandDetailFormValue[];
	fournisseur: string;
	devise: string;
	incoterm: string;
	transport: string;
	conditions_paiement: string;
	responsable: string;
	date_prevue: string;
	date_reelle: string;
	statut: LogistiqueStatut;
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
	reference_paiement: string;
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
