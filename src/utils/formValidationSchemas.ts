import {z} from "zod";
import {
  INPUT_MAX,
  INPUT_MIN,
  INPUT_PASSWORD_MIN,
  INPUT_REQUIRED,
  MINI_INPUT_EMAIL,
  SHORT_INPUT_REQUIRED
} from "@/utils/formValidationErrorMessages";

const passwordField = z.preprocess(
  (val) => (val === undefined ? "" : val),
  z.string()
    .min(8, { error: INPUT_PASSWORD_MIN(8) })
    .nonempty({ error: INPUT_REQUIRED })
);

const userNameField = z.preprocess(
  (val) => (val === undefined ? "" : val),
  z.string()
    .min(2, { error: INPUT_MIN(2) }).max(30, { error: INPUT_MAX(30) })
    .nonempty({ error: INPUT_REQUIRED })
);

export const loginSchema = z.object({
  email: z.email({ error: MINI_INPUT_EMAIL }).nonempty({ error: INPUT_REQUIRED }),
  password: passwordField,
  globalError: z.string().optional(),
});

export const emailSchema= z.object({
  email: z.email({ error: MINI_INPUT_EMAIL }).nonempty({ error: INPUT_REQUIRED }),
  globalError: z.string().optional(),
});

export const passwordResetConfirmationSchema = z.object({
  new_password: passwordField,
  new_password2: passwordField,
  globalError: z.string().optional(),
});

const singleDigit = z
  .string()
  .nonempty({ error: SHORT_INPUT_REQUIRED })        // required
  .regex(/^\d$/, { error: SHORT_INPUT_REQUIRED })   // exactly one digit 0–9
  .transform((val) => Number(val));             // convert to number if needed

export const passwordResetCodeSchema = z.object({
  one: singleDigit,
  two: singleDigit,
  three: singleDigit,
  four: singleDigit,
  globalError: z.string().optional(),
});

export const profilSchema = z.object({
  first_name: userNameField,
  last_name: userNameField,
});

export const changePasswordSchema = z.object({
  old_password: passwordField,
  new_password: passwordField,
  new_password2: passwordField,
});
