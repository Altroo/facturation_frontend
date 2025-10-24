import {
  ResponseDataInterface,
} from '../_init/_initTypes';


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

