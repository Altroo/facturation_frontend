import * as types from './index';
import { UserClass, GroupClass } from '@/models/Classes';

export const accountSetProfilAction = (props: UserClass) => {
	return {
		type: types.ACCOUNT_SET_PROFIL,
		data: { ...props },
	};
};

export const accountSetGroupesAction = (props: GroupClass) => {
	return {
		type: types.ACCOUNT_SET_GROUPES,
		data: { ...props },
	};
};

export const accountUpdateProfilAction = (props: Partial<UserClass>) => {
	return {
		type: types.ACCOUNT_PATCH_PROFIL,
		data: { ...props },
	};
};
