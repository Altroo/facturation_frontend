import {
	safeNavigation,
	isAppVersion,
	isNewerAppVersion,
	getChatAICompany,
	publishChatAICompany,
	subscribeChatAICompany,
	calculateSalePriceHT,
	calculateSalePriceTTC,
	isAiTextField,
	listReturnUrl,
	rememberListPagination,
	runWithCleanup,
	runWithErrorHandler,
	calculateNectarPrixTTC,
	isNectarRaisonSociale,
	normalizeCompanyName,
	isAuthenticatedInstance,
	allowAnyInstance,
	handleUnauthorized,
	setFormikAutoErrors,
	hexToRGB,
	formatDate,
	parseNumber,
	safeParseForInput,
	ValidatePricesHelper,
	getCompanyDocumentLabelForKey,
	getLabelForKey,
} from '@/utils/helpers';
import {
	FACTURE_PRO_FORMA_LIST,
	FACTURE_PRO_FORMA_VIEW,
	FACTURE_PRO_FORMA_EDIT,
	FACTURE_AVOIR_LIST,
	FACTURE_AVOIR_VIEW,
	FACTURE_AVOIR_EDIT,
	BON_DE_LIVRAISON_LIST,
	BON_DE_LIVRAISON_VIEW,
	BON_DE_LIVRAISON_EDIT,
	ARTICLES_LIST,
	ARTICLES_VIEW,
	REGLEMENTS_LIST,
	REGLEMENTS_VIEW,
	USERS_LIST,
	USERS_VIEW,
	STOCK_LIST,
	STOCK_VIEW,
	STOCK_MOVEMENTS,
	STOCK_MOVEMENT_VIEW,
	STOCK_RECEIPTS,
	STOCK_RECEIPT_VIEW,
	STOCK_INVENTORIES,
	STOCK_INVENTORY_VIEW,
	LOGISTIQUE_LIST,
	LOGISTIQUE_VIEW,
} from '@/utils/routes';
import type { NavigationTarget } from '@/types/chatAiTypes';
import { APP_VERSION, NECTAR_RAISON_SOCIALE } from '@/utils/rawData';

import { articleSchema } from '@/utils/formValidationSchemas';

import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

import { getSession, signOut } from 'next-auth/react';

type RequestInterceptorWithHandlers = {
	handlers?: Array<{
		fulfilled?: (
			config: InternalAxiosRequestConfig,
		) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
	}>;
};

jest.mock('next-auth/react', () => ({
	getSession: jest.fn(() => Promise.resolve(null)),
	signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/utils/routes', () => {
	const previousPrefix = process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX;
	process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = '';
	const routes = jest.requireActual('@/utils/routes');
	if (previousPrefix === undefined) Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_DOMAIN_URL_PREFIX');
	else process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = previousPrefix;
	return { ...routes, SITE_ROOT: '/mock-root' };
});

const mockedSignOut = signOut as jest.Mock;
const mockedGetSession = getSession as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
});

