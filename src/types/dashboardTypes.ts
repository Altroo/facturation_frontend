export interface DateFilterParams {
	date_from?: string;
	date_to?: string;
	company_id?: number;
	devise?: 'MAD' | 'EUR' | 'USD';
	client_id?: number;
	project?: string;
}

export interface MonthlyRevenueData {
	month: string;
	revenue: number;
}

export interface RevenueByTypeData {
	type: string;
	amount: number;
}

export interface PaymentStatusData {
	status: string;
	count: number;
}

export interface CollectionRateData {
	rate: number;
	total_invoiced: number;
	total_collected: number;
}

export interface TopClientData {
	client_id: number;
	client_code: string;
	client_name: string;
	revenue: number;
}

export interface TopProductData {
	article_id: number;
	designation: string;
	quantity: number;
}

export interface QuoteConversionData {
	status: string;
	count: number;
}

export interface ProductPriceVolumeData {
	article_id: number;
	designation: string;
	average_price: number;
	total_quantity: number;
}

export interface InvoiceStatusData {
	status: string;
	count: number;
}

export interface MonthlyDocumentVolumeData {
	month: string;
	devis: number;
	factures: number;
	bdl: number;
}

export interface PaymentTimelineData {
	date: string;
	invoiced: number;
	collected: number;
}

export interface OverdueReceivablesData {
	period: string;
	count: number;
	amount: number;
}

export interface PaymentDelayData {
	client_id: number;
	client_name: string;
	total_amount: number;
	average_delay_days: number;
}

export interface ClientProfileMetrics {
	volume: number;
	frequency: number;
	avg_amount: number;
	payment_speed: number;
	acceptance_rate: number;
}

export interface ClientMultidimensionalData {
	client_id: number;
	client_name: string;
	metrics: ClientProfileMetrics;
}

export interface KPICardData {
	value: number;
	trend: number[];
}

export interface KPICardsData {
	current_month_revenue: KPICardData;
	outstanding_receivables: KPICardData;
	average_invoice_amount: KPICardData;
	active_clients: KPICardData;
	currency_data?: {
		MAD: KPICardsData;
		EUR: KPICardsData;
		USD: KPICardsData;
	};
}

export interface ObjectiveData {
	current: number;
	objective: number;
	percentage: number;
}

export interface MonthlyObjectivesData {
	revenue: ObjectiveData;
	revenue_eur?: ObjectiveData;
	revenue_usd?: ObjectiveData;
	invoices: ObjectiveData;
	conversion: ObjectiveData;
	objectives_set: boolean;
}

export interface MonthlyObjectivesSettings {
	id: number;
	company: number;
	objectif_ca: string;
	objectif_ca_eur: string | null;
	objectif_ca_usd: string | null;
	objectif_factures: number;
	objectif_conversion: string;
	date_created: string;
	date_updated: string;
}

export interface MonthlyObjectivesSettingsInput {
	company: number;
	objectif_ca: string;
	objectif_ca_eur?: string | null;
	objectif_ca_usd?: string | null;
	objectif_factures: number;
	objectif_conversion: string;
}

export interface DiscountImpactData {
	document_id: number;
	document_type: string;
	total_amount: number;
	discount_amount: number;
}

export interface ProductMarginVolumeData {
	article_id: number;
	designation: string;
	average_margin: number;
	total_quantity: number;
}

export interface MonthlyPerformanceMetrics {
	revenue: number;
	quotes: number;
	conversion: number;
	collection: number;
	new_clients: number;
}

export interface MonthlyGlobalPerformanceData {
	current: MonthlyPerformanceMetrics;
	previous: MonthlyPerformanceMetrics;
}

export interface SectionMicroTrendsData {
	financial: number[];
	commercial: number[];
	operational: number[];
	cashflow: number[];
}
