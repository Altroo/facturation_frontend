export type TypeDevisStatus = 'Brouillon' | 'Envoyé' | 'Accepté' | 'Refusé' | 'Annulé' | 'Expiré';

export type TypeRemiseType = '' | 'Pourcentage' | 'Fixe';

export type DeviLineSchemaType = {
	id: number;
	article: number;
	article_designation: string | null;
	designation: string | null;
	prix_achat: number;
	prix_vente: number;
	quantity: number;
	remise_type: TypeRemiseType;
	remise: number;
};

export type DeviSchemaType = {
	numero_devis: string;
	client: number;
	date_devis: string;
	numero_demande_prix_client: string | null;
	mode_paiement: number | null;
	remarque: string | null;
	remise_type?: TypeRemiseType;
	remise?: number;
	lignes: Array<DeviLineSchemaType>;
	globalError?: string;
};

export type DeviAddSchemaType = {
	numero_devis: string;
	client: number;
	date_devis: string;
	numero_demande_prix_client: string | null;
	mode_paiement: number | null;
	remarque: string | null;
	globalError?: string;
};
