'use client';

import React, { useState, useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Typography,
	CircularProgress,
	Stack,
	Button,
	Tooltip as MuiTooltip,
	IconButton,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, subMonths } from 'date-fns';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
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
	type DateFilterParams,
	type ObjectiveData,
} from '@/store/services/dashboard';
import { useGetCompanyQuery } from '@/store/services/company';
import CurrencyToggle from '@/components/shared/currencyToggle/currencyToggle';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import type { SessionProps } from '@/types/_initTypes';
import Link from 'next/link';
import { DASHBOARD_OBJECTIFS_MENSUELS } from '@/utils/routes';
import { getProfilState } from '@/store/selectors';
import { useAppSelector, useLanguage } from '@/utils/hooks';

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
);

// Chart color palette
const CHART_COLORS = {
	primary: 'rgba(25, 118, 210, 0.8)',
	primaryLight: 'rgba(25, 118, 210, 0.2)',
	secondary: 'rgba(156, 39, 176, 0.8)',
	secondaryLight: 'rgba(156, 39, 176, 0.2)',
	success: 'rgba(46, 125, 50, 0.8)',
	successLight: 'rgba(46, 125, 50, 0.2)',
	warning: 'rgba(237, 108, 2, 0.8)',
	warningLight: 'rgba(237, 108, 2, 0.2)',
	error: 'rgba(211, 47, 47, 0.8)',
	errorLight: 'rgba(211, 47, 47, 0.2)',
	info: 'rgba(2, 136, 209, 0.8)',
	infoLight: 'rgba(2, 136, 209, 0.2)',
};

const PIE_COLORS = [
	'rgba(25, 118, 210, 0.8)',
	'rgba(46, 125, 50, 0.8)',
	'rgba(237, 108, 2, 0.8)',
	'rgba(156, 39, 176, 0.8)',
	'rgba(211, 47, 47, 0.8)',
	'rgba(0, 188, 212, 0.8)',
	'rgba(255, 193, 7, 0.8)',
	'rgba(121, 85, 72, 0.8)',
];

// Chart wrapper component for consistent styling
type ChartCardProps = {
	title: string;
	description?: string;
	children: React.ReactNode;
	height?:
		| number
		| {
				xs?: number;
				sm?: number;
				md?: number;
		  };
	infoTooltip?: string;
};

const ChartCard: React.FC<ChartCardProps> = ({ title, description, children, height, infoTooltip }) => {
	// Normalize height into an object
	const heightSx =
		typeof height === 'number'
			? { xs: height, sm: height, md: height }
			: {
					xs: height?.xs ?? 300,
					sm: height?.sm ?? 350,
					md: height?.md ?? 400,
				};

	return (
		<Card elevation={2} sx={{ overflow: 'hidden', maxWidth: '100%' }}>
			<CardHeader
				title={
					<Typography
						variant="h6"
						sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }, wordBreak: 'break-word' }}
					>
						{title}
					</Typography>
				}
				subheader={
					description && (
						<Typography variant="caption" color="text.secondary">
							{description}
						</Typography>
					)
				}
				action={
					infoTooltip && (
						<MuiTooltip title={infoTooltip} arrow placement="top">
							<IconButton size="small" sx={{ color: 'text.secondary' }}>
								<InfoOutlinedIcon fontSize="small" />
							</IconButton>
						</MuiTooltip>
					)
				}
				sx={{ pb: { xs: 0, sm: 1 }, px: { xs: 1.5, sm: 2 } }}
			/>
			<CardContent sx={{ pt: { xs: 1, sm: 2 }, pb: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 } }}>
				<Box sx={{ height: heightSx, width: '100%', overflow: 'hidden' }}>{children}</Box>
			</CardContent>
		</Card>
	);
};

// Loading component
const LoadingChart: React.FC = () => (
	<Box display="flex" justifyContent="center" alignItems="center" height="100%">
		<CircularProgress />
	</Box>
);

// Empty data component with improved styling
interface EmptyChartProps {
	message?: string;
}

const EmptyChart: React.FC<EmptyChartProps> = ({ message }) => {
	const { t } = useLanguage();
	return (
		<Box
			display="flex"
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			height="100%"
			sx={{
				backgroundColor: 'grey.50',
				borderRadius: 2,
				border: '1px dashed',
				borderColor: 'grey.300',
			}}
		>
			<Typography variant="h6" color="text.secondary" gutterBottom>
				📊
			</Typography>
			<Typography variant="body2" color="text.secondary" textAlign="center">
				{message || t.dashboard.defaultEmpty}
			</Typography>
		</Box>
	);
};

