import axios, { AxiosHeaders, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { signOut } from 'next-auth/react';
import { store } from '@/store/store';
import { initToken } from '@/store/slices/_init/_initSlice';
import { cookiesDeleter } from '@/store/services/_init/_initAPI';
import { SITE_ROOT } from '@/utils/routes';
import { APIContentTypeInterface, ApiErrorResponseType, InitStateToken } from '@/types/_init/_initTypes';

/**
 * Handles unauthorized response by clearing cookies, signing out, and resetting token.
 */
const handleUnauthorized = async () => {
	await cookiesDeleter('/cookies', {
		pass_updated: true,
		new_email: true,
		code: true,
	});
	await signOut({ redirect: false, callbackUrl: SITE_ROOT });
	store.dispatch(initToken());
};

/**
 * Creates an Axios instance with authentication headers.
 */
export const isAuthenticatedInstance = (
	getToken?: () => InitStateToken | undefined,
	contentType: APIContentTypeInterface = 'application/json',
): AxiosInstance => {
	const instance = axios.create({
		baseURL: process.env.NEXT_PUBLIC_ROOT_API_URL,
		headers: {
			'Content-Type': contentType,
		},
	});

	instance.interceptors.request.use(
		(config: InternalAxiosRequestConfig) => {
			const headers = new AxiosHeaders(config.headers as Record<string, string>);
			const token = getToken?.();
			if (token?.access) {
				headers.set('Authorization', `Bearer ${token.access}`);
			}
			config.headers = headers as InternalAxiosRequestConfig['headers'];
			return config;
		},
		(error) => Promise.reject(error),
	);

	instance.interceptors.response.use(
		(response: AxiosResponse) => response,
		async (error) => {
			if (error?.response) {
				if (error.response.status >= 500) {
					return Promise.reject({
						error: {
							status_code: 502,
							message: 'Server error.',
							details: {
								error: ['It looks like we are unable to connect. Please check your network connection and try again.'],
							},
						},
					});
				}

				if (error.response.status === 401) {
					await handleUnauthorized();
				}

				return Promise.reject({
					error: error.response.data?.error as ApiErrorResponseType,
				});
			}

			return Promise.reject(error);
		},
	);

	return instance;
};

/**
 * Creates an Axios instance without authentication.
 */
export const allowAnyInstance = (contentType: APIContentTypeInterface = 'application/json'): AxiosInstance => {
	const instance = axios.create({
		baseURL: process.env.NEXT_PUBLIC_ROOT_API_URL,
		headers: {
			'Content-Type': contentType,
		},
	});

	instance.interceptors.response.use(
		(response: AxiosResponse) => response,
		(error) => {
			if (error.response?.data) {
				const errorData = error.response.data[0] || error.response.data;
				return Promise.reject({
					error: {
						status_code: errorData.status_code,
						message: errorData.message,
						details: errorData.details,
					},
				});
			}

			return Promise.reject({
				error: {
					status_code: 500,
					message: 'Network error',
					details: {
						error: ['Unable to connect to the server'],
					},
				},
			});
		},
	);

	return instance;
};

type FormikAutoErrorsProps = {
	e: unknown;
	setFieldError: (field: string, message: string | undefined) => void;
};

/**
 * Automatically maps API error responses to Formik field errors.
 */
export const setFormikAutoErrors = ({ e, setFieldError }: FormikAutoErrorsProps) => {
	const payload =
		(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).error ??
		(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).data ??
		(e as ApiErrorResponseType);

	if (!payload?.details) return;

	if (payload.details.error?.length) {
		setFieldError('globalError', payload.details.error[0]);
	}

	for (const [field, messages] of Object.entries(payload.details)) {
		if (field === 'error') continue;
		if (Array.isArray(messages)) {
			messages.forEach((msg) => setFieldError(field, msg));
		}
	}
};

/**
 * Converts hex color to RGB or RGBA string.
 */
export const hexToRGB = (hex: string, alpha?: number): string => {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);

	return alpha !== undefined ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
};
