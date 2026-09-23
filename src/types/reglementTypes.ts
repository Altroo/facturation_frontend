import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import type { ReglementClass } from '@/models/classes';
import type { CurrencyStats } from '@/types/companyDocumentsTypes';
import type { ReactNode } from 'react';

export type ReglementStatutType = 'Valide' | 'Annulé';

export type ReglementSchemaType = {
	facture_client: number;
	mode_reglement: number | null;
	libelle?: string;
	observations?: string;
	montant: number;
	date_reglement: string;
	globalError?: string;
};

export interface ReglementListResponseType extends PaginationResponseType<ReglementClass> {
	stats_by_currency: {
		MAD: CurrencyStats;
		EUR: CurrencyStats;
		USD: CurrencyStats;
	};
}

export type ReglementFormFormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	facture_client_id?: number;
};

export interface ReglementFormProps extends SessionProps {
	company_id: number;
	id?: number;
	facture_client_id?: number;
}

export interface ReglementListFormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

export interface ReglementViewInfoRowProps {
	icon: ReactNode;
	label: string;
	value: string | number | null | undefined | ReactNode;
}

export interface ReglementViewProps extends SessionProps {
	company_id: number;
	id: number;
}