// Section Title Component for responsive headings
interface SectionTitleProps {
	children: React.ReactNode;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children }) => (
	<Typography
		variant="h5"
		gutterBottom
		sx={{
			fontSize: { xs: '1.25rem', sm: '1.5rem' },
			fontWeight: 500,
		}}
	>
		{children}
	</Typography>
);

// Date Filter Component
interface DateFilterProps {
	dateFrom: Date | null;
	dateTo: Date | null;
	onDateFromChange: (date: Date | null) => void;
	onDateToChange: (date: Date | null) => void;
	onReset: () => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ dateFrom, dateTo, onDateFromChange, onDateToChange, onReset }) => {
	const { t } = useLanguage();
	return (
	<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
		<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
			<DatePicker
				label={t.dashboard.dateFrom}
				value={dateFrom}
				onChange={onDateFromChange}
				maxDate={dateTo || undefined}
				enableAccessibleFieldDOMStructure={false}
				slotProps={{
					textField: { size: 'small', sx: { minWidth: 180 } },
				}}
			/>
			<DatePicker
				label={t.dashboard.dateTo}
				value={dateTo}
				onChange={onDateToChange}
				minDate={dateFrom || undefined}
				enableAccessibleFieldDOMStructure={false}
				slotProps={{
					textField: { size: 'small', sx: { minWidth: 180 } },
				}}
			/>
			<Button variant="outlined" onClick={onReset} size="small">
				{t.dashboard.resetDates}
			</Button>
		</Stack>
	</LocalizationProvider>
	);
};

// Financial Overview Charts
interface ChartProps {
	dateParams: DateFilterParams;
	company_id: number;
	devise: 'MAD' | 'EUR' | 'USD';
}

const MonthlyRevenueChart: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetMonthlyRevenueEvolutionQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noRevenue} />;

	const chartData = {
		labels: data.map((d) => d.month),
		datasets: [
			{
				label: t.dashboard.caLabel(devise),
				data: data.map((d) => d.revenue),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				fill: true,
				tension: 0.4,
			},
		],
	};

	return <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />;
};

const RevenueByTypeChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetRevenueByDocumentTypeQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noRepartition} />;

	// Check if all amounts are zero
	const hasData = data.some((d) => d.amount > 0);
	if (!hasData) return <EmptyChart message={t.dashboard.noRepartition} />;

	const chartData = {
		labels: data.map((d) => d.type),
		datasets: [
			{
				data: data.map((d) => d.amount),
				backgroundColor: PIE_COLORS.slice(0, data.length),
			},
		],
	};

	return <Pie data={chartData} options={commonChartOptions} />;
};

const PaymentStatusChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetPaymentStatusOverviewQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noPaiement} />;

	// Check if all counts are zero
	const hasData = data.some((d) => d.count > 0);
	if (!hasData) return <EmptyChart message={t.dashboard.noPaiement} />;

	const chartData = {
		labels: data.map((d) => d.status),
		datasets: [
			{
				label: t.dashboard.collected,
				data: data.map((d) => d.count),
				backgroundColor: [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.error],
			},
		],
	};

	return <Bar data={chartData} options={commonChartOptions} />;
};

const CollectionRateGauge: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetCollectionRateQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart message={t.dashboard.noEncaissement} />;

	// Check if there's any invoiced amount
	if (data.total_invoiced === 0) return <EmptyChart message={t.dashboard.noEncaissement} />;

	const chartData = {
		labels: ['Encaissé', 'Restant'],
		datasets: [
			{
				data: [data.rate, 100 - data.rate],
				backgroundColor: [CHART_COLORS.success, CHART_COLORS.errorLight],
				borderWidth: 0,
			},
		],
	};

	return (
		<Box display="flex" flexDirection="column" alignItems="center" gap={2} height="100%">
			<Box sx={{ height: 200, width: 200 }}>
				<Doughnut
					data={chartData}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						cutout: '70%',
						plugins: { legend: { display: false } },
					}}
				/>
			</Box>
			<Box textAlign="center">
				<Typography variant="h5">{data.rate.toFixed(1)}%</Typography>
				<Typography variant="body2" color="text.secondary">
					{t.dashboard.facture2}: {data.total_invoiced.toLocaleString()} {devise}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{t.dashboard.encaisse}: {data.total_collected.toLocaleString()} {devise}
				</Typography>
			</Box>
		</Box>
	);
};

