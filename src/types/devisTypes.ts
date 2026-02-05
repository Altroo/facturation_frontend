export type TypeFactureLivraisonDevisStatus =
	| 'Brouillon'
	| 'Envoyé'
	| 'Accepté'
	| 'Refusé'
	| 'Annulé'
	| 'Expiré'
	| 'Facturé';

export type TypeRemiseType = '' | 'Pourcentage' | 'Fixe';

export type DeviLineSchemaType = {
	id: number;
	article: number;
	article_designation: string | null;
	designation: string | null;
	prix_achat: number;
	devise_prix_achat: string;
	prix_vente: number;
	devise_prix_vente: string;
	quantity: number;
	remise_type: TypeRemiseType;
	remise: number;
};

export interface DeviFactureLineFormValues {
	id?: string | number;
	article: number;
	designation: string;
	prix_achat: number;
	devise_prix_achat: string;
	prix_vente: number;
	devise_prix_vente: string;
	quantity: number;
	remise_type?: TypeRemiseType;
	remise?: number;
}

export type ValidateArticleLinesErrorType = { [key: string]: string };
