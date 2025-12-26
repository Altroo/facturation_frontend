import type { ZodType } from 'zod';
import type {
	DeviFactureLineFormValues,
	DeviLineSchemaType,
	TypeRemiseType,
	TypeFactureDevisStatus,
} from '@/types/devisTypes';
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

	// already-fetched document query result
	query: QueryResult<TData>;
}

/** Base interface for document data (common fields between devis and facture) */
export interface BaseDocumentData {
	id?: number;
	client: number | null;
	mode_paiement: number | null;
	remarque: string | null;
	remise_type?: TypeRemiseType;
	remise?: number;
	lignes: Array<DeviLineSchemaType>;
	statut?: TypeFactureDevisStatus;
}

/** Devis-specific document data */
export interface DevisDocumentData extends BaseDocumentData {
	numero_devis?: string;
	date_devis: string;
	numero_demande_prix_client: string | null;
}

/** Facture-specific document data (facture client and pro-forma share this) */
export interface FactureDocumentData extends BaseDocumentData {
	numero_facture?: string;
	date_facture: string;
	numero_bon_commande_client: string | null;
}

/** Union type for all document form data types */
export type DocumentFormData = DevisDocumentData | FactureDocumentData;

/** Base form schema fields (common to all document types) */
export interface BaseDocumentFormSchema {
	numero_part: string;
	year_part: string;
	client: number | null;
	mode_paiement: number | null;
	remarque: string | null;
	remise_type?: TypeRemiseType;
	remise?: number;
	lignes: Array<DeviLineSchemaType>;
	globalError?: string;
}

/** Devis form schema type */
export interface DevisFormSchema extends BaseDocumentFormSchema {
	numero_devis?: string;
	date_devis: string;
	numero_demande_prix_client: string | null;
}

/** Facture form schema type (facture client and pro-forma share this) */
export interface FactureFormSchema extends BaseDocumentFormSchema {
	numero_facture?: string;
	date_facture: string;
	numero_bon_commande_client: string | null;
}

/** Union type for form schema */
export type DocumentFormSchema = DevisFormSchema | FactureFormSchema;

export type DocumentType = 'devis' | 'facture-client' | 'facture-pro-forma';

export interface DevisNumResponse {
	numero_devis: string;
}

export interface FactureNumResponse {
	numero_facture: string;
}

export type DocumentNumResponse = DevisNumResponse | FactureNumResponse;

/** Labels configuration for document forms */
export interface DocumentFormLabels {
	/** Document type display name (e.g., "devis", "facture client", "facture pro-forma") */
	documentTypeName: string;
	/** Label for the list page (e.g., "Liste des devis") */
	listLabel: string;
	/** Label for the date field (e.g., "Date du devis") */
	dateLabel: string;
	/** Label for the status section (e.g., "Statut du devis") */
	statusLabel: string;
	/** Label for the lines section (e.g., "Lignes du devis") */
	linesLabel: string;
	/** Delete confirmation message */
	deleteLineMessage: string;
	/** Success message for add operation */
	addSuccessMessage: string;
	/** Success message for update operation */
	updateSuccessMessage: string;
	/** Error message for add operation */
	addErrorMessage: string;
	/** Error message for update operation */
	updateErrorMessage: string;
}

/** Field configuration for document forms */
export interface DocumentFormFields {
	/** Field name for the document number (e.g., "numero_devis" or "numero_facture") */
	numeroField: 'numero_devis' | 'numero_facture';
	/** Field name for the date (e.g., "date_devis" or "date_facture") */
	dateField: 'date_devis' | 'date_facture';
	/** Field name for the extra field (e.g., "numero_demande_prix_client" or "numero_bon_commande_client") */
	extraField: 'numero_demande_prix_client' | 'numero_bon_commande_client';
	/** Label for the extra field */
	extraFieldLabel: string;
}

/** Routes configuration for document forms */
export interface DocumentFormRoutes {
	/** Route to the list page */
	listRoute: string;
	/** Function to generate the edit route */
	editRoute: (id: number, companyId: number) => string;
}

/** Validation schema configuration */
export interface DocumentFormValidation {
	/** Validation schema for edit mode */
	editSchema: ZodType;
	/** Validation schema for add mode */
	addSchema: ZodType;
}

/** Complete configuration for document form component */
export interface DocumentFormConfig {
	/** Document type identifier */
	documentType: DocumentType;
	/** Labels for the form */
	labels: DocumentFormLabels;
	/** Field names configuration */
	fields: DocumentFormFields;
	/** Routes configuration */
	routes: DocumentFormRoutes;
	/** Validation schemas */
	validation: DocumentFormValidation;
}

export type { DeviFactureLineFormValues, DeviLineSchemaType, TypeRemiseType, TypeFactureDevisStatus };
