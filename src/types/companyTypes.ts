export type NbrEmployeType = '' | '1 à 5' | '5 à 10' | '10 à 50' | '50 à 100' | 'plus que 100';
export type CiviliteType = '' | 'Mme' | 'Mlle' | 'M.';

export type managedByType = Array<{
	id: number;
	first_name: string | null;
	last_name: string | null;
	role: string | null;
}>;

export type ManagedByWriteOnlyType = Array<{
	pk: number;
	role: string | null;
}>;

type ManagedByEntry = {
	pk: number;
	role: string;
};

export type CompanyFormValues = {
	raison_sociale: string;
	email: string;
	nbr_employe: string;
	civilite_responsable: string;
	nom_responsable: string;
	gsm_responsable: string;
	adresse: string;
	telephone: string;
	fax: string;
	site_web: string;
	numero_du_compte: string;
	ICE: string;
	registre_de_commerce: string;
	identifiant_fiscal: string;
	tax_professionnelle: string;
	CNSS: string;
	logo: string;
	logo_cropped: string;
	cachet: string;
	cachet_cropped: string;
	managed_by: ManagedByEntry[];
};
