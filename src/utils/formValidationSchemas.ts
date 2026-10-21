import type { TranslationDictionary } from '@/types/languageTypes';
import type {
	PurchaseFormMode,
	PurchaseFormValues,
	SupplierPurchaseSchemaContext,
} from '@/types/supplierPurchaseTypes';
import { logistiquePaymentMethodItemsList, PURCHASE_CONDITIONS, pmRequired, ppRequired } from '@/utils/rawData';
import z from 'zod';
import {
	INPUT_MAX,
	INPUT_MIN,
	INPUT_PASSWORD_MIN,
	INPUT_PHONE,
	INPUT_PRICE_VENTE_ACHAT,
	INPUT_QUANTITY_INT,
	INPUT_REMISE_FIX,
	INPUT_REMISE_POURCENTAGE,
	INPUT_REQUIRED,
	INPUT_URL_INVALID,
	INPUT_YEAR_PART_INVALID,
	MINI_INPUT_EMAIL,
	POURCENTAGE_INPUT_INVALID,
	SHORT_INPUT_REQUIRED,
	TVA_INPUT_INVALID,
} from '@/utils/formValidationErrorMessages';
import type { ClientSchemaType } from '@/types/clientTypes';

import { calculateSalePriceHT } from '@/utils/helpers';

const base64ImageField = z.url().or(z.string().startsWith('data:image/')).nullable().optional();

const passwordField = z.preprocess(
	(val) => (val === undefined ? '' : val),
	z
		.string()
		.min(8, { error: INPUT_PASSWORD_MIN(8) })
		.nonempty({ error: INPUT_REQUIRED }),
);

const optionalEmailField = z.preprocess(
	(val) => (val === undefined || val === null || val === '' ? undefined : val),
	z.email({ error: MINI_INPUT_EMAIL }).optional(),
);

const optionalUrlField = z.preprocess(
	(val) => (val === undefined || val === null || val === '' ? undefined : val),
	z.url({ error: INPUT_URL_INVALID }).optional(),
);

const optionalPhoneField = z.preprocess(
	(val) => (val === undefined || val === null || val === '' ? undefined : val),
	z
		.string()
		.regex(/^\+?\d{7,15}$/, { error: INPUT_PHONE })
		.optional(),
);

const requiredTextField = (min: number, max: number) =>
	z.preprocess(
		(val) => (val === undefined ? '' : val),
		z
			.string()
			.min(min, { error: INPUT_MIN(min) })
			.max(max, { error: INPUT_MAX(max) })
			.nonempty({ error: INPUT_REQUIRED }),
	);

const requiredChoiceTextField = () =>
	z.preprocess((val) => (val === undefined ? '' : val), z.string().nonempty({ error: INPUT_REQUIRED }));

const requiredChoiceNumberField = () =>
	z.preprocess(
		(val) => {
			if (val === undefined || val === null || val === '' || val === 0 || val === '0') {
				return undefined;
			}
			return Number(val);
		},
		z.number({ message: INPUT_REQUIRED }).refine((v) => !Number.isNaN(v), { message: INPUT_REQUIRED }),
	);

const optionalChoiceField = () =>
	z.preprocess((val) => (val === undefined || val === null || val === '' ? undefined : val), z.string().optional());

const optionalTextField = (min: number, max: number) =>
	z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? undefined : val),
		z
			.string()
			.min(min, { error: INPUT_MIN(min) })
			.max(max, { error: INPUT_MAX(max) })
			.optional(),
	);

const requiredNumberField = (min: number = 1, max?: number) =>
	z.preprocess(
		(val) => (val === undefined || val === null ? NaN : Number(val)),
		z
			.number({ error: INPUT_REQUIRED })
			.refine((val) => !Number.isNaN(val), { error: INPUT_REQUIRED })
			.min(min, { error: INPUT_MIN(min) })
			.max(max ?? Number.MAX_SAFE_INTEGER, { error: INPUT_MAX(max ?? Number.MAX_SAFE_INTEGER) }),
	);

const optionalNumberField = (min: number = 1, max?: number) =>
	z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
		z
			.number()
			.refine((val) => !Number.isNaN(val), { error: INPUT_REQUIRED })
			.min(min, { error: INPUT_MIN(min) })
			.max(max ?? Number.MAX_SAFE_INTEGER, { error: INPUT_MAX(max ?? Number.MAX_SAFE_INTEGER) })
			.optional(),
	);

const optionalTVANumberField = (min: number = 1, max?: number) =>
	z.preprocess(
		(val) => {
			if (val === '') return undefined; // champ optionnel si vide
			if (val === undefined) return undefined;
			if (val === null) return null; // conserver null pour .nullable()
			return Number(val); // convertit "123" -> 123, "abc" -> NaN
		},
		z
			.number({ message: TVA_INPUT_INVALID })
			.refine((val) => Number.isFinite(val), { message: TVA_INPUT_INVALID })
			.min(min, { message: INPUT_MIN(min) })
			.max(max ?? Number.MAX_SAFE_INTEGER, { message: INPUT_MAX(max ?? Number.MAX_SAFE_INTEGER) })
			.optional()
			.nullable(),
	);

const singleDigit = z
	.string()
	.min(1, { error: SHORT_INPUT_REQUIRED })
	.regex(/^\d$/, { error: SHORT_INPUT_REQUIRED })
	.transform((val) => Number(val));

