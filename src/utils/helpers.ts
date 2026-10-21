import { aiWritingFields, NECTAR_RAISON_SOCIALE } from '@/utils/rawData';
import type { ListScope } from '@/types/routeTypes';
import type { SalePriceBasis } from '@/types/articleTypes';
import type { ChatMessage, NavigationTarget } from '@/types/chatAiTypes';

import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosHeaders } from 'axios';
import { getSession, signOut } from 'next-auth/react';
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
	getToken?: () => Pick<InitStateToken, 'access'> | undefined,
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
		async (config: InternalAxiosRequestConfig & { _retried?: boolean }) => {
			const headers = new AxiosHeaders(config.headers as Record<string, string>);
			const token = getToken?.();
			let accessToken = token?.access;

			if (!accessToken && typeof window !== 'undefined') {
				const session = await getSession();
				accessToken = session?.accessToken;
			}

			if (accessToken && !config._retried) {
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
			if (axios.isCancel(error)) return Promise.reject(error);

			// Streaming requests still return JSON error bodies on HTTP failures.
			if (error.response?.data && typeof error.response.data.getReader === 'function') {
				error.response.data = await new Response(error.response.data).json().catch(() => null);
			}
			if (error.config?.signal?.aborted) return Promise.reject(new axios.CanceledError());

			const errorData = error.response?.data as (ApiErrorResponseType & { error?: { code?: string } }) | undefined;
			if (error.response?.status === 401) {
				// Retry once with a fresh session token before giving up
				if (error.config && !error.config._retried) {
					error.config._retried = true;
					const freshSession = await getSession();
					if (error.config.signal?.aborted) return Promise.reject(new axios.CanceledError());
					if (freshSession?.accessToken) {
						error.config.headers['Authorization'] = `Bearer ${freshSession.accessToken}`;
						return instance(error.config);
					}
				}
				await handleUnauthorized(onUnauthorized);
				return Promise.reject({
					error: {
						status_code: 401,
						message: errorData?.message || 'Non autorisé',
						details: errorData?.details || { error: ['Authentification requise'] },
					},
				});
			}

			if (typeof errorData?.error?.code === 'string') {
				return Promise.reject({
					error: {
						status_code: error.response.status,
						code: errorData.error.code,
						message: errorData.message || error.message,
						details: errorData.details || {},
					},
				});
			}
			if (error.response?.status >= 500) {
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
			if (errorData) {
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
					status_code: error.response?.status ?? 0,
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
export const formatNumberWithSpaces = (value: string | number | null | undefined, decimals: number = 2): string => {
	if (value === null || value === undefined || value === '') return '';
	const num = typeof value === 'string' ? parseFloat(value) : value;
	if (Number.isNaN(num)) return '';

	// Use toLocaleString with French locale for space-separated thousands
	return num.toLocaleString('fr-FR', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
		useGrouping: true,
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
 * the first detail string is returned. Otherwise, returns the fallback message.
 */
export const extractApiErrorMessage = (error: unknown, fallback: string): string => {
	if (
		typeof error === 'object' &&
		error !== null &&
		'data' in error &&
		typeof (error as { data: unknown }).data === 'object' &&
		(error as { data: { details?: Record<string, string[] | string> } }).data !== null
	) {
		const data = (error as { data: { message?: string; details?: Record<string, string[] | string> | string } }).data;
		const details = data.details;
		if (typeof details === 'string' && details.trim().length > 0) {
			return details;
		}
		if (details && typeof details === 'object') {
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

export const reloadApp = (url: string) => window.location.replace(url);

export const normalizeCompanyName = (value?: string | null): string => (value ?? '').trim().toUpperCase();

export const isNectarRaisonSociale = (value?: string | null): boolean =>
	normalizeCompanyName(value) === NECTAR_RAISON_SOCIALE;

export const calculateNectarPrixTTC = (prixHT?: number | string | null, tva?: number | string | null): number => {
	const ht = Number(prixHT ?? 0);
	const tvaRate = Number(tva ?? 0);
	if (!Number.isFinite(ht)) return 0;
	return ht * (1 + (Number.isFinite(tvaRate) ? tvaRate : 0) / 100);
};

export const runWithCleanup = async <T>(action: () => Promise<T>, cleanup: () => void): Promise<T> => {
	try {
		return await action();
	} finally {
		cleanup();
	}
};

export const runWithErrorHandler = async (
	action: () => Promise<void>,
	onError: (error: unknown) => void,
): Promise<void> => {
	try {
		await action();
	} catch (error) {
		onError(error);
	}
};

const PREFIX = 'list-pagination:v1:';
const PAGE_SIZES = new Set(['5', '10', '25', '50', '100']);

function storageKey(url: URL, scope: ListScope = {}) {
	return (
		PREFIX +
		JSON.stringify([
			url.pathname,
			...(['company_id', 'store_id'] as const).map((key) => String(scope[key] ?? url.searchParams.get(key) ?? '')),
		])
	);
}

function validParameter(key: string, value: string) {
	if (!/^(?:[a-z][a-z0-9_]*_)?(?:page|page_size|ordering)$/.test(key)) return false;
	if (key === 'page_size' || key.endsWith('_page_size')) return PAGE_SIZES.has(value);
	if (key === 'ordering' || key.endsWith('_ordering')) return /^-?[a-zA-Z_][a-zA-Z0-9_]{0,99}$/.test(value);
	return /^[1-9][0-9]{0,5}$/.test(value);
}

export function rememberListPagination(href: string, scope: ListScope = {}) {
	if (typeof window === 'undefined') return;
	try {
		const url = new URL(href, window.location.origin);
		if (url.origin !== window.location.origin) return;
		const values = [...url.searchParams].filter(([key, value]) => validParameter(key, value));
		window.sessionStorage.setItem(storageKey(url, scope), JSON.stringify(values));
	} catch {
		// Browsers that block storage still retain normal URL pagination/navigation.
	}
}

export function listReturnUrl(target: string): string {
	if (typeof window === 'undefined') return target;
	const absolute = /^https?:\/\//.test(target);
	if ((!target.startsWith('/') && !absolute) || target.startsWith('//') || target.includes('\\')) return target;
	try {
		const url = new URL(target, window.location.origin);
		if (url.origin !== window.location.origin || url.username || url.password) return target;
		const raw = window.sessionStorage.getItem(storageKey(url));
		if (!raw || raw.length > 8192) return target;
		const values: unknown = JSON.parse(raw);
		if (!Array.isArray(values) || values.length > 32) return target;
		let changed = false;
		for (const item of values) {
			if (!Array.isArray(item) || item.length !== 2) continue;
			const [key, value] = item;
			if (
				typeof key !== 'string' ||
				typeof value !== 'string' ||
				!validParameter(key, value) ||
				url.searchParams.has(key)
			)
				continue;
			url.searchParams.set(key, value);
			changed = true;
		}
		return changed ? (absolute ? url.href : url.pathname + url.search + url.hash) : target;
	} catch {
		return target;
	}
}

export const isAiTextField = (name: string, type: string) =>
	(type === 'text' || type === 'textarea') && aiWritingFields.has(name);

export const calculateSalePriceHT = (price: number, tva: number, basis: SalePriceBasis = 'HT'): number => {
	if (basis === 'HT') return price;
	// Work in cents and VAT basis points so half-cent results round consistently.
	const cents = Math.round(price * 100);
	const taxFactor = 10_000 + Math.round(tva * 100);
	return Math.round((cents * 10_000) / taxFactor) / 100;
};

export const calculateSalePriceTTC = (priceHT: number, tva: number): number => {
	const cents = Math.round(priceHT * 100);
	const taxFactor = 10_000 + Math.round(tva * 100);
	return Math.round((cents * taxFactor) / 10_000) / 100;
};

export const isAppVersion = (value: unknown): value is string =>
	typeof value === 'string' && /^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/.exec(value)?.[0] === value;

export const isNewerAppVersion = (candidate: unknown, current: unknown): boolean => {
	if (!isAppVersion(candidate) || !isAppVersion(current)) return false;
	const next = candidate.split('.').map(Number);
	const local = current.split('.').map(Number);
	for (let i = 0; i < next.length; i++) {
		if (next[i] !== local[i]) return next[i] > local[i];
	}
	return false;
};

let activeCompany: number | null = null;
const listeners = new Set<() => void>();

export const publishChatAICompany = (id: number | null) => {
	if (activeCompany === id) return;
	activeCompany = id;
	listeners.forEach((notify) => notify());
};
export const getChatAICompany = () => activeCompany;
export const subscribeChatAICompany = (notify: () => void) => {
	listeners.add(notify);
	return () => {
		listeners.delete(notify);
	};
};

export const chatErrorCode = (error: unknown): string => {
	if (axios.isCancel(error)) return 'ABORTED';
	if (axios.isAxiosError(error)) {
		const code = error.response?.data?.error?.code;
		if (typeof code === 'string') return code;
		if (error.response?.status === 401) return 'NOT_AUTHENTICATED';
		if (error.response?.status === 403) return 'PERMISSION_DENIED';
	}
	if (error && typeof error === 'object') {
		if ('name' in error && error.name === 'AbortError') return 'ABORTED';
		if ('error' in error && error.error && typeof error.error === 'object') {
			if ('code' in error.error && typeof error.error.code === 'string') return error.error.code;
			if ('status_code' in error.error && error.error.status_code === 401) return 'NOT_AUTHENTICATED';
			if ('status_code' in error.error && error.error.status_code === 403) return 'PERMISSION_DENIED';
		}
		if (!(error instanceof Error) && 'code' in error && typeof error.code === 'string') return error.code;
	}
	return 'APPLICATION_UNAVAILABLE';
};

export const isChatMessage = (value: unknown): value is ChatMessage => {
	if (!value || typeof value !== 'object') return false;
	return (
		'id' in value &&
		typeof value.id === 'string' &&
		'role' in value &&
		(value.role === 'assistant' || value.role === 'user') &&
		'text' in value &&
		typeof value.text === 'string' &&
		(!('cards' in value) ||
			value.cards === undefined ||
			(Array.isArray(value.cards) &&
				value.cards.every((card) => card && typeof card === 'object' && typeof card.type === 'string')))
	);
};

export const safeNavigation = (target: NavigationTarget, companyId: number) => {
	if (target.application !== 'facturation' || target.company_id !== companyId) return null;
	const list: Record<string, string> = {
		invoices: 'facture-client/',
		clients: 'clients/',
		payments: 'reglements/',
		dashboard: '',
		quotes: 'devis/',
		proformas: 'facture-pro-forma/',
		credit_notes: 'facture-avoir/',
		delivery_notes: 'bon-de-livraison/',
		articles: 'articles/',
		users: 'users/',
		stock: 'stock/',
		stock_movements: 'stock/movements/',
		stock_receipts: 'stock/receipts/',
		stock_inventories: 'stock/inventories/',
		logistics: 'logistique/',
	};
	const detail: Record<string, string> = {
		invoice: 'facture-client/',
		client: 'clients/',
		invoice_edit: 'facture-client/',
		client_edit: 'clients/',
		quote: 'devis/',
		quote_edit: 'devis/',
		proforma: 'facture-pro-forma/',
		proforma_edit: 'facture-pro-forma/',
		credit_note: 'facture-avoir/',
		credit_note_edit: 'facture-avoir/',
		delivery_note: 'bon-de-livraison/',
		delivery_note_edit: 'bon-de-livraison/',
		article: 'articles/',
		payment: 'reglements/',
		user: 'users/',
		stock_balance: 'stock/',
		stock_movement: 'stock/movements/',
		stock_receipt: 'stock/receipts/',
		stock_inventory: 'stock/inventories/',
		logistics_order: 'logistique/',
	};
	let route: string;
	if (
		Object.hasOwn(detail, target.resource) &&
		Number.isSafeInteger(target.identifier) &&
		(target.identifier ?? 0) > 0
	) {
		route = `/dashboard/${detail[target.resource]}${target.identifier}/${target.resource.endsWith('_edit') ? 'edit/' : ''}`;
	} else if (Object.hasOwn(list, target.resource) && target.identifier === null) {
		route = `/dashboard/${list[target.resource]}`;
	} else return null;
	const expected = ['user', 'users'].includes(target.resource) ? route : `${route}?company_id=${companyId}`;
	return target.path === expected ? expected : null;
};
