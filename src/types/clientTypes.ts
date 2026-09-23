import type { SessionProps } from '@/types/_initTypes';
import type { ReactNode } from 'react';

export type TypeClientType = 'PM' | 'PP' | 'CD';

export type StatementEntryType = 'invoice' | 'credit_note' | 'payment' | 'opening';
export type StatementType = 'all' | Exclude<StatementEntryType, 'opening'>;

export type AccountStatementRow = {
	id: string;
	type: StatementEntryType;
	date: string;
	dueDate: string;
	piece: string;
	label: string;
	devise: string;
	debit: number;
	credit: number;
};

export type ClientSchemaType = {
	client_type: TypeClientType;
	code_client: string;
	company: number;
	raison_sociale?: string;
	nom?: string;
	prenom?: string;
	adresse?: string | null;
	ville?: number | null;
	tel?: string | null;
	email?: string | null;
	delai_de_paiement?: number | null;
	remarque?: string | null;
	numero_du_compte?: string | null;
	ICE?: string | null;
	registre_de_commerce?: string | null;
	identifiant_fiscal?: string | null;
	taxe_professionnelle?: string | null;
	CNSS?: string | null;
	globalError?: string;
};

export type ClientsFormFormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	company_raison_sociale?: string;
};

export interface ClientsFormProps extends SessionProps {
	company_id: number;
	id?: number;
}

export interface ClientsListFormikContentProps extends SessionProps {
	company_id: number;
	company_raison_sociale?: string;
	archived: boolean;
	role: string;
}

export interface ClientsListProps extends SessionProps {
	archived: boolean;
}

export interface ClientsViewInfoRowProps {
	icon: ReactNode;
	label: string;
	value: string | number | null | undefined | ReactNode;
}

export interface ClientsViewProps extends SessionProps {
	company_id: number;
	id: number;
}