export const loginSchema = z.object({
	email: z.email({ error: MINI_INPUT_EMAIL }),
	password: passwordField,
	globalError: optionalTextField(1, 500),
});

export const emailSchema = z.object({
	email: z.email({ error: MINI_INPUT_EMAIL }),
	globalError: optionalTextField(1, 500),
});

export const passwordResetConfirmationSchema = z.object({
	new_password: passwordField,
	new_password2: passwordField,
	globalError: optionalTextField(1, 500),
});

export const passwordResetCodeSchema = z.object({
	one: singleDigit,
	two: singleDigit,
	three: singleDigit,
	four: singleDigit,
	five: singleDigit,
	six: singleDigit,
	globalError: optionalTextField(1, 500),
});

export const profilSchema = z.object({
	first_name: requiredTextField(2, 30),
	last_name: requiredTextField(2, 30),
	gender: optionalChoiceField(),
	avatar: base64ImageField,
	avatar_cropped: base64ImageField,
});

export const changePasswordSchema = z.object({
	old_password: passwordField,
	new_password: passwordField,
	new_password2: passwordField,
});

export const companySchema = z.object({
	// REQUIRED FIELDS
	raison_sociale: requiredTextField(2, 255),
	ICE: requiredTextField(2, 100),
	nbr_employe: requiredChoiceTextField(),

	// OPTIONAL FIELDS
	email: optionalEmailField,
	civilite_responsable: optionalChoiceField(),
	nom_responsable: optionalTextField(2, 255),
	gsm_responsable: optionalPhoneField,
	adresse: optionalTextField(2, 255),
	telephone: optionalPhoneField,
	fax: optionalPhoneField,
	site_web: optionalUrlField,
	numero_du_compte: optionalTextField(2, 100),
	registre_de_commerce: optionalTextField(2, 100),
	identifiant_fiscal: optionalTextField(2, 100),
	tax_professionnelle: optionalTextField(2, 100),
	CNSS: optionalTextField(2, 100),
	managed_by: z
		.array(
			z.object({
				pk: requiredNumberField(1),
				role: requiredTextField(1, 50),
				can_validate_factures: z.boolean().optional(),
			}),
		)
		.optional(),
	logo: base64ImageField,
	logo_cropped: base64ImageField,
	cachet: base64ImageField,
	cachet_cropped: base64ImageField,
	uses_foreign_currency: z.boolean().default(false),
	stock_management_enabled: z.boolean().default(false),
	inventory_management_enabled: z.boolean().default(false),
	globalError: optionalTextField(1, 500),
});

export const userSchema = z.object({
	// REQUIRED FIELDS
	first_name: requiredTextField(2, 255),
	last_name: requiredTextField(2, 255),
	email: z.email({ error: MINI_INPUT_EMAIL }),
	gender: requiredChoiceTextField(),
	is_active: z.boolean(),
	is_staff: z.boolean(),
	// OPTIONAL FIELDS
	companies: z
		.array(
			z.object({
				membership_id: z.number(),
				company_id: z.number(),
				raison_sociale: z.string(),
				role: z.string(),
				can_validate_factures: z.boolean().optional(),
			}),
		)
		.optional(),
	avatar: base64ImageField,
	avatar_cropped: base64ImageField,
	globalError: optionalTextField(1, 500),
});

export const clientSchema = z
	.object({
		client_type: z.enum(['PM', 'PP', 'CD']),
		code_client: requiredTextField(1, 100),
		company: requiredNumberField(1),
		// optional fields
		raison_sociale: optionalTextField(2, 255),
		nom: optionalTextField(2, 255),
		prenom: optionalTextField(2, 255),
		adresse: optionalTextField(2, 255).nullable(),
		ville: optionalNumberField(1).nullable(),
		tel: optionalPhoneField.nullable(),
		email: optionalEmailField,
		delai_de_paiement: optionalNumberField(0).nullable(),
		remarque: optionalTextField(2, 2000).nullable(),
		numero_du_compte: optionalTextField(2, 100).nullable(),
		ICE: optionalTextField(2, 100).nullable(),
		registre_de_commerce: optionalTextField(2, 100).nullable(),
		identifiant_fiscal: optionalTextField(2, 100).nullable(),
		taxe_professionnelle: optionalTextField(2, 100).nullable(),
		CNSS: optionalTextField(2, 100).nullable(),
		globalError: optionalTextField(1, 500),
	})
	.superRefine((data: ClientSchemaType, ctx) => {
		if (data.client_type === 'PM') {
			pmRequired.forEach((key) => {
				const val = data[key];
				const isEmpty =
					val === undefined ||
					val === null ||
					(typeof val === 'string' && val.trim() === '') ||
					(typeof val === 'number' && Number.isNaN(val));
				if (isEmpty) {
					ctx.addIssue({
						path: [key],
						code: 'custom',
						message: INPUT_REQUIRED,
					});
				}
			});
		} else if (data.client_type === 'PP') {
			ppRequired.forEach((key) => {
				const val = data[key];
				const isEmpty =
					val === undefined ||
					val === null ||
					(typeof val === 'string' && val.trim() === '') ||
					(typeof val === 'number' && Number.isNaN(val));
				if (isEmpty) {
					ctx.addIssue({
						path: [key],
						code: 'custom',
						message: INPUT_REQUIRED,
					});
				}
			});
		}
	});

