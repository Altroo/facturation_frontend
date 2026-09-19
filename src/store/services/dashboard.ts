import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type {
	ClientMultidimensionalData,
	CollectionRateData,
	DateFilterParams,
	DiscountImpactData,
	InvoiceStatusData,
	KPICardsData,
	MonthlyDocumentVolumeData,
	MonthlyGlobalPerformanceData,
	MonthlyObjectivesData,
	MonthlyObjectivesSettings,
	MonthlyObjectivesSettingsInput,
	MonthlyRevenueData,
	OverdueReceivablesData,
	PaymentDelayData,
	PaymentStatusData,
	PaymentTimelineData,
	ProductMarginVolumeData,
	ProductPriceVolumeData,
	QuoteConversionData,
	RevenueByTypeData,
	SectionMicroTrendsData,
	TopClientData,
	TopProductData,
} from '@/types/dashboardTypes';

// Helper function to build query string with date params
export const buildDateQueryString = (params?: DateFilterParams): string => {
	if (!params) return '';
	const searchParams = new URLSearchParams();
	if (params.date_from) searchParams.append('date_from', params.date_from);
	if (params.date_to) searchParams.append('date_to', params.date_to);
	if (params.company_id) searchParams.append('company_id', params.company_id.toString());
	if (params.devise) searchParams.append('devise', params.devise);
	if (params.client_id) searchParams.append('client_id', params.client_id.toString());
	if (params.project) searchParams.append('project', params.project);
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
	useGetMonthlyObjectivesSettingsByCompanyQuery,
	useCreateMonthlyObjectivesSettingsMutation,
	useUpdateMonthlyObjectivesSettingsMutation,
} = dashboardApi;
