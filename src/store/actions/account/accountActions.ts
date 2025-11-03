import * as types from '../index';
import {UserClass} from "@/models/account/UserClass";

export const accountSetProfilAction = (props: UserClass) => {
  return {
    type: types.ACCOUNT_SET_PROFIL,
    data: {...props}
  };
};

export const accountUpdateProfilAction = (props: Partial<UserClass>) => {
  return {
    type: types.ACCOUNT_PATCH_PROFIL,
    data: {...props}
  };
}
