import { UserClass } from '@/models/Classes';

export interface UserWithCompaniesResponseType extends UserClass {
	companies: Array<{
		id: number;
		raison_sociale: string;
		role: string;
	}>;
}
