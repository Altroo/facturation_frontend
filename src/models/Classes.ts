import type { NbrEmployeType, CiviliteType, ManagedByType, ManagedByWriteOnlyType } from '@/types/companyTypes';
import { client_type } from '@/types/clientTypes';

export class UserClass {
	constructor(
		public id: number,
		public first_name: string,
		public last_name: string,
		public email: string,
		public gender: string,
		public avatar: string | ArrayBuffer | null,
		public avatar_cropped: string | ArrayBuffer | null,
		public is_staff: boolean,
		public is_active: boolean,
		public date_joined: string | null,
		public last_login: string | null,
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
		public id: number,
		public code_client: string,
		public client_type: client_type,
		public company: number,
		public adresse: string | null,
		public ville: number | null,
		public tel: string | null,
		public email: string | null,
		public delai_de_paiement: number | null,
		public remarque: string | null,
		public date_created: string | null,
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
