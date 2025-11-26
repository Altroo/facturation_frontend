import { UserClass } from '@/models/Classes';

export type UserCompaniesType = {
	membership_id: number;
	company_id: number;
	raison_sociale: string;
	role: string;
};

export interface UserWithCompaniesResponseType extends UserClass {
	companies: Array<UserCompaniesType>;
}

export type UsersFormValuesType = {
	first_name: string;
	last_name: string;
	email: string;
	gender: string;
	is_active: boolean;
	is_staff: boolean;
	avatar: string | ArrayBuffer;
	avatar_cropped: string | ArrayBuffer;
	companies: Array<UserCompaniesType>;
	globalError: string;
};
