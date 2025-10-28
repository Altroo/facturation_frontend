import {
  ResponseDataInterface,
} from '../_init/_initTypes';
import {UserClass} from "@/models/account/UserClass";

//!- Account State
export interface AccountStateInterface {
  profil: UserClass | Record<string, unknown>;
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

export type AccountGenderType = 'H' | 'F';

export type AccountGetProfilResponseType = ResponseDataInterface<UserClass>;

export type AccountPatchProfilResponseType = AccountGetProfilResponseType;

export interface AccountPatchProfilType {
  type: string;
  avatar: string | ArrayBuffer | null;
  first_name: string;
  last_name: string;
  gender: string;
}
