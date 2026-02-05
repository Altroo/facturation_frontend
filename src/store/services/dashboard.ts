import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';

// Date filter params interface
export interface DateFilterParams {
	date_from?: string;
	date_to?: string;
	company_id?: number;
	devise?: 'MAD' | 'EUR' | 'USD';
}

// Dashboard data types
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

// Helper function to build query string with date params
const buildDateQueryString = (params?: DateFilterParams): string => {
	if (!params) return '';
	const searchParams = new URLSearchParams();
	if (params.date_from) searchParams.append('date_from', params.date_from);
	if (params.date_to) searchParams.append('date_to', params.date_to);
	if (params.company_id) searchParams.append('company_id', params.company_id.toString());
	if (params.devise) searchParams.append('devise', params.devise);
	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : '';
}

export const dashboardApi = createApi({
	reducerPath: 'dashboardApi',
	tagTypes: ['Dashboard', 'MonthlyObjectivesSettings'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		// Financial Overview
		getMonthlyRevenueEvolution: builder.query<MonthlyRevenueData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/financial/monthly-revenue/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getRevenueByDocumentType: builder.query<RevenueByTypeData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/financial/revenue-by-type/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getPaymentStatusOverview: builder.query<PaymentStatusData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/financial/payment-status/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getCollectionRate: builder.query<CollectionRateData, DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/financial/collection-rate/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),

		// Commercial Performance
		getTopClientsByRevenue: builder.query<TopClientData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/commercial/top-clients/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getTopProductsByQuantity: builder.query<TopProductData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/commercial/top-products/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getQuoteConversionRate: builder.query<QuoteConversionData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/commercial/quote-conversion/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getProductPriceVolumeAnalysis: builder.query<ProductPriceVolumeData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/commercial/product-price-volume/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),

		// Operational Indicators
		getInvoiceStatusDistribution: builder.query<InvoiceStatusData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/operational/invoice-status/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getMonthlyDocumentVolume: builder.query<MonthlyDocumentVolumeData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/operational/document-volume/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),

		// Cash Flow Analysis
		getPaymentTimeline: builder.query<PaymentTimelineData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/cashflow/payment-timeline/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getOverdueReceivables: builder.query<OverdueReceivablesData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/cashflow/overdue-receivables/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getPaymentDelayByClient: builder.query<PaymentDelayData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/cashflow/payment-delay/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),

		// Client Analysis
		getClientMultidimensionalProfile: builder.query<ClientMultidimensionalData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/client/multidimensional-profile/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),

		// KPI Cards
		getKPICardsWithTrends: builder.query<KPICardsData, DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/kpi/cards-with-trends/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getMonthlyObjectives: builder.query<MonthlyObjectivesData, DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/kpi/monthly-objectives/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),

		// Discount and Margin Analysis
		getDiscountImpactAnalysis: builder.query<DiscountImpactData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/analysis/discount-impact/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getProductMarginVolume: builder.query<ProductMarginVolumeData[], DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/analysis/product-margin-volume/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),

		// Synthetic Dashboards
		getMonthlyGlobalPerformance: builder.query<MonthlyGlobalPerformanceData, DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/synthetic/monthly-performance/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),
		getSectionMicroTrends: builder.query<SectionMicroTrendsData, DateFilterParams | void>({
			query: (params) => ({
				url: `/dashboard/synthetic/section-micro-trends/${buildDateQueryString(params ?? undefined)}`,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),

		// Monthly Objectives Settings CRUD
		getAllMonthlyObjectivesSettings: builder.query<MonthlyObjectivesSettings[], void>({
			query: () => ({
				url: '/dashboard/objectives/',
				method: 'GET',
			}),
			providesTags: ['MonthlyObjectivesSettings'],
		}),
		getMonthlyObjectivesSettingsByCompany: builder.query<MonthlyObjectivesSettings, number>({
			query: (companyId) => ({
				url: `/dashboard/objectives/by-company/${companyId}/`,
				method: 'GET',
			}),
			providesTags: ['MonthlyObjectivesSettings'],
		}),
		createMonthlyObjectivesSettings: builder.mutation<MonthlyObjectivesSettings, MonthlyObjectivesSettingsInput>({
			query: (data) => ({
				url: '/dashboard/objectives/',
				method: 'POST',
				data,
			}),
			invalidatesTags: ['MonthlyObjectivesSettings', 'Dashboard'],
		}),
		updateMonthlyObjectivesSettings: builder.mutation<MonthlyObjectivesSettings, { id: number; data: MonthlyObjectivesSettingsInput }>({
			query: ({ id, data }) => ({
				url: `/dashboard/objectives/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['MonthlyObjectivesSettings', 'Dashboard'],
		}),
		patchMonthlyObjectivesSettings: builder.mutation<MonthlyObjectivesSettings, { id: number; data: Partial<MonthlyObjectivesSettingsInput> }>({
			query: ({ id, data }) => ({
				url: `/dashboard/objectives/${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['MonthlyObjectivesSettings', 'Dashboard'],
		}),
		deleteMonthlyObjectivesSettings: builder.mutation<void, number>({
			query: (id) => ({
				url: `/dashboard/objectives/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['MonthlyObjectivesSettings', 'Dashboard'],
		}),
	}),
});

export const {
	useGetMonthlyRevenueEvolutionQuery,
	useGetRevenueByDocumentTypeQuery,
	useGetPaymentStatusOverviewQuery,
	useGetCollectionRateQuery,
	useGetTopClientsByRevenueQuery,
	useGetTopProductsByQuantityQuery,
	useGetQuoteConversionRateQuery,
	useGetProductPriceVolumeAnalysisQuery,
	useGetInvoiceStatusDistributionQuery,
	useGetMonthlyDocumentVolumeQuery,
	useGetPaymentTimelineQuery,
	useGetOverdueReceivablesQuery,
	useGetPaymentDelayByClientQuery,
	useGetClientMultidimensionalProfileQuery,
	useGetKPICardsWithTrendsQuery,
	useGetMonthlyObjectivesQuery,
	useGetDiscountImpactAnalysisQuery,
	useGetProductMarginVolumeQuery,
	useGetMonthlyGlobalPerformanceQuery,
	useGetSectionMicroTrendsQuery,
	useGetAllMonthlyObjectivesSettingsQuery,
	useGetMonthlyObjectivesSettingsByCompanyQuery,
	useCreateMonthlyObjectivesSettingsMutation,
	useUpdateMonthlyObjectivesSettingsMutation,
	usePatchMonthlyObjectivesSettingsMutation,
	useDeleteMonthlyObjectivesSettingsMutation,
} = dashboardApi;
