export type ApiErrorType = {
  status_code: number | null;
  message: string | null;
  details: Record<string, Array<string>> | { error: Array<string> } | null;
};

export type ApiErrorResponseType = {
  error: ApiErrorType;
};

export interface ResponseDataInterface<T> {
  data: T;
  status: number;
}

export type APIContentTypeInterface = 'application/json' | 'application/x-www-form-urlencoded' | 'multipart/form-data';

//!- Init State
export type InitStateToken = {
  user: {
    pk: number | null;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  access: string | null;
  refresh: string | null;
  access_expiration: string | null;
  refresh_expiration: string | null;
};

export interface InitStateInterface<T> {
  initStateToken: T;
}

