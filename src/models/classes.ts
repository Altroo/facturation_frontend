import type { NbrEmployeType, CiviliteType, ManagedByType, ManagedByWriteOnlyType } from '@/types/companyTypes';
import type { TypeClientType } from '@/types/clientTypes';
import type { TypeArticleType } from '@/types/articleTypes';
import type { TypeFactureLivraisonDevisStatus, TypeRemiseType } from '@/types/devisTypes';
import type { ReglementStatutType } from '@/types/reglementTypes';

export class UserClass {
	constructor(
		public readonly id: number,
		public first_name: string,
		public last_name: string,
		public email: string,
		public gender: string,
		public avatar: string | ArrayBuffer | null,
		public avatar_cropped: string | ArrayBuffer | null,
		public is_staff: boolean,
		public is_active: boolean,
		public default_password_set: boolean,
		public date_joined: string | null,
		public date_updated: string | null,
		public last_login: string | null,
	) {}
}

export class GroupClass {
	constructor(public group_titles: Array<string> | Array<null>) {}
}

export class CompanyClass {
	constructor(
		public readonly id: number,
		public date_created: string | null,
		public date_updated: string | null,
		public raison_sociale: string,
		public email: string | null,
		public logo: string | ArrayBuffer | null,
		public logo_cropped: string | ArrayBuffer | null,
		public cachet: string | ArrayBuffer | null,
		public cachet_cropped: string | ArrayBuffer | null,
		public nbr_employe: NbrEmployeType | string,
		public civilite_responsable: CiviliteType | string,
		public nom_responsable: string | null,
		public gsm_responsable: string | null,
		public adresse: string | null,
		public telephone: string | null,
		public fax: string | null,
		public site_web: string | null,
		public numero_du_compte: string | null,
		public ICE: string | null,
		public registre_de_commerce: string | null,
		public identifiant_fiscal: string | null,
		public tax_professionnelle: string | null,
		public CNSS: string | null,
		public managed_by: Array<ManagedByWriteOnlyType>,
		public admins: Array<ManagedByType>,
	) {}
}

export class ClientClass {
	constructor(
		public readonly id: number,
		public code_client: string,
		public client_type: TypeClientType | string,
		public company: number,
		public readonly company_name: string | null,
		public adresse: string | null,
		public ville: number | null,
		public readonly ville_name: string | null,
		public tel: string | null,
		public email: string | null,
		public delai_de_paiement: number | null,
		public remarque: string | null,
		public date_created: string | null,
		public date_updated: string | null,
		public archived: boolean,
		public raison_sociale: string | null,
		public numero_du_compte: string | null,
		public ICE: string | null,
		public registre_de_commerce: string | null,
		public identifiant_fiscal: string | null,
		public taxe_professionnelle: string | null,
		public CNSS: string | null,
		public fax: string | null,
		public nom: string | null,
		public prenom: string | null,
	) {}
}

export class ArticleClass {
	constructor(
		public readonly id: number,
		public reference: string,
		public type_article: TypeArticleType,
		public company: number,
		public readonly company_name: string | null,
		public marque: number | null,
		public readonly marque_name: string | null,
		public categorie: number | null,
		public readonly categorie_name: string | null,
		public emplacement: number | null,
		public readonly emplacement_name: string | null,
		public unite: number | null,
		public readonly unite_name: string | null,
		public designation: string | null,
		public photo: string | ArrayBuffer | null,
		public prix_achat: number | null,
		public prix_vente: number | null,
		public tva: number,
		public remarque: string | null,
		public readonly date_created: string,
		public readonly date_updated: string,
		public archived: boolean,
	) {}
}

export class CitiesClass {
	constructor(
		public readonly id: number,
		public nom: string,
	) {}
}

export class MarqueClass {
	constructor(
		public readonly id: number,
		public nom: string,
	) {}
}

export class CategorieClass {
	constructor(
		public readonly id: number,
		public nom: string,
	) {}
}

export class UniteClass {
	constructor(
		public readonly id: number,
		public nom: string,
	) {}
}