// Commercial Performance Charts
const TopClientsChart: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetTopClientsByRevenueQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noClientFound} />;

	const chartData = {
		labels: data.map((d) => (d.client_name.length > 15 ? d.client_name.substring(0, 15) + '...' : d.client_name)),
		datasets: [
			{
				label: t.dashboard.caLabel(devise),
				data: data.map((d) => d.revenue),
				backgroundColor: CHART_COLORS.primary,
			},
		],
	};

	return (
		<Bar
			data={chartData}
			options={{
				responsive: true,
				maintainAspectRatio: false,
				indexAxis: 'y',
			}}
		/>
	);
};

const TopProductsChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetTopProductsByQuantityQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noProduitFound} />;

	const chartData = {
		labels: data.map((d) => (d.designation.length > 20 ? d.designation.substring(0, 20) + '...' : d.designation)),
		datasets: [
			{
				label: t.dashboard.qteLabel,
				data: data.map((d) => d.quantity),
				backgroundColor: CHART_COLORS.secondary,
			},
		],
	};

	return (
		<Bar
			data={chartData}
			options={{
				responsive: true,
				maintainAspectRatio: false,
				indexAxis: 'y',
			}}
		/>
	);
};

const QuoteConversionChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetQuoteConversionRateQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noDevisFound} />;

	const chartData = {
		labels: data.map((d) => d.status),
		datasets: [
			{
				data: data.map((d) => d.count),
				backgroundColor: PIE_COLORS.slice(0, data.length),
			},
		],
	};

	return <Doughnut data={chartData} options={commonChartOptions} />;
};

const ProductPriceVolumeChart: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetProductPriceVolumeAnalysisQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noProduit} />;

	// Sort by quantity descending and take top 10
	const topProducts = [...data].sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 10);

	const chartData = {
		labels: topProducts.map((d) => {
			const name = d.designation || t.dashboard.noName;
			return name.length > 25 ? name.slice(0, 22) + '…' : name;
		}),
		datasets: [
			{
				label: t.dashboard.qteLabel,
				data: topProducts.map((d) => d.total_quantity),
				backgroundColor: CHART_COLORS.primary,
				xAxisID: 'x',
			},
			{
				label: t.dashboard.prixMoyLabel(devise),
				data: topProducts.map((d) => d.average_price),
				backgroundColor: CHART_COLORS.secondary,
				xAxisID: 'x1',
			},
		],
	};

	return (
		<Bar
			data={chartData}
			options={{
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						ticks: {
							autoSkip: false,
							font: { size: 11 },
						},
					},
					x: { type: 'linear', position: 'bottom', title: { display: true, text: t.dashboard.quantiteAxis } },
					x1: {
						type: 'linear',
						position: 'top',
						title: { display: true, text: t.dashboard.prixLabel(devise) },
						grid: { drawOnChartArea: false },
					},
				},
				plugins: {
					tooltip: {
						callbacks: {
							title: (items) => {
								const idx = items[0]?.dataIndex;
								return idx !== undefined ? (topProducts[idx]?.designation || t.dashboard.noName) : '';
							},
						},
					},
				},
			}}
		/>
	);
};

// Operational Indicators Charts
const InvoiceStatusChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetInvoiceStatusDistributionQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noFactureFound} />;

	const chartData = {
		labels: data.map((d) => d.status),
		datasets: [
			{
				label: t.dashboard.collected,
				data: data.map((d) => d.count),
				backgroundColor: PIE_COLORS.slice(0, data.length),
			},
		],
	};

	return <Bar data={chartData} options={commonChartOptions} />;
};

const DocumentVolumeChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetMonthlyDocumentVolumeQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noDocumentFound} />;

	const chartData = {
		labels: data.map((d) => d.month),
		datasets: [
			{
				label: t.dashboard.devis,
				data: data.map((d) => d.devis),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				tension: 0.4,
			},
			{
				label: t.dashboard.factures,
				data: data.map((d) => d.factures),
				borderColor: CHART_COLORS.success,
				backgroundColor: CHART_COLORS.successLight,
				tension: 0.4,
			},
			{
				label: t.dashboard.bls,
				data: data.map((d) => d.bdl),
				borderColor: CHART_COLORS.warning,
				backgroundColor: CHART_COLORS.warningLight,
				tension: 0.4,
			},
		],
	};

	return <Line data={chartData} options={commonChartOptions} />;
};

