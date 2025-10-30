import * as types from '../index';
import {UserClass} from "@/models/account/UserClass";

export const accountSetProfilAction = (props: UserClass) => {
  return {
    type: types.ACCOUNT_SET_PROFIL,
    data: {...props}
  };
};

/*** date format YYYY-MM-DD - 2022-12-31 */
export const accountPatchProfilAction = (
  avatar: string | ArrayBuffer | null,
  first_name: string,
  last_name: string,
  gender: string,
) => {
  return {
    type: types.ACCOUNT_PATCH_PROFIL,
    first_name,
    last_name,
    gender,
    avatar,
  };
};