import z from 'zod/v4';
import {
	INPUT_MAX,
	INPUT_MIN,
	INPUT_PASSWORD_MIN,
	INPUT_PHONE,
	INPUT_PRICE_VENTE_ACHAT,
	INPUT_QUANTITY_INT,
	INPUT_REQUIRED,
	MINI_INPUT_EMAIL,
	SHORT_INPUT_REQUIRED,
} from '@/utils/formValidationErrorMessages';
import { ClientSchemaType } from '@/types/clientTypes';

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
	z.url({ error: 'URL invalide' }).optional(),
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

const requiredChoiceField = () =>
	z.preprocess((val) => (val === undefined ? '' : val), z.string().nonempty({ error: INPUT_REQUIRED }));

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
	nbr_employe: requiredChoiceField(),

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
	globalError: optionalTextField(1, 500),
});

export const userSchema = z.object({
	// REQUIRED FIELDS
	first_name: requiredTextField(2, 255),
	last_name: requiredTextField(2, 255),
	email: z.email({ error: MINI_INPUT_EMAIL }),
	gender: requiredChoiceField(),
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
		delai_de_paiement: optionalNumberField(1).nullable(),
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
								? 'Raison sociale requise'
								: key === 'ville'
									? 'Ville requise'
									: key === 'ICE'
										? 'ICE requis'
										: key === 'registre_de_commerce'
											? 'Registre de commerce requis'
											: 'Délai de paiement requis',
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
								? 'Nom requis'
								: key === 'prenom'
									? 'Prénom requis'
									: key === 'adresse'
										? 'Adresse requise'
										: key === 'ville'
											? 'Ville requise'
											: key === 'tel'
												? 'Téléphone requis'
												: 'Délai de paiement requis',
					});
				}
			});
		}
	});

export const articleSchema = z.object({
	type_article: z.enum(['Produit', 'Service']),
	reference: requiredTextField(1, 100),
	designation: requiredTextField(1, 500),
	company: requiredNumberField(1),
	// optional fields
	photo: base64ImageField,
	photo_cropped: base64ImageField,
	emplacement: optionalNumberField(1).nullable(),
	marque: optionalNumberField(1).nullable(),
	categorie: optionalNumberField(1).nullable(),
	unite: optionalNumberField(1).nullable(),
	prix_achat: optionalNumberField(0).nullable(),
	prix_vente: optionalNumberField(0).nullable(),
	tva: optionalNumberField(0).nullable(),
	remarque: optionalTextField(2, 500).nullable(),
	globalError: optionalTextField(1, 500),
});

export const devisLineSchema = z
	.object({
		article: requiredNumberField(1),
		prix_achat: requiredNumberField(0),
		prix_vente: requiredNumberField(0),
		quantity: requiredNumberField(1).refine((val) => Number.isInteger(val), {
			error: INPUT_QUANTITY_INT,
		}),
		remise_type: z.enum(['Pourcentage', 'Fixe']).optional().nullable(),
		remise: optionalNumberField(0), // now optional
	})
	.refine((data) => data.prix_vente >= data.prix_achat, {
		error: INPUT_PRICE_VENTE_ACHAT,
		path: ['prix_vente'],
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
			if (!Number.isInteger(remiseVal)) {
				ctx.addIssue({
					path: ['remise'],
					code: 'custom',
					message: 'La remise doit être un entier.',
				});
				return;
			}

			if (rType === 'Pourcentage') {
				if (remiseVal < 0 || remiseVal > 100) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: 'La remise en pourcentage doit être entre 0 et 100.',
					});
				}
			} else {
				if (remiseVal < 0) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: 'La remise fixe doit être positive ou nulle.',
					});
				}
			}
		}
	});

export const deviSchema = z
	.object({
		numero_devis: requiredTextField(1, 20),
		client: requiredNumberField(1),
		date_devis: requiredTextField(1, 100),
		numero_demande_prix_client: optionalTextField(1, 100).nullable(),
		mode_paiement: optionalNumberField(0).nullable(),
		remarque: optionalTextField(2, 500).nullable(),
		remise_type: z.enum(['Pourcentage', 'Fixe']).optional().nullable(),
		remise: optionalNumberField(0),
		lignes: z.array(devisLineSchema).optional(),
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
			if (!Number.isInteger(remiseVal)) {
				ctx.addIssue({
					path: ['remise'],
					code: 'custom',
					message: 'La remise doit être un entier.',
				});
				return;
			}

			if (rType === 'Pourcentage') {
				if (remiseVal < 0 || remiseVal > 100) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: 'La remise en pourcentage doit être entre 0 et 100.',
					});
				}
			} else {
				if (remiseVal < 0) {
					ctx.addIssue({
						path: ['remise'],
						code: 'custom',
						message: 'La remise fixe doit être positive ou nulle.',
					});
				}
			}
		}
	});

export const deviAddSchema = z.object({
	numero_devis: requiredTextField(1, 20),
	client: requiredNumberField(1),
	date_devis: requiredTextField(1, 100),
	numero_demande_prix_client: optionalTextField(1, 100).nullable(),
	mode_paiement: optionalNumberField(1).nullable(),
	remarque: optionalTextField(2, 500).nullable(),
	globalError: optionalTextField(1, 500),
});
