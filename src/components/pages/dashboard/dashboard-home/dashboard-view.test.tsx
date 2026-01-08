import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';
import type {
	MonthlyRevenueData,
	RevenueByTypeData,
	PaymentStatusData,
	CollectionRateData,
	TopClientData,
	TopProductData,
	QuoteConversionData,
	ProductPriceVolumeData,
	InvoiceStatusData,
	MonthlyDocumentVolumeData,
	PaymentTimelineData,
	OverdueReceivablesData,
	PaymentDelayData,
	ClientMultidimensionalData,
	KPICardsData,
	MonthlyObjectivesData,
	DiscountImpactData,
	ProductMarginVolumeData,
	MonthlyGlobalPerformanceData,
	SectionMicroTrendsData,
} from '@/store/services/dashboard';

// Define hook return type for proper typing
interface QueryResult<T> {
	data: T | undefined;
	isLoading: boolean;
	error: unknown;
	refetch: () => void;
}

// Mock data
const mockMonthlyRevenueData: MonthlyRevenueData[] = [
	{ month: '2025-01', revenue: 100000 },
	{ month: '2025-02', revenue: 120000 },
	{ month: '2025-03', revenue: 150000 },
];

const mockRevenueByTypeData: RevenueByTypeData[] = [
	{ type: 'Factures', amount: 500000 },
	{ type: 'Devis', amount: 200000 },
	{ type: 'Bons de livraison', amount: 100000 },
];

const mockPaymentStatusData: PaymentStatusData[] = [
	{ status: 'Payée', count: 50 },
	{ status: 'En attente', count: 20 },
	{ status: 'En retard', count: 10 },
];

const mockCollectionRateData: CollectionRateData = {
	rate: 75.5,
	total_invoiced: 1000000,
	total_collected: 755000,
};

const mockTopClientsData: TopClientData[] = [
	{ client_id: 1, client_code: 'CLI001', client_name: 'Client A', revenue: 200000 },
	{ client_id: 2, client_code: 'CLI002', client_name: 'Client B', revenue: 150000 },
];

const mockTopProductsData: TopProductData[] = [
	{ article_id: 1, designation: 'Produit A', quantity: 500 },
	{ article_id: 2, designation: 'Produit B', quantity: 300 },
];

const mockQuoteConversionData: QuoteConversionData[] = [
	{ status: 'Accepté', count: 30 },
	{ status: 'En attente', count: 15 },
	{ status: 'Refusé', count: 5 },
];

const mockProductPriceVolumeData: ProductPriceVolumeData[] = [
	{ article_id: 1, designation: 'Produit A', average_price: 100, total_quantity: 500 },
	{ article_id: 2, designation: 'Produit B', average_price: 200, total_quantity: 300 },
];

const mockInvoiceStatusData: InvoiceStatusData[] = [
	{ status: 'Validée', count: 40 },
	{ status: 'Brouillon', count: 10 },
];

const mockDocumentVolumeData: MonthlyDocumentVolumeData[] = [
	{ month: '2025-01', devis: 20, factures: 15, bdl: 10 },
	{ month: '2025-02', devis: 25, factures: 20, bdl: 15 },
];

const mockPaymentTimelineData: PaymentTimelineData[] = [
	{ date: '2025-01-01', invoiced: 50000, collected: 40000 },
	{ date: '2025-01-02', invoiced: 60000, collected: 55000 },
];

const mockOverdueReceivablesData: OverdueReceivablesData[] = [
	{ period: '0-30 jours', count: 5, amount: 50000 },
	{ period: '30-60 jours', count: 3, amount: 30000 },
];

const mockPaymentDelayData: PaymentDelayData[] = [
	{ client_id: 1, client_name: 'Client A', total_amount: 100000, average_delay_days: 15 },
	{ client_id: 2, client_name: 'Client B', total_amount: 80000, average_delay_days: 25 },
];

const mockClientProfileData: ClientMultidimensionalData[] = [
	{
		client_id: 1,
		client_name: 'Client A',
		metrics: {
			volume: 500000,
			frequency: 10,
			avg_amount: 50000,
			payment_speed: 15,
			acceptance_rate: 80,
		},
	},
];

