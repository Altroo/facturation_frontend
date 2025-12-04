export type TypeDevisStatus = 'Brouillon' | 'Envoyé' | 'Accepté' | 'Refusé' | 'Annulé' | 'Expiré';

export type TypeRemiseType = 'Pourcentage' | 'Fixe';

export type DeviLineSchemaType = {
	article: number;
	prix_achat: number;
	prix_vente: number;
	quantity: number;
	pourcentage_remise: number;
};

export type DeviSchemaType = {
	numero_devis: string;
	client: number;
	date_devis: string;
	numero_demande_prix_client: string | null;
	mode_paiement: number;
	remarque: string | null;
	lignes: Array<DeviLineSchemaType>;
	globalError?: string;
};
