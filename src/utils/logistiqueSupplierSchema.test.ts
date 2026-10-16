import { prepareDataForValidation } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { logistiqueSupplierSchema } from './logistiqueSupplierSchema';
import { fr } from '@/translations/fr';

const schema = logistiqueSupplierSchema(fr.logistique);
const formikSchema = toFormikValidationSchema(schema);

test('optional email stays optional after Formik prepares empty values', async () => {
	await expect(
		formikSchema.validate(prepareDataForValidation({ nom: 'Fournisseur', email: '' })),
	).resolves.toBeUndefined();
});

test('empty name and malformed email have clear validation messages', async () => {
	await expect(formikSchema.validate(prepareDataForValidation({ nom: '', email: '' }))).rejects.toMatchObject({
		inner: expect.arrayContaining([expect.objectContaining({ path: 'nom', message: fr.logistique.supplierRequired })]),
	});
	expect(schema.safeParse({ nom: '  ', email: '' }).success).toBe(false);
	expect(schema.safeParse({ nom: 'Test', email: 'wrong' }).success).toBe(false);
	expect(schema.safeParse({ nom: 'x'.repeat(256), email: '' }).success).toBe(false);
});

test('values trim surrounding spaces and accept a valid email', () => {
	expect(schema.parse({ nom: '  Fournisseur  ', email: '  contact@example.com  ' })).toEqual({
		nom: 'Fournisseur',
		email: 'contact@example.com',
	});
});
