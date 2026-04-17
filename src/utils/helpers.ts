import axios, { AxiosHeaders } from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { signOut, getSession } from 'next-auth/react';
import { SITE_ROOT } from '@/utils/routes';
import type { APIContentTypeInterface, ApiErrorResponseType, InitStateToken } from '@/types/_initTypes';

/**
 * Handles unauthorized response by clearing cookies, signing out, and resetting token.
 * Dispatches a custom 'session-expired' event to notify the UI.
 */
export const handleUnauthorized = async (onResetToken?: () => void) => {
	// Notify UI about session expiration
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('session-expired'));
	}
	await signOut({ redirect: false, redirectTo: SITE_ROOT });
	if (onResetToken) {
		onResetToken();
	}
};

/**
 * Creates an Axios instance with authentication headers.
 * The getToken callback should read the latest token from Redux state (via api.getState()).
 */
export const isAuthenticatedInstance = (
	getToken?: () => InitStateToken | undefined,
	onUnauthorized?: () => void,
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
		async (config: InternalAxiosRequestConfig) => {
			const headers = new AxiosHeaders(config.headers as Record<string, string>);
			const token = getToken?.();
			let accessToken = token?.access;

			if (!accessToken && typeof window !== 'undefined') {
				const session = await getSession();
				accessToken = session?.accessToken;
			}

			if (accessToken) {
				headers.set('Authorization', `Bearer ${accessToken}`);
			}

			// Let axios auto-set Content-Type (with boundary) for multipart uploads
			if (config.data instanceof FormData) {
				headers.delete('Content-Type');
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
			if (error.response?.data) {
				const errorData = error.response.data as ApiErrorResponseType;

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

				if (error.response.status === 401) {
					// Retry once with a fresh session token before giving up
					if (error.config && !error.config._retried) {
						error.config._retried = true;
						const freshSession = await getSession();
						if (freshSession?.accessToken) {
							error.config.headers['Authorization'] = `Bearer ${freshSession.accessToken}`;
							return instance(error.config);
						}
					}
					await handleUnauthorized(onUnauthorized);
					return Promise.reject({
						error: {
							status_code: 401,
							message: errorData.message || 'Non autorisé',
							details: errorData.details || { error: ['Authentification requise'] },
						},
					});
				}

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

			return Promise.reject({
				error: {
					status_code: 0,
					message: error.message || 'Erreur réseau',
					details: { error: ['Impossible de se connecter au serveur'] },
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
			if (error.response?.data) {
				const errorData = error.response.data as ApiErrorResponseType;
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

			return Promise.reject({
				error: {
					status_code: error.response?.status || 0,
					message: error.message || 'Erreur réseau',
					details: { error: ['Impossible de se connecter au serveur'] },
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
		const errorMsg = Array.isArray(messages) ? messages[0] : messages;

		// Handle combined numero_devis field
		if (field === 'numero_devis' || field === 'numero_facture') {
			setFieldError('numero_part', errorMsg);
			setFieldError('year_part', errorMsg);
		} else if (field === 'error' || field === 'detail') {
			setFieldError('globalError', errorMsg);
		} else {
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

export const formatDate = (value: string | null) => {
	if (!value) return '—'; // display a placeholder for null
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat('fr-FR', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).format(date);
};

export const formatLocalDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

export const formatNumber = (value: string | number | null | undefined): string => {
	if (value === null || value === undefined) return '0,00';
	const num = typeof value === 'string' ? parseFloat(value) : value;
	if (Number.isNaN(num)) return '0,00';
	return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const parseNumber = (value: string | number): number | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	const trimmed = value.trim();
	if (trimmed === '') return null;
	// Replace comma with dot for decimal parsing (supports both "10.5" and "10,5")
	const normalized = trimmed.replace(',', '.');
	// Return null for intermediate typing states (trailing decimal point)
	// This keeps the raw string in the input so user can continue typing decimals
	if (normalized.endsWith('.')) return null;
	const n = Number(normalized);
	return Number.isFinite(n) ? n : null;
};

export const safeParseForInput = (raw: string): number | string => {
	const parsed = parseNumber(raw);
	return parsed === null ? raw : parsed;
};

/**
 * Formats a number with a thousand separators (spaces) for better readability.
 * Example: 50000000.00 → "50 000 000,00"
 * @param value - The value to format (number, string, null, or undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with spaces as a thousand separators (French locale)
 */
export const formatNumberWithSpaces = (
	value: string | number | null | undefined,
	decimals: number = 2
): string => {
	if (value === null || value === undefined || value === '') return '';
	const num = typeof value === 'string' ? parseFloat(value) : value;
	if (Number.isNaN(num)) return '';

	// Use toLocaleString with French locale for space-separated thousands
	return num.toLocaleString('fr-FR', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
		useGrouping: true
	});
};

/**
 * Parses a formatted number string (with spaces as a thousand separators) back to a number.
 * Example: "50 000 000.00" → 50000000.00
 * @param value - The formatted string to parse
 * @returns Parsed number or null if invalid
 */
export const parseFormattedNumber = (value: string | number): number | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	const trimmed = value.trim();
	if (trimmed === '') return null;

	// Remove all spaces (thousand separators)
	let normalized = trimmed.replace(/\s/g, '');
	// Replace comma with dot for decimal parsing
	normalized = normalized.replace(',', '.');

	// Return null for intermediate typing states (trailing decimal point or comma)
	if (normalized.endsWith('.')) return null;

	const n = Number(normalized);
	return Number.isFinite(n) ? n : null;
};

// Consolidated validation helper
export const ValidatePricesHelper = {
	validatePrixVente(prixVente: number, prixAchat: number): string | null {
		if (prixVente < prixAchat) {
			return `Le prix de vente (${formatNumber(prixVente)} MAD) doit être supérieur ou égal au prix d'achat (${formatNumber(prixAchat)} MAD)`;
		}
		return null;
	},

	validateRemise(
		remise: number,
		remiseType: 'Pourcentage' | 'Fixe' | '' | undefined,
		baseAmount: number,
	): string | null {
		if (!Number.isFinite(remise) || remise < 0) {
			return 'La remise doit être positive ou nulle';
		}

		if (remiseType === 'Pourcentage' && remise > 100) {
			return 'La remise en pourcentage doit être entre 0 et 100';
		}

		if (remiseType === 'Fixe' && remise > baseAmount) {
			return `La remise fixe (${formatNumber(remise)} MAD) ne peut pas dépasser le total (${formatNumber(baseAmount)} MAD)`;
		}

		return null;
	},

	validateGlobalRemise(
		remise: number,
		remiseType: 'Pourcentage' | 'Fixe' | '',
		totalHTBeforeGlobal: number,
	): string | null {
		if (!Number.isFinite(remise) || remise < 0) {
			return 'La remise doit être positive ou nulle';
		}

		if (remiseType === 'Pourcentage' && remise > 100) {
			return 'La remise en pourcentage doit être entre 0 et 100';
		}

		if (remiseType === 'Fixe' && remise > totalHTBeforeGlobal) {
			return `La remise fixe globale (${formatNumber(remise)} MAD) ne peut pas dépasser le total HT du devis (${formatNumber(totalHTBeforeGlobal)} MAD)`;
		}

		return null;
	},
};

export const getLabelForKey = (fieldLabels: Record<string, string>, key: string) =>
	fieldLabels[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());

export const getCompanyDocumentLabelForKey = (fieldLabels: Record<string, string>, key: string) => {
	// Handle line errors like: ligne_0_prix_vente or ligne_2_remise
	const lineMatch = key.match(/^ligne_(\d+)_(.+)$/);
	if (lineMatch) {
		const idx = Number(lineMatch[1]);
		const fieldKey = lineMatch[2];
		const baseLabel = fieldLabels[fieldKey] ?? getLabelForKey(fieldLabels, fieldKey);
		return `Ligne ${idx + 1} - ${baseLabel}`;
	}
	// Other known keys (including global_remise)
	if (fieldLabels[key]) return fieldLabels[key];
	// Fallback
	return getLabelForKey(fieldLabels, key);
};

/**
 * Extracts a user-friendly error message from an RTK Query mutation error.
 * When the backend returns structured error details (e.g. ProtectedError / 409),
 * the first detail string is returned. Otherwise returns the fallback message.
 */
export const extractApiErrorMessage = (error: unknown, fallback: string): string => {
	if (
		typeof error === 'object' &&
		error !== null &&
		'data' in error &&
		typeof (error as { data: unknown }).data === 'object' &&
		(error as { data: { details?: Record<string, string[] | string> } }).data !== null
	) {
		const data = (error as { data: { message?: string; details?: Record<string, string[] | string> } }).data;
		const details = data.details;
		if (details) {
			for (const values of Object.values(details)) {
				if (Array.isArray(values) && values.length > 0) {
					return values[0];
				}
				if (typeof values === 'string' && values.length > 0) {
					return values;
				}
			}
		}
		if (data.message) {
			return data.message;
		}
	}
	return fallback;
};