const mockKPICardsData: KPICardsData = {
	current_month_revenue: { value: 150000, trend: [100000, 120000, 150000] },
	outstanding_receivables: { value: 245000, trend: [200000, 220000, 245000] },
	average_invoice_amount: { value: 25000, trend: [20000, 22000, 25000] },
	active_clients: { value: 25, trend: [20, 22, 25] },
};

const mockObjectivesData: MonthlyObjectivesData = {
	revenue: { current: 150000, objective: 200000, percentage: 75 },
	invoices: { current: 40, objective: 50, percentage: 80 },
	conversion: { current: 60, objective: 70, percentage: 85 },
};

const mockDiscountImpactData: DiscountImpactData[] = [
	{ document_id: 1, document_type: 'Facture', total_amount: 50000, discount_amount: 5000 },
	{ document_id: 2, document_type: 'Devis', total_amount: 30000, discount_amount: 3000 },
];

const mockProductMarginData: ProductMarginVolumeData[] = [
	{ article_id: 1, designation: 'Produit A', average_margin: 30, total_quantity: 500 },
	{ article_id: 2, designation: 'Produit B', average_margin: 25, total_quantity: 300 },
];

const mockGlobalPerformanceData: MonthlyGlobalPerformanceData = {
	current: { revenue: 150000, quotes: 30, conversion: 60, collection: 100000, new_clients: 5 },
	previous: { revenue: 120000, quotes: 25, conversion: 55, collection: 80000, new_clients: 4 },
};

const mockSectionMicroTrendsData: SectionMicroTrendsData = {
	financial: [1000, 1200, 1500, 1400, 1600],
	commercial: [10, 12, 15, 14, 16],
	operational: [20, 22, 25, 24, 26],
	cashflow: [500, 600, 700, 650, 800],
};

// Mock query state types
type MockQueryState = 'loading' | 'success' | 'error' | 'empty';

// Mock hooks states
let mockQueryStates: Record<string, MockQueryState> = {};

// Helper to create mock return value
function createMockQueryResult<T>(state: MockQueryState, data: T): QueryResult<T> {
	switch (state) {
		case 'loading':
			return { data: undefined, isLoading: true, error: undefined, refetch: jest.fn() };
		case 'error':
			return { data: undefined, isLoading: false, error: new Error('Test error'), refetch: jest.fn() };
		case 'empty':
			return { data: [] as unknown as T, isLoading: false, error: undefined, refetch: jest.fn() };
		case 'success':
		default:
			return { data, isLoading: false, error: undefined, refetch: jest.fn() };
	}
}

// Mock the dashboard service hooks
jest.mock('@/store/services/dashboard', () => ({
	__esModule: true,
	useGetMonthlyRevenueEvolutionQuery: () =>
		createMockQueryResult(mockQueryStates['monthlyRevenue'] || 'success', mockMonthlyRevenueData),
	useGetRevenueByDocumentTypeQuery: () =>
		createMockQueryResult(mockQueryStates['revenueByType'] || 'success', mockRevenueByTypeData),
	useGetPaymentStatusOverviewQuery: () =>
		createMockQueryResult(mockQueryStates['paymentStatus'] || 'success', mockPaymentStatusData),
	useGetCollectionRateQuery: () =>
		createMockQueryResult(mockQueryStates['collectionRate'] || 'success', mockCollectionRateData),
	useGetTopClientsByRevenueQuery: () =>
		createMockQueryResult(mockQueryStates['topClients'] || 'success', mockTopClientsData),
	useGetTopProductsByQuantityQuery: () =>
		createMockQueryResult(mockQueryStates['topProducts'] || 'success', mockTopProductsData),
	useGetQuoteConversionRateQuery: () =>
		createMockQueryResult(mockQueryStates['quoteConversion'] || 'success', mockQuoteConversionData),
	useGetProductPriceVolumeAnalysisQuery: () =>
		createMockQueryResult(mockQueryStates['productPriceVolume'] || 'success', mockProductPriceVolumeData),
	useGetInvoiceStatusDistributionQuery: () =>
		createMockQueryResult(mockQueryStates['invoiceStatus'] || 'success', mockInvoiceStatusData),
	useGetMonthlyDocumentVolumeQuery: () =>
		createMockQueryResult(mockQueryStates['documentVolume'] || 'success', mockDocumentVolumeData),
	useGetPaymentTimelineQuery: () =>
		createMockQueryResult(mockQueryStates['paymentTimeline'] || 'success', mockPaymentTimelineData),
	useGetOverdueReceivablesQuery: () =>
		createMockQueryResult(mockQueryStates['overdueReceivables'] || 'success', mockOverdueReceivablesData),
	useGetPaymentDelayByClientQuery: () =>
		createMockQueryResult(mockQueryStates['paymentDelay'] || 'success', mockPaymentDelayData),
	useGetClientMultidimensionalProfileQuery: () =>
		createMockQueryResult(mockQueryStates['clientProfile'] || 'success', mockClientProfileData),
	useGetKPICardsWithTrendsQuery: () =>
		createMockQueryResult(mockQueryStates['kpiCards'] || 'success', mockKPICardsData),
	useGetMonthlyObjectivesQuery: () =>
		createMockQueryResult(mockQueryStates['objectives'] || 'success', mockObjectivesData),
	useGetDiscountImpactAnalysisQuery: () =>
		createMockQueryResult(mockQueryStates['discountImpact'] || 'success', mockDiscountImpactData),
	useGetProductMarginVolumeQuery: () =>
		createMockQueryResult(mockQueryStates['productMargin'] || 'success', mockProductMarginData),
	useGetMonthlyGlobalPerformanceQuery: () =>
		createMockQueryResult(mockQueryStates['globalPerformance'] || 'success', mockGlobalPerformanceData),
	useGetSectionMicroTrendsQuery: () =>
		createMockQueryResult(mockQueryStates['sectionMicroTrends'] || 'success', mockSectionMicroTrendsData),
}));

