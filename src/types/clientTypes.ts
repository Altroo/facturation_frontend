export type client_type = 'PM' | 'PP';

export type ClientSchemaType = {
	client_type: 'PM' | 'PP';
	code_client: string;
	company: number;
	raison_sociale?: string;
	nom?: string;
	prenom?: string;
	adresse?: string | null;
	ville?: number | null;
	tel?: string | null;
	email?: string | null;
	delai_de_paiement?: number | null;
	remarque?: string | null;
	numero_du_compte?: string | null;
	ICE?: string | null;
	registre_de_commerce?: string | null;
	identifiant_fiscal?: string | null;
	taxe_professionnelle?: string | null;
	CNSS?: string | null;
	globalError?: string;
};
