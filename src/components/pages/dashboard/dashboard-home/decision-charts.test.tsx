import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReceivablesByClientChart, UninvoicedDeliveriesChart } from './decision-charts';
import { useGetReceivablesByClientQuery, useGetUninvoicedDeliveriesQuery } from '@/store/services/dashboard';
import type { ReceivablesByClientData, UninvoicedDeliveriesData } from '@/types/dashboardTypes';

jest.mock('@/store/services/dashboard', () => ({
	useGetReceivablesByClientQuery: jest.fn(),
	useGetUninvoicedDeliveriesQuery: jest.fn(),
}));
jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', t: jest.requireActual('@/translations').translations.fr }),
}));
jest.mock('react-chartjs-2', () => ({
	Bar: ({ data, 'aria-label': label }: { data: unknown; 'aria-label': string }) => (
		<div role="img" aria-label={label}>
			{JSON.stringify(data)}
		</div>
	),
}));
const receivablesHook = useGetReceivablesByClientQuery as jest.Mock;
const deliveriesHook = useGetUninvoicedDeliveriesQuery as jest.Mock;
const balances: ReceivablesByClientData = {
	as_of: '2026-10-06',
	currency: 'MAD',
	total_amount: 10000,
	overdue_amount: 6000,
	client_count: 1,
	invoice_count: 3,
	clients: [
		{
			client_id: 7,
			client_name: 'Client A',
			amount: 10000,
			overdue: 6000,
			not_due: 3000,
			no_due_date: 1000,
			invoice_count: 3,
		},
	],
};
const deliveries: UninvoicedDeliveriesData = {
	as_of: '2026-10-06',
	currency: 'EUR',
	total_amount: 5000,
	total_count: 2,
	buckets: [
		{ key: '0_7', amount: 1000, count: 1 },
		{ key: '8_30', amount: 0, count: 0 },
		{ key: '31_60', amount: 4000, count: 1 },
		{ key: 'over_60', amount: 0, count: 0 },
	],
};
const props = {
	company_id: 4,
	devise: 'MAD' as const,
	dateParams: { date_from: '2026-09-01', date_to: '2026-10-06', client_id: 7, project: 'VILLA' },
};
beforeEach(() => {
	receivablesHook.mockReturnValue({ currentData: balances, isLoading: false, isFetching: false, refetch: jest.fn() });
	deliveriesHook.mockReturnValue({ currentData: deliveries, isLoading: false, isFetching: false, refetch: jest.fn() });
});

test('shows absolute client balances by payment urgency and preserves the selected scope', () => {
	render(<ReceivablesByClientChart {...props} />);
	expect(receivablesHook).toHaveBeenLastCalledWith({ ...props.dateParams, company_id: 4, devise: 'MAD' });
	const chart = JSON.parse(screen.getByRole('img').textContent || '{}');
	expect(chart.labels).toEqual(['Client A']);
	expect(chart.datasets.map((series: { label: string; data: number[] }) => [series.label, series.data])).toEqual([
		['En retard', [6000]],
		['Échéance non dépassée', [3000]],
		['Sans échéance', [1000]],
	]);
	expect(screen.getByText(/Total à encaisser dans la sélection/)).toBeInTheDocument();
	expect(screen.getByText('Documents de la période · Situation au 06/10/2026')).toBeInTheDocument();
});

test('shows ageing delivery amounts and their document count in the requested currency', () => {
	render(<UninvoicedDeliveriesChart {...props} devise="EUR" />);
	expect(deliveriesHook).toHaveBeenLastCalledWith({ ...props.dateParams, company_id: 4, devise: 'EUR' });
	const chart = JSON.parse(screen.getByRole('img').textContent || '{}');
	expect(chart.labels).toEqual(['0 à 7 jours', '8 à 30 jours', '31 à 60 jours', 'Plus de 60 jours']);
	expect(chart.datasets[0].data).toEqual([1000, 0, 4000, 0]);
	expect(screen.getByText(/2 bons à facturer/)).toBeInTheDocument();
	expect(screen.getByText(/5.*000 EUR/)).toBeInTheDocument();
});

test('does not present old-currency amounts while new filter results are loading', () => {
	receivablesHook.mockReturnValue({ data: balances, currentData: undefined, isFetching: true, isLoading: false });
	render(<ReceivablesByClientChart {...props} devise="EUR" />);
	expect(screen.getByRole('progressbar')).toBeInTheDocument();
	expect(screen.queryByRole('img')).not.toBeInTheDocument();
	expect(screen.queryByText(/MAD/)).not.toBeInTheDocument();
});

test.each(['receivables', 'deliveries'])(
	'distinguishes a %s load failure from an empty result and allows retry',
	(kind) => {
		const refetch = jest.fn();
		const hook = kind === 'receivables' ? receivablesHook : deliveriesHook;
		const Chart = kind === 'receivables' ? ReceivablesByClientChart : UninvoicedDeliveriesChart;
		hook.mockReturnValue({ currentData: undefined, error: { status: 500 }, refetch });
		render(<Chart {...props} />);
		expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger ce graphique.');
		fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));
		expect(refetch).toHaveBeenCalledTimes(1);
	},
);

test('shows a clear empty state instead of a zero-value chart', () => {
	receivablesHook.mockReturnValue({ currentData: { ...balances, clients: [], total_amount: 0 }, refetch: jest.fn() });
	deliveriesHook.mockReturnValue({
		currentData: { ...deliveries, total_count: 0, total_amount: 0 },
		refetch: jest.fn(),
	});
	render(
		<>
			<ReceivablesByClientChart {...props} />
			<UninvoicedDeliveriesChart {...props} />
		</>,
	);
	expect(screen.queryByRole('img')).not.toBeInTheDocument();
	expect(screen.getByText(/Aucun montant à encaisser/)).toBeInTheDocument();
	expect(screen.getByText(/Aucun bon de livraison accepté à facturer/)).toBeInTheDocument();
});
