export type SalePriceBasis = 'HT' | 'TTC';

export const calculateSalePriceHT = (price: number, tva: number, basis: SalePriceBasis = 'HT'): number => {
	if (basis === 'HT') return price;
	// Work in cents and VAT basis points so half-cent results round consistently.
	const cents = Math.round(price * 100);
	const taxFactor = 10_000 + Math.round(tva * 100);
	return Math.round((cents * 10_000) / taxFactor) / 100;
};

export const calculateSalePriceTTC = (priceHT: number, tva: number): number => {
	const cents = Math.round(priceHT * 100);
	const taxFactor = 10_000 + Math.round(tva * 100);
	return Math.round((cents * taxFactor) / 10_000) / 100;
};
