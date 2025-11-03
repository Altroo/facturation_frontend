import {
  ResponseDataInterface, SagaPayloadType, TokenType,
} from '@/types/_init/_initTypes';
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

export type AccountGenderCodeValueType = {
  code: 'H' | 'F';
  value: 'Homme' | 'Femme';
};

export type setProfilPayloadType = SagaPayloadType<UserClass>;



export interface UpdateProfilResponse extends TokenType {
  data: Partial<UserClass>
}

export interface PasswordResetResponse extends TokenType {
  data: {
    old_password: string,
    new_password: string,
    new_password2: string,
  }
}

