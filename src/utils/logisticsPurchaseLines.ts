import type { ArticleClass } from '@/models/classes';
import type { PurchaseFormValues, PurchaseLineValues } from '@/types/supplierPurchaseTypes';

export const purchaseLineFromArticle = (
	article: Partial<ArticleClass> | undefined,
	currency: string,
	quantity = '1',
): PurchaseLineValues => ({
	article: article?.id ?? null,
	article_reference: article?.reference ?? '',
	designation: article?.designation ?? '',
	quantity,
	prix_achat: article?.devise_prix_achat === currency ? String(article.prix_achat ?? '') : '',
	expected_emplacement: article?.emplacement ?? null,
	origin_name: article?.emplacement_name ?? '',
	brand_name: article?.marque_name ?? '',
});

export function withPurchaseLines(
	values: PurchaseFormValues,
	lines: PurchaseLineValues[],
	articles: Partial<ArticleClass>[] = [],
): PurchaseFormValues {
	const names = (items: PurchaseLineValues[], key: 'origin_name' | 'brand_name') =>
		[
			...new Set(
				items
					.map(
						(line) =>
							line[key] ||
							articles.find((article) => article.id === line.article)?.[
								key === 'origin_name' ? 'emplacement_name' : 'marque_name'
							],
					)
					.filter(Boolean),
			),
		].join(', ');
	return {
		...values,
		lignes: lines,
		origine_marchandise:
			!values.origine_marchandise || values.origine_marchandise === names(values.lignes, 'origin_name')
				? names(lines, 'origin_name')
				: values.origine_marchandise,
		nature_marchandise:
			!values.nature_marchandise || values.nature_marchandise === names(values.lignes, 'brand_name')
				? names(lines, 'brand_name')
				: values.nature_marchandise,
	};
}

export function purchaseLinesInCurrency(
	values: PurchaseFormValues,
	currency: string,
	articles: Partial<ArticleClass>[],
): PurchaseFormValues {
	return {
		...values,
		devise_proforma_fournisseur: currency,
		lignes: values.lignes.map((line) => {
			const article = articles.find((item) => item.id === line.article);
			return { ...line, prix_achat: article?.devise_prix_achat === currency ? String(article.prix_achat ?? '') : '' };
		}),
	};
}
