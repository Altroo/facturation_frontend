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
});

export const changePasswordSchema = z.object({
	old_password: passwordField,
	new_password: passwordField,
	new_password2: passwordField,
});

const base64ImageField = z.url().or(z.string().startsWith('data:image/')).nullable().optional();

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
	nbr_employe: z.string().min(1, { error: INPUT_REQUIRED }),

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
