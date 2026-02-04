export type TypeArticleType = 'Produit' | 'Service';

export type CurrencyType = 'MAD' | 'EUR' | 'USD';

export type ImportArticlesResponseType = {
	total: number;
	created: number;
	errors: { row: number; message: string }[];
};

export type ArticleSchemaType = {
	type_article: TypeArticleType;
	photo: string | ArrayBuffer;
	photo_cropped: string | ArrayBuffer;
	reference: string;
	company: number;
	emplacement?: number | null;
	marque?: number | null;
	categorie?: number | null;
	unite?: number | null;
	designation?: string;
	prix_achat?: number;
	devise_prix_achat?: CurrencyType;
	prix_vente?: number;
	tva?: number;
	remarque?: string;
	globalError?: string;
};
