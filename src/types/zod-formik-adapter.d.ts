import type { ZodTypeAny } from 'zod';

declare module 'zod-formik-adapter' {
	export function toFormikValidationSchema<S extends ZodTypeAny>(
		schema: S,
	): {
		validate(values: unknown): Promise<void>;
	};
}
