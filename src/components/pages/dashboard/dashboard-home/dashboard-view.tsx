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
import CurrencyToggle from '@/components/shared/CurrencyToggle';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import type { SessionProps } from '@/types/_initTypes';
import Link from 'next/link';
import { DASHBOARD_OBJECTIFS_MENSUELS } from '@/utils/routes';
import { getProfilState } from '@/store/selectors';
import { useAppSelector } from '@/utils/hooks';

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

const EmptyChart: React.FC<EmptyChartProps> = ({ message }) => (
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
			{message || 'Aucune donnée disponible'}
		</Typography>
	</Box>
);

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

const DateFilter: React.FC<DateFilterProps> = ({ dateFrom, dateTo, onDateFromChange, onDateToChange, onReset }) => (
	<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
		<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
			<DatePicker
				label="Date de début"
				value={dateFrom}
				onChange={onDateFromChange}
				maxDate={dateTo || undefined}
				enableAccessibleFieldDOMStructure={false}
				slotProps={{
					textField: { size: 'small', sx: { minWidth: 180 } },
				}}
			/>
			<DatePicker
				label="Date de fin"
				value={dateTo}
				onChange={onDateToChange}
				minDate={dateFrom || undefined}
				enableAccessibleFieldDOMStructure={false}
				slotProps={{
					textField: { size: 'small', sx: { minWidth: 180 } },
				}}
			/>
			<Button variant="outlined" onClick={onReset} size="small">
				Réinitialiser
			</Button>
		</Stack>
	</LocalizationProvider>
);

// Financial Overview Charts
interface ChartProps {
	dateParams: DateFilterParams;
	company_id: number;
	devise: 'MAD' | 'EUR' | 'USD';
}

const MonthlyRevenueChart: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { data, isLoading, error } = useGetMonthlyRevenueEvolutionQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de revenus disponible" />;

	const chartData = {
		labels: data.map((d) => d.month),
		datasets: [
			{
				label: `Chiffre d'affaires (${devise})`,
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
	const { data, isLoading, error } = useGetRevenueByDocumentTypeQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de répartition disponible" />;

	// Check if all amounts are zero
	const hasData = data.some((d) => d.amount > 0);
	if (!hasData) return <EmptyChart message="Aucune donnée de répartition disponible" />;

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
	const { data, isLoading, error } = useGetPaymentStatusOverviewQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de paiement disponible" />;

	// Check if all counts are zero
	const hasData = data.some((d) => d.count > 0);
	if (!hasData) return <EmptyChart message="Aucune donnée de paiement disponible" />;

	const chartData = {
		labels: data.map((d) => d.status),
		datasets: [
			{
				label: 'Nombre de factures',
				data: data.map((d) => d.count),
				backgroundColor: [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.error],
			},
		],
	};

	return <Bar data={chartData} options={commonChartOptions} />;
};

const CollectionRateGauge: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { data, isLoading, error } = useGetCollectionRateQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart message="Aucune donnée d'encaissement disponible" />;

	// Check if there's any invoiced amount
	if (data.total_invoiced === 0) return <EmptyChart message="Aucune donnée d'encaissement disponible" />;

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
					Facturé: {data.total_invoiced.toLocaleString()} {devise}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Encaissé: {data.total_collected.toLocaleString()} {devise}
				</Typography>
			</Box>
		</Box>
	);
};

