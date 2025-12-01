export type TypeArticleType = 'Produit' | 'Service';

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
	prix_vente?: number;
	tva?: number;
	remarque?: string;
	globalError?: string;
};
