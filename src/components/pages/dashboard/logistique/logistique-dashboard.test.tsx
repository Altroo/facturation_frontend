import { fireEvent, render, screen } from '@testing-library/react';
import type { ChartData } from 'chart.js';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetLogistiqueDashboardQuery } from '@/store/services/logistique';
import type { CompanyDocumentsListProps } from '@/types/companyDocumentsTypes';
import type { LogistiqueStats } from '@/types/logistiqueTypes';
import { translations } from '@/translations';
import LogistiqueDashboard from './logistique-dashboard';

jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: jest.fn() }));
jest.mock('@/store/services/logistique', () => ({ useGetLogistiqueDashboardQuery: jest.fn() }));
jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ t: jest.requireActual('@/translations').translations.fr }),
}));
jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => ({
	__esModule: true,
	default: ({ children }: CompanyDocumentsListProps) =>
		children({ company_id: 12, role: 'Lecture', raison_sociale: 'Test' }),
}));
jest.mock('@/components/shared/themedCharts/themedCharts', () => ({
	Line: ({ data }: { data: ChartData }) => <output data-testid="line-chart">{JSON.stringify(data)}</output>,
	Bar: ({ data }: { data: ChartData }) => <output data-testid="bar-chart">{JSON.stringify(data)}</output>,
	Doughnut: ({ data }: { data: ChartData }) => <output data-testid="doughnut-chart">{JSON.stringify(data)}</output>,
}));

const t = translations.fr;
const mockRefetch = jest.fn();
const stats: LogistiqueStats = {
	total_commandes: 0,
	commandes_en_cours: 0,
	retards: 0,
	paiements_en_attente: 0,
	livraisons: 0,
	couts_logistiques: 0,
	swift_manquant: 0,
	documents_non_recus: 0,
	transit_non_lance: 0,
	kpi_fournisseurs: [],
	fournisseurs: [],
	kpi_marques: [],
	marques: [],
	statuts_workflow: [],
	statuts_paiement: [],
	couts_detail: { achat: 0, transport: 0, transit: 0, douane: 0, tva: 0, livraison_locale: 0, autres: 0, total: 0 },
	monthly_flow: [],
};

beforeEach(() => {
	jest.clearAllMocks();
	(useInitAccessToken as jest.Mock).mockReturnValue('token');
	(useGetLogistiqueDashboardQuery as jest.Mock).mockReturnValue({ data: stats, refetch: mockRefetch });
});

describe('LogistiqueDashboard', () => {
	it('requests the dashboard for the selected company and skips it without a token', () => {
		const { rerender } = render(<LogistiqueDashboard />);
		expect(useGetLogistiqueDashboardQuery).toHaveBeenCalledWith({ company_id: 12 }, { skip: false });
		(useInitAccessToken as jest.Mock).mockReturnValue(undefined);
		rerender(<LogistiqueDashboard />);
		expect(useGetLogistiqueDashboardQuery).toHaveBeenLastCalledWith({ company_id: 12 }, { skip: true });
	});

	it('shows loading feedback while statistics are fetched', () => {
		(useGetLogistiqueDashboardQuery as jest.Mock).mockReturnValue({ isLoading: true });
		render(<LogistiqueDashboard />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
		expect(screen.queryByTestId('logistique-dashboard-total')).not.toBeInTheDocument();
	});

	it('allows retrying statistics failures', () => {
		(useGetLogistiqueDashboardQuery as jest.Mock).mockReturnValue({ error: { status: 500 }, refetch: mockRefetch });
		render(<LogistiqueDashboard />);
		expect(screen.getByRole('alert')).toHaveTextContent(t.common.genericError);
		fireEvent.click(screen.getByRole('button', { name: t.common.retry }));
		expect(mockRefetch).toHaveBeenCalledTimes(1);
	});

	it('renders zero metrics and empty-chart messages without mounting charts', () => {
		render(<LogistiqueDashboard />);
		expect(screen.getByTestId('logistique-dashboard-total')).toHaveTextContent('0');
		expect(screen.getAllByText(t.logistique.noChartData)).toHaveLength(6);
		expect(screen.getByText(t.logistique.noSupplierKpi)).toBeInTheDocument();
		expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
		expect(screen.queryByTestId('doughnut-chart')).not.toBeInTheDocument();
	});

	it('translates monthly activity and numeric cost strings into chart datasets', () => {
		(useGetLogistiqueDashboardQuery as jest.Mock).mockReturnValue({
			data: {
				...stats,
				total_commandes: 3,
				monthly_flow: [{ month: '2026-10', commandes: 3, livraisons: 1, paiements: 2, cout_total: '1 250,50' }],
				kpi_fournisseurs: [{ fournisseur: 'Fournisseur Test', total_commandes: 3, cout_total: '1 250,50' }],
			},
		});
		render(<LogistiqueDashboard />);

		const lines = screen.getAllByTestId('line-chart').map((chart) => JSON.parse(chart.textContent!) as ChartData);
		expect(lines[0].datasets.map((dataset) => dataset.data)).toEqual([[3], [1], [2]]);
		expect(lines[1].datasets[0].data).toEqual([1250.5]);
		const share = JSON.parse(screen.getByTestId('doughnut-chart').textContent!) as ChartData;
		expect(share.labels).toEqual(['Fournisseur Test']);
		expect(share.datasets[0].data).toEqual([1250.5]);
	});
});
