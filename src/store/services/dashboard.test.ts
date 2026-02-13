// Mock axiosBaseQuery BEFORE importing dashboard - jest.mock is hoisted
jest.mock('@/utils/axiosBaseQuery', () => {
	const fn = jest.fn(() => Promise.resolve({ data: {} }));
	return {
		__esModule: true,
		axiosBaseQuery: () => fn,
		__mockFn: fn,
	};
});
jest.mock('@/utils/helpers', () => ({
	__esModule: true,
	isAuthenticatedInstance: jest.fn(() => ({})),
}));
jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getInitStateToken: jest.fn(() => 'mock-token'),
}));
jest.mock('@/store/slices/_initSlice', () => ({
	__esModule: true,
	initToken: jest.fn(),
}));

import { configureStore } from '@reduxjs/toolkit';
import {
	dashboardApi,
	buildDateQueryString,
	type DateFilterParams,
	type MonthlyRevenueData,
	type RevenueByTypeData,
	type PaymentStatusData,
	type CollectionRateData,
	type TopClientData,
	type TopProductData,
	type QuoteConversionData,
	type ProductPriceVolumeData,
	type InvoiceStatusData,
	type MonthlyDocumentVolumeData,
	type PaymentTimelineData,
	type OverdueReceivablesData,
	type PaymentDelayData,
	type ClientMultidimensionalData,
	type KPICardsData,
	type MonthlyObjectivesData,
	type DiscountImpactData,
	type ProductMarginVolumeData,
	type MonthlyGlobalPerformanceData,
	type SectionMicroTrendsData,
} from './dashboard';