export const articleSchema = z
	.object({
		type_article: z.enum(['Produit', 'Service']),
		reference: requiredTextField(2, 100),
		designation: requiredTextField(2, 500),
		company: requiredNumberField(1),
		// optional fields
		photo: base64ImageField,
		photo_cropped: base64ImageField,
		emplacement: optionalNumberField(1).nullable(),
		marque: optionalNumberField(1).nullable(),
		categorie: optionalNumberField(1).nullable(),
		unite: optionalNumberField(1).nullable(),
		prix_achat: optionalNumberField(0).nullable(),
		devise_prix_achat: z.enum(['MAD', 'EUR', 'USD']).default('MAD'),
		prix_vente: optionalNumberField(0).nullable(),
		prix_vente_base: z.enum(['HT', 'TTC']).default('HT'),
		devise_prix_vente: z.enum(['MAD', 'EUR', 'USD']).default('MAD'),
		tva: optionalTVANumberField(0),
		stock_minimum: optionalNumberField(0).default(0),
		remarque: optionalTextField(2, 2000).nullable(),
		globalError: optionalTextField(1, 500),
	})
	.refine(
		(data) => {
			const a = data.prix_achat;
			const v = data.prix_vente;
			if (a === undefined || a === null || v === undefined || v === null) return true;
			const rates: Record<'MAD' | 'EUR' | 'USD', number> = { MAD: 1, EUR: 10, USD: 9 };
			const deviseAchat = (data.devise_prix_achat ?? 'MAD') as 'MAD' | 'EUR' | 'USD';
			const deviseVente = (data.devise_prix_vente ?? 'MAD') as 'MAD' | 'EUR' | 'USD';
			const aInMAD = a * rates[deviseAchat];
			const vInMAD = calculateSalePriceHT(v, data.tva ?? 0, data.prix_vente_base) * rates[deviseVente];
			return vInMAD > aInMAD;
		},
		{ error: INPUT_PRICE_VENTE_ACHAT, path: ['prix_vente'] },
	);

export const devisLivraisonFactureLineSchema = z
	.object({
		article: requiredNumberField(1),
		prix_achat: optionalNumberField(0).nullable(),
		devise_prix_achat: z.string().default('MAD'),
		prix_vente: optionalNumberField(0).nullable(),
		quantity: z.preprocess(
			(val) => {
				if (val === undefined || val === null) return NaN;
				if (typeof val === 'string') {
					const normalized = val.trim().replace(',', '.');
					if (!normalized) return NaN;
					const parsed = parseFloat(normalized);
					return Number.isNaN(parsed) ? NaN : parsed;
				}
				const parsed = Number(val);
				return Number.isNaN(parsed) ? NaN : parsed;
			},
			z
				.number({ error: INPUT_REQUIRED })
				.refine((val) => !Number.isNaN(val), { error: INPUT_REQUIRED })
				.min(0.01, { error: INPUT_MIN(0.01) }),
		),
		remise_type: z.enum(['Pourcentage', 'Fixe']).optional().nullable(),
		remise: z.preprocess(
			(val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val),
			optionalNumberField(0),
		),
	})
	.refine(
		(data) => {
			const a = data.prix_achat;
			const v = data.prix_vente;
			if (a === undefined || a === null || v === undefined || v === null) return true;
			return v > a;
		},
		{ error: INPUT_PRICE_VENTE_ACHAT, path: ['prix_vente'] },
	)
	.superRefine((data, ctx) => {
		const hasRemiseType = data.remise_type !== undefined;
		const rType = data.remise_type ?? 'Pourcentage';
		const remiseVal = data.remise;

		if (hasRemiseType && (remiseVal === undefined || remiseVal === null || Number.isNaN(remiseVal))) {
			ctx.addIssue({
				path: ['remise'],
				code: 'custom',
				message: INPUT_REQUIRED,
			});
			return;
		}

		if (remiseVal !== undefined && remiseVal !== null) {
			if (rType === 'Pourcentage') {
				if (remiseVal < 0 || remiseVal > 100) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: INPUT_REMISE_POURCENTAGE,
					});
				}
			} else {
				if (remiseVal < 0) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: INPUT_REMISE_FIX,
					});
				}
			}
		}
	});

const supplierSnapshotFields = {
	fournisseur: z.preprocess(
		(value) => (typeof value === 'string' ? value.trim() || undefined : value),
		z
			.string()
			.max(255, { error: INPUT_MAX(255) })
			.optional(),
	),
	fournisseur_email: optionalEmailField,
};

