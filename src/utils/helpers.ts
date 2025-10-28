import {
  APIContentTypeInterface,
  ApiErrorResponseType, InitStateToken, NormalizedError,
} from '@/types/_init/_initTypes';
import {initToken} from '@/store/slices/_init/_initSlice';
import axios, {AxiosInstance, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {SITE_ROOT} from "@/utils/routes";
import {bulkCookiesDeleter} from "@/store/services/_init/_initAPI";
import {signOut} from 'next-auth/react';
import {store} from '@/store/store';

export const isAuthenticatedInstance = (
  initStateToken: InitStateToken,
  contentType: APIContentTypeInterface = 'application/json',
) => {
  const instance: AxiosInstance = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_ROOT_API_URL}`,
    headers: {
      'Content-Type': contentType,
    },
    // withCredentials: true
  });
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      /* initStateToken might be using the old access_token. */
      // load new access token from storage instead.
      config.headers.set({
        Authorization: 'Bearer ' + initStateToken.access
      });
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Any status code with range of 2xx
      return response;
    },
    async (error) => {
      if (error.response) {
        // access token expired
        if (error.response.status >= 500) {
          const errorObj = {
            error: {
              status_code: 502,
              message: 'Server error.',
              details: {
                error: ['It looks like we are unable to connect. Please check your network connection and try again.'],
              },
            },
          };
          return Promise.reject(errorObj);
        }
        if (error.response.status === 401) {
          await bulkCookiesDeleter('/cookie/delete');
          await signOut({redirect: false, callbackUrl: SITE_ROOT});
          store.dispatch(initToken());
        }
        const errorObj = {
          error: error.response.data.error as ApiErrorResponseType, // for custom api errors
        };
        return Promise.reject(errorObj);
      }
      return Promise.reject(error);
    },
  );
  return instance;
};

export const allowAnyInstance = (contentType: APIContentTypeInterface = 'application/json') => {
  const instance: AxiosInstance = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_ROOT_API_URL}`,
    headers: {
      'Content-Type': contentType,
    },
  });

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error) => {
      // Directly use the error response data if it matches the backend structure
      if (error.response && error.response.data) {
        const errorData = error.response.data[0] || error.response.data;

        return Promise.reject({
          error: {
            status_code: errorData.status_code,
            message: errorData.message,
            details: errorData.details
          }
        });
      }
      // Fallback for network or other errors
      return Promise.reject({
        error: {
          status_code: 500,
          message: 'Network error',
          details: {
            error: ['Unable to connect to the server']
          }
        }
      });
    },
  );

  return instance;
};

type FormikAutoErrorsProps = {
  e: NormalizedError;
  setFieldError: (field: string, message: string | undefined) => void;
};


export const setFormikAutoErrors = ({ e, setFieldError }: FormikAutoErrorsProps) => {
  const { details, message } = e.data;

  if (details) {
    for (const [field, messages] of Object.entries(details)) {
      if (Array.isArray(messages) && messages.length > 0) {
        setFieldError(field, messages[0]);
      }
    }
  }

  if ((!details || Object.keys(details).length === 0) && message) {
    setFieldError("globalError", message);
  }
};




// convert hex color to rgba
export const hexToRGB = (hex: string, alpha: number) => {
  const r: number = parseInt(hex.slice(1, 3), 16),
    g: number = parseInt(hex.slice(3, 5), 16),
    b: number = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  } else {
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }
};
