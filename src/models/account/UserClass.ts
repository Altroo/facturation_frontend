import { AccountGenderType } from '@/types/account/accountTypes';

export class UserClass {
	constructor(
		public pk: number,
		public first_name: string,
		public last_name: string,
		public gender: AccountGenderType | null,
		public avatar: string | null,
		public date_joined: Date | string | null,
	) {}
}