// Cash Flow Charts
const PaymentTimelineChart: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetPaymentTimelineQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noPaiement} />;

	const chartData = {
		labels: data.map((d) => d.date),
		datasets: [
			{
				label: t.dashboard.factureDevise(devise),
				data: data.map((d) => d.invoiced),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				tension: 0.4,
			},
			{
				label: t.dashboard.encaisseLabel(devise),
				data: data.map((d) => d.collected),
				borderColor: CHART_COLORS.success,
				backgroundColor: CHART_COLORS.successLight,
				tension: 0.4,
			},
		],
	};

	return <Line data={chartData} options={commonChartOptions} />;
};

const OverdueReceivablesChart: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetOverdueReceivablesQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noCreanceData} />;

	// Check if all counts and amounts are zero
	const hasData = data.some((d) => d.count > 0 || d.amount > 0);
	if (!hasData) return <EmptyChart message={t.dashboard.noCreanceData} />;

	const chartData = {
		labels: data.map((d) => d.period),
		datasets: [
			{
				label: t.dashboard.collected,
				data: data.map((d) => d.count),
				backgroundColor: CHART_COLORS.warning,
				yAxisID: 'y',
			},
			{
				label: t.dashboard.montantLabel(devise),
				data: data.map((d) => d.amount),
				backgroundColor: CHART_COLORS.error,
				yAxisID: 'y1',
			},
		],
	};

	return (
		<Bar
			data={chartData}
			options={{
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: { type: 'linear', position: 'left' },
					y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } },
				},
			}}
		/>
	);
};

const PaymentDelayChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetPaymentDelayByClientQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noDelai} />;

	// Sort by delay descending and take top 10
	const topDelayed = [...data].sort((a, b) => b.average_delay_days - a.average_delay_days).slice(0, 10);

	const chartData = {
		labels: topDelayed.map((d) => d.client_name),
		datasets: [
			{
				label: t.dashboard.delaiLabel,
				data: topDelayed.map((d) => d.average_delay_days),
				backgroundColor: topDelayed.map((d) =>
					d.average_delay_days > 60
						? CHART_COLORS.error
						: d.average_delay_days > 30
							? CHART_COLORS.warning
							: CHART_COLORS.success,
				),
			},
		],
	};

	return (
		<Bar
			data={chartData}
			options={{
				responsive: true,
				maintainAspectRatio: false,
				indexAxis: 'y',
				scales: {
					x: { title: { display: true, text: t.dashboard.delaiLabel } },
				},
			}}
		/>
	);
};

// Common chart options to prevent resize on hover
const commonChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	resizeDelay: 0,
	animation: {
		duration: 300,
	},
	plugins: {
		tooltip: {
			animation: {
				duration: 150,
			},
		},
	},
};

// Client Analysis Chart
const ClientProfileMetricsChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetClientMultidimensionalProfileQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noClientFound} />;

	const topClient = data[0];
	const metrics = [t.dashboard.metricVolume, t.dashboard.metricFrequence, t.dashboard.metricMontantMoy, t.dashboard.metricRapidite, t.dashboard.metricAcceptRate];

	const chartData = {
		labels: metrics,
		datasets: [
			{
				label: topClient.client_name,
				data: [
					topClient.metrics.volume / 10000,
					topClient.metrics.frequency,
					topClient.metrics.avg_amount / 1000,
					topClient.metrics.payment_speed,
					topClient.metrics.acceptance_rate,
				],
				backgroundColor: CHART_COLORS.primary,
			},
		],
	};

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Typography variant="subtitle1" gutterBottom>
				{topClient.client_name}
			</Typography>
			<Box sx={{ flex: 1, minHeight: 0 }}>
				<Bar data={chartData} options={commonChartOptions} />
			</Box>
		</Box>
	);
};

