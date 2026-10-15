import { calculateSalePriceHT, calculateSalePriceTTC } from './articlePricing';
import { articleSchema } from './formValidationSchemas';

describe('article HT/TTC pricing', () => {
	it.each([
		[120, 20, 100],
		[110, 10, 100],
		[107, 7, 100],
		[100, 0, 100],
		[17.49, 20, 14.58],
		[1.23, 20, 1.03],
		[1234.56, 20, 1028.8],
		[0, 20, 0],
	])('converts %s TTC at %s%% VAT to %s HT', (ttc, tva, ht) => {
		expect(calculateSalePriceHT(ttc, tva, 'TTC')).toBe(ht);
	});

	it('keeps existing HT prices unchanged', () => {
		expect(calculateSalePriceHT(150.25, 20)).toBe(150.25);
	});

	it.each([
		[100, 20, 120],
		[100, 10, 110],
		[100, 0, 100],
		[10.05, 10, 11.06],
	])('calculates %s HT at %s%% VAT as %s TTC', (ht, tva, ttc) => {
		expect(calculateSalePriceTTC(ht, tva)).toBe(ttc);
	});

	it.each([
		['HT', 120, 20, true],
		['TTC', 120, 20, false],
		['TTC', 132, 20, true],
		['TTC', 120, 0, true],
	])('compares %s selling prices with the HT purchase price', (basis, price, tva, valid) => {
		const result = articleSchema.safeParse({
			type_article: 'Produit',
			reference: 'PRICE-TEST',
			designation: 'Article test',
			company: 1,
			prix_achat: 105,
			prix_vente: price,
			prix_vente_base: basis,
			tva,
		});
		expect(result.success).toBe(valid);
		if (!result.success) expect(result.error.issues[0].path).toEqual(['prix_vente']);
	});
});
