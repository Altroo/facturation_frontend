import {
	NECTAR_RAISON_SOCIALE,
	calculateNectarPrixTTC,
	isNectarRaisonSociale,
	normalizeCompanyName,
} from '@/utils/nectar';

describe('nectar utilities', () => {
	it('normalizes company names before comparison', () => {
		expect(normalizeCompanyName('  Immobiliere Nectar ')).toBe(NECTAR_RAISON_SOCIALE);
		expect(normalizeCompanyName(null)).toBe('');
		expect(normalizeCompanyName(undefined)).toBe('');
		expect(isNectarRaisonSociale(' immobiliere nectar ')).toBe(true);
		expect(isNectarRaisonSociale('Another company')).toBe(false);
	});

	it('calculates the tax-inclusive Nectar price from numeric and string values', () => {
		expect(calculateNectarPrixTTC(100, 20)).toBe(120);
		expect(calculateNectarPrixTTC('250', '10')).toBeCloseTo(275);
		expect(calculateNectarPrixTTC(null, null)).toBe(0);
	});

	it('handles invalid price and tax values', () => {
		expect(calculateNectarPrixTTC('invalid', 20)).toBe(0);
		expect(calculateNectarPrixTTC(100, 'invalid')).toBe(100);
	});
});
