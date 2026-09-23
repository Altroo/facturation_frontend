import type { UserClass } from '@/models/classes';
import type { SessionProps } from '@/types/_initTypes';
import type { ReactNode } from 'react';

export type UserCompaniesType = {
	membership_id: number;
	company_id: number;
	raison_sociale: string;
	role: string;
	can_validate_factures?: boolean;
	can_change_document_status?: boolean;
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

export type UsersFormFormikContentProps = {
	token: string | undefined;
	id?: number;
};

export interface UsersFormProps extends SessionProps {
	id?: number;
}

export interface UsersViewInfoRowProps {
	icon: ReactNode;
	label: string;
	value: string | number | null | undefined | ReactNode;
}

export interface UsersViewProps extends SessionProps {
	id: number;
}
