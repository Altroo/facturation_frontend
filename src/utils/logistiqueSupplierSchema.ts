import z from 'zod';
import type { TranslationDictionary } from '@/types/languageTypes';

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