export const deviSchema = z
	.object({
		numero_part: requiredTextField(1, 15),
		year_part: z.preprocess(
			(val) => {
				if (val === undefined || val === null || val === '') {
					return undefined;
				}
				return Number(val);
			},
			z
				.number({ error: INPUT_YEAR_PART_INVALID })
				.refine((val) => !Number.isNaN(val), { message: INPUT_YEAR_PART_INVALID })
				.refine((val) => val >= 20 && val <= 99 && Number.isInteger(val), {
					message: INPUT_YEAR_PART_INVALID,
				}),
		),
		client: requiredChoiceNumberField(),
		date_devis: requiredTextField(1, 100),
		date_echeance: optionalTextField(1, 100).nullable(),
		numero_demande_prix_client: optionalTextField(1, 100).nullable(),
		mode_paiement: optionalNumberField(0).nullable(),
		remarque: optionalTextField(2, 2000).nullable(),
		...supplierSnapshotFields,
		remise_type: z.enum(['Pourcentage', 'Fixe']).optional().nullable(),
		remise: z.preprocess(
			(val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val),
			optionalNumberField(0),
		),
		lignes: z.array(devisLivraisonFactureLineSchema).optional(),
		globalError: optionalTextField(1, 500),
	})
	.superRefine((data, ctx) => {
		const hasRemiseType = data.remise_type !== undefined;
		const rType = data.remise_type ?? 'Pourcentage';
		const remiseVal = data.remise;

		if (hasRemiseType && (remiseVal === undefined || remiseVal === null || Number.isNaN(remiseVal))) {
			ctx.addIssue({
				path: ['remise'],
				code: 'custom',
				message: INPUT_REQUIRED,
			});
			return;
		}

		if (remiseVal !== undefined && remiseVal !== null) {
			if (rType === 'Pourcentage') {
				if (remiseVal < 0 || remiseVal > 100) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: INPUT_REMISE_POURCENTAGE,
					});
				}
			} else {
				if (remiseVal < 0) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: INPUT_REMISE_FIX,
					});
				}
			}
		}
	});

export const deviAddSchema = z.object({
	numero_part: requiredTextField(1, 15),
	year_part: z.preprocess(
		(val) => {
			if (val === undefined || val === null || val === '') {
				return undefined;
			}
			return Number(val);
		},
		z
			.number({ error: INPUT_YEAR_PART_INVALID })
			.refine((val) => !Number.isNaN(val), { message: INPUT_YEAR_PART_INVALID })
			.refine((val) => val >= 20 && val <= 99 && Number.isInteger(val), {
				message: INPUT_YEAR_PART_INVALID,
			}),
	),
	client: requiredChoiceNumberField(),
	date_devis: requiredTextField(1, 100),
	date_echeance: optionalTextField(1, 100).nullable(),
	numero_demande_prix_client: optionalTextField(1, 100).nullable(),
	mode_paiement: optionalNumberField(0).nullable(),
	remarque: optionalTextField(2, 2000).nullable(),
	...supplierSnapshotFields,
	globalError: optionalTextField(1, 500),
});

export const factureClientProformaSchema = z
	.object({
		numero_part: requiredTextField(1, 15),
		year_part: z.preprocess(
			(val) => {
				if (val === undefined || val === null || val === '') {
					return undefined;
				}
				return Number(val);
			},
			z
				.number({ error: INPUT_YEAR_PART_INVALID })
				.refine((val) => !Number.isNaN(val), { message: INPUT_YEAR_PART_INVALID })
				.refine((val) => val >= 20 && val <= 99 && Number.isInteger(val), {
					message: INPUT_YEAR_PART_INVALID,
				}),
		),
		client: requiredChoiceNumberField(),
		date_facture: requiredTextField(1, 100),
		date_echeance: optionalTextField(1, 100).nullable(),
		numero_bon_commande_client: optionalTextField(1, 100).nullable(),
		termes_paiement: optionalTextField(1, 2000).nullable(),
		mode_paiement: optionalNumberField(0).nullable(),
		remarque: optionalTextField(2, 2000).nullable(),
		...supplierSnapshotFields,
		remise_type: z.enum(['Pourcentage', 'Fixe']).optional().nullable(),
		remise: z.preprocess(
			(val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val),
			optionalNumberField(0),
		),
		lignes: z.array(devisLivraisonFactureLineSchema).optional(),
		globalError: optionalTextField(1, 500),
	})
	.superRefine((data, ctx) => {
		const hasRemiseType = data.remise_type !== undefined;
		const rType = data.remise_type ?? 'Pourcentage';
		const remiseVal = data.remise;

		if (hasRemiseType && (remiseVal === undefined || remiseVal === null || Number.isNaN(remiseVal))) {
			ctx.addIssue({
				path: ['remise'],
				code: 'custom',
				message: INPUT_REQUIRED,
			});
			return;
		}

		if (remiseVal !== undefined && remiseVal !== null) {
			if (rType === 'Pourcentage') {
				if (remiseVal < 0 || remiseVal > 100) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: INPUT_REMISE_POURCENTAGE,
					});
				}
			} else {
				if (remiseVal < 0) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: INPUT_REMISE_FIX,
					});
				}
			}
		}
	});

export const factureClientProformaAddSchema = z.object({
	numero_part: requiredTextField(1, 15),
	year_part: z.preprocess(
		(val) => {
			if (val === undefined || val === null || val === '') {
				return undefined;
			}
			return Number(val);
		},
		z
			.number({ error: INPUT_YEAR_PART_INVALID })
			.refine((val) => !Number.isNaN(val), { message: INPUT_YEAR_PART_INVALID })
			.refine((val) => val >= 20 && val <= 99 && Number.isInteger(val), {
				message: INPUT_YEAR_PART_INVALID,
			}),
	),
	client: requiredChoiceNumberField(),
	date_facture: requiredTextField(1, 100),
	date_echeance: optionalTextField(1, 100).nullable(),
	numero_bon_commande_client: optionalTextField(1, 100).nullable(),
	termes_paiement: optionalTextField(1, 2000).nullable(),
	mode_paiement: optionalNumberField(0).nullable(),
	remarque: optionalTextField(2, 2000).nullable(),
	...supplierSnapshotFields,
	globalError: optionalTextField(1, 500),
});

