import type { ZodType } from 'zod';
import type {
	DeviFactureLineFormValues,
	DeviLineSchemaType,
	TypeFactureLivraisonDevisStatus,
	TypeRemiseType,
	ValidateArticleLinesErrorType,
} from '@/types/devisTypes';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import type {
	ArticleClass,
	BonDeLivraisonClass,
	DeviClass,
	FactureAvoirClass,
	FactureClass,
	ReglementClass,
} from '@/models/classes';
import type { GridColDef, GridFilterModel } from '@mui/x-data-grid';
import type { ComponentType, Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import type { SelectedArticlePopupValues } from '@/types/articleTypes';

export type DocumentType = 'devis' | 'facture-client' | 'facture-pro-forma' | 'bon-de-livraison' | 'facture-avoir';

type Ligne = {
	id?: number | string;
	article: number;
	reference?: string | null;
	designation?: string | null;
	prix_achat?: number | string | null;
	devise_prix_achat?: string | null;
	prix_vente?: number | string | null;
	quantity?: number | string | null;
	remise?: number | string | null;
	remise_type?: TypeRemiseType | null;
	stock_coverage?: {
		status: 'not_managed' | 'disponible' | 'couvert_par_stock_entrant' | 'a_approvisionner';
		available_quantity?: number | string;
		incoming_quantity?: number | string;
		shortage_quantity?: number | string;
	} | null;
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
		termes_paiement?: string | null;
		fournisseur?: string | null;
		fournisseur_email?: string | null;
		devise?: string | null;
		date_echeance?: string | null;
	};

export type BonDeLivraisonData = CompanyDocumentData & {
	numero_bon_livraison?: string | number | null;
	date_bon_livraison?: string | null;
	numero_bon_commande_client?: string | number | null;
};

export type DevisData = CompanyDocumentData & {
	numero_devis?: string | number | null;
	date_devis?: string | null;
	numero_demande_prix_client?: string | number | null;
};

export type FactureClientData = CompanyDocumentData & {
	numero_facture?: string | number | null;
	date_facture?: string | null;
	numero_bon_commande_client?: string | number | null;
};

export type FactureProFormaData = FactureClientData & {
	fournisseur?: string | null;
	fournisseur_email?: string | null;
};

export type FactureAvoirData = CompanyDocumentData & {
	numero_avoir?: string | number | null;
	date_avoir?: string | null;
	facture_origine?: number | null;
	facture_origine_numero?: string | null;
	facture_origine_date?: string | null;
	motif_avoir_label?: string | null;
	numero_bon_commande_client?: string | number | null;
};

export type Totals = {
	totalHT: number;
	totalPrixAchat: number;
	totalPrixAchatDevise: string | null;
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

	// optional extra action buttons rendered beside the back/edit buttons
	headerActions?: ReactNode;
	canEdit?: boolean;
	extraDocumentRows?: Array<{
		icon: ReactNode;
		label: string;
		getValue: (data: TData | undefined) => string | number | null | undefined | ReactNode;
	}>;
	extraSections?: ReactNode;
}

/** Base interface for document data (common fields between devis and facture) */
export interface BaseDocumentData {
	id?: number;
	client: number | null;
	mode_paiement: number | null;
	remarque: string | null;
	fournisseur?: string | null;
	fournisseur_email?: string | null;
	remise_type?: TypeRemiseType;
	remise?: number;
	lignes: Array<DeviLineSchemaType>;
	statut?: TypeFactureLivraisonDevisStatus;
	devise?: string;
	date_echeance?: string | null;
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
	termes_paiement?: string | null;
	source_devis?: number | null;
	source_devis_numero?: string | null;
	source_proforma?: number | null;
	source_proforma_numero?: string | null;
	has_logistics_dossier?: boolean;
}

/** Facture d'avoir-specific document data */
export interface FactureAvoirDocumentData extends BaseDocumentData {
	numero_avoir?: string;
	date_avoir: string;
	facture_origine?: number | null;
	facture_origine_numero?: string | null;
	facture_origine_date?: string | null;
	motif_avoir: string;
	motif_avoir_label?: string | null;
	numero_bon_commande_client: string | null;
}
/** Bon de livraison-specific document data */
export interface BonDeLivraisonDocumentData extends BaseDocumentData {
	numero_bon_livraison?: string;
	date_bon_livraison: string;
	numero_bon_commande_client: string | null;
	livre_par?: number | null;
	source_facture_client?: number | null;
	source_facture_client_numero?: string | null;
}

/** Union type for all document form data types */
export type DocumentFormData =
	DevisDocumentData | FactureDocumentData | BonDeLivraisonDocumentData | FactureAvoirDocumentData;

/** Base form schema fields (common to all document types) */
export interface BaseDocumentFormSchema {
	numero_part: string;
	year_part: string;
	client: number | null;
	mode_paiement: number | null;
	remarque: string | null;
	fournisseur?: string | null;
	fournisseur_email?: string | null;
	remise_type?: TypeRemiseType;
	remise?: number;
	lignes: Array<DeviLineSchemaType>;
	devise?: string;
	date_echeance?: string | null;
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
	termes_paiement?: string | null;
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

export interface FactureAvoirNumResponse {
	numero_avoir: string;
}
export interface BonDeLivraisonNumResponse {
	numero_bon_livraison: string;
}

export type DocumentNumResponse =
	DevisNumResponse | FactureNumResponse | FactureAvoirNumResponse | BonDeLivraisonNumResponse;

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
export type DocumentListClass = DeviClass | FactureClass | FactureAvoirClass | BonDeLivraisonClass;

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
	icon: ReactNode;
	/** Modal title */
	modalTitle: string;
	/** Modal body message */
	modalBody: string;
	/** Whether the action is disabled - can be boolean or function */
	disabled?: boolean | ((row: DocumentListClass) => boolean);
	/** Whether this conversion has already been completed for a row */
	completed?: (row: DocumentListClass) => boolean;
	/** Label shown when the conversion is already completed */
	completedLabel?: string | ((row: DocumentListClass) => string);
	/** Route to redirect after successful conversion */
	redirectRoute: (id: number, companyId: number) => string;
}

/** Print action configuration */
export interface PrintAction {
	/** Unique key for the action */
	key: string;
	/** Label shown in menu */
	label: string;
	/** Icon component */
	icon: ReactNode;
	/** Icon color */
	iconColor?: string;
	/** URL generator for the PDF - now includes language parameter */
	urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') => string;
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

/** Bulk delete mutation result interface */
export interface DocumentBulkDeleteMutationResult {
	bulkDeleteRecords: (params: { ids: number[] }) => { unwrap: () => Promise<unknown> };
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
	/** Print actions configuration */
	printActions?: PrintAction[];
	/** Custom columns function (returns GridColDef[]) */
	getExtraColumns?: (args: {
		router: ReturnType<typeof import('next/navigation').useRouter>;
		companyId: number;
	}) => GridColDef[];
	/** Whether delete and bulk-delete actions are allowed. Defaults to true. */
	allowDelete?: boolean;
	/** Per-row edit visibility guard. Defaults to editable. */
	canEditRow?: (row: TDocument) => boolean;
	/** Per-row print visibility guard. Defaults to printable when print actions exist. */
	canPrintRow?: (row: TDocument) => boolean;
}

export type { DeviFactureLineFormValues, DeviLineSchemaType, TypeRemiseType, TypeFactureLivraisonDevisStatus };

export interface FactureForPayment {
	id: number;
	numero_facture: string;
	client_name: string;
	date_facture: string;
	total_ttc_apres_remise: string;
	total_paid: string;
	total_avoirs?: string;
	remaining_amount: string;
	statut: string;
	devise: string;
}

export interface CurrencyStats {
	chiffre_affaire_total: string;
	total_reglements: string;
	total_impayes: string;
	total_avoirs?: string;
	total_tva?: string;
}

export interface FactureClientListResponseType extends PaginationResponseType<FactureClass> {
	stats_by_currency: {
		MAD: CurrencyStats;
		EUR: CurrencyStats;
		USD: CurrencyStats;
	};
}

export interface FactureAvoirListResponseType extends PaginationResponseType<FactureAvoirClass> {
	stats_by_currency: {
		MAD: CurrencyStats;
		EUR: CurrencyStats;
		USD: CurrencyStats;
	};
}

export interface ClientHistoryResponseType {
	devis: DeviClass[];
	factures: FactureClass[];
	avoirs: FactureAvoirClass[];
	reglements: ReglementClass[];
}

export type BonDeLivraisonFormFormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	role?: string;
};

export interface BonDeLivraisonFormProps extends SessionProps {
	company_id: number;
	id?: number;
}

export interface BonDeLivraisonListFormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

export interface BonDeLivraisonUninvoicedListFormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

export interface BonDeLivraisonViewProps extends SessionProps {
	company_id: number;
	id: number;
}

export type DevisFormFormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	role?: string;
};

