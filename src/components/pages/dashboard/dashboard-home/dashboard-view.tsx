'use client';

import React, { useState, useMemo } from 'react';
import { Box, Card, CardContent, CardHeader, Typography, CircularProgress, Stack, Button } from '@mui/material';
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
import { Line, Bar, Pie, Doughnut, Scatter } from 'react-chartjs-2';
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
} from '@/store/services/dashboard';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import type { SessionProps } from '@/types/_initTypes';

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
};

const ChartCard: React.FC<ChartCardProps> = ({ title, description, children, height }) => {
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
		<Card elevation={2}>
			<CardHeader
				title={
					<Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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
				sx={{ pb: { xs: 0, sm: 1 } }}
			/>
			<CardContent sx={{ pt: { xs: 1, sm: 2 }, pb: { xs: 2, sm: 3 } }}>
				<Box sx={{ height: heightSx, width: '100%' }}>{children}</Box>
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
				enableAccessibleFieldDOMStructure={false}
				slotProps={{
					textField: { size: 'small', sx: { minWidth: 180 } },
				}}
			/>
			<DatePicker
				label="Date de fin"
				value={dateTo}
				onChange={onDateToChange}
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
}

const MonthlyRevenueChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetMonthlyRevenueEvolutionQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de revenus disponible" />;

	const chartData = {
		labels: data.map((d) => d.month),
		datasets: [
			{
				label: "Chiffre d'affaires (MAD)",
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

const RevenueByTypeChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetRevenueByDocumentTypeQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de répartition disponible" />;

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

const PaymentStatusChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetPaymentStatusOverviewQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de statut disponible" />;

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

const CollectionRateGauge: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetCollectionRateQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart />;

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
					Facturé: {data.total_invoiced.toLocaleString()} MAD
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Encaissé: {data.total_collected.toLocaleString()} MAD
				</Typography>
			</Box>
		</Box>
	);
};

// Commercial Performance Charts
const TopClientsChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetTopClientsByRevenueQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucun client trouvé" />;

	const chartData = {
		labels: data.map((d) => (d.client_name.length > 15 ? d.client_name.substring(0, 15) + '...' : d.client_name)),
		datasets: [
			{
				label: "Chiffre d'affaires (MAD)",
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

const TopProductsChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetTopProductsByQuantityQuery(dateParams);

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

const QuoteConversionChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetQuoteConversionRateQuery(dateParams);

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

const ProductPriceVolumeChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetProductPriceVolumeAnalysisQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée produit disponible" />;

	const chartData = {
		datasets: [
			{
				label: 'Produits',
				data: data.map((d) => ({ x: d.total_quantity, y: d.average_price })),
				backgroundColor: CHART_COLORS.primary,
			},
		],
	};

	return (
		<Scatter
			data={chartData}
			options={{
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: { title: { display: true, text: 'Quantité vendue' } },
					y: { title: { display: true, text: 'Prix moyen (MAD)' } },
				},
			}}
		/>
	);
};

// Operational Indicators Charts
const InvoiceStatusChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetInvoiceStatusDistributionQuery(dateParams);

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

const DocumentVolumeChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetMonthlyDocumentVolumeQuery(dateParams);

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
const PaymentTimelineChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetPaymentTimelineQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de paiement disponible" />;

	const chartData = {
		labels: data.map((d) => d.date),
		datasets: [
			{
				label: 'Facturé (MAD)',
				data: data.map((d) => d.invoiced),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				tension: 0.4,
			},
			{
				label: 'Encaissé (MAD)',
				data: data.map((d) => d.collected),
				borderColor: CHART_COLORS.success,
				backgroundColor: CHART_COLORS.successLight,
				tension: 0.4,
			},
		],
	};

	return <Line data={chartData} options={commonChartOptions} />;
};

const OverdueReceivablesChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetOverdueReceivablesQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune créance en retard" />;

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
				label: 'Montant (MAD)',
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

const PaymentDelayChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetPaymentDelayByClientQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de délai disponible" />;

	const chartData = {
		datasets: [
			{
				label: 'Clients',
				data: data.map((d) => ({ x: d.total_amount, y: d.average_delay_days })),
				backgroundColor: CHART_COLORS.secondary,
			},
		],
	};

	return (
		<Scatter
			data={chartData}
			options={{
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: { title: { display: true, text: 'Montant facturé (MAD)' } },
					y: { title: { display: true, text: 'Délai moyen (jours)' } },
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
const ClientProfileMetricsChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetClientMultidimensionalProfileQuery(dateParams);

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
const KPICardsSection: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetKPICardsWithTrendsQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart />;

	const cards = [
		{
			title: 'CA Mois en Cours',
			value: `${data.current_month_revenue.value.toLocaleString()} MAD`,
			trend: data.current_month_revenue.trend,
		},
		{
			title: 'Créances en Cours',
			value: `${data.outstanding_receivables.value.toLocaleString()} MAD`,
			trend: data.outstanding_receivables.trend,
		},
		{
			title: 'Montant Moyen Facture',
			value: `${data.average_invoice_amount.value.toLocaleString()} MAD`,
			trend: data.average_invoice_amount.trend,
		},
		{
			title: 'Clients Actifs',
			value: data.active_clients.value.toString(),
			trend: data.active_clients.trend,
		},
	];

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
			{cards.map((card, index) => (
				<Card elevation={2} key={index}>
					<CardContent>
						<Typography variant="h6" color="text.secondary" gutterBottom>
							{card.title}
						</Typography>
						<Typography variant="h4" gutterBottom>
							{card.value}
						</Typography>
						{card.trend.length > 0 && (
							<Box height={60}>
								<Line
									data={{
										labels: card.trend.map((_, i) => i.toString()),
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

const MonthlyObjectivesSection: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetMonthlyObjectivesQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart />;

	const objectives = [
		{ title: 'Objectif CA', data: data.revenue, unit: 'MAD' },
		{ title: 'Objectif Factures', data: data.invoices, unit: '' },
		{ title: 'Objectif Conversion', data: data.conversion, unit: '%' },
	];

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
			{objectives.map((obj) => (
				<Card elevation={2} key={obj.title}>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							{obj.title}
						</Typography>
						<Box display="flex" flexDirection="column" alignItems="center" gap={2}>
							<Box sx={{ height: 150, width: 150 }}>
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
								<Typography variant="body1">
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
const DiscountImpactChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetDiscountImpactAnalysisQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de remise disponible" />;

	const chartData = {
		datasets: [
			{
				label: 'Documents',
				data: data.map((d) => ({ x: d.total_amount, y: d.discount_amount })),
				backgroundColor: CHART_COLORS.warning,
			},
		],
	};

	return (
		<Scatter
			data={chartData}
			options={{
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: { title: { display: true, text: 'Montant TTC (MAD)' } },
					y: { title: { display: true, text: 'Remise (MAD)' } },
				},
			}}
		/>
	);
};

const ProductMarginChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetProductMarginVolumeQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data || data.length === 0) return <EmptyChart message="Aucune donnée de marge disponible" />;

	const chartData = {
		datasets: [
			{
				label: 'Produits',
				data: data.map((d) => ({ x: d.total_quantity, y: d.average_margin })),
				backgroundColor: CHART_COLORS.success,
			},
		],
	};

	return (
		<Scatter
			data={chartData}
			options={{
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: { title: { display: true, text: 'Quantité vendue' } },
					y: { title: { display: true, text: 'Marge moyenne (MAD)' } },
				},
			}}
		/>
	);
};

// Synthetic Dashboards
const GlobalPerformanceComparisonChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetMonthlyGlobalPerformanceQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart />;

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

const SectionMicroTrendsChart: React.FC<ChartProps> = ({ dateParams }) => {
	const { data, isLoading, error } = useGetSectionMicroTrendsQuery(dateParams);

	if (isLoading) return <LoadingChart />;
	if (error || !data) return <EmptyChart />;

	const sectionData = [
		{ title: 'Financier', data: data.financial, color: CHART_COLORS.primary },
		{ title: 'Commercial', data: data.commercial, color: CHART_COLORS.success },
		{ title: 'Opérationnel', data: data.operational, color: CHART_COLORS.warning },
		{ title: 'Trésorerie', data: data.cashflow, color: CHART_COLORS.secondary },
	];

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
			{sectionData.map((section) => (
				<Card key={section.title} elevation={1}>
					<CardContent>
						<Typography variant="subtitle2" gutterBottom>
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
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
							>
								Aucune donnée
							</Typography>
						)}
					</CardContent>
				</Card>
			))}
		</Box>
	);
};

// Main Dashboard Component
const DashboardContent: React.FC = () => {
	const [dateFrom, setDateFrom] = useState<Date | null>(subMonths(new Date(), 12));
	const [dateTo, setDateTo] = useState<Date | null>(new Date());

	const dateParams = useMemo<DateFilterParams>(
		() => ({
			date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
			date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
		}),
		[dateFrom, dateTo],
	);

	const handleReset = () => {
		setDateFrom(subMonths(new Date(), 12));
		setDateTo(new Date());
	};

	return (
		<Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
			<Typography
				variant="h4"
				gutterBottom
				sx={{ mb: { xs: 2, sm: 3, md: 4 }, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
			>
				Tableau de Bord
			</Typography>

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
				<KPICardsSection dateParams={dateParams} />
			</Box>

			{/* Monthly Objectives */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Objectifs Mensuels</SectionTitle>
				<MonthlyObjectivesSection dateParams={dateParams} />
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
						<ChartCard title="Évolution du CA Mensuel" description="Période sélectionnée">
							<MonthlyRevenueChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="Répartition du CA par Type" description="Tous documents">
							<RevenueByTypeChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="État des Paiements" description="Statut des factures">
							<PaymentStatusChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="Taux de Recouvrement" description="Encaissements vs factures">
							<CollectionRateGauge dateParams={dateParams} />
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
						<ChartCard title="Top 10 Clients" description="Par chiffre d'affaires">
							<TopClientsChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="Top 10 Produits" description="Par quantité vendue">
							<TopProductsChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="Taux de Conversion Devis" description="Répartition par statut">
							<QuoteConversionChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="Analyse Prix/Volume" description="Produits">
							<ProductPriceVolumeChart dateParams={dateParams} />
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
						<ChartCard title="Répartition des Factures" description="Par statut">
							<InvoiceStatusChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="Volume de Documents" description="Période sélectionnée">
							<DocumentVolumeChart dateParams={dateParams} />
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
						<ChartCard title="Chronologie des Encaissements" description="Période sélectionnée">
							<PaymentTimelineChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="Créances Impayées" description="Par période d'échéance">
							<OverdueReceivablesChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="Délai de Paiement par Client" description="Montant vs délai moyen">
							<PaymentDelayChart dateParams={dateParams} />
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
						<ChartCard title="Métriques du Meilleur Client" description="Analyse multi-dimensionnelle">
							<ClientProfileMetricsChart dateParams={dateParams} />
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
						<ChartCard title="Impact des Remises" description="Montant vs remise">
							<DiscountImpactChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="Marge vs Volume" description="Analyse produits">
							<ProductMarginChart dateParams={dateParams} />
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
						<ChartCard title="Comparaison Mensuelle" description="Mois en cours vs précédent">
							<GlobalPerformanceComparisonChart dateParams={dateParams} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard title="Micro-Tendances par Section" description="Évolution période">
							<SectionMicroTrendsChart dateParams={dateParams} />
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
			{() => <DashboardContent />}
		</CompanyDocumentsWrapperList>
	);
};

export default DashboardClient;
