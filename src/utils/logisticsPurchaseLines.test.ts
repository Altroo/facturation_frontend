import { purchaseLineFromArticle, withPurchaseLines, purchaseLinesInCurrency } from './logisticsPurchaseLines';
import type { PurchaseFormValues } from '@/types/supplierPurchaseTypes';
const article = {
	id: 1,
	reference: 'ARTICLE',
	designation: 'Article',
	prix_achat: 20,
	devise_prix_achat: 'EUR' as const,
	emplacement: 1,
	emplacement_name: 'Italie',
	marque_name: 'Marque A',
};
const line = purchaseLineFromArticle(article, 'EUR');
const values = { lignes: [], origine_marchandise: '', nature_marchandise: '' } as unknown as PurchaseFormValues;
it('prefills the unit price only in the matching currency', () => {
	expect(line.prix_achat).toBe('20');
	expect(purchaseLineFromArticle(article, 'MAD').prix_achat).toBe('');
});
it('derives defaults on addition and removes obsolete defaults when a line is removed', () => {
	const first = withPurchaseLines(values, [line]);
	const second = purchaseLineFromArticle(
		{ ...article, id: 2, emplacement_name: 'Espagne', marque_name: 'Marque B' },
		'EUR',
	);
	const both = withPurchaseLines(first, [line, second]);
	expect(both.origine_marchandise).toBe('Italie, Espagne');
	expect(both.nature_marchandise).toBe('Marque A, Marque B');
	expect(withPurchaseLines(both, [second])).toEqual(
		expect.objectContaining({ origine_marchandise: 'Espagne', nature_marchandise: 'Marque B' }),
	);
});
it('retains manually edited origin and nature when selections change', () => {
	const manual = {
		...withPurchaseLines(values, [line]),
		origine_marchandise: 'Origine vérifiée',
		nature_marchandise: 'Nature vérifiée',
	};
	expect(withPurchaseLines(manual, [])).toEqual(
		expect.objectContaining({ origine_marchandise: 'Origine vérifiée', nature_marchandise: 'Nature vérifiée' }),
	);
});
it('keeps selected metadata when search results move to another page', () => {
	expect(withPurchaseLines({ ...values, lignes: [line] }, [line], []).origine_marchandise).toBe('Italie');
});

it('does not carry a price into a different currency and restores the matching catalog price', () => {
	const selected = { ...values, lignes: [line] };
	const mad = purchaseLinesInCurrency(selected, 'MAD', [article]);
	expect(mad.lignes[0].prix_achat).toBe('');
	expect(purchaseLinesInCurrency(mad, 'EUR', [article]).lignes[0].prix_achat).toBe('20');
});
