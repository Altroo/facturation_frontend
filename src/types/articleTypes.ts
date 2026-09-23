import type { SessionProps } from '@/types/_initTypes';
import type { FC, ReactNode } from 'react';
import type { ArticleClass } from '@/models/classes';
import type { TypeRemiseType } from '@/types/devisTypes';

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
	devise_prix_vente?: CurrencyType;
	tva?: number;
	stock_minimum?: number;
	remarque?: string;
	globalError?: string;
};

export type ArticlesFormFormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
};

export interface ArticlesFormProps extends SessionProps {
	company_id: number;
	id?: number;
}

export interface ArticlesListFormikContentProps extends SessionProps {
	company_id: number;
	archived: boolean;
	role: string;
}

export interface ArticlesListProps extends SessionProps {
	archived: boolean;
}

export interface ArticlesViewInfoRowProps {
	icon: ReactNode;
	label: string;
	value: string | number | null | undefined | ReactNode;
}

export interface ArticlesViewProps extends SessionProps {
	company_id: number;
	id: number;
}

export interface ClientArticleWrapperFormProps extends SessionProps {
	company_id: number;
	id?: number;
	entityName: 'article' | 'client';
	FormikComponent: FC<{ token?: string; id?: number; company_id: number; company_raison_sociale?: string }>;
}

export interface SelectedArticlePopupValues {
	articleId: number;
	articleData: Partial<ArticleClass>;
	quantity: string | number;
	remise_type: TypeRemiseType;
	remise: string | number;
}

export type ArticlePopupValues = {
	quantity: string | number;
	remise_type: TypeRemiseType;
	remise: string | number;
};

export interface AddArticleModalProps {
	open: boolean;
	onClose: () => void;
	companyId: number;
	selectedArticles: Set<number>;
	setSelectedArticles: (selection: Set<number>) => void;
	onAdd: (selectedArticlesData: SelectedArticlePopupValues[]) => void;
	existingArticleIds: Set<number>;
	existingArticleLineValues?: Record<number, ArticlePopupValues>;
	documentDevise?: string;
	disableRemise?: boolean;
}
