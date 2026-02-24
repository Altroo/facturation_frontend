import type { ResponseDataInterface, SagaPayloadType, TokenType } from '@/types/_initTypes';
import type { GroupClass, UserClass } from '@/models/classes';

//!- Account State
export interface AccountStateInterface {
	profil: UserClass | Record<string, unknown>;
	groupes: Array<string> | Array<null>;
}

export type InitStateTokenNextAuth = {
	user: {
		pk: number;
		email: string;
		first_name: string;
		last_name: string;
	};
	access: string;
	refresh: string;
	access_expiration: string;
	refresh_expiration: string;
};

export type AccountPostLoginResponseType = ResponseDataInterface<InitStateTokenNextAuth>;

export type AccountGenderCodeValueType = {
	code: 'H' | 'F';
	value: 'Homme' | 'Femme';
};

export type DropDownType = {
	code: string;
	value: string;
	archived?: boolean;
};

export type setProfilPayloadType = SagaPayloadType<UserClass>;
export type setGroupesPayloadType = SagaPayloadType<GroupClass>;

export interface EditProfilResponse extends TokenType {
	data: Partial<UserClass>;
}

export interface PasswordResetResponse extends TokenType {
	data: {
		old_password: string;
		new_password: string;
		new_password2: string;
	};
}