export interface DevisFormProps extends SessionProps {
	company_id: number;
	id?: number;
}

export interface DevisListFormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

export interface DevisViewProps extends SessionProps {
	company_id: number;
	id: number;
}

export type FactureAvoirMotif = 'retour_marchandise' | 'erreur_facturation' | 'remise' | 'annulation' | 'autre';

export type FactureAvoirFormValues = {
	numero_part: string;
	year_part: string;
	date_avoir: string;
	facture_origine: number | null;
	client: number | null;
	mode_paiement: number | null;
	motif_avoir: FactureAvoirMotif | '';
	numero_bon_commande_client: string;
	remarque: string;
	fournisseur: string;
	fournisseur_email: string;
	statut: TypeFactureLivraisonDevisStatus;
	remise_type: TypeRemiseType;
	remise: number;
	devise: string;
	lignes: DeviFactureLineFormValues[];
};

export type FactureAvoirFormFormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	role?: string;
};

export interface FactureAvoirFormProps extends SessionProps {
	company_id: number;
	id?: number;
}

export interface FactureAvoirListFormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

export type FactureAvoirListProps = SessionProps;

export interface FactureAvoirViewProps extends SessionProps {
	company_id: number;
	id: number;
}

export type FactureClientFormFormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	role?: string;
};

