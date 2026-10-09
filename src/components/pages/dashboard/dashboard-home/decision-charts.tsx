'use client';

import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Bar } from '@/components/shared/themedCharts/themedCharts';
import { useGetReceivablesByClientQuery, useGetUninvoicedDeliveriesQuery } from '@/store/services/dashboard';
import type { ChartProps } from '@/types/dashboardTypes';
import { useLanguage } from '@/utils/hooks';
import { dashboardChartColors as COLORS } from '@/utils/rawData';

const ChartError = ({ retry }: { retry: () => void }) => {
	const { t } = useLanguage();
	return (
		<Stack role="alert" spacing={1} sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
			<Typography color="text.secondary">{t.dashboard.chartLoadError}</Typography>
			<Button onClick={retry}>{t.common.retry}</Button>
		</Stack>
	);
};

export const ReceivablesByClientChart = ({ dateParams, company_id, devise = 'MAD' }: ChartProps) => {
	const { t, language } = useLanguage();
	const {
		currentData: data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = useGetReceivablesByClientQuery({ ...dateParams, company_id, devise });
	if (isLoading || (isFetching && !data)) return <CircularProgress aria-label={t.common.loading} />;
	if (error) return <ChartError retry={refetch} />;
	if (!data || data.clients.length === 0)
		return <Typography color="text.secondary">{t.dashboard.noReceivables}</Typography>;
	const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
	const money = (value: number) => `${value.toLocaleString(locale, { maximumFractionDigits: 2 })} ${data.currency}`;
	const series = [
		{ key: 'overdue' as const, label: t.dashboard.overdueBalance, color: COLORS.error },
		{ key: 'not_due' as const, label: t.dashboard.notDueBalance, color: COLORS.primary },
		{ key: 'no_due_date' as const, label: t.dashboard.undatedBalance, color: '#94a3b8' },
	];
	return (
		<Stack spacing={1} sx={{ height: '100%' }}>
			<Box>
				<Typography variant="h5">{money(data.total_amount)}</Typography>
				<Typography variant="caption" color="text.secondary">
					{t.dashboard.allClientsBalance} · {t.dashboard.visibleDebtors(data.clients.length, data.client_count)}
				</Typography>
			</Box>
			<Box sx={{ flex: 1, minHeight: 0 }}>
				<Bar
					role="img"
					aria-label={t.dashboard.chartReceivables}
					data={{
						labels: data.clients.map((client) =>
							client.client_name.length > 24 ? `${client.client_name.slice(0, 22)}…` : client.client_name,
						),
						datasets: series.map((item) => ({
							label: item.label,
							data: data.clients.map((client) => client[item.key]),
							backgroundColor: item.color,
							maxBarThickness: 34,
						})),
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						indexAxis: 'y',
						scales: {
							x: {
								stacked: true,
								beginAtZero: true,
								title: { display: true, text: t.dashboard.chartAmountTTC(data.currency) },
								ticks: { callback: (value) => Number(value).toLocaleString(locale, { notation: 'compact' }) },
							},
							y: { stacked: true, grid: { display: false }, ticks: { autoSkip: false } },
						},
						plugins: {
							legend: { position: 'bottom', onClick: () => {}, labels: { boxWidth: 10, font: { size: 11 } } },
							tooltip: {
								callbacks: {
									title: (items) => data.clients[items[0].dataIndex].client_name,
									label: (item) => `${item.dataset.label} : ${money(item.parsed.x ?? 0)}`,
									afterBody: (items) =>
										t.dashboard.outstandingInvoiceCount(data.clients[items[0].dataIndex].invoice_count),
								},
							},
						},
					}}
				/>
			</Box>
			<Typography variant="caption" color="text.secondary">
				{t.dashboard.currentDocumentScope(data.as_of.split('-').reverse().join('/'))}
			</Typography>
		</Stack>
	);
};

export const UninvoicedDeliveriesChart = ({ dateParams, company_id, devise = 'MAD' }: ChartProps) => {
	const { t, language } = useLanguage();
	const {
		currentData: data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = useGetUninvoicedDeliveriesQuery({ ...dateParams, company_id, devise });
	if (isLoading || (isFetching && !data)) return <CircularProgress aria-label={t.common.loading} />;
	if (error) return <ChartError retry={refetch} />;
	if (!data || data.total_count === 0)
		return <Typography color="text.secondary">{t.dashboard.noUninvoicedDeliveries}</Typography>;
	const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
	const money = (value: number) => `${value.toLocaleString(locale, { maximumFractionDigits: 2 })} ${data.currency}`;
	const labels = {
		'0_7': t.dashboard.age0To7,
		'8_30': t.dashboard.age8To30,
		'31_60': t.dashboard.age31To60,
		over_60: t.dashboard.ageOver60,
	};
	return (
		<Stack spacing={1} sx={{ height: '100%' }}>
			<Box>
				<Typography variant="h5">{money(data.total_amount)}</Typography>
				<Typography variant="caption" color="text.secondary">
					{t.dashboard.uninvoicedBalance} · {t.dashboard.uninvoicedDeliveryCount(data.total_count)}
				</Typography>
			</Box>
			<Box sx={{ flex: 1, minHeight: 0 }}>
				<Bar
					role="img"
					aria-label={t.dashboard.chartUninvoicedDeliveries}
					data={{
						labels: data.buckets.map((bucket) => labels[bucket.key]),
						datasets: [
							{
								label: t.dashboard.uninvoicedBalance,
								data: data.buckets.map((bucket) => bucket.amount),
								backgroundColor: [COLORS.primary, COLORS.warning, '#ed6c02', COLORS.error],
								maxBarThickness: 34,
							},
						],
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						indexAxis: 'y',
						scales: {
							x: {
								beginAtZero: true,
								title: { display: true, text: t.dashboard.chartAmountTTC(data.currency) },
								ticks: { callback: (value) => Number(value).toLocaleString(locale, { notation: 'compact' }) },
							},
							y: { grid: { display: false }, title: { display: true, text: t.dashboard.deliveryAge } },
						},
						plugins: {
							legend: { display: false },
							tooltip: {
								callbacks: {
									label: (item) => money(item.parsed.x ?? 0),
									afterBody: (items) => t.dashboard.uninvoicedDeliveryCount(data.buckets[items[0].dataIndex].count),
								},
							},
						},
					}}
				/>
			</Box>
			<Typography variant="caption" color="text.secondary">
				{t.dashboard.currentDocumentScope(data.as_of.split('-').reverse().join('/'))}
			</Typography>
		</Stack>
	);
};
