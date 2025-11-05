import type { NbrEmployeType, CiviliteType } from '@/types/company/companyTypes';

export class UserClass {
	constructor(
		public id: number,
		public first_name: string,
		public last_name: string,
		public gender: string,
		public avatar: string | ArrayBuffer | null,
		public date_joined: string | null,
		public is_superuser: boolean,
		// public group: string,
	) {}
}

export class GroupClass {
	constructor(public group_titles: Array<string> | Array<null>) {}
}

export class CompanyClass {
	constructor(
		public id: number,
		public date_created: string | null,
		public raison_sociale: string | null,
		public email: string | null,
		public logo: string | ArrayBuffer | null,
		public cachet: string | ArrayBuffer | null,
		public nbr_employe: NbrEmployeType,
		public civilite_responsable: CiviliteType,
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
		public managed_by: Array<number> | Array<null>,
	) {}
}
