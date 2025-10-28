import {z} from "zod";
import {INPUT_PASSWORD_MIN, MINI_INPUT_EMAIL, SHORT_INPUT_REQUIRED} from "@/utils/formValidationErrorMessages";

export const loginSchema = z.object({
  email: z.email({ message: MINI_INPUT_EMAIL }).nonempty("Required"),
  password: z.string({ message: INPUT_PASSWORD_MIN(8) }).nonempty("Required").min(8),
  globalError: z.string().optional(),
});

export const emailSchema= z.object({
  email: z.email({ message: MINI_INPUT_EMAIL }).nonempty("Required"),
  globalError: z.string().optional(),
});

export const passwordResetConfirmationSchema = z.object({
  new_password: z.string({ message: INPUT_PASSWORD_MIN(8) }).nonempty("Required").min(8),
  new_password2: z.string({ message: INPUT_PASSWORD_MIN(8) }).nonempty("Required").min(8),
  globalError: z.string().optional(),
});

const singleDigit = z
  .string()
  .nonempty({ message: SHORT_INPUT_REQUIRED })        // required
  .regex(/^\d$/, { message: SHORT_INPUT_REQUIRED })   // exactly one digit 0–9
  .transform((val) => Number(val));             // convert to number if needed

export const passwordResetCodeSchema = z.object({
  one: singleDigit,
  two: singleDigit,
  three: singleDigit,
  four: singleDigit,
  globalError: z.string().optional(),
});