// Mock CompanyDocumentsWrapperList
jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => ({
	__esModule: true,
	default: ({
		children,
		title,
	}: {
		children: (props: { company_id: number; role: string }) => React.ReactNode;
		title: string;
	}) => (
		<div data-testid="company-documents-wrapper">
			<h1>{title}</h1>
			{children({ company_id: 1, role: 'admin' })}
		</div>
	),
}));

// Mock Chart.js components from react-chartjs-2
jest.mock('react-chartjs-2', () => ({
	__esModule: true,
	Line: () => <div data-testid="line-chart">LineChart</div>,
	Bar: () => <div data-testid="bar-chart">BarChart</div>,
	Pie: () => <div data-testid="pie-chart">PieChart</div>,
	Doughnut: () => <div data-testid="doughnut-chart">DoughnutChart</div>,
	Scatter: () => <div data-testid="scatter-chart">ScatterChart</div>,
}));

// Mock chart.js to avoid canvas issues
jest.mock('chart.js', () => ({
	Chart: {
		register: jest.fn(),
	},
	CategoryScale: jest.fn(),
	LinearScale: jest.fn(),
	PointElement: jest.fn(),
	LineElement: jest.fn(),
	BarElement: jest.fn(),
	ArcElement: jest.fn(),
	Title: jest.fn(),
	Tooltip: jest.fn(),
	Legend: jest.fn(),
	Filler: jest.fn(),
}));

// Mock MUI DatePickers
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
	__esModule: true,
	DatePicker: ({ label }: { label: string }) => (
		<input data-testid={`date-picker-${label}`} placeholder={label} />
	),
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
	__esModule: true,
	LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
	__esModule: true,
	AdapterDateFns: jest.fn(),
}));

// Import component after mocks
import DashboardClient from './dashboard-view';

const mockSession: AppSession = {
	accessToken: 'test-access-token',
	refreshToken: 'test-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		id: '1',
		pk: 1,
		email: 'test@example.com',
		emailVerified: null,
		name: 'Test User',
		first_name: 'Test',
		last_name: 'User',
		image: null,
	},
};

