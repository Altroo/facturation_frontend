import type { ZodType } from 'zod';
import type {
	DeviFactureLineFormValues,
	DeviLineSchemaType,
	TypeRemiseType,
	TypeFactureLivraisonDevisStatus,
} from '@/types/devisTypes';
import type { SessionProps } from '@/types/_initTypes';
import { BonDeLivraisonClass, DeviClass, FactureClass } from '@/models/classes';
import type { PaginationResponseType } from '@/types/_initTypes';
import type { GridColDef } from '@mui/x-data-grid';
import React from 'react';

export type DocumentType = 'devis' | 'facture-client' | 'facture-pro-forma' | 'bon-de-livraison';

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
		livre_par_name?: string | null;
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

	type: DocumentType;
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
	statut?: TypeFactureLivraisonDevisStatus;
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

/** Bon de livraison-specific document data */
export interface BonDeLivraisonDocumentData extends BaseDocumentData {
	numero_bon_livraison?: string;
	date_bon_livraison: string;
	numero_bon_commande_client: string | null;
	livre_par?: number | null;
}

/** Union type for all document form data types */
export type DocumentFormData = DevisDocumentData | FactureDocumentData | BonDeLivraisonDocumentData;

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

/** Facture form schema type (facture client and pro forma share this) */
export interface FactureFormSchema extends BaseDocumentFormSchema {
	numero_facture?: string;
	date_facture: string;
	numero_bon_commande_client: string | null;
}

/** Bon de livraison form schema type */
export interface BonDeLivraisonFormSchema extends BaseDocumentFormSchema {
	numero_bon_livraison?: string;
	date_bon_livraison: string;
	numero_bon_commande_client: string | null;
	livre_par?: number | null;
}

/** Union type for form schema */
export type DocumentFormSchema = DevisFormSchema | FactureFormSchema | BonDeLivraisonFormSchema;

export interface DevisNumResponse {
	numero_devis: string;
}

export interface FactureNumResponse {
	numero_facture: string;
}

export interface BonDeLivraisonNumResponse {
	numero_bon_livraison: string;
}

export type DocumentNumResponse = DevisNumResponse | FactureNumResponse | BonDeLivraisonNumResponse;

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
export interface DocumentFormFields<TDocument> {
	/** Field name for the document number (e.g., "numero_devis" or "numero_facture") */
	numeroField: keyof TDocument & string;
	/** Field name for the date (e.g., "date_devis" or "date_facture") */
	dateField: keyof TDocument & string;
	/** Field name for the extra field (e.g., "numero_demande_prix_client" or "numero_bon_commande_client") */
	extraField: keyof TDocument & string;
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
export interface DocumentFormConfig<TDocument> {
	/** Document type identifier */
	documentType: DocumentType;
	/** Labels for the form */
	labels: DocumentFormLabels;
	/** Field names configuration */
	fields: DocumentFormFields<TDocument>;
	/** Routes configuration */
	routes: DocumentFormRoutes;
	/** Validation schemas */
	validation: DocumentFormValidation;
}

/** Union type for document class in list views */
export type DocumentListClass = DeviClass | FactureClass | BonDeLivraisonClass;

/** Pagination model type */
export interface PaginationModel {
	page: number;
	pageSize: number;
}

/** Convert action configuration */
export interface ConvertAction {
	/** Unique key for the action */
	key: string;
	/** Label shown in menu */
	label: string;
	/** Icon component */
	icon: React.ReactNode;
	/** Modal title */
	modalTitle: string;
	/** Modal body message */
	modalBody: string;
	/** Whether the action is disabled */
	disabled?: boolean;
	/** Route to redirect after successful conversion */
	redirectRoute: (id: number, companyId: number) => string;
}

/** Labels configuration for document list */
export interface DocumentListLabels {
	/** Document type singular name (e.g., "devi", "facture client", "facture pro-forma") */
	documentTypeName: string;
	/** Page title (e.g., "Liste des Devis") */
	pageTitle: string;
	/** Button text for adding new document */
	addButtonText: string;
	/** Success message for delete operation */
	deleteSuccessMessage: string;
	/** Error message for delete operation */
	deleteErrorMessage: string;
	/** Delete confirmation title */
	deleteConfirmTitle: string;
	/** Delete confirmation body */
	deleteConfirmBody: string;
}

/** Routes configuration for document list */
export interface DocumentListRoutes {
	/** Function to generate the add route */
	addRoute: (companyId: number) => string;
	/** Function to generate the edit route */
	editRoute: (id: number, companyId: number) => string;
	/** Function to generate the view route */
	viewRoute: (id: number, companyId: number) => string;
}

/** Column configuration for document list */
export interface DocumentListColumnConfig<TDocument extends DocumentListClass> {
	/** Field name for document number (e.g., "numero_devis" or "numero_facture") */
	numeroField: keyof TDocument;
	/** Header name for document number column */
	numeroHeaderName: string;
	/** Field name for document date (e.g., "date_devis" or "date_facture") */
	dateField: keyof TDocument;
	/** Header name for document date column */
	dateHeaderName: string;
	/** Extra field name (e.g., "numero_demande_prix_client" or "numero_bon_commande_client") */
	extraField: keyof TDocument;
	/** Header name for extra field column */
	extraFieldHeaderName: string;
}

/** Query result interface */
export interface DocumentListQueryResult<TDocument extends DocumentListClass> {
	data: PaginationResponseType<TDocument> | undefined;
	isLoading: boolean;
	refetch: () => void;
}

/** Delete mutation result interface */
export interface DocumentDeleteMutationResult {
	deleteRecord: (params: { id: number }) => { unwrap: () => Promise<unknown> };
}

/** Convert mutation result interface */
export interface DocumentConvertMutationResult {
	convertMutation: (params: { id: number }) => { unwrap: () => Promise<{ id: number }> };
	isLoading: boolean;
}

/** Complete configuration for document list component */
export interface DocumentListConfig<TDocument extends DocumentListClass> {
	/** Document type identifier */
	documentType: DocumentType;
	/** Labels for the list */
	labels: DocumentListLabels;
	/** Routes configuration */
	routes: DocumentListRoutes;
	/** Column configuration */
	columns: DocumentListColumnConfig<TDocument>;
	/** Convert actions configuration */
	convertActions?: ConvertAction[];
	/** Custom columns function (returns GridColDef[]) */
	getExtraColumns?: (args: {
		router: ReturnType<typeof import('next/navigation').useRouter>;
		companyId: number;
	}) => GridColDef[];
}

export type { DeviFactureLineFormValues, DeviLineSchemaType, TypeRemiseType, TypeFactureLivraisonDevisStatus };
