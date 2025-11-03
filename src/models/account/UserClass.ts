export class UserClass {
	constructor(
		public id: number,
		public first_name: string,
		public last_name: string,
		public gender: string,
		public avatar: string | ArrayBuffer | null,
		public date_joined: string | null,
		public is_staff: boolean,
		public is_superuser: boolean,
	) {}
}