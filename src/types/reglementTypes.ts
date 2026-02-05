import type { PaginationResponseType } from '@/types/_initTypes';
import { ReglementClass } from '@/models/classes';
import type { CurrencyStats } from '@/types/companyDocumentsTypes';

export type ReglementStatutType = 'Valide' | 'Annulé';

export type ReglementSchemaType = {
	facture_client: number;
	mode_reglement: number | null;
	libelle?: string;
	montant: number;
	date_reglement: string;
	date_echeance: string;
	globalError?: string;
};

export interface ReglementListResponseType extends PaginationResponseType<ReglementClass> {
	stats_by_currency: {
		MAD: CurrencyStats;
		EUR: CurrencyStats;
		USD: CurrencyStats;
	};
}