describe('API Utilities', () => {
	describe('hexToRGB', () => {
		it('converts hex to rgb', () => {
			expect(hexToRGB('#ff0000')).toBe('rgb(255, 0, 0)');
		});

		it('converts hex to rgba with alpha', () => {
			expect(hexToRGB('#00ff00', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
		});
	});

	describe('formatDate', () => {
		it('formats valid date string', () => {
			expect(formatDate('2025-11-20T16:03:00')).toMatch(/20 nov\. 2025/);
		});

		it('returns placeholder for null', () => {
			expect(formatDate(null)).toBe('—');
		});

		it('returns placeholder for invalid date', () => {
			expect(formatDate('invalid')).toBe('—');
		});
	});

	describe('parseNumber', () => {
		it('parses numeric strings and numbers', () => {
			expect(parseNumber('123')).toBe(123);
			expect(parseNumber(' 12.3 ')).toBe(12.3);
			expect(parseNumber(45)).toBe(45);
		});

		it('returns null for non-finite or invalid values', () => {
			expect(parseNumber('')).toBeNull();
			expect(parseNumber('abc')).toBeNull();
			expect(parseNumber(NaN as unknown as string)).toBeNull();
		});
	});

	describe('safeParseForInput', () => {
		it('returns number when parseable, otherwise raw string', () => {
			expect(safeParseForInput('12')).toBe(12);
			expect(safeParseForInput('')).toBe('');
			expect(safeParseForInput('not-a-number')).toBe('not-a-number');
		});
	});

	describe('setFormikAutoErrors', () => {
		it('maps error fields to Formik', () => {
			const mockSetFieldError = jest.fn();
			const errorPayload = {
				error: {
					status_code: 400,
					message: 'Invalid',
					details: {
						email: ['Invalid email'],
						error: ['Something went wrong'],
					},
				},
			};

			setFormikAutoErrors({ e: errorPayload, setFieldError: mockSetFieldError });

			expect(mockSetFieldError).toHaveBeenCalledWith('email', 'Invalid email');
			expect(mockSetFieldError).toHaveBeenCalledWith('globalError', 'Something went wrong');
		});

		it('maps numero_devis to numero_part and year_part', () => {
			const mockSetFieldError = jest.fn();
			const errorPayload = {
				error: {
					status_code: 400,
					message: 'Invalid',
					details: {
						numero_devis: ['Numéro de devis invalide'],
					},
				},
			};

			setFormikAutoErrors({ e: errorPayload, setFieldError: mockSetFieldError });

			expect(mockSetFieldError).toHaveBeenCalledWith('numero_part', 'Numéro de devis invalide');
			expect(mockSetFieldError).toHaveBeenCalledWith('year_part', 'Numéro de devis invalide');
		});

		it('maps numero_facture to numero_part and year_part', () => {
			const mockSetFieldError = jest.fn();
			const errorPayload = {
				error: {
					status_code: 400,
					message: 'Invalid',
					details: {
						numero_facture: ['Numéro de facture invalide'],
					},
				},
			};

			setFormikAutoErrors({ e: errorPayload, setFieldError: mockSetFieldError });

			expect(mockSetFieldError).toHaveBeenCalledWith('numero_part', 'Numéro de facture invalide');
			expect(mockSetFieldError).toHaveBeenCalledWith('year_part', 'Numéro de facture invalide');
		});

		it('maps detail field to globalError', () => {
			const mockSetFieldError = jest.fn();
			const errorPayload = {
				error: {
					status_code: 400,
					message: 'Invalid',
					details: {
						detail: ['Une erreur est survenue'],
					},
				},
			};

			setFormikAutoErrors({ e: errorPayload, setFieldError: mockSetFieldError });

			expect(mockSetFieldError).toHaveBeenCalledWith('globalError', 'Une erreur est survenue');
		});

		it('reads payload from data property when error is not present', () => {
			const mockSetFieldError = jest.fn();
			const errorPayload = {
				data: {
					status_code: 400,
					message: 'Invalid',
					details: {
						name: ['Le nom est requis'],
					},
				},
			};

			setFormikAutoErrors({ e: errorPayload, setFieldError: mockSetFieldError });

			expect(mockSetFieldError).toHaveBeenCalledWith('name', 'Le nom est requis');
		});

		it('reads payload directly when no error or data wrapper', () => {
			const mockSetFieldError = jest.fn();
			const errorPayload = {
				status_code: 400,
				message: 'Invalid',
				details: {
					field: ['Error message'],
				},
			};

			setFormikAutoErrors({ e: errorPayload, setFieldError: mockSetFieldError });

			expect(mockSetFieldError).toHaveBeenCalledWith('field', 'Error message');
		});

		it('handles non-array error messages', () => {
			const mockSetFieldError = jest.fn();
			const errorPayload = {
				error: {
					status_code: 400,
					message: 'Invalid',
					details: {
						field: 'Single error message',
					},
				},
			};

			setFormikAutoErrors({ e: errorPayload, setFieldError: mockSetFieldError });

			expect(mockSetFieldError).toHaveBeenCalledWith('field', 'Single error message');
		});

		it('does nothing when details is undefined', () => {
			const mockSetFieldError = jest.fn();
			const errorPayload = {
				error: {
					status_code: 400,
					message: 'Invalid',
				},
			};

			setFormikAutoErrors({ e: errorPayload, setFieldError: mockSetFieldError });

			expect(mockSetFieldError).not.toHaveBeenCalled();
		});

		it('does nothing when payload is empty', () => {
			const mockSetFieldError = jest.fn();

			setFormikAutoErrors({ e: {}, setFieldError: mockSetFieldError });

			expect(mockSetFieldError).not.toHaveBeenCalled();
		});
	});

	describe('ValidatePricesHelper', () => {
		describe('validatePrixVente', () => {
			it('returns error when prixVente < prixAchat', () => {
				const msg = ValidatePricesHelper.validatePrixVente(50, 100);
				expect(msg).toBe("Le prix de vente (50,00 MAD) doit être supérieur ou égal au prix d'achat (100,00 MAD)");
			});

			it('returns null when prixVente >= prixAchat', () => {
				expect(ValidatePricesHelper.validatePrixVente(100, 50)).toBeNull();
				expect(ValidatePricesHelper.validatePrixVente(100, 100)).toBeNull();
			});
		});

		describe('validateRemise', () => {
			it('rejects negative remise', () => {
				expect(ValidatePricesHelper.validateRemise(-1, '', 100)).toBe('La remise doit être positive ou nulle');
			});

			it('rejects percentage > 100', () => {
				expect(ValidatePricesHelper.validateRemise(150, 'Pourcentage', 100)).toBe(
					'La remise en pourcentage doit être entre 0 et 100',
				);
			});

			it('rejects fixed remise larger than base amount', () => {
				const msg = ValidatePricesHelper.validateRemise(200, 'Fixe', 150);
				expect(msg).toBe('La remise fixe (200,00 MAD) ne peut pas dépasser le total (150,00 MAD)');
			});

			it('accepts valid remise values', () => {
				expect(ValidatePricesHelper.validateRemise(10, 'Pourcentage', 100)).toBeNull();
				expect(ValidatePricesHelper.validateRemise(50, 'Fixe', 100)).toBeNull();
				expect(ValidatePricesHelper.validateRemise(0, '', 100)).toBeNull();
			});
		});

		describe('validateGlobalRemise', () => {
			it('rejects negative global remise', () => {
				expect(ValidatePricesHelper.validateGlobalRemise(-5, '', 1000)).toBe('La remise doit être positive ou nulle');
			});

			it('rejects percentage >100', () => {
				expect(ValidatePricesHelper.validateGlobalRemise(150, 'Pourcentage', 1000)).toBe(
					'La remise en pourcentage doit être entre 0 et 100',
				);
			});

			it('rejects fixed global remise larger than totalHTBeforeGlobal', () => {
				expect(ValidatePricesHelper.validateGlobalRemise(1100, 'Fixe', 1000)).toBe(
					'La remise fixe globale (1\u202f100,00 MAD) ne peut pas dépasser le total HT du devis (1\u202f000,00 MAD)',
				);
			});

			it('accepts valid global remise values', () => {
				expect(ValidatePricesHelper.validateGlobalRemise(10, 'Pourcentage', 1000)).toBeNull();
				expect(ValidatePricesHelper.validateGlobalRemise(100, 'Fixe', 1000)).toBeNull();
			});
		});
	});

	describe('allowAnyInstance', () => {
		it('handles structured error response', async () => {
			const instance = allowAnyInstance();

			// Mock the adapter on THIS instance (no global axios mocking to avoid recursion)
			instance.defaults.adapter = jest.fn(() =>
				Promise.reject({
					response: {
						status: 400,
						data: {
							status_code: 400,
							message: 'Bad Request',
							details: { field: ['Invalid'] },
						},
					},
				}),
			);

			await expect(instance.get('/test')).rejects.toMatchObject({
				error: {
					status_code: 400,
					message: 'Bad Request',
					details: { field: ['Invalid'] },
				},
			});
		});

		it('handles network error fallback', async () => {
			const instance = allowAnyInstance();

			instance.defaults.adapter = jest.fn(() => Promise.reject(new Error('Erreur réseau')));

			await expect(instance.get('/test')).rejects.toMatchObject({
				error: {
					status_code: 0,
					message: 'Erreur réseau',
					details: { error: ['Impossible de se connecter au serveur'] },
				},
			});
		});
	});

	describe('isAuthenticatedInstance', () => {
		const mockToken = {
			access: 'abc123',
			refresh: 'def456',
			access_expiration: '2025-12-01T00:00:00Z',
			refresh_expiration: '2025-12-15T00:00:00Z',
			user: {
				pk: 1,
				email: 'user@example.com',
				first_name: 'Al',
				last_name: 'User',
			},
		};

		it('falls back to the NextAuth session token when Redux auth state is empty', async () => {
			mockedGetSession.mockResolvedValueOnce({ accessToken: 'session-access-token' });
			const instance = isAuthenticatedInstance(() => undefined);
			const requestInterceptor = instance.interceptors.request as typeof instance.interceptors.request &
				RequestInterceptorWithHandlers;
			const handler = requestInterceptor.handlers?.[0]?.fulfilled;

			const config = await handler?.({ headers: new AxiosHeaders() } as InternalAxiosRequestConfig);

			expect(mockedGetSession).toHaveBeenCalledTimes(1);
			expect(new AxiosHeaders(config?.headers).get('Authorization')).toBe('Bearer session-access-token');
		});

		it('prefers the Redux token and skips NextAuth fallback when access is already present', async () => {
			const instance = isAuthenticatedInstance(() => mockToken);
			const requestInterceptor = instance.interceptors.request as typeof instance.interceptors.request &
				RequestInterceptorWithHandlers;
			const handler = requestInterceptor.handlers?.[0]?.fulfilled;

			const config = await handler?.({ headers: new AxiosHeaders() } as InternalAxiosRequestConfig);

			expect(mockedGetSession).not.toHaveBeenCalled();
			expect(new AxiosHeaders(config?.headers).get('Authorization')).toBe('Bearer abc123');
		});

		it('adds Authorization header if token exists', async () => {
			const getToken = () => mockToken;
			const instance = isAuthenticatedInstance(getToken);

			instance.defaults.adapter = jest.fn((config) =>
				Promise.resolve({
					data: { success: true },
					status: 200,
					statusText: 'OK',
					headers: config.headers,
					config,
				}),
			);

			const res = await instance.get('/secure');
			expect(res.data).toEqual({ success: true });

			const call = (instance.defaults.adapter as jest.Mock).mock.calls[0][0];
			expect(call.headers?.Authorization).toBe('Bearer abc123');
		});

		it('does not set Authorization when no token provided', async () => {
			const instance = isAuthenticatedInstance(undefined);

			instance.defaults.adapter = jest.fn((config) =>
				Promise.resolve({
					data: { ok: true },
					status: 200,
					statusText: 'OK',
					headers: config.headers,
					config,
				}),
			);

			await instance.get('/open');
			const call = (instance.defaults.adapter as jest.Mock).mock.calls[0][0];
			expect(call.headers?.Authorization).toBeUndefined();
		});

		it('handles 401 and calls handleUnauthorized', async () => {
			const getToken = () => mockToken;
			const onUnauthorized = jest.fn();
			const instance = isAuthenticatedInstance(getToken, onUnauthorized);

			instance.defaults.adapter = jest.fn(() =>
				Promise.reject({
					response: {
						status: 401,
						data: {
							status_code: 401,
							message: 'Unauthorized',
							details: { error: ['Token expired'] },
						},
					},
				}),
			);

			await expect(instance.get('/secure')).rejects.toMatchObject({
				error: {
					status_code: 401,
					message: 'Unauthorized',
					details: { error: ['Token expired'] },
				},
			});

			expect(onUnauthorized).toHaveBeenCalled();
		});

		it('handles 500 and returns friendly server error', async () => {
			const getToken = () => mockToken;
			const instance = isAuthenticatedInstance(getToken);

			instance.defaults.adapter = jest.fn(() =>
				Promise.reject({
					response: {
						status: 500,
						data: {
							message: 'Internal Error',
							details: {},
						},
					},
				}),
			);

			await expect(instance.get('/secure')).rejects.toMatchObject({
				error: {
					status_code: 500,
					message: 'Erreur serveur.',
					details: {
						error: [
							'Il semble que nous ne puissions pas nous connecter. Veuillez vérifier votre connexion réseau et réessayer.',
						],
					},
				},
			});
		});

		it('handles structured API error payload', async () => {
			const getToken = () => mockToken;
			const instance = isAuthenticatedInstance(getToken);

			instance.defaults.adapter = jest.fn(() =>
				Promise.reject({
					response: {
						status: 400,
						data: {
							status_code: 400,
							message: 'Invalid data',
							details: { name: ['Required'] },
						},
					},
				}),
			);

			await expect(instance.get('/secure')).rejects.toMatchObject({
				error: {
					status_code: 400,
					message: 'Invalid data',
					details: { name: ['Required'] },
				},
			});
		});

		it('handles network error fallback when no response', async () => {
			const getToken = () => mockToken;
			const instance = isAuthenticatedInstance(getToken);

			instance.defaults.adapter = jest.fn(() => Promise.reject(new Error('Erreur réseau')));

			await expect(instance.get('/secure')).rejects.toMatchObject({
				error: {
					status_code: 0,
					message: 'Erreur réseau',
					details: { error: ['Impossible de se connecter au serveur'] },
				},
			});
		});
	});

	describe('handleUnauthorized', () => {
		it('calls signOut and resets token', async () => {
			const onResetToken = jest.fn();

			await handleUnauthorized(onResetToken);

			expect(mockedSignOut).toHaveBeenCalledWith({ redirect: false, redirectTo: '/mock-root' });
			expect(onResetToken).toHaveBeenCalled();
		});

		it('does not fail without onResetToken', async () => {
			await expect(handleUnauthorized()).resolves.toBeUndefined();
			expect(mockedSignOut).toHaveBeenCalledWith({ redirect: false, redirectTo: '/mock-root' });
		});
	});
});

describe('Label helpers', () => {
	describe('getLabelForKey', () => {
		it('returns mapped label when present', () => {
			const labels = { name: 'Nom', email_address: 'Adresse e-mail' };
			expect(getLabelForKey(labels, 'name')).toBe('Nom');
			expect(getLabelForKey(labels, 'email_address')).toBe('Adresse e-mail');
		});

		it('formats key when label missing', () => {
			const labels: Record<string, string> = {};
			expect(getLabelForKey(labels, 'missing_key')).toBe('Missing Key');
			expect(getLabelForKey(labels, 'another_field_here')).toBe('Another Field Here');
		});
	});

	describe('getCompanyDocumentLabelForKey', () => {
		it('formats line keys using field label when present', () => {
			const labels = { prix_vente: 'Prix de vente' };
			expect(getCompanyDocumentLabelForKey(labels, 'ligne_0_prix_vente')).toBe('Ligne 1 - Prix de vente');
		});

		it('formats line keys using fallback when label missing', () => {
			const labels: Record<string, string> = {};
			expect(getCompanyDocumentLabelForKey(labels, 'ligne_2_custom_field')).toBe('Ligne 3 - Custom Field');
		});

		it('returns known key label when present', () => {
			const labels = { global_remise: 'Remise globale' };
			expect(getCompanyDocumentLabelForKey(labels, 'global_remise')).toBe('Remise globale');
		});
	});
});

describe('nectar', () => {
	describe('nectar utilities', () => {
		it('normalizes company names before comparison', () => {
			expect(normalizeCompanyName('  Immobiliere Nectar ')).toBe(NECTAR_RAISON_SOCIALE);
			expect(normalizeCompanyName(null)).toBe('');
			expect(normalizeCompanyName(undefined)).toBe('');
			expect(isNectarRaisonSociale(' immobiliere nectar ')).toBe(true);
			expect(isNectarRaisonSociale('Another company')).toBe(false);
		});

		it('calculates the tax-inclusive Nectar price from numeric and string values', () => {
			expect(calculateNectarPrixTTC(100, 20)).toBe(120);
			expect(calculateNectarPrixTTC('250', '10')).toBeCloseTo(275);
			expect(calculateNectarPrixTTC(null, null)).toBe(0);
		});

		it('handles invalid price and tax values', () => {
			expect(calculateNectarPrixTTC('invalid', 20)).toBe(0);
			expect(calculateNectarPrixTTC(100, 'invalid')).toBe(100);
		});
	});
});

describe('runWithCleanup', () => {
	describe('async handler cleanup', () => {
		it('returns the action result and runs cleanup afterward', async () => {
			const calls: string[] = [];
			const result = await runWithCleanup(
				async () => {
					calls.push('action');
					return 42;
				},
				() => calls.push('cleanup'),
			);

			expect(result).toBe(42);
			expect(calls).toEqual(['action', 'cleanup']);
		});

		it('runs cleanup and preserves a rejected action error', async () => {
			const error = new Error('request failed');
			const cleanup = jest.fn();

			await expect(runWithCleanup(async () => Promise.reject(error), cleanup)).rejects.toBe(error);
			expect(cleanup).toHaveBeenCalledTimes(1);
		});

		it('passes a rejected action error to its handler', async () => {
			const error = new Error('request failed');
			const onError = jest.fn();

			await runWithErrorHandler(async () => Promise.reject(error), onError);
			expect(onError).toHaveBeenCalledWith(error);
		});
	});
});

describe('List return pagination', () => {
	beforeEach(() => {
		window.sessionStorage.clear();
		window.history.replaceState({}, '', '/dashboard');
	});
	afterEach(() => jest.restoreAllMocks());

	it('returns from a detail to page three of the named list, preserving size and ordering', () => {
		rememberListPagination('/dashboard/articles?company_id=7&page=3&page_size=25&ordering=-name');
		window.history.replaceState({}, '', '/dashboard/articles/42?company_id=7');
		expect(listReturnUrl('/dashboard/articles?company_id=7')).toBe(
			'/dashboard/articles?company_id=7&page=3&page_size=25&ordering=-name',
		);
	});

	it('keeps an AI deep-link return pointed at its named list when there is no saved state', () => {
		rememberListPagination('/dashboard/tasks?page=8');
		window.history.replaceState({}, '', '/dashboard/users/42');
		expect(listReturnUrl('/dashboard/users')).toBe('/dashboard/users');
	});

	it.each(['company_id', 'store_id'] as const)('never copies another %s scope', (scope) => {
		rememberListPagination('/dashboard/articles?page=3', { [scope]: 7 });
		expect(listReturnUrl(`/dashboard/articles?${scope}=8`)).toBe(`/dashboard/articles?${scope}=8`);
		expect(listReturnUrl(`/dashboard/articles?${scope}=7`)).toBe(`/dashboard/articles?${scope}=7&page=3`);
		expect(listReturnUrl('/dashboard/articles')).toBe('/dashboard/articles');
	});

	it('uses the effective authorized selector scope when the list URL has no scope', () => {
		rememberListPagination('/dashboard/articles?page=3&page_size=10', { store_id: 9 });
		expect(listReturnUrl('/dashboard/articles?store_id=9')).toContain('page=3');
	});

	it('preserves explicit destination values, other query parameters and its anchor', () => {
		rememberListPagination('/dashboard/users?page=3&page_size=25&ordering=name');
		expect(listReturnUrl('/dashboard/users?page=2&archived=false#results')).toBe(
			'/dashboard/users?page=2&archived=false&page_size=25&ordering=name#results',
		);
	});

	it('keeps independent grids and does not store search text or other data', () => {
		rememberListPagination('/dashboard/stock?page=3&requests_page=2&requests_page_size=5&search=private&token=secret');
		const result = listReturnUrl('/dashboard/stock');
		expect(result).toBe('/dashboard/stock?page=3&requests_page=2&requests_page_size=5');
		expect(JSON.stringify(window.sessionStorage)).not.toMatch(/private|secret/);
	});

	it('clears the old page when the user later visits the fresh list', () => {
		rememberListPagination('/dashboard/users?page=3&ordering=name');
		rememberListPagination('/dashboard/users');
		expect(listReturnUrl('/dashboard/users')).toBe('/dashboard/users');
	});

	it('rejects malformed saved data and never takes a destination or scope from storage', () => {
		rememberListPagination('/dashboard/users?page=3');
		const key = window.sessionStorage.key(0)!;
		window.sessionStorage.setItem(key, '{broken');
		expect(listReturnUrl('/dashboard/users')).toBe('/dashboard/users');
		window.sessionStorage.setItem(
			key,
			JSON.stringify([
				['page', '3'],
				['company_id', '9'],
				['returnTo', 'https://example.test'],
				['ordering', 'javascript:alert(1)'],
				['page_size', '-1'],
			]),
		);
		expect(listReturnUrl('/dashboard/users')).toBe('/dashboard/users?page=3');
	});

	it('rejects invalid page/size values and a foreign-origin source', () => {
		rememberListPagination('/dashboard/users?page=-3&page_size=999&ordering=%3Cscript%3E');
		rememberListPagination('https://example.test/dashboard/users?page=5');
		expect(listReturnUrl('/dashboard/users')).toBe('/dashboard/users');
	});

	it('keeps normal navigation working when storage is blocked', () => {
		jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		expect(() => rememberListPagination('/dashboard/users?page=3')).not.toThrow();
		expect(listReturnUrl('/dashboard/users')).toBe('/dashboard/users');
	});

	it('supports the same-origin absolute URLs used by production native routes', () => {
		const base = window.location.origin;
		rememberListPagination(`${base}/dashboard/users?page=3&page_size=10`);
		expect(listReturnUrl(`${base}/dashboard/users`)).toBe(`${base}/dashboard/users?page=3&page_size=10`);
		expect(listReturnUrl('https://elsewhere.test/dashboard/users')).toBe('https://elsewhere.test/dashboard/users');
		expect(listReturnUrl('//elsewhere.test/dashboard/users')).toBe('//elsewhere.test/dashboard/users');
	});
});

describe('aiTextFields', () => {
	describe('AI text eligibility', () => {
		it.each([
			'designation',
			'remarque',
			'description',
			'nature_marchandise',
			'process_remark',
			'conditions_paiement_proforma',
			'notes_ecarts_proforma',
			'commentaire_paiement',
			'reject_note',
			'libelle',
			'observations',
			'termes_paiement',
			'reason',
			'note',
		])('enables reviewed writing field %s', (name) => expect(isAiTextField(name, 'text')).toBe(true));
		it.each([
			'barcode',
			'barCode',
			'code_barre',
			'reference',
			'numero_contrat',
			'code',
			'ICE',
			'rib',
			'incoterm_proforma',
			'raison_sociale',
			'nom',
			'prenom',
			'client_nom',
			'first_name',
			'last_name',
			'employee_first_name',
			'guest_name',
			'locataire_nom',
			'supplier_name',
			'fournisseur',
			'responsible',
			'responsable_projet',
			'architecte',
			'st_rep',
			'st_name',
			'name',
			'adresse',
			'client_adresse',
			'address',
			'st_addr',
			'ville_signature',
			'origine_marchandise',
			'banque',
			'banque_paiement',
			'st_banque',
			'transport',
			'superficie',
			'surface',
			'duree_estimee',
			'frais_redemarrage',
			'st_capital',
			'st_retenue_garantie',
			'st_avance',
			'st_plafond_penalite',
			'garantie_nb',
			'chantier_etage',
			'taxe_professionnelle',
			'prix_vente',
			'montant',
			'stock',
			'email',
			'client_cin',
			'client_cp',
			'search',
			'date_facture',
			'unknown_field',
			'new_bank',
			'edit_type',
		])('excludes identifiers, names, measurements and unreviewed fields: %s', (name) =>
			expect(isAiTextField(name, 'text')).toBe(false),
		);
		it.each(['number', 'date', 'email', 'password', 'checkbox', 'tel', 'url'])('excludes input type %s', (type) =>
			expect(isAiTextField('designation', type)).toBe(false),
		);
	});
});

describe('articlePricing', () => {
	describe('article HT/TTC pricing', () => {
		it.each([
			[120, 20, 100],
			[110, 10, 100],
			[107, 7, 100],
			[100, 0, 100],
			[17.49, 20, 14.58],
			[1.23, 20, 1.03],
			[1234.56, 20, 1028.8],
			[0, 20, 0],
		])('converts %s TTC at %s%% VAT to %s HT', (ttc, tva, ht) => {
			expect(calculateSalePriceHT(ttc, tva, 'TTC')).toBe(ht);
		});

		it('keeps existing HT prices unchanged', () => {
			expect(calculateSalePriceHT(150.25, 20)).toBe(150.25);
		});

		it.each([
			[100, 20, 120],
			[100, 10, 110],
			[100, 0, 100],
			[10.05, 10, 11.06],
		])('calculates %s HT at %s%% VAT as %s TTC', (ht, tva, ttc) => {
			expect(calculateSalePriceTTC(ht, tva)).toBe(ttc);
		});

		it.each([
			['HT', 120, 20, true],
			['TTC', 120, 20, false],
			['TTC', 132, 20, true],
			['TTC', 120, 0, true],
		])('compares %s selling prices with the HT purchase price', (basis, price, tva, valid) => {
			const result = articleSchema.safeParse({
				type_article: 'Produit',
				reference: 'PRICE-TEST',
				designation: 'Article test',
				company: 1,
				prix_achat: 105,
				prix_vente: price,
				prix_vente_base: basis,
				tva,
			});
			expect(result.success).toBe(valid);
			if (!result.success) expect(result.error.issues[0].path).toEqual(['prix_vente']);
		});
	});
});

describe('chatAiCompany', () => {
	beforeEach(() => publishChatAICompany(null));
	afterEach(() => publishChatAICompany(null));

	it('publishes company changes and clears the active company on logout', () => {
		const notify = jest.fn();
		const unsubscribe = subscribeChatAICompany(notify);
		try {
			publishChatAICompany(7);
			expect(getChatAICompany()).toBe(7);
			publishChatAICompany(7);
			expect(notify).toHaveBeenCalledTimes(1);
			publishChatAICompany(8);
			expect(getChatAICompany()).toBe(8);
			publishChatAICompany(null);
			expect(getChatAICompany()).toBeNull();
			expect(notify).toHaveBeenCalledTimes(3);
		} finally {
			unsubscribe();
		}
	});

	it('unsubscribes one listener without affecting other subscribers', () => {
		const first = jest.fn();
		const second = jest.fn();
		const unsubscribeFirst = subscribeChatAICompany(first);
		const unsubscribeSecond = subscribeChatAICompany(second);
		try {
			unsubscribeFirst();
			unsubscribeFirst();
			publishChatAICompany(7);
			expect(first).not.toHaveBeenCalled();
			expect(second).toHaveBeenCalledTimes(1);
		} finally {
			unsubscribeFirst();
			unsubscribeSecond();
		}
	});
});

describe('App version comparisons', () => {
	it.each(['0.0.0', '1.2.3', '2026.10.6'])('accepts %s', (value) => expect(isAppVersion(value)).toBe(true));
	it.each([null, undefined, 1, '', '1', '1.0', '01.0.0', '1.0.0-beta', '1.0.0\n', '1000000.0.0'])(
		'rejects %s',
		(value) => {
			expect(isAppVersion(value)).toBe(false);
			expect(isNewerAppVersion(value, APP_VERSION)).toBe(false);
		},
	);
	it.each([
		['1.10.0', '1.9.9', true],
		['1.2.1', '1.2.0', true],
		['2.0.0', '1.99.9', true],
		['1.2.0', '1.2.0', false],
		['1.2.0', '1.10.0', false],
		['1.0.0', 'invalid', false],
	])('compares %s with %s numerically', (candidate, current, expected) => {
		expect(isNewerAppVersion(candidate, current)).toBe(expected);
	});
});

describe('Chat navigation', () => {
	const target: NavigationTarget = {
		application: 'facturation',
		resource: 'invoice',
		identifier: 12,
		company_id: 7,
		path: '/dashboard/facture-client/12/?company_id=7',
	};

	describe('authorized navigation contract', () => {
		it('accepts an exact approved invoice route', () => expect(safeNavigation(target, 7)).toBe(target.path));
		it.each([
			'javascript:alert(1)',
			'//evil.invalid',
			'https://evil.invalid',
			'/dashboard/facture-client/99/?company_id=7',
			'/dashboard/facture-client/12/?company_id=8',
		])('rejects an unsafe or substituted path %s', (path) => expect(safeNavigation({ ...target, path }, 7)).toBeNull());
		it('rejects another company even with the expected path', () => expect(safeNavigation(target, 8)).toBeNull());
		it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid record ID %s', (identifier) =>
			expect(safeNavigation({ ...target, identifier }, 7)).toBeNull(),
		);
		it('rejects prototype resource names', () =>
			expect(safeNavigation({ ...target, resource: '__proto__' }, 7)).toBeNull());
		it('permits the verified edit path', () =>
			expect(
				safeNavigation(
					{ ...target, resource: 'invoice_edit', path: '/dashboard/facture-client/12/edit/?company_id=7' },
					7,
				),
			).toBe('/dashboard/facture-client/12/edit/?company_id=7'));
	});

	const commercialDocumentRoutes = [
		{
			resource: 'proforma',
			listResource: 'proformas',
			list: FACTURE_PRO_FORMA_LIST,
			view: FACTURE_PRO_FORMA_VIEW,
			edit: FACTURE_PRO_FORMA_EDIT,
		},
		{
			resource: 'credit_note',
			listResource: 'credit_notes',
			list: FACTURE_AVOIR_LIST,
			view: FACTURE_AVOIR_VIEW,
			edit: FACTURE_AVOIR_EDIT,
		},
		{
			resource: 'delivery_note',
			listResource: 'delivery_notes',
			list: BON_DE_LIVRAISON_LIST,
			view: BON_DE_LIVRAISON_VIEW,
			edit: BON_DE_LIVRAISON_EDIT,
		},
	] as const;

	describe('commercial document navigation', () => {
		it.each(commercialDocumentRoutes)(
			'accepts actual $resource detail, edit, and list routes',
			({ resource, listResource, list, view, edit }) => {
				const detail = { ...target, resource, path: view(12, 7) };
				const editTarget = { ...target, resource: `${resource}_edit`, path: edit(12, 7) };
				const listTarget = { ...target, resource: listResource, identifier: null, path: `${list}/?company_id=7` };
				expect(safeNavigation(detail, 7)).toBe(detail.path);
				expect(safeNavigation(editTarget, 7)).toBe(editTarget.path);
				expect(safeNavigation(listTarget, 7)).toBe(listTarget.path);
			},
		);
		it.each(commercialDocumentRoutes)(
			'rejects substituted resource, company, or query in $resource navigation',
			({ resource, view }) => {
				expect(safeNavigation({ ...target, resource }, 7)).toBeNull();
				expect(safeNavigation({ ...target, resource, company_id: 8, path: view(12, 7) }, 7)).toBeNull();
				expect(safeNavigation({ ...target, resource, path: `${view(12, 7)}&next=https://evil.invalid` }, 7)).toBeNull();
			},
		);
	});

	const readOnlyModuleRoutes = [
		{ resource: 'article', listResource: 'articles', list: ARTICLES_LIST, view: ARTICLES_VIEW },
		{ resource: 'payment', listResource: 'payments', list: REGLEMENTS_LIST, view: REGLEMENTS_VIEW },
		{ resource: 'stock_balance', listResource: 'stock', list: STOCK_LIST, view: STOCK_VIEW },
		{ resource: 'stock_movement', listResource: 'stock_movements', list: STOCK_MOVEMENTS, view: STOCK_MOVEMENT_VIEW },
		{ resource: 'stock_receipt', listResource: 'stock_receipts', list: STOCK_RECEIPTS, view: STOCK_RECEIPT_VIEW },
		{
			resource: 'stock_inventory',
			listResource: 'stock_inventories',
			list: STOCK_INVENTORIES,
			view: STOCK_INVENTORY_VIEW,
		},
		{ resource: 'logistics_order', listResource: 'logistics', list: LOGISTIQUE_LIST, view: LOGISTIQUE_VIEW },
	] as const;

	describe('read-only module navigation', () => {
		it.each(readOnlyModuleRoutes)(
			'accepts verified $resource detail/list and rejects changed context or edit routes',
			({ resource, listResource, list, view }) => {
				const detail = { ...target, resource, path: view(12, 7) };
				const listing = { ...target, resource: listResource, identifier: null, path: `${list}/?company_id=7` };
				expect(safeNavigation(detail, 7)).toBe(detail.path);
				expect(safeNavigation(listing, 7)).toBe(listing.path);
				expect(safeNavigation({ ...detail, path: view(12, 8) }, 7)).toBeNull();
				expect(safeNavigation({ ...detail, path: view(99, 7) }, 7)).toBeNull();
				expect(safeNavigation({ ...detail, application: 'reservation' } as unknown as NavigationTarget, 7)).toBeNull();
				expect(safeNavigation({ ...detail, path: detail.path + '&next=https://evil.invalid' }, 7)).toBeNull();
				expect(
					safeNavigation({ ...detail, resource: resource + '_edit', path: detail.path.replace('/?', '/edit/?') }, 7),
				).toBeNull();
			},
		);
		it.each([
			{ resource: 'user', identifier: 12, path: `${USERS_VIEW(12)}/` },
			{ resource: 'users', identifier: null, path: `${USERS_LIST}/` },
		])('keeps native $resource navigation global without a company query', (route) => {
			const destination = { ...target, ...route };
			expect(safeNavigation(destination, 7)).toBe(route.path);
			expect(safeNavigation({ ...destination, path: route.path + '?company_id=7' }, 7)).toBeNull();
			expect(safeNavigation({ ...destination, company_id: 8 }, 7)).toBeNull();
			expect(safeNavigation({ ...destination, resource: 'user_edit', path: `${USERS_VIEW(12)}/edit/` }, 7)).toBeNull();
		});
	});
});