export const factureProformaSchema = factureClientProformaSchema;

export const factureProformaAddSchema = factureClientProformaAddSchema;

export const bonDeLivraisonSchema = z
	.object({
		numero_part: requiredTextField(1, 15),
		year_part: z.preprocess(
			(val) => {
				if (val === undefined || val === null || val === '') {
					return undefined;
				}
				return Number(val);
			},
			z
				.number({ error: INPUT_YEAR_PART_INVALID })
				.refine((val) => !Number.isNaN(val), { message: INPUT_YEAR_PART_INVALID })
				.refine((val) => val >= 20 && val <= 99 && Number.isInteger(val), {
					message: INPUT_YEAR_PART_INVALID,
				}),
		),
		client: requiredChoiceNumberField(),
		date_bon_livraison: requiredTextField(1, 100),
		date_echeance: optionalTextField(1, 100).nullable(),
		numero_demande_prix_client: optionalTextField(1, 100).nullable(),
		mode_paiement: optionalNumberField(0).nullable(),
		livre_par: optionalNumberField(0).nullable(),
		remarque: optionalTextField(2, 2000).nullable(),
		...supplierSnapshotFields,
		remise_type: z.enum(['Pourcentage', 'Fixe']).optional().nullable(),
		remise: z.preprocess(
			(val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val),
			optionalNumberField(0),
		),
		lignes: z.array(devisLivraisonFactureLineSchema).optional(),
		globalError: optionalTextField(1, 500),
	})
	.superRefine((data, ctx) => {
		const hasRemiseType = data.remise_type !== undefined;
		const rType = data.remise_type ?? 'Pourcentage';
		const remiseVal = data.remise;

		if (hasRemiseType && (remiseVal === undefined || remiseVal === null || Number.isNaN(remiseVal))) {
			ctx.addIssue({
				path: ['remise'],
				code: 'custom',
				message: INPUT_REQUIRED,
			});
			return;
		}

		if (remiseVal !== undefined && remiseVal !== null) {
			if (rType === 'Pourcentage') {
				if (remiseVal < 0 || remiseVal > 100) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: INPUT_REMISE_POURCENTAGE,
					});
				}
			} else {
				if (remiseVal < 0) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: INPUT_REMISE_FIX,
					});
				}
			}
		}
	});

export const bonDeLivraisonAddSchema = z.object({
	numero_part: requiredTextField(1, 15),
	year_part: z.preprocess(
		(val) => {
			if (val === undefined || val === null || val === '') {
				return undefined;
			}
			return Number(val);
		},
		z
			.number({ error: INPUT_YEAR_PART_INVALID })
			.refine((val) => !Number.isNaN(val), { message: INPUT_YEAR_PART_INVALID })
			.refine((val) => val >= 20 && val <= 99 && Number.isInteger(val), {
				message: INPUT_YEAR_PART_INVALID,
			}),
	),
	client: requiredChoiceNumberField(),
	date_bon_livraison: requiredTextField(1, 100),
	date_echeance: optionalTextField(1, 100).nullable(),
	numero_demande_prix_client: optionalTextField(1, 100).nullable(),
	mode_paiement: optionalNumberField(0).nullable(),
	livre_par: optionalNumberField(0).nullable(),
	remarque: optionalTextField(2, 2000).nullable(),
	...supplierSnapshotFields,
	globalError: optionalTextField(1, 500),
});

export const reglementSchema = z.object({
	facture_client: requiredChoiceNumberField(),
	mode_reglement: optionalNumberField(1).nullable(),
	libelle: optionalTextField(1, 255).nullable(),
	observations: optionalTextField(1, 2000).nullable(),
	montant: z.preprocess(
		(val) => {
			if (val === undefined || val === null || val === '') return NaN;
			return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
		},
		z
			.number({ error: INPUT_REQUIRED })
			.refine((val) => !Number.isNaN(val), { error: INPUT_REQUIRED })
			.min(0.01, { error: INPUT_MIN(0.01) }),
	),
	date_reglement: requiredTextField(1, 100),
	globalError: optionalTextField(1, 500),
});

