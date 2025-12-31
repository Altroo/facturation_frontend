import {
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
} from './helpers';
import { signOut } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
	signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/utils/routes', () => ({
	SITE_ROOT: '/mock-root',
}));

const mockedSignOut = signOut as jest.Mock;

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
				expect(msg).toBe("Le prix de vente (50.00 MAD) doit être supérieur ou égal au prix d'achat (100.00 MAD)");
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
				expect(msg).toBe('La remise fixe (200.00 MAD) ne peut pas dépasser le total (150.00 MAD)');
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
					'La remise fixe globale (1100.00 MAD) ne peut pas dépasser le total HT du devis (1000.00 MAD)',
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
