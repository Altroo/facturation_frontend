import { DeviLineSchemaType, TypeRemiseType } from '@/types/devisTypes';

export type FactureProFormaSchemaType = {
	numero_facture: string;
	client: number;
	date_facture: string;
	numero_bon_commande_client: string | null;
	mode_paiement: number | null;
	remarque: string | null;
	remise_type?: TypeRemiseType;
	remise?: number;
	lignes: Array<DeviLineSchemaType>;
	globalError?: string;
};

export interface DeviLineFormValues {
	id?: string | number;
	article: number;
	designation: string;
	prix_achat: number;
	prix_vente: number;
	quantity: number;
	remise_type?: 'Pourcentage' | 'Fixe' | '';
	remise?: number;
}