// Add monthly objectives schema to central validation file so other components can reuse it.
export const monthlyObjectivesSchema = z.object({
	objectif_ca: z.preprocess(
		(val) => {
			// accept empty string / undefined and convert to NaN so number validation fails with INPUT_REQUIRED
			if (val === undefined || val === null || val === '') return NaN;
			if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
			return val;
		},
		z
			.number({ error: INPUT_REQUIRED })
			.refine((v) => !Number.isNaN(v), { message: INPUT_REQUIRED })
			.min(0, { message: INPUT_MIN(0) }),
	),
	objectif_ca_eur: z.preprocess(
		(val) => {
			// Allow null/undefined/empty string for optional foreign currency fields
			if (val === undefined || val === null || val === '') return null;
			if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
			return val;
		},
		z
			.number()
			.min(0, { message: INPUT_MIN(0) })
			.nullable()
			.optional(),
	),
	objectif_ca_usd: z.preprocess(
		(val) => {
			// Allow null/undefined/empty string for optional foreign currency fields
			if (val === undefined || val === null || val === '') return null;
			if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
			return val;
		},
		z
			.number()
			.min(0, { message: INPUT_MIN(0) })
			.nullable()
			.optional(),
	),
	objectif_factures: z.preprocess(
		(val) => {
			if (val === undefined || val === null || val === '') return NaN;
			// allow numeric strings
			return Number(val);
		},
		z
			.number({ error: INPUT_REQUIRED })
			.refine((v) => !Number.isNaN(v), { message: INPUT_REQUIRED })
			.refine((v) => Number.isInteger(v), { message: INPUT_QUANTITY_INT })
			.min(0, { message: INPUT_MIN(0) }),
	),
	objectif_conversion: z.preprocess(
		(val) => {
			if (val === undefined || val === null || val === '') return NaN;
			if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
			return val;
		},
		z
			.number({ error: INPUT_REQUIRED })
			.refine((v) => !Number.isNaN(v), { message: INPUT_REQUIRED })
			.min(0, { message: INPUT_MIN(0) })
			.max(100, { message: POURCENTAGE_INPUT_INVALID }),
	),
});

const stockDecimalField = (minimum?: number) =>
	z.preprocess(
		(value) => {
			if (value === undefined || value === null || value === '') return NaN;
			return typeof value === 'string' ? Number(value.replace(',', '.')) : value;
		},
		z
			.number({ error: INPUT_REQUIRED })
			.refine((value) => Number.isFinite(value), { error: INPUT_REQUIRED })
			.refine((value) => minimum === undefined || value >= minimum, { error: INPUT_MIN(minimum ?? 0) }),
	);

export const stockAdjustmentSchema = z.object({
	movement_type: z.enum(['opening', 'adjustment']),
	article: requiredChoiceNumberField(),
	emplacement: requiredChoiceNumberField(),
	quantity: stockDecimalField().refine((value) => value !== 0, {
		error: 'La quantité ne peut pas être nulle',
	}),
	reason: requiredTextField(1, 1000),
	globalError: optionalTextField(1, 500),
});

export const stockReceiptSchema = z.object({
	logistics_order: requiredChoiceNumberField(),
	logistics_line: requiredChoiceNumberField(),
	emplacement: requiredChoiceNumberField(),
	quantity: stockDecimalField(0.001),
	reference: optionalTextField(1, 255).default(''),
	note: optionalTextField(1, 1000).default(''),
	globalError: optionalTextField(1, 500),
});

export const stockInventorySchema = z.object({
	article: requiredChoiceNumberField(),
	emplacement: requiredChoiceNumberField(),
	counted_quantity: stockDecimalField(0),
	reference: optionalTextField(1, 255).default(''),
	note: optionalTextField(1, 1000).default(''),
	globalError: optionalTextField(1, 500),
});

export const logistiqueSupplierSchema = (text: TranslationDictionary['logistique']) =>
	z.object({
		nom: z
			.string({ error: text.supplierRequired })
			.trim()
			.min(1, text.supplierRequired)
			.max(255, text.supplierNameTooLong),
		email: z
			.string()
			.trim()
			.max(254, text.supplierEmailTooLong)
			.refine((value) => !value || z.email().safeParse(value).success, text.supplierInvalidEmail)
			.default(''),
	});

const isFile = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File;
const documentFile = z
	.custom<File>(isFile, {
		error: 'Choisissez un fichier.',
	})
	.refine((file) => !isFile(file) || file.size <= 10 * 1024 * 1024, { error: 'Le fichier ne doit pas dépasser 10 Mo.' })
	.refine((file) => !isFile(file) || /\.(pdf|docx?|xlsx?|png|jpe?g)$/i.test(file.name), {
		error: 'Utilisez un fichier PDF, Word, Excel, JPG ou PNG.',
	})
	.nullable();