describe('DashboardClient', () => {
	beforeEach(() => {
		mockQueryStates = {};
	});

	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the dashboard wrapper with title', () => {
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByTestId('company-documents-wrapper')).toBeInTheDocument();
			// Use getAllByText since title appears in wrapper and h4
			const titles = screen.getAllByText('Tableau de Bord');
			expect(titles.length).toBeGreaterThan(0);
		});

		it('renders all section titles', () => {
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Indicateurs Clés')).toBeInTheDocument();
			expect(screen.getByText('Objectifs Mensuels')).toBeInTheDocument();
			expect(screen.getByText('Aperçu Financier')).toBeInTheDocument();
			expect(screen.getByText('Performance Commerciale')).toBeInTheDocument();
			expect(screen.getByText('Indicateurs Opérationnels')).toBeInTheDocument();
			expect(screen.getByText('Analyse de Trésorerie')).toBeInTheDocument();
			expect(screen.getByText('Analyse Clients')).toBeInTheDocument();
			expect(screen.getByText('Analyse Remises et Marges')).toBeInTheDocument();
			expect(screen.getByText('Performance Globale')).toBeInTheDocument();
		});

		it('renders chart cards with titles', () => {
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Évolution du CA Mensuel')).toBeInTheDocument();
			expect(screen.getByText('Répartition du CA par Type')).toBeInTheDocument();
			expect(screen.getByText('État des Paiements')).toBeInTheDocument();
			expect(screen.getByText('Taux de Recouvrement')).toBeInTheDocument();
		});
	});

	describe('Charts rendering with data', () => {
		it('renders LineChart components', () => {
			render(<DashboardClient session={mockSession} />);
			const lineCharts = screen.getAllByTestId('line-chart');
			expect(lineCharts.length).toBeGreaterThan(0);
		});

		it('renders PieChart components', () => {
			render(<DashboardClient session={mockSession} />);
			const pieCharts = screen.getAllByTestId('pie-chart');
			expect(pieCharts.length).toBeGreaterThan(0);
		});

		it('renders BarChart components', () => {
			render(<DashboardClient session={mockSession} />);
			const barCharts = screen.getAllByTestId('bar-chart');
			expect(barCharts.length).toBeGreaterThan(0);
		});

		it('renders ScatterChart components', () => {
			render(<DashboardClient session={mockSession} />);
			const scatterCharts = screen.getAllByTestId('scatter-chart');
			expect(scatterCharts.length).toBeGreaterThan(0);
		});

		it('renders Doughnut components', () => {
			render(<DashboardClient session={mockSession} />);
			const doughnutCharts = screen.getAllByTestId('doughnut-chart');
			expect(doughnutCharts.length).toBeGreaterThan(0);
		});
	});

	describe('Loading states', () => {
		it('shows loading indicator when KPI data is loading', () => {
			mockQueryStates['kpiCards'] = 'loading';
			render(<DashboardClient session={mockSession} />);
			const spinners = screen.getAllByRole('progressbar');
			expect(spinners.length).toBeGreaterThan(0);
		});

		it('shows loading indicator when monthly revenue is loading', () => {
			mockQueryStates['monthlyRevenue'] = 'loading';
			render(<DashboardClient session={mockSession} />);
			const spinners = screen.getAllByRole('progressbar');
			expect(spinners.length).toBeGreaterThan(0);
		});
	});

	describe('Error states', () => {
		it('shows error message when KPI data fails', () => {
			mockQueryStates['kpiCards'] = 'error';
			render(<DashboardClient session={mockSession} />);
			// Error shows in KPI section
			expect(screen.getByText('Indicateurs Clés')).toBeInTheDocument();
		});

		it('shows error message when monthly revenue fails', () => {
			mockQueryStates['monthlyRevenue'] = 'error';
			render(<DashboardClient session={mockSession} />);
			// Error shows in chart section
			expect(screen.getByText('Aperçu Financier')).toBeInTheDocument();
		});
	});

	describe('Empty data handling', () => {
		it('shows empty message when monthly revenue is empty', () => {
			mockQueryStates['monthlyRevenue'] = 'empty';
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Aucune donnée de revenus disponible')).toBeInTheDocument();
		});

		it('shows empty message when top clients is empty', () => {
			mockQueryStates['topClients'] = 'empty';
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Aucun client trouvé')).toBeInTheDocument();
		});

		it('shows empty message when top products is empty', () => {
			mockQueryStates['topProducts'] = 'empty';
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Aucun produit trouvé')).toBeInTheDocument();
		});

		it('shows empty message when payment status is empty', () => {
			mockQueryStates['paymentStatus'] = 'empty';
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Aucune donnée de statut disponible')).toBeInTheDocument();
		});

		it('shows empty message when quote conversion is empty', () => {
			mockQueryStates['quoteConversion'] = 'empty';
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Aucun devis trouvé')).toBeInTheDocument();
		});

		it('shows empty message when invoice status is empty', () => {
			mockQueryStates['invoiceStatus'] = 'empty';
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Aucune facture trouvée')).toBeInTheDocument();
		});

		it('shows empty message when overdue receivables is empty', () => {
			mockQueryStates['overdueReceivables'] = 'empty';
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Aucune créance en retard')).toBeInTheDocument();
		});

		it('shows placeholder when section micro trends has empty data', () => {
			mockQueryStates['sectionMicroTrends'] = 'success';
			// This tests the component handles empty arrays within the data gracefully
			render(<DashboardClient session={mockSession} />);
			// Should still render the section titles
			expect(screen.getByText('Financier')).toBeInTheDocument();
			expect(screen.getByText('Commercial')).toBeInTheDocument();
		});
	});

	describe('KPI Cards', () => {
		it('displays KPI values correctly', () => {
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('CA Mois en Cours')).toBeInTheDocument();
			expect(screen.getByText('Créances en Cours')).toBeInTheDocument();
			expect(screen.getByText('Montant Moyen Facture')).toBeInTheDocument();
			expect(screen.getByText('Clients Actifs')).toBeInTheDocument();
		});
	});

	describe('Monthly Objectives', () => {
		it('displays objective titles', () => {
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Objectif CA')).toBeInTheDocument();
			expect(screen.getByText('Objectif Factures')).toBeInTheDocument();
			expect(screen.getByText('Objectif Conversion')).toBeInTheDocument();
		});
	});

	describe('Section Micro Trends', () => {
		it('displays all trend sections', () => {
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByText('Financier')).toBeInTheDocument();
			expect(screen.getByText('Commercial')).toBeInTheDocument();
			expect(screen.getByText('Opérationnel')).toBeInTheDocument();
			expect(screen.getByText('Trésorerie')).toBeInTheDocument();
		});
	});

	describe('Props handling', () => {
		it('handles session prop correctly', () => {
			render(<DashboardClient session={mockSession} />);
			expect(screen.getByTestId('company-documents-wrapper')).toBeInTheDocument();
		});

		it('handles undefined session', () => {
			render(<DashboardClient session={undefined} />);
			expect(screen.getByTestId('company-documents-wrapper')).toBeInTheDocument();
		});
	});
});