// Commercial Performance Charts
const TopClientsChart: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { data, isLoading, error } = useGetTopClientsByRevenueQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucun client trouvé" />;

	const chartData = {
		labels: data.map((d) => (d.client_name.length > 15 ? d.client_name.substring(0, 15) + '...' : d.client_name)),
		datasets: [
			{
				label: `Chiffre d'affaires (${devise})`,
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
	const { data, isLoading, error } = useGetTopProductsByQuantityQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucun produit trouvé" />;

	const chartData = {
		labels: data.map((d) => (d.designation.length > 20 ? d.designation.substring(0, 20) + '...' : d.designation)),
		datasets: [
			{
				label: 'Quantité vendue',
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
	const { data, isLoading, error } = useGetQuoteConversionRateQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucun devis trouvé" />;

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
	const { data, isLoading, error } = useGetProductPriceVolumeAnalysisQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée produit disponible" />;

	// Sort by quantity descending and take top 10
	const topProducts = [...data].sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 10);

	const chartData = {
		labels: topProducts.map((d) => d.designation || 'Sans nom'),
		datasets: [
			{
				label: 'Quantité vendue',
				data: topProducts.map((d) => d.total_quantity),
				backgroundColor: CHART_COLORS.primary,
				yAxisID: 'y',
			},
			{
				label: `Prix moyen (${devise})`,
				data: topProducts.map((d) => d.average_price),
				backgroundColor: CHART_COLORS.secondary,
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
					y: { type: 'linear', position: 'left', title: { display: true, text: 'Quantité' } },
					y1: {
						type: 'linear',
						position: 'right',
						title: { display: true, text: `Prix (${devise})` },
						grid: { drawOnChartArea: false },
					},
				},
			}}
		/>
	);
};

// Operational Indicators Charts
const InvoiceStatusChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { data, isLoading, error } = useGetInvoiceStatusDistributionQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune facture trouvée" />;

	const chartData = {
		labels: data.map((d) => d.status),
		datasets: [
			{
				label: 'Nombre de factures',
				data: data.map((d) => d.count),
				backgroundColor: PIE_COLORS.slice(0, data.length),
			},
		],
	};

	return <Bar data={chartData} options={commonChartOptions} />;
};

const DocumentVolumeChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { data, isLoading, error } = useGetMonthlyDocumentVolumeQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucun document trouvé" />;

	const chartData = {
		labels: data.map((d) => d.month),
		datasets: [
			{
				label: 'Devis',
				data: data.map((d) => d.devis),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				tension: 0.4,
			},
			{
				label: 'Factures',
				data: data.map((d) => d.factures),
				borderColor: CHART_COLORS.success,
				backgroundColor: CHART_COLORS.successLight,
				tension: 0.4,
			},
			{
				label: 'Bons de livraison',
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
	const { data, isLoading, error } = useGetPaymentTimelineQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de paiement disponible" />;

	const chartData = {
		labels: data.map((d) => d.date),
		datasets: [
			{
				label: `Facturé (${devise})`,
				data: data.map((d) => d.invoiced),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				tension: 0.4,
			},
			{
				label: `Encaissé (${devise})`,
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
	const { data, isLoading, error } = useGetOverdueReceivablesQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de créances disponible" />;

	// Check if all counts and amounts are zero
	const hasData = data.some((d) => d.count > 0 || d.amount > 0);
	if (!hasData) return <EmptyChart message="Aucune donnée de créances disponible" />;

	const chartData = {
		labels: data.map((d) => d.period),
		datasets: [
			{
				label: 'Nombre de factures',
				data: data.map((d) => d.count),
				backgroundColor: CHART_COLORS.warning,
				yAxisID: 'y',
			},
			{
				label: `Montant (${devise})`,
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
	const { data, isLoading, error } = useGetPaymentDelayByClientQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de délai disponible" />;

	// Sort by delay descending and take top 10
	const topDelayed = [...data].sort((a, b) => b.average_delay_days - a.average_delay_days).slice(0, 10);

	const chartData = {
		labels: topDelayed.map((d) => d.client_name),
		datasets: [
			{
				label: 'Délai moyen (jours)',
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
					x: { title: { display: true, text: 'Délai moyen (jours)' } },
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
	const { data, isLoading, error } = useGetClientMultidimensionalProfileQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucun client trouvé" />;

	const topClient = data[0];
	const metrics = ['Volume (x10k)', 'Fréquence', 'Montant moy (x1k)', 'Rapidité', 'Accept. (%)'];

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
	const { data, isLoading, error } = useGetKPICardsWithTrendsQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart message="Aucune donnée KPI disponible" />;

	// Get the appropriate currency data
	const currencyData = (devise === 'EUR' 
		? data.currency_data?.EUR 
		: devise === 'USD' 
		? data.currency_data?.USD 
		: data.currency_data?.MAD) || data;

	const cards = [
		{
			title: 'CA Mois en Cours',
			value: `${currencyData.current_month_revenue.value.toLocaleString()} ${devise}`,
			trend: currencyData.current_month_revenue.trend,
			tooltip: "Chiffre d'affaires total du mois en cours avec évolution sur les 5 dernières périodes",
		},
		{
			title: 'Créances en Cours',
			value: `${currencyData.outstanding_receivables.value.toLocaleString()} ${devise}`,
			trend: currencyData.outstanding_receivables.trend,
			tooltip: 'Montant total des factures émises non encore encaissées',
		},
		{
			title: 'Montant Moyen Facture',
			value: `${currencyData.average_invoice_amount.value.toLocaleString()} ${devise}`,
			trend: currencyData.average_invoice_amount.trend,
			tooltip: 'Montant moyen des factures émises sur la période',
		},
		{
			title: 'Clients Actifs',
			value: currencyData.active_clients.value.toString(),
			trend: currencyData.active_clients.trend,
			tooltip: 'Nombre de clients ayant au moins une transaction sur la période',
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
	const { data, isLoading, error } = useGetMonthlyObjectivesQuery({ ...dateParams, company_id });
	const { is_staff } = useAppSelector(getProfilState);

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart message="Aucune donnée d'objectifs disponible" />;

	// Show message with link if objectives are not set
	if (!data.objectives_set) {
		return (
			<Card elevation={2} sx={{ p: 3, textAlign: 'center' }}>
				<Typography variant="body1" color="text.secondary" gutterBottom>
					Les objectifs mensuels ne sont pas encore configurés pour cette société.
				</Typography>
				{is_staff && (
					<Link href={DASHBOARD_OBJECTIFS_MENSUELS} style={{ textDecoration: 'none' }}>
						<Button variant="contained" sx={{ mt: 2 }}>
							Configurer les objectifs
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
			title: `Objectif CA (${devise})`,
			data: revenueData,
			unit: devise,
			tooltip: "Progression vers l'objectif de chiffre d'affaires mensuel",
		},
		{
			title: 'Objectif Factures',
			data: data.invoices,
			unit: '',
			tooltip: "Progression vers l'objectif de nombre de factures émises",
		},
		{
			title: 'Objectif Conversion',
			data: data.conversion,
			unit: '%',
			tooltip: "Progression vers l'objectif de taux de conversion des devis",
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
										labels: ['Atteint', 'Restant'],
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
									{obj.data.percentage.toFixed(1)}% atteint
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
	const { data, isLoading, error } = useGetDiscountImpactAnalysisQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de remise disponible" />;

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
				label: `Montant TTC (${devise})`,
				data: dataWithPercentage.map((d) => d.total_amount),
				backgroundColor: CHART_COLORS.primary,
				yAxisID: 'y',
			},
			{
				label: `Remise (${devise})`,
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
					y: { title: { display: true, text: `Montant (${devise})` } },
				},
			}}
		/>
	);
};

const ProductMarginChart: React.FC<ChartProps> = ({ dateParams, company_id, devise }) => {
	const { data, isLoading, error } = useGetProductMarginVolumeQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de marge disponible" />;

	// Sort by margin descending and take top 10
	const topMargins = [...data].sort((a, b) => b.average_margin - a.average_margin).slice(0, 10);

	const chartData = {
		labels: topMargins.map((d) => d.designation || 'Sans nom'),
		datasets: [
			{
				label: `Marge moyenne (${devise})`,
				data: topMargins.map((d) => d.average_margin),
				backgroundColor: CHART_COLORS.success,
				yAxisID: 'y',
			},
			{
				label: 'Quantité vendue',
				data: topMargins.map((d) => d.total_quantity),
				backgroundColor: CHART_COLORS.info,
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
					y: { type: 'linear', position: 'left', title: { display: true, text: `Marge (${devise})` } },
					y1: {
						type: 'linear',
						position: 'right',
						title: { display: true, text: 'Quantité' },
						grid: { drawOnChartArea: false },
					},
				},
			}}
		/>
	);
};

// Synthetic Dashboards
const GlobalPerformanceComparisonChart: React.FC<ChartProps> = ({ dateParams, company_id }) => {
	const { data, isLoading, error } = useGetMonthlyGlobalPerformanceQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart message="Aucune donnée de performance disponible" />;

	// Check if there's any data in current or previous period
	const hasData =
		data.current.revenue > 0 || data.current.quotes > 0 || data.previous.revenue > 0 || data.previous.quotes > 0;
	if (!hasData) return <EmptyChart message="Aucune donnée de performance disponible" />;

	const metrics = ['CA (x10k)', 'Devis', 'Conversion (%)', 'Encaisse. (x10k)', 'Nouv. clients'];

	const chartData = {
		labels: metrics,
		datasets: [
			{
				label: 'Mois en cours',
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
				label: 'Mois précédent',
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
	const { data, isLoading, error } = useGetSectionMicroTrendsQuery({ ...dateParams, company_id });

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart message="Aucune donnée de tendances disponible" />;

	const sectionData = [
		{ title: 'Financier', data: data.financial, color: CHART_COLORS.primary },
		{ title: 'Commercial', data: data.commercial, color: CHART_COLORS.success },
		{ title: 'Opérationnel', data: data.operational, color: CHART_COLORS.warning },
		{ title: 'Trésorerie', data: data.cashflow, color: CHART_COLORS.secondary },
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
									Aucune donnée
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
				<SectionTitle>Indicateurs Clés</SectionTitle>
				<KPICardsSection dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
			</Box>
			{/* Monthly Objectives */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Objectifs Mensuels</SectionTitle>
				<MonthlyObjectivesSection dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
			</Box>
			{/* Financial Overview */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Aperçu Financier</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title="Évolution du CA Mensuel"
							description="Période sélectionnée"
							infoTooltip="Affiche l'évolution du chiffre d'affaires mois par mois. Permet d'identifier les tendances de croissance ou de déclin des revenus sur la période sélectionnée."
						>
							<MonthlyRevenueChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Répartition du CA par Type"
							description="Tous documents"
							infoTooltip="Montre la distribution du chiffre d'affaires par type de document (factures, proformas, etc.). Utile pour comprendre quels types de documents génèrent le plus de revenus."
						>
							<RevenueByTypeChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="État des Paiements"
							description="Statut des factures"
							infoTooltip="Répartition des factures selon leur statut de paiement (payé, en attente, en retard). Permet de suivre la santé du recouvrement."
						>
							<PaymentStatusChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Taux de Recouvrement"
							description="Encaissements vs factures"
							infoTooltip="Pourcentage du montant facturé qui a été effectivement encaissé. Un indicateur clé de la performance de recouvrement de l'entreprise."
						>
							<CollectionRateGauge dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Commercial Performance */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Performance Commerciale</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title="Top 10 Clients"
							description="Par chiffre d'affaires"
							infoTooltip="Classement des 10 meilleurs clients selon le montant total facturé. Identifie les clients les plus importants pour l'entreprise."
						>
							<TopClientsChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Top 10 Produits"
							description="Par quantité vendue"
							infoTooltip="Classement des 10 produits/services les plus vendus en termes de quantité. Aide à identifier les best-sellers."
						>
							<TopProductsChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Taux de Conversion Devis"
							description="Répartition par statut"
							infoTooltip="Répartition des devis selon leur statut (accepté, refusé, en attente). Mesure l'efficacité commerciale de conversion des propositions."
						>
							<QuoteConversionChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Analyse Prix/Volume"
							description="Produits"
							infoTooltip="Relation entre le prix unitaire et le volume de vente des produits. Permet d'identifier les opportunités de tarification."
						>
							<ProductPriceVolumeChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Operational Indicators */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Indicateurs Opérationnels</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title="Répartition des Factures"
							description="Par statut"
							infoTooltip="Distribution des factures selon leur état (brouillon, validée, envoyée, etc.). Vue d'ensemble de la gestion des factures."
						>
							<InvoiceStatusChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Volume de Documents"
							description="Période sélectionnée"
							infoTooltip="Évolution du nombre de documents créés (devis, factures, bons de livraison) par mois. Indicateur d'activité commerciale."
						>
							<DocumentVolumeChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Cash Flow Analysis */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Analyse de Trésorerie</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title="Chronologie des Encaissements"
							description="Période sélectionnée"
							infoTooltip="Comparaison entre les montants facturés et les montants réellement encaissés au fil du temps. Identifie les écarts de trésorerie."
						>
							<PaymentTimelineChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Créances Impayées"
							description="Par période d'échéance"
							infoTooltip="Répartition des créances en retard par tranche de temps (0-30j, 30-60j, 60-90j, >90j). Alerte sur les risques de non-paiement."
						>
							<OverdueReceivablesChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Délai de Paiement par Client"
							description="Montant vs délai moyen"
							infoTooltip="Relation entre le montant des factures et le délai de paiement moyen par client. Identifie les clients à risque ou les bons payeurs."
						>
							<PaymentDelayChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Client Analysis */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Analyse Clients</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title="Métriques du Meilleur Client"
							description="Analyse multi-dimensionnelle"
							infoTooltip="Profil détaillé du meilleur client : volume d'achat, fréquence des commandes, montant moyen, rapidité de paiement et taux d'acceptation des devis."
						>
							<ClientProfileMetricsChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Discount & Margin Analysis */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Analyse Remises et Marges</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title="Impact des Remises"
							description="Montant vs remise"
							infoTooltip="Corrélation entre le montant total des documents et les remises accordées. Aide à optimiser la politique de remises."
						>
							<DiscountImpactChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Marge vs Volume"
							description="Analyse produits"
							infoTooltip="Relation entre la marge unitaire et le volume de vente par produit. Identifie les produits rentables et ceux à fort volume."
						>
							<ProductMarginChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
			{/* Synthetic Dashboard */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Performance Globale</SectionTitle>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
						gap: { xs: 2, md: 3 },
					}}
				>
					<Box>
						<ChartCard
							title="Comparaison Mensuelle"
							description="Mois en cours vs précédent"
							infoTooltip="Comparaison des indicateurs clés (CA, devis, conversion, encaissements, nouveaux clients) entre le mois en cours et le mois précédent."
						>
							<GlobalPerformanceComparisonChart dateParams={dateParams} company_id={company_id} devise={selectedDevise} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Micro-Tendances par Section"
							description="Évolution période"
							infoTooltip="Mini-graphiques montrant l'évolution récente des indicateurs par domaine (financier, commercial, opérationnel, trésorerie). Vue rapide des tendances."
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
	return (
		<CompanyDocumentsWrapperList session={session} title="Tableau de Bord">
			{({ company_id }) => <DashboardContent company_id={company_id} />}
		</CompanyDocumentsWrapperList>
	);
};

export default DashboardClient;