const formShape = z.object({
	fournisseur_record: z.string().default(''),
	fournisseur: z.string().default(''),
	fournisseur_email: z.string().default(''),
	marque: z.string().default(''),
	responsable: z.string().default(''),
	date_prevue: z.string().default(''),
	date_commande_client: z.string().default(''),
	numero_proforma_fournisseur: z.string().default(''),
	date_proforma_fournisseur: z.string().default(''),
	montant_proforma_fournisseur: z.string().default(''),
	devise_proforma_fournisseur: z.string().default(''),
	condition_achat: z.string().default(''),
	incoterm: z.string().default(''),
	delai_proforma_jours: z.string().default(''),
	origine_marchandise: z.string().default(''),
	nature_marchandise: z.string().default(''),
	poids_net: z.string().default(''),
	poids_brut: z.string().default(''),
	volume: z.string().default(''),
	ecart_prix_proforma: z.boolean(),
	ecart_quantite_proforma: z.boolean(),
	ecart_autre_proforma: z.boolean(),
	notes_ecarts_proforma: z.string().default(''),
	numero_domiciliation: z.string().default(''),
	banque: z.string().default(''),
	montant_titre_importation: z.string().default(''),
	devise_titre_importation: z.string().default(''),
	date_titre_importation: z.string().default(''),
	date_expedition_prevue: z.string().default(''),
	date_expedition_reelle: z.string().default(''),
	date_arrivee_maroc: z.string().default(''),
	documents_remis_banque_le: z.string().default(''),
	date_reelle: z.string().default(''),
	transport: z.string().default(''),
	documents_originaux_requis: z.boolean(),
	statut_documents_originaux: z.string().default(''),
	cout_transport: z.string().default(''),
	frais_transit: z.string().default(''),
	frais_douane: z.string().default(''),
	tva: z.string().default(''),
	livraison_locale: z.string().default(''),
	autres_frais: z.string().default(''),
	remarque: z.string().default(''),
	note: z.string().default(''),
	reference_reception: z.string().default(''),
	echeance_id: z.string().default(''),
	date_echeance: z.string().default(''),
	date_paiement: z.string().default(''),
	methode_paiement: z.string().default(''),
	montant_paye: z.string().default(''),
	reference_paiement: z.string().default(''),
	commentaire_paiement: z.string().default(''),
	nom: z.string().default(''),
	email_contact: z.string().default(''),
	lignes: z.array(
		z.object({
			article: z.number().nullable(),
			article_reference: z.string().default(''),
			designation: z.string().default(''),
			quantity: z.string().default(''),
			prix_achat: z.string().default(''),
			expected_emplacement: z.number().nullable(),
		}),
	),
	reception_lignes: z.array(
		z.object({
			logistics_line: z.number(),
			article: z.number(),
			article_reference: z.string().default(''),
			designation: z.string().default(''),
			remaining_quantity: z.string().default(''),
			quantity: z.string().default(''),
			emplacement: z.string().default(''),
		}),
	),
	proforma_fournisseur_file: documentFile,
	titre_importation_file: documentFile,
	documents_originaux_file: documentFile,
	justificatifs_file: documentFile,
	swift_file: documentFile,
	fichier: documentFile,
	decision: z.enum(['control', 'request_correction', 'validate', 'reject']),
	confirmer_production: z.boolean(),
	statut: z.string().default(''),
}) satisfies z.ZodType<PurchaseFormValues>;

