import type { PaginationResponseType } from '@/types/_initTypes';
import { ReglementClass } from '@/models/classes';

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
	chiffre_affaire_total: string;
	total_reglements: string;
	total_impayes: string;
}
