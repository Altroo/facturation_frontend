import axios, { AxiosHeaders, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { signOut } from 'next-auth/react';
import { store } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import { SITE_ROOT } from '@/utils/routes';
import type { APIContentTypeInterface, ApiErrorResponseType, InitStateToken } from '@/types/_initTypes';

/**
 * Handles unauthorized response by clearing cookies, signing out, and resetting token.
 */
const handleUnauthorized = async () => {
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

	// Request interceptor - add auth token
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

	// Response interceptor - handle errors
	instance.interceptors.response.use(
		(response: AxiosResponse) => response,
		async (error) => {
			// Handle responses with error data
			if (error.response?.data) {
				const errorData = error.response.data as ApiErrorResponseType;

				// Handle server errors (500+)
				if (error.response.status >= 500) {
					return Promise.reject({
						error: {
							status_code: error.response.status,
							message: 'Erreur serveur.',
							details: {
								error: [
									'Il semble que nous ne puissions pas nous connecter. Veuillez vérifier votre connexion réseau et réessayer.',
								],
							},
						},
					});
				}

				// Handle unauthorized (401)
				if (error.response.status === 401) {
					// Assuming handleUnauthorized is defined elsewhere
					await handleUnauthorized();

					return Promise.reject({
						error: {
							status_code: 401,
							message: errorData.message || 'Non autorisé',
							details: errorData.details || { error: ['Authentification requise'] },
						},
					});
				}

				// Handle all other error responses (400, 403, 404, etc.)
				// Django always returns a single error object
				if (errorData.status_code !== undefined && errorData.message !== undefined) {
					return Promise.reject({
						error: {
							status_code: errorData.status_code,
							message: errorData.message,
							details: errorData.details || {},
						},
					});
				}
			}

			// Handle network errors (no response)
			return Promise.reject({
				error: {
					status_code: 0,
					message: error.message || 'Erreur réseau',
					details: {
						error: ['Impossible de se connecter au serveur'],
					},
				},
			});
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
			// Handle response errors
			if (error.response?.data) {
				const errorData = error.response.data as ApiErrorResponseType;

				// Django always returns a single error object with this structure
				if (errorData.status_code !== undefined && errorData.message !== undefined) {
					return Promise.reject({
						error: {
							status_code: errorData.status_code,
							message: errorData.message,
							details: errorData.details || {},
						},
					});
				}
			}

			// Handle network errors or malformed responses
			return Promise.reject({
				error: {
					status_code: error.response?.status || 0,
					message: error.message || 'Erreur réseau',
					details: {
						error: ['Impossible de se connecter au serveur'],
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

	for (const [field, messages] of Object.entries(payload.details)) {
		if (field === 'error') {
			// Handle global errors
			const errorMsg = Array.isArray(messages) ? messages[0] : messages;
			setFieldError('globalError', errorMsg);
		} else if (field === 'detail') {
			// Handle DRF 'detail' errors as global errors
			const errorMsg = Array.isArray(messages) ? messages[0] : messages;
			setFieldError('globalError', errorMsg);
		} else {
			// Handle field-specific errors
			if (Array.isArray(messages)) {
				messages.forEach((msg) => setFieldError(field, msg));
			} else {
				setFieldError(field, messages);
			}
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
