import { z } from 'zod';
import {
	INPUT_MAX,
	INPUT_MIN,
	INPUT_PASSWORD_MIN,
	INPUT_PHONE,
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

const optionalTextField = (min: number, max: number) =>
	z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? undefined : val),
		z
			.string()
			.min(min, { error: INPUT_MIN(min) })
			.max(max, { error: INPUT_MAX(max) })
			.optional(),
	);

export const loginSchema = z.object({
	email: z.email({ error: MINI_INPUT_EMAIL }),
	password: passwordField,
	globalError: z.string().optional(),
});

export const emailSchema = z.object({
	email: z.email({ error: MINI_INPUT_EMAIL }),
	globalError: z.string().optional(),
});

export const passwordResetConfirmationSchema = z.object({
	new_password: passwordField,
	new_password2: passwordField,
	globalError: z.string().optional(),
});

const singleDigit = z
	.string()
	.min(1, { error: SHORT_INPUT_REQUIRED })
	.regex(/^\d$/, { error: SHORT_INPUT_REQUIRED })
	.transform((val) => Number(val));

export const passwordResetCodeSchema = z.object({
	one: singleDigit,
	two: singleDigit,
	three: singleDigit,
	four: singleDigit,
	globalError: z.string().optional(),
});

export const profilSchema = z.object({
	first_name: requiredTextField(2, 30),
	last_name: requiredTextField(2, 30),
	gender: z.string().optional(),
	avatar: base64ImageField,
	avatar_cropped: base64ImageField,
});

export const changePasswordSchema = z.object({
	old_password: passwordField,
	new_password: passwordField,
	new_password2: passwordField,
});

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

export const companySchema = z.object({
	// REQUIRED FIELDS
	raison_sociale: requiredTextField(2, 255),
	ICE: requiredTextField(2, 100),
	nbr_employe: requiredChoiceField(),

	// OPTIONAL FIELDS
	email: optionalEmailField,
	civilite_responsable: z.string().optional(),
	nom_responsable: optionalTextField(2, 255),
	gsm_responsable: optionalPhoneField,
	adresse: z.string().optional(),
	telephone: optionalPhoneField,
	fax: optionalPhoneField,
	site_web: optionalUrlField,
	numero_du_compte: z.string().optional(),
	registre_de_commerce: z.string().optional(),
	identifiant_fiscal: z.string().optional(),
	tax_professionnelle: z.string().optional(),
	CNSS: z.string().optional(),
	managed_by: z
		.array(
			z.object({
				pk: z.number(),
				role: z.string(),
			}),
		)
		.optional(),
	logo: base64ImageField,
	logo_cropped: base64ImageField,
	cachet: base64ImageField,
	cachet_cropped: base64ImageField,
	globalError: z.string().optional(),
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
	globalError: z.string().optional(),
});

export const pmRequired = ['raison_sociale', 'ville', 'ICE', 'registre_de_commerce', 'delai_de_paiement'] as const;
export const ppRequired = ['nom', 'prenom', 'adresse', 'ville', 'tel', 'delai_de_paiement'] as const;

export const clientSchema = z
	.object({
		client_type: z.enum(['PM', 'PP']),
		code_client: requiredTextField(1, 100), // required string with min/max
		company: z.number(),

		// optional fields
		raison_sociale: optionalTextField(2, 255),
		nom: optionalTextField(2, 255),
		prenom: optionalTextField(2, 255),
		adresse: optionalTextField(2, 255).nullable(),
		ville: z.number().nullable().optional(),
		tel: optionalPhoneField,
		email: optionalEmailField,
		delai_de_paiement: z.preprocess(
			(val) => (val === '' || val === null || val === undefined ? null : Number(val)),
			z.number().int().positive().nullable().optional(),
		),
		remarque: optionalTextField(2, 500).nullable(),

		numero_du_compte: optionalTextField(2, 100).nullable(),
		ICE: optionalTextField(2, 100).nullable(),
		registre_de_commerce: optionalTextField(2, 100).nullable(),
		identifiant_fiscal: optionalTextField(2, 100).nullable(),
		taxe_professionnelle: optionalTextField(2, 100).nullable(),
		CNSS: optionalTextField(2, 100).nullable(),

		globalError: z.string().optional(),
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
	company: z.number(),
	// optional fields
	photo: base64ImageField,
	photo_cropped: base64ImageField,
	emplacement: z.number().nullable().optional(),
	marque: z.number().nullable().optional(),
	categorie: z.number().nullable().optional(),
	unite: z.number().nullable().optional(),
	prix_achat: z.number().nullable().optional(),
	prix_vente: z.number().nullable().optional(),
	tva: z.number().nullable().optional(),
	remarque: optionalTextField(2, 500).nullable(),
	globalError: z.string().optional(),
});