// KPI Cards
const KPICardsSection: React.FC<ChartProps> = ({ dateParams, company_id, devise = 'MAD' }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetKPICardsWithTrendsQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart message={t.dashboard.noKpiData} />;

	// Get the appropriate currency data
	const currencyData = (devise === 'EUR' 
		? data.currency_data?.EUR 
		: devise === 'USD' 
		? data.currency_data?.USD 
		: data.currency_data?.MAD) || data;

	const cards = [
		{
			title: t.dashboard.kpiCA,
			value: `${currencyData.current_month_revenue.value.toLocaleString()} ${devise}`,
			trend: currencyData.current_month_revenue.trend,
			tooltip: t.dashboard.kpiCATooltip,
		},
		{
			title: t.dashboard.kpiCreances,
			value: `${currencyData.outstanding_receivables.value.toLocaleString()} ${devise}`,
			trend: currencyData.outstanding_receivables.trend,
			tooltip: t.dashboard.kpiCreancesTooltip,
		},
		{
			title: t.dashboard.kpiMoyenneFacture,
			value: `${currencyData.average_invoice_amount.value.toLocaleString()} ${devise}`,
			trend: currencyData.average_invoice_amount.trend,
			tooltip: t.dashboard.kpiMoyenneTooltip,
		},
		{
			title: t.dashboard.kpiClientsActifs,
			value: currencyData.active_clients.value.toString(),
			trend: currencyData.active_clients.trend,
			tooltip: t.dashboard.kpiClientsTooltip,
		},
	];

	return (
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
				gap: 2,
				overflow: 'hidden',
			}}
		>
			{cards.map((card, index) => (
				<Card elevation={2} key={index} sx={{ overflow: 'hidden' }}>
					<CardHeader
						title={
							<Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
								{card.title}
							</Typography>
						}
						action={
							<MuiTooltip title={card.tooltip} arrow placement="top">
								<IconButton size="small" sx={{ color: 'text.secondary' }}>
									<InfoOutlinedIcon fontSize="small" />
								</IconButton>
							</MuiTooltip>
						}
						sx={{ pb: 0, px: { xs: 1.5, sm: 2 } }}
					/>
					<CardContent sx={{ px: { xs: 1.5, sm: 2 }, pt: 1 }}>
						<Typography
							variant="h4"
							gutterBottom
							sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }, wordBreak: 'break-word' }}
						>
							{card.value}
						</Typography>
						{card.trend.length > 0 && (
							<Box height={60}>
								<Line
									data={{
										labels: card.trend.map((_: number, i: number) => i.toString()),
										datasets: [
											{
												data: card.trend,
												borderColor: CHART_COLORS.primary,
												backgroundColor: CHART_COLORS.primaryLight,
												fill: true,
												tension: 0.4,
												pointRadius: 0,
											},
										],
									}}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										plugins: { legend: { display: false } },
										scales: { x: { display: false }, y: { display: false } },
									}}
								/>
							</Box>
						)}
					</CardContent>
				</Card>
			))}
		</Box>
	);
};

const MonthlyObjectivesSection: React.FC<ChartProps> = ({ dateParams, company_id, devise = 'MAD' }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetMonthlyObjectivesQuery({ ...dateParams, company_id });
	const { is_staff } = useAppSelector(getProfilState);

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart message={t.dashboard.noObjectifsData} />;

	// Show message with link if objectives are not set
	if (!data.objectives_set) {
		return (
			<Card elevation={2} sx={{ p: 3, textAlign: 'center' }}>
				<Typography variant="body1" color="text.secondary" gutterBottom>
					{t.dashboard.objectifsNotSet}
				</Typography>
				{is_staff && (
					<Link href={DASHBOARD_OBJECTIFS_MENSUELS} style={{ textDecoration: 'none' }}>
						<Button variant="contained" sx={{ mt: 2 }}>
							{t.dashboard.configureObjectifs}
						</Button>
					</Link>
				)}
			</Card>
		);
	}

	// Get the appropriate revenue data based on devise
	const revenueData: ObjectiveData = (devise === 'EUR' 
		? data.revenue_eur 
		: devise === 'USD' 
		? data.revenue_usd 
		: data.revenue) ?? data.revenue;

	const objectives = [
		{
			title: t.dashboard.objectifCA(devise),
			data: revenueData,
			unit: devise,
			tooltip: t.dashboard.objectifCATooltip,
		},
		{
			title: t.dashboard.objectifFactures,
			data: data.invoices,
			unit: '',
			tooltip: t.dashboard.objectifFacturesTooltip,
		},
		{
			title: t.dashboard.objectifConversion,
			data: data.conversion,
			unit: '%',
			tooltip: t.dashboard.objectifConversionTooltip,
		},
	];

	return (
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
				gap: 2,
				overflow: 'hidden',
			}}
		>
			{objectives.map((obj) => (
				<Card elevation={2} key={obj.title} sx={{ overflow: 'hidden' }}>
					<CardHeader
						title={
							<Typography variant="h6" sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
								{obj.title}
							</Typography>
						}
						action={
							<MuiTooltip title={obj.tooltip} arrow placement="top">
								<IconButton size="small" sx={{ color: 'text.secondary' }}>
									<InfoOutlinedIcon fontSize="small" />
								</IconButton>
							</MuiTooltip>
						}
						sx={{ pb: 1, px: { xs: 1.5, sm: 2 } }}
					/>
					<CardContent sx={{ px: { xs: 1.5, sm: 2 }, pt: 0 }}>
						<Box display="flex" flexDirection="column" alignItems="center" gap={2}>
							<Box sx={{ height: { xs: 120, sm: 150 }, width: { xs: 120, sm: 150 } }}>
								<Doughnut
									data={{
										labels: [t.dashboard.atteint, t.dashboard.restant],
										datasets: [
											{
												data: [obj.data.percentage, 100 - obj.data.percentage],
												backgroundColor: [CHART_COLORS.success, CHART_COLORS.errorLight],
												borderWidth: 0,
											},
										],
									}}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										cutout: '70%',
										plugins: { legend: { display: false } },
									}}
								/>
							</Box>
							<Box textAlign="center">
								<Typography variant="body1" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, wordBreak: 'break-word' }}>
									{obj.data.current.toLocaleString()} {obj.unit} / {obj.data.objective.toLocaleString()} {obj.unit}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{t.dashboard.percentAtteint(obj.data.percentage.toFixed(1))}
								</Typography>
							</Box>
						</Box>
					</CardContent>
				</Card>
			))}
		</Box>
	);
};