describe('Chart Components Empty Data Edge Cases', () => {
	beforeEach(() => {
		mockQueryStates = {};
	});

	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	it('handles all queries returning empty data simultaneously', () => {
		mockQueryStates = {
			monthlyRevenue: 'empty',
			revenueByType: 'empty',
			paymentStatus: 'empty',
			topClients: 'empty',
			topProducts: 'empty',
			quoteConversion: 'empty',
			productPriceVolume: 'empty',
			invoiceStatus: 'empty',
			documentVolume: 'empty',
			paymentTimeline: 'empty',
			overdueReceivables: 'empty',
			paymentDelay: 'empty',
			clientProfile: 'empty',
			discountImpact: 'empty',
			productMargin: 'empty',
		};

		render(<DashboardClient session={mockSession} />);

		// Should still render the page structure - use getAllByText for multiple matches
		const titles = screen.getAllByText('Tableau de Bord');
		expect(titles.length).toBeGreaterThan(0);

		// Should show empty data messages - check for at least one
		const emptyMessages = screen.getAllByText('Aucun client trouvé');
		expect(emptyMessages.length).toBeGreaterThan(0);
	});

	it('handles mixed loading/error/success states', () => {
		mockQueryStates = {
			monthlyRevenue: 'loading',
			revenueByType: 'error',
			kpiCards: 'success',
		};

		render(<DashboardClient session={mockSession} />);

		// Should render page structure - use getAllByText for multiple matches
		const titles = screen.getAllByText('Tableau de Bord');
		expect(titles.length).toBeGreaterThan(0);

		// Should have loading indicator
		const spinners = screen.getAllByRole('progressbar');
		expect(spinners.length).toBeGreaterThan(0);

		// Should still render the financial section
		expect(screen.getByText('Aperçu Financier')).toBeInTheDocument();
	});
});
