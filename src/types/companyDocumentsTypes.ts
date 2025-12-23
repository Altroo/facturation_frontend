import { TypeRemiseType } from '@/types/devisTypes';
import type { SessionProps } from '@/types/_initTypes';

type Ligne = {
	article: number;
	designation?: string | null;
	prix_achat?: number | string | null;
	prix_vente?: number | string | null;
	quantity?: number | string | null;
	remise?: number | string | null;
	remise_type?: TypeRemiseType | null;
};

type TotalsFields = {
	total_ht?: number | string | null;
	total_tva?: number | string | null;
	total_ttc?: number | string | null;
	total_ttc_apres_remise?: number | string | null;
};

type GlobalRemiseFields = {
	remise?: number | string | null;
	remise_type?: TypeRemiseType | null;
};

type MetadataFields = {
	date_created?: string | null;
	date_updated?: string | null;
	created_by_user_name?: string | null;
};

export type CompanyDocumentData = TotalsFields &
	GlobalRemiseFields &
	MetadataFields & {
		lignes?: Ligne[] | null;
		statut?: string | null;
		client_name?: string | null;
		mode_paiement_name?: string | null;
		remarque?: string | null;
	};

export type Totals = {
	totalHT: number;
	totalTVA: number;
	totalTTC: number;
	totalTTCApresRemise: number;
};

type QueryResult<TData> = {
	data?: TData;
	isLoading: boolean;
	error?: unknown;
};

export interface CompanyDocumentsViewProps<TData extends CompanyDocumentData> extends SessionProps {
	company_id: number;
	id: number;

	title: string;
	backLabel: string;
	backTo: string;
	editTo: (id: number, companyId: number) => string;

	// document-specific fields
	documentNumberLabel: string;
	getDocumentNumber: (data: TData | undefined) => string | number | null | undefined;

	documentDateLabel: string;
	getDocumentDateRaw: (data: TData | undefined) => string | null | undefined;

	statusTitle: string;
	linesTitle: string;

	termsSecondLabel: string;
	getTermsSecondValue: (data: TData | undefined) => string | number | null | undefined;

	// already-fetched document query result (removes hook duplication + avoids typing "any")
	query: QueryResult<TData>;
}