export interface FactureClientFormProps extends SessionProps {
	company_id: number;
	id?: number;
}

export interface FactureClientListFormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

export interface FactureClientUnpaidListFormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

export interface FactureClientViewProps extends SessionProps {
	company_id: number;
	id: number;
}

export type InvoicePaymentsSectionProps = {
	companyId: number;
	factureClientId: number;
	token?: string;
	canManagePayments: boolean;
};

export type FactureProFormaFormFormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	role?: string;
};

export interface FactureProFormaFormProps extends SessionProps {
	company_id: number;
	id?: number;
}

export interface FactureProFormaListFormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

export interface FactureProFormaViewProps extends SessionProps {
	company_id: number;
	id: number;
}

export interface DocumentFormModalsProps<TDocument extends DocumentListClass = DocumentListClass> {
	isEditMode: boolean;
	config: DocumentFormConfig<TDocument>;
	companyId: number;
	// Add Article modal
	showAddArticleModal: boolean;
	setShowAddArticleModal: (v: boolean) => void;
	selectedArticles: Set<number>;
	setSelectedArticles: (v: Set<number>) => void;
	handleAddArticles: (selectedArticlesData: SelectedArticlePopupValues[]) => void;
	existingArticleIds: Set<number>;
	existingArticleLineValues?: Record<
		number,
		{ quantity: string | number; remise_type: TypeRemiseType; remise: string | number }
	>;
	documentDevise: string;
	// Global Remise modal
	showGlobalRemiseModal: boolean;
	setShowGlobalRemiseModal: (v: boolean) => void;
	currentRemiseType: string;
	currentRemiseValue: number;
	handleApplyGlobalRemise: (type: 'Pourcentage' | 'Fixe' | '', value: number) => void;
	disableRemise?: boolean;
	// Delete Confirm modal
	showDeleteConfirm: boolean;
	setShowDeleteConfirm: (v: boolean) => void;
	confirmDeleteLine: () => void;
}