// Discount & Margin Analysis Charts
const DiscountImpactChart: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetDiscountImpactAnalysisQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noRemise} />;

	// Calculate discount percentage and sort by highest discount
	const dataWithPercentage = [...data]
		.map((d) => ({
			...d,
			discount_percentage: d.total_amount > 0 ? (d.discount_amount / d.total_amount) * 100 : 0,
		}))
		.sort((a, b) => b.discount_amount - a.discount_amount)
		.slice(0, 10);

	const chartData = {
		labels: dataWithPercentage.map((_, i) => `Doc ${i + 1}`),
		datasets: [
			{
				label: t.dashboard.montantTTC(devise),
				data: dataWithPercentage.map((d) => d.total_amount),
				backgroundColor: CHART_COLORS.primary,
				yAxisID: 'y',
			},
			{
				label: t.dashboard.remiseDevise(devise),
				data: dataWithPercentage.map((d) => d.discount_amount),
				backgroundColor: CHART_COLORS.warning,
				yAxisID: 'y',
			},
		],
	};

	return (
		<Bar
			data={chartData}
			options={{
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: { title: { display: true, text: t.dashboard.montantLabel(devise) } },
				},
			}}
		/>
	);
};

const ProductMarginChart: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetProductMarginVolumeQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message={t.dashboard.noMarge} />;

	// Sort by margin descending and take top 10
	const topMargins = [...data].sort((a, b) => b.average_margin - a.average_margin).slice(0, 10);

	const chartData = {
		labels: topMargins.map((d) => {
			const name = d.designation || t.dashboard.noName;
			return name.length > 25 ? name.slice(0, 22) + '…' : name;
		}),
		datasets: [
			{
				label: t.dashboard.margeMoyLabel(devise),
				data: topMargins.map((d) => d.average_margin),
				backgroundColor: CHART_COLORS.success,
				xAxisID: 'x',
			},
			{
				label: t.dashboard.qteLabel,
				data: topMargins.map((d) => d.total_quantity),
				backgroundColor: CHART_COLORS.info,
				xAxisID: 'x1',
			},
		],
	};

	return (
		<Bar
			data={chartData}
			options={{
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						ticks: {
							autoSkip: false,
							font: { size: 11 },
						},
					},
					x: { type: 'linear', position: 'bottom', title: { display: true, text: t.dashboard.margeLabel(devise) } },
					x1: {
						type: 'linear',
						position: 'top',
						title: { display: true, text: t.dashboard.quantiteAxis },
						grid: { drawOnChartArea: false },
					},
				},
				plugins: {
					tooltip: {
						callbacks: {
							title: (items) => {
								const idx = items[0]?.dataIndex;
								return idx !== undefined ? (topMargins[idx]?.designation || t.dashboard.noName) : '';
							},
						},
					},
				},
			}}
		/>
	);
};

