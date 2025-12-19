import { DeviLineSchemaType, TypeRemiseType } from '@/types/devisTypes';

export type FactureClientProFormaSchemaType = {
	numero_facture: string;
	client: number | null;
	date_facture: string;
	numero_bon_commande_client: string | null;
	mode_paiement: number | null;
	remarque: string | null;
	remise_type?: TypeRemiseType;
	remise?: number;
	lignes: Array<DeviLineSchemaType>;
	globalError?: string;
};