/** Full Formik value shape; only the selected action's business fields are required. */
export const getSupplierPurchaseSchema = (mode: PurchaseFormMode, context: SupplierPurchaseSchemaContext = {}) =>
	formShape.superRefine((values, ctx) => {
		const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
		const required = (key: keyof PurchaseFormValues, message = 'Ce champ est obligatoire.') => {
			if (!String(values[key] ?? '').trim()) issue([key], message);
		};
		const text = (key: keyof PurchaseFormValues, max: number, mandatory = false) => {
			if (mandatory) required(key);
			if (String(values[key]).length > max) issue([key], `Saisissez au maximum ${max} caractères.`);
		};
		const numeric = (
			value: string,
			path: (string | number)[],
			mandatory = false,
			positive = false,
			decimals = 2,
			max = 9999999999.99,
		) => {
			if (!value.trim()) {
				if (mandatory) issue(path, 'Ce champ est obligatoire.');
				return;
			}
			const pattern = decimals === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`);
			if (
				!pattern.test(value.trim()) ||
				!Number.isFinite(Number(value)) ||
				Number(value) > max ||
				(positive && Number(value) <= 0)
			) {
				issue(path, positive ? 'Saisissez un nombre supérieur à zéro.' : 'Saisissez un nombre positif ou nul.');
			}
		};
		const id = (key: 'responsable' | 'marque' | 'echeance_id', mandatory = true) =>
			numeric(values[key], [key], mandatory, true, 0, Number.MAX_SAFE_INTEGER);
		const email = (key: 'fournisseur_email' | 'email_contact') => {
			if (values[key].trim() && !z.email().safeParse(values[key].trim()).success)
				issue([key], 'Saisissez une adresse e-mail valide.');
		};
		const date = (key: keyof PurchaseFormValues, mandatory = false, actual = false) => {
			const value = String(values[key]);
			if (!value) {
				if (mandatory) required(key);
				return;
			}
			if (!z.iso.date().safeParse(value).success) {
				issue([key], 'Saisissez une date valide.');
				return;
			}
			const now = new Date();
			const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			if (actual && value > localToday) issue([key], 'Une date réelle ne peut pas être dans le futur.');
		};
		const currency = (key: 'devise_proforma_fournisseur' | 'devise_titre_importation') => {
			if (!['MAD', 'EUR', 'USD'].includes(values[key])) issue([key], 'Choisissez une devise.');
		};
		const costs = (
			keys: ('cout_transport' | 'frais_transit' | 'frais_douane' | 'tva' | 'livraison_locale' | 'autres_frais')[],
		) => {
			keys.forEach((key) => numeric(values[key], [key]));
		};

		if (mode === 'dossier') {
			text('fournisseur', 255, true);
			email('fournisseur_email');
			id('responsable');
			id('marque', false);
			date('date_prevue');
			date('date_commande_client');
		} else if (mode === 'proforma') {
			text('numero_proforma_fournisseur', 120, true);
			date('date_proforma_fournisseur', true);
			numeric(values.montant_proforma_fournisseur, ['montant_proforma_fournisseur'], true, true);
			currency('devise_proforma_fournisseur');
			text('incoterm', 50, true);
			numeric(values.delai_proforma_jours, ['delai_proforma_jours'], true, false, 0, 2147483647);
			if (!PURCHASE_CONDITIONS.some(([code]) => code === values.condition_achat))
				issue(['condition_achat'], 'Choisissez une condition d’achat.');
			if (values.condition_achat === 'advance100' && Number(values.montant_proforma_fournisseur) >= 18000) {
				issue(
					['condition_achat'],
					'Le paiement intégral d’avance est réservé aux montants inférieurs à 18 000 dans la devise choisie.',
				);
			}
			if (!values.proforma_fournisseur_file && !context.existingProformaFile)
				issue(['proforma_fournisseur_file'], 'Joignez la proforma fournisseur.');
			text('origine_marchandise', 255);
			text('nature_marchandise', 255);
			numeric(values.poids_net, ['poids_net'], false, false, 2, 99999999.99);
			numeric(values.poids_brut, ['poids_brut'], false, false, 2, 99999999.99);
			numeric(values.volume, ['volume'], false, false, 3, 9999999.999);
			if (!values.lignes.length) issue(['lignes'], 'Ajoutez les articles de la proforma fournisseur.');
			values.lignes.forEach((line, index) => {
				if (!line.article || !Number.isInteger(line.article) || line.article < 1)
					issue(['lignes', index, 'article'], 'Choisissez un article.');
				numeric(line.quantity, ['lignes', index, 'quantity'], true, true, 3, 9999999.999);
				numeric(line.prix_achat, ['lignes', index, 'prix_achat'], true, false, 2, 99999999.99);
			});
			const anomaly = values.ecart_prix_proforma || values.ecart_quantite_proforma || values.ecart_autre_proforma;
			if (values.decision === 'request_correction' && !anomaly)
				issue(['ecart_autre_proforma'], 'Signalez au moins une anomalie avant de demander une correction.');
			if (values.decision === 'validate' && anomaly)
				issue(['notes_ecarts_proforma'], 'Corrigez les anomalies avant de valider la proforma.');
			if (values.decision === 'request_correction' || values.decision === 'reject')
				required('notes_ecarts_proforma', 'Expliquez les anomalies ou le motif du refus.');
		} else if (mode === 'titre') {
			text('numero_domiciliation', 120, true);
			text('banque', 255, true);
			numeric(values.montant_titre_importation, ['montant_titre_importation'], true, true);
			currency('devise_titre_importation');
			date('date_titre_importation', true);
			if (!values.titre_importation_file && !context.existingTitleFile)
				issue(['titre_importation_file'], 'Joignez le titre d’importation.');
		} else if (mode === 'production') {
			date('date_expedition_prevue', true);
		} else if (mode === 'expedition') {
			date('date_expedition_reelle', true, true);
			text('transport', 100);
		} else if (mode === 'transit') {
			date('date_arrivee_maroc', false, true);
			date('documents_remis_banque_le', false, true);
			if (
				values.date_arrivee_maroc &&
				values.date_expedition_reelle &&
				values.date_arrivee_maroc < values.date_expedition_reelle
			)
				issue(['date_arrivee_maroc'], 'L’arrivée au Maroc doit suivre l’expédition.');
			costs(['cout_transport', 'frais_transit', 'frais_douane', 'tva']);
		} else if (mode === 'reception') {
			text('reference_reception', 80);
			if (context.managedReceipt) {
				if (!values.reception_lignes.some((line) => Number(line.quantity) > 0))
					issue(['reception_lignes'], 'Renseignez au moins une quantité reçue.');
				values.reception_lignes.forEach((line, index) => {
					numeric(line.quantity, ['reception_lignes', index, 'quantity'], false, false, 3, 999999999.999);
					if (Number(line.quantity) > 0) {
						if (Number(line.quantity) > Number(line.remaining_quantity))
							issue(['reception_lignes', index, 'quantity'], 'La quantité reçue dépasse la quantité restante.');
						numeric(
							line.emplacement,
							['reception_lignes', index, 'emplacement'],
							true,
							true,
							0,
							Number.MAX_SAFE_INTEGER,
						);
					}
				});
			} else {
				date('date_reelle', true, true);
				if (values.date_reelle && values.date_expedition_reelle && values.date_reelle < values.date_expedition_reelle)
					issue(['date_reelle'], 'La réception doit suivre l’expédition.');
			}
		} else if (mode === 'couts') {
			costs(['cout_transport', 'frais_transit', 'frais_douane', 'tva', 'livraison_locale', 'autres_frais']);
		} else if (mode === 'demande_paiement') {
			id('echeance_id');
			date('date_echeance', true);
		} else if (mode === 'paiement') {
			id('echeance_id');
			date('date_paiement', true, true);
			if (!logistiquePaymentMethodItemsList.some((method) => method !== '' && method === values.methode_paiement))
				issue(['methode_paiement'], 'Choisissez une méthode de paiement.');
			numeric(values.montant_paye, ['montant_paye'], true, true);
			if (context.maxPayment !== undefined && Number(values.montant_paye) > context.maxPayment)
				issue(['montant_paye'], 'Le montant payé dépasse le montant restant de cette échéance.');
			text('reference_paiement', 120);
		} else if (mode === 'justificatif') {
			id('echeance_id');
			if (!values.swift_file) issue(['swift_file'], 'Joignez le justificatif bancaire.');
		} else if (mode === 'remarque') {
			required('remarque', 'Renseignez votre remarque.');
		} else if (mode === 'repertoire') {
			text('nom', 255, true);
			email('email_contact');
		}
	});