export class EmplacementClass {
	constructor(
		public readonly id: number,
		public nom: string,
	) {}
}

export class ModePaiementClass {
	constructor(
		public readonly id: number,
		public nom: string,
	) {}
}

export class LivreParClass {
	constructor(
		public readonly id: number,
		public nom: string,
	) {}
}

export class DeviFactureLivraisonLineClass {
	constructor(
		public readonly id: number,
		public article: number,
		public readonly article_designation: string | null,
		public readonly designation: string | null,
		public prix_achat: number,
		public prix_vente: number,
		public quantity: number,
		public remise_type: TypeRemiseType,
		public remise: number,
	) {}
}

export class DeviClass {
	constructor(
		public readonly id: number,
		public numero_devis: string,
		public client: number | null,
		public readonly client_name: string | null,
		public date_devis: string,
		public numero_demande_prix_client: string | null,
		public mode_paiement: number | null,
		public readonly mode_paiement_name: string | null,
		public remarque: string | null,
		public statut: TypeFactureLivraisonDevisStatus,
		public readonly date_created: string,
		public readonly date_updated: string,
		public readonly created_by_user_id: number,
		public readonly created_by_user_name: string | null,
		public readonly lignes_count: number,
		public remise_type: TypeRemiseType,
		public remise: number,
		public readonly total_ht: number,
		public readonly total_tva: number,
		public readonly total_ttc: number,
		public readonly total_ttc_apres_remise: number,
		public lignes: Array<DeviFactureLivraisonLineClass>,
	) {}
}

export class FactureClass {
	constructor(
		public readonly id: number,
		public numero_facture: string,
		public client: number | null,
		public readonly client_name: string | null,
		public date_facture: string,
		public numero_bon_commande_client: string | null,
		public mode_paiement: number | null,
		public readonly mode_paiement_name: string | null,
		public remarque: string | null,
		public statut: TypeFactureLivraisonDevisStatus,
		public readonly date_created: string,
		public readonly date_updated: string,
		public readonly created_by_user_id: number,
		public readonly created_by_user_name: string | null,
		public readonly lignes_count: number,
		public remise_type: TypeRemiseType,
		public remise: number,
		public readonly total_ht: number,
		public readonly total_tva: number,
		public readonly total_ttc: number,
		public readonly total_ttc_apres_remise: number,
		public lignes: Array<DeviFactureLivraisonLineClass>,
	) {}
}

export class BonDeLivraisonClass {
	constructor(
		public readonly id: number,
		public numero_bon_livraison: string,
		public client: number | null,
		public readonly client_name: string | null,
		public date_bon_livraison: string,
		public numero_bon_commande_client: string | null,
		public livre_par: number | null,
		public readonly livre_par_name: string | null,
		public mode_paiement: number | null,
		public readonly mode_paiement_name: string | null,
		public remarque: string | null,
		public statut: TypeFactureLivraisonDevisStatus,
		public readonly date_created: string,
		public readonly date_updated: string,
		public readonly created_by_user_id: number,
		public readonly created_by_user_name: string | null,
		public readonly lignes_count: number,
		public remise_type: TypeRemiseType,
		public remise: number,
		public readonly total_ht: number,
		public readonly total_tva: number,
		public readonly total_ttc: number,
		public readonly total_ttc_apres_remise: number,
		public lignes: Array<DeviFactureLivraisonLineClass>,
	) {}
}

export class ReglementClass {
	constructor(
		public readonly id: number,
		public facture_client: number,
		public readonly facture_client_numero: string | null,
		public readonly client: number | null,
		public readonly client_name: string | null,
		public mode_reglement: number | null,
		public readonly mode_reglement_name: string | null,
		public libelle: string,
		public montant: number,
		public date_reglement: string,
		public date_echeance: string,
		public statut: ReglementStatutType,
		public readonly date_created: string,
		public readonly date_updated: string,
		// Financial fields (detail/update)
		public readonly montant_facture?: number,
		public readonly total_reglements_facture?: number,
		public readonly reste_a_payer?: number,
	) {}
}