export interface SharedDocumentFormContentProps<TDocument extends DocumentListClass = DocumentListClass> {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	config: DocumentFormConfig<TDocument>;
	role?: string;
	// Data from API
	rawData?: DocumentFormData;
	isDataLoading: boolean;
	dataError?: unknown;
	rawNumData?: DocumentNumResponse;
	isNumLoading: boolean;
	refetchNum?: () => Promise<unknown>;
	// Mutation functions
	addData: (params: { data: DocumentFormSchema }) => { unwrap: () => Promise<{ id?: number }> };
	isAddLoading: boolean;
	addError?: unknown;
	updateData: (params: { data: DocumentFormSchema; id: number }) => { unwrap: () => Promise<unknown> };
	isUpdateLoading: boolean;
	updateError?: unknown;
	patchStatut: (params: { id: number; data: { statut: TypeFactureLivraisonDevisStatus } }) => {
		unwrap: () => Promise<unknown>;
	};
	isPatchLoading: boolean;
	patchError?: unknown;
	extraSections?: ReactNode;
}

export interface DocumentConfig {
	addTitle: string;
	editTitle: string;
}

export interface CompanyDocumentsWrapperFormProps extends SessionProps {
	company_id: number;
	id?: number;
	documentConfig: DocumentConfig;
	FormComponent: ComponentType<{
		company_id: number;
		token?: string;
		id?: number;
		isEditMode: boolean;
		role?: string;
	}>;
}

export interface UseDocumentLinesColumnsParams {
	getLines: () => DeviFactureLineFormValues[];
	validationErrors: ValidateArticleLinesErrorType;
	role?: string;
	devise: string;
	handleLineChangeRef: RefObject<
		(index: number, field: keyof DeviFactureLineFormValues, value: string | number) => void
	>;
	handleDeleteLine: (index: number) => void;
	getArticleById: (
		articleRef: number | string | Partial<ArticleClass> | undefined,
	) => Partial<ArticleClass> | undefined;
	isNectarCompany?: boolean;
}

export interface DocumentListContentProps<TDocument extends DocumentListClass> {
	/** Company ID */
	companyId: number;
	/** User role */
	role: string;
	/** Router instance */
	router: ReturnType<typeof import('next/navigation').useRouter>;
	/** Configuration for the list */
	config: DocumentListConfig<TDocument>;
	/** Query result from RTK Query hook */
	queryResult: DocumentListQueryResult<TDocument>;
	/** Delete mutation function */
	deleteMutation: DocumentDeleteMutationResult;
	/** Optional single-request bulk delete mutation */
	bulkDeleteMutation?: DocumentBulkDeleteMutationResult;
	/** Convert mutations - key is action key, value is mutation result */
	convertMutations?: Record<string, DocumentConvertMutationResult>;
	/** Pagination model state */
	paginationModel: PaginationModel;
	/** Set pagination model state */
	setPaginationModel: Dispatch<SetStateAction<PaginationModel>>;
	/** Search term state */
	searchTerm: string;
	/** Set search term state */
	setSearchTerm: Dispatch<SetStateAction<string>>;
	/** Filter model state */
	filterModel?: GridFilterModel;
	/** Filter model change handler */
	onFilterModelChange?: (model: GridFilterModel) => void;
	/** Callback emitting backend-ready custom filter params */
	onCustomFilterParamsChange?: (params: Record<string, string>) => void;
	/** Optional chip filter bar rendered between the action buttons and the data grid */
	chipFilterBar?: ReactNode;
	accessToken?: string;
}

export type CompanyLike = {
	id: number;
	raison_sociale: string;
	role: string;
};

export type CompanyDocumentsListProps = SessionProps & {
	title: string;
	requestedCompanyId?: number;
	children: (args: { company_id: number; role: string; raison_sociale: string }) => ReactNode;
};

export interface CompanyDocumentsWrapperViewInfoRowProps {
	icon: ReactNode;
	label: string;
	value: string | number | null | undefined | ReactNode;
}

export type DocumentErrorStateProps = {
	title: string;
	message: string;
	helpText: string;
	backLabel: string;
	retryLabel: string;
	onBack: () => void;
	onRetry: () => void;
};

export interface TotalsCardProps {
	totals: {
		totalHT: number;
		totalPrixAchat: number;
		totalPrixAchatDevise?: string | null;
		totalTVA: number;
		totalTTC: number;
		totalTTCApresRemise: number;
	};
	devise?: string;
	isMobile?: boolean;
	isLoading?: boolean;
	showDiscountTotal?: boolean;
}

export interface LinesGridProps {
	rows: Array<DeviFactureLineFormValues>;
	title: string;
	columns: GridColDef[];
	onAddClick: () => void;
	isLoading: boolean;
}