// Synthetic Dashboards
const GlobalPerformanceComparisonChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetMonthlyGlobalPerformanceQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart message={t.dashboard.noPerformance} />;

	// Check if there's any data in current or previous period
	const hasData =
		data.current.revenue > 0 || data.current.quotes > 0 || data.previous.revenue > 0 || data.previous.quotes > 0;
	if (!hasData) return <EmptyChart message={t.dashboard.noPerformance} />;

	const metrics = [t.dashboard.metricCA10k, t.dashboard.metricDevis2, t.dashboard.metricConversion, t.dashboard.metricEncaisse10k, t.dashboard.metricNouvClients];

	const chartData = {
		labels: metrics,
		datasets: [
			{
				label: t.dashboard.moisEnCours,
				data: [
					data.current.revenue / 10000,
					data.current.quotes,
					data.current.conversion,
					data.current.collection / 10000,
					data.current.new_clients,
				],
				backgroundColor: CHART_COLORS.primary,
			},
			{
				label: t.dashboard.moisPrecedent,
				data: [
					data.previous.revenue / 10000,
					data.previous.quotes,
					data.previous.conversion,
					data.previous.collection / 10000,
					data.previous.new_clients,
				],
				backgroundColor: CHART_COLORS.secondary,
			},
		],
	};

	return <Bar data={chartData} options={commonChartOptions} />;
};

const SectionMicroTrendsChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { t } = useLanguage();
	const { data, isLoading, error } = useGetSectionMicroTrendsQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart message={t.dashboard.noTendances} />;

	const sectionData = [
		{ title: t.dashboard.trendFinancier, data: data.financial, color: CHART_COLORS.primary },
		{ title: t.dashboard.trendCommercial, data: data.commercial, color: CHART_COLORS.success },
		{ title: t.dashboard.trendOperationnel, data: data.operational, color: CHART_COLORS.warning },
		{ title: t.dashboard.trendTresorerie, data: data.cashflow, color: CHART_COLORS.secondary },
	];

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, overflow: 'hidden' }}>
			{sectionData.map((section) => (
				<Card key={section.title} elevation={1} sx={{ overflow: 'hidden' }}>
					<CardContent sx={{ px: { xs: 1.5, sm: 2 } }}>
						<Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
							{section.title}
						</Typography>
						{section.data.length > 0 ? (
							<Box height={100}>
								<Line
									data={{
										labels: section.data.map((_, i) => i.toString()),
										datasets: [
											{
												data: section.data,
												borderColor: section.color,
												backgroundColor: section.color.replace('0.8', '0.2'),
												fill: true,
												tension: 0.4,
												pointRadius: 0,
											},
										],
									}}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										plugins: { legend: { display: false } },
										scales: { x: { display: false }, y: { display: false } },
									}}
								/>
							</Box>
						) : (
							<Box
								sx={{
									height: 100,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 0.5,
								}}
							>
								<Typography variant="h6" color="text.secondary">
									📊
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{t.dashboard.noData}
								</Typography>
							</Box>
						)}
					</CardContent>
				</Card>
			))}
		</Box>
	);
};

