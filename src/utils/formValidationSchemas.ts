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
			}),
		)
		.optional(),
	logo: base64ImageField,
	logo_cropped: base64ImageField,
	cachet: base64ImageField,
	cachet_cropped: base64ImageField,
	uses_foreign_currency: z.boolean().default(false),
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
			}),
		)
		.optional(),
	avatar: base64ImageField,
	avatar_cropped: base64ImageField,
	globalError: optionalTextField(1, 500),
});

export const pmRequired = ['raison_sociale', 'ville', 'ICE', 'registre_de_commerce', 'delai_de_paiement'] as const;
export const ppRequired = ['nom', 'prenom', 'adresse', 'ville', 'tel', 'delai_de_paiement'] as const;

export const clientSchema = z
	.object({
		client_type: z.enum(['PM', 'PP']),
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
		remarque: optionalTextField(2, 500).nullable(),
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
						message:
							key === 'raison_sociale'
								? INPUT_REQUIRED
								: key === 'ville'
									? INPUT_REQUIRED
									: key === 'ICE'
										? INPUT_REQUIRED
										: key === 'registre_de_commerce'
											? INPUT_REQUIRED
											: INPUT_REQUIRED,
					});
				}
			});
		} else {
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
						message:
							key === 'nom'
								? INPUT_REQUIRED
								: key === 'prenom'
									? INPUT_REQUIRED
									: key === 'adresse'
										? INPUT_REQUIRED
										: key === 'ville'
											? INPUT_REQUIRED
											: key === 'tel'
												? INPUT_REQUIRED
												: INPUT_REQUIRED,
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
		tva: optionalTVANumberField(0),
		remarque: optionalTextField(2, 500).nullable(),
		globalError: optionalTextField(1, 500),
	})
	.refine(
		(data) => {
			const a = data.prix_achat;
			const v = data.prix_vente;
			if (a === undefined || a === null || v === undefined || v === null) return true;
			return v > a;
		},
		{ error: INPUT_PRICE_VENTE_ACHAT, path: ['prix_vente'] },
	);

export const devisLivraisonFactureLineSchema = z
	.object({
		article: requiredNumberField(1),
		prix_achat: optionalNumberField(0).nullable(),
		devise_prix_achat: z.string().default('MAD'),
		prix_vente: optionalNumberField(0).nullable(),
		quantity: requiredNumberField(1).refine((val) => Number.isInteger(val), {
			error: INPUT_QUANTITY_INT,
		}),
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
		numero_demande_prix_client: optionalTextField(1, 100).nullable(),
		mode_paiement: optionalNumberField(0).nullable(),
		remarque: optionalTextField(2, 500).nullable(),
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
	numero_demande_prix_client: optionalTextField(1, 100).nullable(),
	mode_paiement: optionalNumberField(0).nullable(),
	remarque: optionalTextField(2, 500).nullable(),
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
		numero_bon_commande_client: optionalTextField(1, 100).nullable(),
		mode_paiement: optionalNumberField(0).nullable(),
		remarque: optionalTextField(2, 500).nullable(),
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
	numero_bon_commande_client: optionalTextField(1, 100).nullable(),
	mode_paiement: optionalNumberField(0).nullable(),
	remarque: optionalTextField(2, 500).nullable(),
	globalError: optionalTextField(1, 500),
});

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
		numero_demande_prix_client: optionalTextField(1, 100).nullable(),
		mode_paiement: optionalNumberField(0).nullable(),
		livre_par: optionalNumberField(0).nullable(),
		remarque: optionalTextField(2, 500).nullable(),
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
	numero_demande_prix_client: optionalTextField(1, 100).nullable(),
	mode_paiement: optionalNumberField(0).nullable(),
	livre_par: optionalNumberField(0).nullable(),
	remarque: optionalTextField(2, 500).nullable(),
	globalError: optionalTextField(1, 500),
});

export const reglementSchema = z.object({
	facture_client: requiredChoiceNumberField(),
	mode_reglement: optionalNumberField(1).nullable(),
	libelle: optionalTextField(1, 255).nullable(),
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
	date_echeance: requiredTextField(1, 100),
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
		z.number({ error: INPUT_REQUIRED }).refine((v) => !Number.isNaN(v), { message: INPUT_REQUIRED })
			.min(0, { message: INPUT_MIN(0) }),
	),
	objectif_ca_eur: z.preprocess(
		(val) => {
			// Allow null/undefined/empty string for optional foreign currency fields
			if (val === undefined || val === null || val === '') return null;
			if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
			return val;
		},
		z.number().min(0, { message: INPUT_MIN(0) }).nullable().optional(),
	),
	objectif_ca_usd: z.preprocess(
		(val) => {
			// Allow null/undefined/empty string for optional foreign currency fields
			if (val === undefined || val === null || val === '') return null;
			if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
			return val;
		},
		z.number().min(0, { message: INPUT_MIN(0) }).nullable().optional(),
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

