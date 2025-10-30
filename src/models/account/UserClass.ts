import { AccountGenderType } from '@/types/account/accountTypes';

export class UserClass {
	constructor(
		public id: number,
		public first_name: string,
		public last_name: string,
		public gender: AccountGenderType,
		public avatar: string | null,
		public date_joined: string | null,
		public is_admin: boolean,
	) {}
}