// Main Dashboard Component
interface DashboardContentProps {
	company_id: number;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ company_id }) => {
	const { t } = useLanguage();
	const [dateFrom, setDateFrom] = useState<Date | null>(subMonths(new Date(), 12));
	const [dateTo, setDateTo] = useState<Date | null>(new Date());
	const [selectedDevise, setSelectedDevise] = useState<'MAD' | 'EUR' | 'USD'>('MAD');

	const { data: companyData } = useGetCompanyQuery({ id: company_id });
	const usesForeignCurrency = companyData?.uses_foreign_currency || false;

	const dateParams = useMemo<DateFilterParams>(
		() => ({
			date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
			date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
			company_id,
			devise: selectedDevise,
		}),
		[dateFrom, dateTo, company_id, selectedDevise],
	);

	const handleReset = () => {
		setDateFrom(subMonths(new Date(), 12));
		setDateTo(new Date());
	};

	return (
		<Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, overflowX: 'hidden', maxWidth: '100%' }}>
			{/* Currency Toggle */}
			<CurrencyToggle
				selectedDevise={selectedDevise}
				onDeviseChange={setSelectedDevise}
				usesForeignCurrency={usesForeignCurrency}
			/>
			{/* Date Filter */}
			<DateFilter
				dateFrom={dateFrom}
				dateTo={dateTo}
				onDateFromChange={setDateFrom}
				onDateToChange={setDateTo}
				onReset={handleReset}
			/>
			{/* KPI Cards */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>{t.dashboard.sectionKpi}</SectionTitle>
				<KPICardsSection dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
			</Box>
			{/* Monthly Objectives */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>{t.dashboard.sectionObjectifs}</SectionTitle>
				<MonthlyObjectivesSection dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
			</Box>
			{/* Financial Overview */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>{t.dashboard.sectionFinancier}</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title={t.dashboard.chartCA}
							description={t.dashboard.chartCADesc}
							infoTooltip={t.dashboard.tooltipEvolutionCA}
						>
							<MonthlyRevenueChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartRepartitionCA}
							description={t.dashboard.chartRepartitionCADesc}
							infoTooltip={t.dashboard.tooltipRepartitionCA}
						>
							<RevenueByTypeChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartPaiements}
							description={t.dashboard.chartPaiementsDesc}
							infoTooltip={t.dashboard.tooltipPaiements}
						>
							<PaymentStatusChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartRecouvrement}
							description={t.dashboard.chartRecouvrementDesc}
							infoTooltip={t.dashboard.tooltipRecouvrement}
						>
							<CollectionRateGauge dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Commercial Performance */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>{t.dashboard.sectionCommercial}</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title={t.dashboard.chartTopClients}
							description={t.dashboard.chartTopClientsDesc}
							infoTooltip={t.dashboard.tooltipTopClients}
						>
							<TopClientsChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartTopProduits}
							description={t.dashboard.chartTopProduitsDesc}
							infoTooltip={t.dashboard.tooltipTopProduits}
						>
							<TopProductsChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartTauxConversion}
							description={t.dashboard.chartTauxConversionDesc}
							infoTooltip={t.dashboard.tooltipConversion}
						>
							<QuoteConversionChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartPrixVolume}
							description={t.dashboard.chartPrixVolumeDesc}
							infoTooltip={t.dashboard.tooltipPrixVolume}
						>
							<ProductPriceVolumeChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Operational Indicators */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>{t.dashboard.sectionOperationnel}</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title={t.dashboard.chartRepartitionFactures}
							description={t.dashboard.chartRepartitionFacturesDesc}
							infoTooltip={t.dashboard.tooltipRepartitionFactures}
						>
							<InvoiceStatusChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartVolumeDocuments}
							description={t.dashboard.chartCADesc}
							infoTooltip={t.dashboard.tooltipVolumeDocuments}
						>
							<DocumentVolumeChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Cash Flow Analysis */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>{t.dashboard.sectionTresorerie}</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title={t.dashboard.chartChronologie}
							description={t.dashboard.chartCADesc}
							infoTooltip={t.dashboard.tooltipChronologie}
						>
							<PaymentTimelineChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartCreances}
							description={t.dashboard.chartCreancesDesc}
							infoTooltip={t.dashboard.tooltipCreances}
						>
							<OverdueReceivablesChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartDelaiPaiement}
							description={t.dashboard.chartDelaiPaiementDesc}
							infoTooltip={t.dashboard.tooltipDelaiPaiement}
						>
							<PaymentDelayChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Client Analysis */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>{t.dashboard.sectionClients}</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title={t.dashboard.chartMeilleursClient}
							description={t.dashboard.chartMeilleursClientDesc}
							infoTooltip={t.dashboard.tooltipMeilleursClient}
						>
							<ClientProfileMetricsChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Discount & Margin Analysis */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>{t.dashboard.sectionRemises}</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title={t.dashboard.chartRemises}
							description={t.dashboard.chartRemisesDesc}
							infoTooltip={t.dashboard.tooltipRemises}
						>
							<DiscountImpactChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartMarges}
							description={t.dashboard.chartMargesDesc}
							infoTooltip={t.dashboard.tooltipMarges}
						>
							<ProductMarginChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Synthetic Dashboard */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>{t.dashboard.sectionGlobal}</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title={t.dashboard.chartComparaison}
							description={t.dashboard.chartComparaisonDesc}
							infoTooltip={t.dashboard.tooltipComparaison}
						>
							<GlobalPerformanceComparisonChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title={t.dashboard.chartMicroTendances}
							description={t.dashboard.chartTendancesDesc}
							infoTooltip={t.dashboard.tooltipMicroTendances}
						>
							<SectionMicroTrendsChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

const DashboardClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperList session={session} title={t.dashboard.mainTitle}>
			{({ company_id }) => <DashboardContent company_id={company_id} />}
		</CompanyDocumentsWrapperList>
	);
};

export default DashboardClient;
