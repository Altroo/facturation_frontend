import {
  APIContentTypeInterface,
  ApiErrorResponseType,
} from '@/types/_init/_initTypes';
import axios, {AxiosInstance, AxiosResponse} from 'axios';


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

type formikAutoErrors = {
  e: unknown;
  setFieldError: (field: string, message: string | undefined) => void;
};

export const setFormikAutoErrors = (props: formikAutoErrors) => {
  const { e, setFieldError } = props;
  const errors = e as ApiErrorResponseType;
  if (errors.error.details) {
    if (errors.error.details.error) {
      // requires globalError field in formik initialValues
      setFieldError('globalError', errors.error.details.error[0]);
    }
    if (typeof errors.error.details === 'object') {
      for (const [key, value] of Object.entries(errors.error.details)) {
        value.map((singleError) => {
          setFieldError(key, singleError);
        });
      }
    }
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
