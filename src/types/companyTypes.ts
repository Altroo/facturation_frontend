export type NbrEmployeType = '' | '1 à 5' | '5 à 10' | '10 à 50' | '50 à 100' | 'plus que 100';
export type CiviliteType = '' | 'Mme' | 'Mlle' | 'M.';

export type ManagedByType = {
	id: number;
	first_name: string | null;
	last_name: string | null;
	role: string | null;
};

export type ManagedByWriteOnlyType = {
	pk: number;
	role: string | null;
};

type ManagedByEntry = {
	pk: number;
	first_name: string | null;
	last_name: string | null;
	role: string | null;
};

export type CompanyFormValuesType = {
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
	logo: string | ArrayBuffer;
	logo_cropped: string | ArrayBuffer;
	cachet: string | ArrayBuffer;
	cachet_cropped: string | ArrayBuffer;
	managed_by: ManagedByEntry[];
};