describe('dashboardApi', () => {
	it('should be defined', () => {
		expect(dashboardApi).toBeDefined();
		expect(dashboardApi.reducerPath).toBe('dashboardApi');
	});

	it('should have all endpoints defined', () => {
		const endpoints = dashboardApi.endpoints;
		expect(endpoints.getMonthlyRevenueEvolution).toBeDefined();
		expect(endpoints.getRevenueByDocumentType).toBeDefined();
		expect(endpoints.getPaymentStatusOverview).toBeDefined();
		expect(endpoints.getCollectionRate).toBeDefined();
		expect(endpoints.getTopClientsByRevenue).toBeDefined();
		expect(endpoints.getTopProductsByQuantity).toBeDefined();
		expect(endpoints.getQuoteConversionRate).toBeDefined();
		expect(endpoints.getProductPriceVolumeAnalysis).toBeDefined();
		expect(endpoints.getInvoiceStatusDistribution).toBeDefined();
		expect(endpoints.getMonthlyDocumentVolume).toBeDefined();
		expect(endpoints.getPaymentTimeline).toBeDefined();
		expect(endpoints.getOverdueReceivables).toBeDefined();
		expect(endpoints.getPaymentDelayByClient).toBeDefined();
		expect(endpoints.getClientMultidimensionalProfile).toBeDefined();
		expect(endpoints.getKPICardsWithTrends).toBeDefined();
		expect(endpoints.getMonthlyObjectives).toBeDefined();
		expect(endpoints.getDiscountImpactAnalysis).toBeDefined();
		expect(endpoints.getProductMarginVolume).toBeDefined();
		expect(endpoints.getMonthlyGlobalPerformance).toBeDefined();
		expect(endpoints.getSectionMicroTrends).toBeDefined();
	});

	describe('type definitions', () => {
		it('should have correct DateFilterParams structure', () => {
			const params: DateFilterParams = {
				date_from: '2024-01-01',
				date_to: '2024-12-31',
				company_id: 1,
			};
			expect(params.date_from).toBe('2024-01-01');
			expect(params.date_to).toBe('2024-12-31');
			expect(params.company_id).toBe(1);
		});

		it('should have correct MonthlyRevenueData structure', () => {
			const data: MonthlyRevenueData = { month: '2024-01', revenue: 10000 };
			expect(data.month).toBe('2024-01');
			expect(data.revenue).toBe(10000);
		});

		it('should have correct RevenueByTypeData structure', () => {
			const data: RevenueByTypeData = { type: 'facture', amount: 5000 };
			expect(data.type).toBe('facture');
			expect(data.amount).toBe(5000);
		});

		it('should have correct PaymentStatusData structure', () => {
			const data: PaymentStatusData = { status: 'paid', count: 25 };
			expect(data.status).toBe('paid');
			expect(data.count).toBe(25);
		});

		it('should have correct CollectionRateData structure', () => {
			const data: CollectionRateData = { rate: 85.5, total_invoiced: 10000, total_collected: 8550 };
			expect(data.rate).toBe(85.5);
			expect(data.total_invoiced).toBe(10000);
			expect(data.total_collected).toBe(8550);
		});

		it('should have correct TopClientData structure', () => {
			const data: TopClientData = { client_id: 1, client_code: 'C001', client_name: 'Test', revenue: 5000 };
			expect(data.client_id).toBe(1);
			expect(data.client_code).toBe('C001');
		});

		it('should have correct TopProductData structure', () => {
			const data: TopProductData = { article_id: 1, designation: 'Product A', quantity: 100 };
			expect(data.article_id).toBe(1);
			expect(data.quantity).toBe(100);
		});

		it('should have correct QuoteConversionData structure', () => {
			const data: QuoteConversionData = { status: 'converted', count: 15 };
			expect(data.status).toBe('converted');
			expect(data.count).toBe(15);
		});

		it('should have correct ProductPriceVolumeData structure', () => {
			const data: ProductPriceVolumeData = { article_id: 1, designation: 'A', average_price: 50, total_quantity: 200 };
			expect(data.average_price).toBe(50);
			expect(data.total_quantity).toBe(200);
		});

		it('should have correct InvoiceStatusData structure', () => {
			const data: InvoiceStatusData = { status: 'pending', count: 10 };
			expect(data.status).toBe('pending');
			expect(data.count).toBe(10);
		});

		it('should have correct MonthlyDocumentVolumeData structure', () => {
			const data: MonthlyDocumentVolumeData = { month: '2024-01', devis: 10, factures: 20, bdl: 5 };
			expect(data.devis).toBe(10);
			expect(data.factures).toBe(20);
			expect(data.bdl).toBe(5);
		});

		it('should have correct PaymentTimelineData structure', () => {
			const data: PaymentTimelineData = { date: '2024-01-15', invoiced: 1000, collected: 800 };
			expect(data.date).toBe('2024-01-15');
			expect(data.invoiced).toBe(1000);
		});

		it('should have correct OverdueReceivablesData structure', () => {
			const data: OverdueReceivablesData = { period: '30-60', count: 5, amount: 2500 };
			expect(data.period).toBe('30-60');
			expect(data.count).toBe(5);
		});

		it('should have correct PaymentDelayData structure', () => {
			const data: PaymentDelayData = { client_id: 1, client_name: 'Test', total_amount: 5000, average_delay_days: 15 };
			expect(data.average_delay_days).toBe(15);
		});

		it('should have correct ClientMultidimensionalData structure', () => {
			const data: ClientMultidimensionalData = {
				client_id: 1,
				client_name: 'Test',
				metrics: { volume: 100, frequency: 5, avg_amount: 1000, payment_speed: 0.9, acceptance_rate: 0.95 },
			};
			expect(data.metrics.volume).toBe(100);
			expect(data.metrics.acceptance_rate).toBe(0.95);
		});

		it('should have correct KPICardsData structure', () => {
			const data: KPICardsData = {
				current_month_revenue: { value: 10000, trend: [8000, 9000, 10000] },
				outstanding_receivables: { value: 5000, trend: [6000, 5500, 5000] },
				average_invoice_amount: { value: 500, trend: [450, 475, 500] },
				active_clients: { value: 50, trend: [45, 48, 50] },
			};
			expect(data.current_month_revenue.value).toBe(10000);
			expect(data.active_clients.trend).toHaveLength(3);
		});

		it('should have correct MonthlyObjectivesData structure', () => {
			const data: MonthlyObjectivesData = {
				revenue: { current: 8000, objective: 10000, percentage: 80 },
				invoices: { current: 40, objective: 50, percentage: 80 },
				conversion: { current: 15, objective: 20, percentage: 75 },
				objectives_set: true,
			};
			expect(data.revenue.percentage).toBe(80);
			expect(data.objectives_set).toBe(true);
		});

		it('should have correct DiscountImpactData structure', () => {
			const data: DiscountImpactData = { document_id: 1, document_type: 'facture', total_amount: 1000, discount_amount: 100 };
			expect(data.discount_amount).toBe(100);
		});

		it('should have correct ProductMarginVolumeData structure', () => {
			const data: ProductMarginVolumeData = { article_id: 1, designation: 'A', average_margin: 25.5, total_quantity: 100 };
			expect(data.average_margin).toBe(25.5);
		});

		it('should have correct MonthlyGlobalPerformanceData structure', () => {
			const data: MonthlyGlobalPerformanceData = {
				current: { revenue: 10000, quotes: 20, conversion: 75, collection: 85, new_clients: 5 },
				previous: { revenue: 9000, quotes: 18, conversion: 70, collection: 80, new_clients: 4 },
			};
			expect(data.current.revenue).toBe(10000);
			expect(data.previous.revenue).toBe(9000);
		});

		it('should have correct SectionMicroTrendsData structure', () => {
			const data: SectionMicroTrendsData = {
				financial: [100, 110, 120],
				commercial: [50, 55, 60],
				operational: [80, 85, 90],
				cashflow: [70, 75, 80],
			};
			expect(data.financial).toHaveLength(3);
			expect(data.commercial).toHaveLength(3);
		});
	});

	describe('buildDateQueryString', () => {
		it('returns empty string for undefined params', () => {
			expect(buildDateQueryString(undefined)).toBe('');
		});

		it('returns empty string for empty params object', () => {
			expect(buildDateQueryString({})).toBe('');
		});

		it('builds query string with date_from only', () => {
			const result = buildDateQueryString({ date_from: '2024-01-01' });
			expect(result).toBe('?date_from=2024-01-01');
		});

		it('builds query string with date_to only', () => {
			const result = buildDateQueryString({ date_to: '2024-12-31' });
			expect(result).toBe('?date_to=2024-12-31');
		});

		it('builds query string with company_id only', () => {
			const result = buildDateQueryString({ company_id: 1 });
			expect(result).toBe('?company_id=1');
		});

		it('builds query string with devise only', () => {
			const result = buildDateQueryString({ devise: 'EUR' });
			expect(result).toBe('?devise=EUR');
		});

		it('builds query string with all params', () => {
			const result = buildDateQueryString({
				date_from: '2024-01-01',
				date_to: '2024-12-31',
				company_id: 1,
				devise: 'USD',
			});
			expect(result).toContain('date_from=2024-01-01');
			expect(result).toContain('date_to=2024-12-31');
			expect(result).toContain('company_id=1');
			expect(result).toContain('devise=USD');
			expect(result).toMatch(/^\?/);
		});

		it('builds query string with date_from and date_to', () => {
			const result = buildDateQueryString({
				date_from: '2024-06-01',
				date_to: '2024-06-30',
			});
			expect(result).toBe('?date_from=2024-06-01&date_to=2024-06-30');
		});

		it('builds query string with company_id and devise', () => {
			const result = buildDateQueryString({ company_id: 5, devise: 'MAD' });
			expect(result).toBe('?company_id=5&devise=MAD');
		});
	});

	describe('endpoint query functions', () => {
		const queryEndpoints = [
			'getMonthlyRevenueEvolution',
			'getRevenueByDocumentType',
			'getPaymentStatusOverview',
			'getCollectionRate',
			'getTopClientsByRevenue',
			'getTopProductsByQuantity',
			'getQuoteConversionRate',
			'getProductPriceVolumeAnalysis',
			'getInvoiceStatusDistribution',
			'getMonthlyDocumentVolume',
			'getPaymentTimeline',
			'getOverdueReceivables',
			'getPaymentDelayByClient',
			'getClientMultidimensionalProfile',
			'getKPICardsWithTrends',
			'getMonthlyObjectives',
			'getDiscountImpactAnalysis',
			'getProductMarginVolume',
			'getMonthlyGlobalPerformance',
			'getSectionMicroTrends',
		] as const;

		const mutationEndpoints = [
			'createMonthlyObjectivesSettings',
			'updateMonthlyObjectivesSettings',
			'patchMonthlyObjectivesSettings',
			'deleteMonthlyObjectivesSettings',
		] as const;

		const settingsQueryEndpoints = [
			'getAllMonthlyObjectivesSettings',
			'getMonthlyObjectivesSettingsByCompany',
		] as const;

		it.each(queryEndpoints)('endpoint %s has initiate method', (name) => {
			const endpoint = dashboardApi.endpoints[name];
			expect(endpoint).toBeDefined();
			expect(endpoint.initiate).toBeDefined();
			expect(typeof endpoint.initiate).toBe('function');
		});

		it.each(mutationEndpoints)('mutation endpoint %s has initiate method', (name) => {
			const endpoint = dashboardApi.endpoints[name];
			expect(endpoint).toBeDefined();
			expect(endpoint.initiate).toBeDefined();
			expect(typeof endpoint.initiate).toBe('function');
		});

		it.each(settingsQueryEndpoints)('settings query endpoint %s has initiate method', (name) => {
			const endpoint = dashboardApi.endpoints[name];
			expect(endpoint).toBeDefined();
			expect(endpoint.initiate).toBeDefined();
			expect(typeof endpoint.initiate).toBe('function');
		});

		it('has correct total number of endpoints', () => {
			const allEndpoints = Object.keys(dashboardApi.endpoints);
			expect(allEndpoints).toHaveLength(
				queryEndpoints.length + mutationEndpoints.length + settingsQueryEndpoints.length,
			);
		});

		it('has Dashboard and MonthlyObjectivesSettings tag types', () => {
			const enhanceEndpoints = dashboardApi.enhanceEndpoints;
			expect(enhanceEndpoints).toBeDefined();
		});
	});

	describe('query function execution via store dispatch', () => {
		const createTestStore = () =>
			configureStore({
				reducer: { [dashboardApi.reducerPath]: dashboardApi.reducer },
				middleware: (getDefault) => getDefault().concat(dashboardApi.middleware),
			});

		const getMockBaseQuery = () =>
			(jest.requireMock('@/utils/axiosBaseQuery') as { __mockFn: jest.Mock }).__mockFn;

		beforeEach(() => {
			const fn = getMockBaseQuery();
			fn.mockReset();
			fn.mockResolvedValue({ data: {} });
		});

		const dateQueryEndpoints = [
			['getMonthlyRevenueEvolution', '/dashboard/financial/monthly-revenue/'],
			['getRevenueByDocumentType', '/dashboard/financial/revenue-by-type/'],
			['getPaymentStatusOverview', '/dashboard/financial/payment-status/'],
			['getCollectionRate', '/dashboard/financial/collection-rate/'],
			['getTopClientsByRevenue', '/dashboard/commercial/top-clients/'],
			['getTopProductsByQuantity', '/dashboard/commercial/top-products/'],
			['getQuoteConversionRate', '/dashboard/commercial/quote-conversion/'],
			['getProductPriceVolumeAnalysis', '/dashboard/commercial/product-price-volume/'],
			['getInvoiceStatusDistribution', '/dashboard/operational/invoice-status/'],
			['getMonthlyDocumentVolume', '/dashboard/operational/document-volume/'],
			['getPaymentTimeline', '/dashboard/cashflow/payment-timeline/'],
			['getOverdueReceivables', '/dashboard/cashflow/overdue-receivables/'],
			['getPaymentDelayByClient', '/dashboard/cashflow/payment-delay/'],
			['getClientMultidimensionalProfile', '/dashboard/client/multidimensional-profile/'],
			['getKPICardsWithTrends', '/dashboard/kpi/cards-with-trends/'],
			['getMonthlyObjectives', '/dashboard/kpi/monthly-objectives/'],
			['getDiscountImpactAnalysis', '/dashboard/analysis/discount-impact/'],
			['getProductMarginVolume', '/dashboard/analysis/product-margin-volume/'],
			['getMonthlyGlobalPerformance', '/dashboard/synthetic/monthly-performance/'],
			['getSectionMicroTrends', '/dashboard/synthetic/section-micro-trends/'],
		] as const;

		it.each(dateQueryEndpoints)(
			'dispatching %s calls query with correct URL',
			async (endpointName, expectedUrlPrefix) => {
				const store = createTestStore();
				const fn = getMockBaseQuery();
				const callCountBefore = fn.mock.calls.length;
				const endpoint = dashboardApi.endpoints[endpointName];
				const action = endpoint.initiate({ company_id: 1 } as DateFilterParams);
				// @ts-expect-error - Dynamic endpoint access creates union type incompatible with strict dispatch
				store.dispatch(action);
				await new Promise((r) => setTimeout(r, 50));
				expect(fn.mock.calls.length).toBeGreaterThan(callCountBefore);
				const lastCall = fn.mock.calls[fn.mock.calls.length - 1];
				expect((lastCall[0] as Record<string, unknown>).url).toContain(expectedUrlPrefix);
				expect((lastCall[0] as Record<string, unknown>).method).toBe('GET');
			},
		);

		it('dispatches getAllMonthlyObjectivesSettings', async () => {
			const store = createTestStore();
			const fn = getMockBaseQuery();
			const before = fn.mock.calls.length;
			store.dispatch(dashboardApi.endpoints.getAllMonthlyObjectivesSettings.initiate());
			await new Promise((r) => setTimeout(r, 50));
			const lastCall = fn.mock.calls[fn.mock.calls.length - 1];
			expect(fn.mock.calls.length).toBeGreaterThan(before);
			expect((lastCall[0] as Record<string, unknown>).url).toBe('/dashboard/objectives/');
			expect((lastCall[0] as Record<string, unknown>).method).toBe('GET');
		});

		it('dispatches getMonthlyObjectivesSettingsByCompany', async () => {
			const store = createTestStore();
			const fn = getMockBaseQuery();
			const before = fn.mock.calls.length;
			store.dispatch(dashboardApi.endpoints.getMonthlyObjectivesSettingsByCompany.initiate(5));
			await new Promise((r) => setTimeout(r, 50));
			const lastCall = fn.mock.calls[fn.mock.calls.length - 1];
			expect(fn.mock.calls.length).toBeGreaterThan(before);
			expect((lastCall[0] as Record<string, unknown>).url).toBe('/dashboard/objectives/by-company/5/');
		});

		it('dispatches createMonthlyObjectivesSettings', async () => {
			const store = createTestStore();
			const fn = getMockBaseQuery();
			const before = fn.mock.calls.length;
			store.dispatch(
				dashboardApi.endpoints.createMonthlyObjectivesSettings.initiate({
					company: 1,
					objectif_ca: '10000',
					objectif_factures: 50,
					objectif_conversion: '25',
				}),
			);
			await new Promise((r) => setTimeout(r, 50));
			const lastCall = fn.mock.calls[fn.mock.calls.length - 1];
			expect(fn.mock.calls.length).toBeGreaterThan(before);
			expect((lastCall[0] as Record<string, unknown>).method).toBe('POST');
		});

		it('dispatches updateMonthlyObjectivesSettings', async () => {
			const store = createTestStore();
			const fn = getMockBaseQuery();
			const before = fn.mock.calls.length;
			store.dispatch(
				dashboardApi.endpoints.updateMonthlyObjectivesSettings.initiate({
					id: 1,
					data: { company: 1, objectif_ca: '20000', objectif_factures: 100, objectif_conversion: '50' },
				}),
			);
			await new Promise((r) => setTimeout(r, 50));
			const lastCall = fn.mock.calls[fn.mock.calls.length - 1];
			expect(fn.mock.calls.length).toBeGreaterThan(before);
			expect((lastCall[0] as Record<string, unknown>).url).toBe('/dashboard/objectives/1/');
			expect((lastCall[0] as Record<string, unknown>).method).toBe('PUT');
		});

		it('dispatches patchMonthlyObjectivesSettings', async () => {
			const store = createTestStore();
			const fn = getMockBaseQuery();
			const before = fn.mock.calls.length;
			store.dispatch(
				dashboardApi.endpoints.patchMonthlyObjectivesSettings.initiate({
					id: 2,
					data: { objectif_ca: '15000' },
				}),
			);
			await new Promise((r) => setTimeout(r, 50));
			const lastCall = fn.mock.calls[fn.mock.calls.length - 1];
			expect(fn.mock.calls.length).toBeGreaterThan(before);
			expect((lastCall[0] as Record<string, unknown>).url).toBe('/dashboard/objectives/2/');
			expect((lastCall[0] as Record<string, unknown>).method).toBe('PATCH');
		});

		it('dispatches deleteMonthlyObjectivesSettings', async () => {
			const store = createTestStore();
			const fn = getMockBaseQuery();
			const before = fn.mock.calls.length;
			store.dispatch(dashboardApi.endpoints.deleteMonthlyObjectivesSettings.initiate(3));
			await new Promise((r) => setTimeout(r, 50));
			const lastCall = fn.mock.calls[fn.mock.calls.length - 1];
			expect(fn.mock.calls.length).toBeGreaterThan(before);
			expect((lastCall[0] as Record<string, unknown>).url).toBe('/dashboard/objectives/3/');
			expect((lastCall[0] as Record<string, unknown>).method).toBe('DELETE');
		});
	});
});
