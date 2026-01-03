export type ReglementStatutType = 'Valide' | 'Annulé';

export type ReglementSchemaType = {
	facture_client: number;
	mode_reglement: number | null;
	libelle?: string;
	montant: number;
	date_reglement: string;
	date_echeance: string;
	globalError?: string;
};

export type ReglementListResponseType = {
	count: number;
	next: string | null;
	previous: string | null;
	results: Array<{
		id: number;
		facture_client: number;
		facture_client_numero: string;
		client: number;
		client_name: string;
		mode_reglement: number | null;
		mode_reglement_name: string | null;
		libelle: string;
		montant: string;
		date_reglement: string;
		date_echeance: string;
		statut: ReglementStatutType;
		date_created: string;
		date_updated: string;
	}>;
	chiffre_affaire_total: string;
	total_reglements: string;
	total_impayes: string;
};
