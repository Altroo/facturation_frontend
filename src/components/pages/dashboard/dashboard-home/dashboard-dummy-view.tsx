'use client';

import React, { useState, useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Typography,
	Stack,
	Button,
	Tooltip as MuiTooltip,
	IconButton,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { subMonths } from 'date-fns';
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

// ===================== DUMMY DATA GENERATION =====================

type DummyDataScenario = 'normal' | 'low' | 'high';

const generateDummyData = (scenario: DummyDataScenario) => {
	const multiplier = scenario === 'high' ? 2 : scenario === 'low' ? 0.3 : 1;

	return {
		monthlyRevenue: [
			{ month: '2025-01', revenue: 125000 * multiplier },
			{ month: '2025-02', revenue: 148000 * multiplier },
			{ month: '2025-03', revenue: 132000 * multiplier },
			{ month: '2025-04', revenue: 156000 * multiplier },
			{ month: '2025-05', revenue: 178000 * multiplier },
			{ month: '2025-06', revenue: 195000 * multiplier },
			{ month: '2025-07', revenue: 165000 * multiplier },
			{ month: '2025-08', revenue: 142000 * multiplier },
			{ month: '2025-09', revenue: 188000 * multiplier },
			{ month: '2025-10', revenue: 210000 * multiplier },
			{ month: '2025-11', revenue: 225000 * multiplier },
			{ month: '2025-12', revenue: 245000 * multiplier },
		],
		revenueByType: [
			{ type: 'Factures Client', amount: 850000 * multiplier },
			{ type: 'Factures Proforma', amount: 320000 * multiplier },
			{ type: 'Bons de Livraison', amount: 95000 * multiplier },
		],
		paymentStatus: [
			{ status: 'Payé', count: Math.round(45 * multiplier) },
			{ status: 'En attente', count: Math.round(28 * multiplier) },
			{ status: 'En retard', count: Math.round(12 * multiplier) },
		],
		collectionRate: { rate: scenario === 'high' ? 92 : scenario === 'low' ? 58 : 78 },
		topClients: [
			{ client_name: 'TechCorp SA', total_amount: 185000 * multiplier },
			{ client_name: 'InnoSolutions SARL', total_amount: 142000 * multiplier },
			{ client_name: 'Global Industries', total_amount: 128000 * multiplier },
			{ client_name: 'ModernTech Ltd', total_amount: 115000 * multiplier },
			{ client_name: 'FutureSystems', total_amount: 98000 * multiplier },
			{ client_name: 'DigitalWorks', total_amount: 87000 * multiplier },
			{ client_name: 'SmartBiz SARL', total_amount: 76000 * multiplier },
			{ client_name: 'ProServices', total_amount: 65000 * multiplier },
			{ client_name: 'NextGen Corp', total_amount: 54000 * multiplier },
			{ client_name: 'Alpha Solutions', total_amount: 43000 * multiplier },
		],
		topProducts: [
			{ article_name: 'Service Consulting Premium', total_quantity: Math.round(245 * multiplier) },
			{ article_name: 'Licence Logiciel Annuelle', total_quantity: Math.round(189 * multiplier) },
			{ article_name: 'Formation Technique', total_quantity: Math.round(156 * multiplier) },
			{ article_name: 'Support Maintenance', total_quantity: Math.round(134 * multiplier) },
			{ article_name: 'Développement Web', total_quantity: Math.round(112 * multiplier) },
			{ article_name: 'Audit Sécurité', total_quantity: Math.round(98 * multiplier) },
			{ article_name: 'Migration Cloud', total_quantity: Math.round(87 * multiplier) },
			{ article_name: 'Design UI/UX', total_quantity: Math.round(76 * multiplier) },
			{ article_name: 'API Integration', total_quantity: Math.round(65 * multiplier) },
			{ article_name: 'Data Analytics', total_quantity: Math.round(54 * multiplier) },
		],
		quoteConversion: [
			{ status: 'Accepté', count: Math.round(67 * multiplier) },
			{ status: 'Refusé', count: Math.round(23 * multiplier) },
			{ status: 'En attente', count: Math.round(35 * multiplier) },
			{ status: 'Expiré', count: Math.round(15 * multiplier) },
		],
		productPriceVolume: [
			{ article_name: 'Service A', prix_ht: 1500, total_quantity: Math.round(45 * multiplier) },
			{ article_name: 'Service B', prix_ht: 2800, total_quantity: Math.round(28 * multiplier) },
			{ article_name: 'Produit X', prix_ht: 850, total_quantity: Math.round(120 * multiplier) },
			{ article_name: 'Licence Y', prix_ht: 3200, total_quantity: Math.round(15 * multiplier) },
			{ article_name: 'Formation Z', prix_ht: 1200, total_quantity: Math.round(65 * multiplier) },
		],
		invoiceStatus: [
			{ status: 'Brouillon', count: Math.round(12 * multiplier) },
			{ status: 'Validée', count: Math.round(45 * multiplier) },
			{ status: 'Envoyée', count: Math.round(38 * multiplier) },
			{ status: 'Payée', count: Math.round(89 * multiplier) },
		],
		documentVolume: [
			{
				month: '2025-01',
				devis: Math.round(15 * multiplier),
				factures: Math.round(12 * multiplier),
				bdl: Math.round(8 * multiplier),
			},
			{
				month: '2025-02',
				devis: Math.round(18 * multiplier),
				factures: Math.round(14 * multiplier),
				bdl: Math.round(10 * multiplier),
			},
			{
				month: '2025-03',
				devis: Math.round(22 * multiplier),
				factures: Math.round(18 * multiplier),
				bdl: Math.round(12 * multiplier),
			},
			{
				month: '2025-04',
				devis: Math.round(20 * multiplier),
				factures: Math.round(16 * multiplier),
				bdl: Math.round(11 * multiplier),
			},
			{
				month: '2025-05',
				devis: Math.round(25 * multiplier),
				factures: Math.round(20 * multiplier),
				bdl: Math.round(14 * multiplier),
			},
			{
				month: '2025-06',
				devis: Math.round(28 * multiplier),
				factures: Math.round(22 * multiplier),
				bdl: Math.round(16 * multiplier),
			},
		],
		paymentTimeline: [
			{ date: '2025-01', invoiced: 125000 * multiplier, collected: 95000 * multiplier },
			{ date: '2025-02', invoiced: 148000 * multiplier, collected: 118000 * multiplier },
			{ date: '2025-03', invoiced: 132000 * multiplier, collected: 125000 * multiplier },
			{ date: '2025-04', invoiced: 156000 * multiplier, collected: 138000 * multiplier },
			{ date: '2025-05', invoiced: 178000 * multiplier, collected: 165000 * multiplier },
			{ date: '2025-06', invoiced: 195000 * multiplier, collected: 178000 * multiplier },
		],
		overdueReceivables: [
			{ period: '0-30 jours', count: Math.round(18 * multiplier), amount: 45000 * multiplier },
			{ period: '30-60 jours', count: Math.round(12 * multiplier), amount: 32000 * multiplier },
			{ period: '60-90 jours', count: Math.round(8 * multiplier), amount: 24000 * multiplier },
			{ period: '+90 jours', count: Math.round(5 * multiplier), amount: 18000 * multiplier },
		],
		paymentDelay: [
			{
				client_name: 'TechCorp SA',
				total_amount: 85000 * multiplier,
				avg_delay: scenario === 'high' ? 15 : scenario === 'low' ? 45 : 28,
			},
			{
				client_name: 'InnoSolutions SARL',
				total_amount: 62000 * multiplier,
				avg_delay: scenario === 'high' ? 12 : scenario === 'low' ? 52 : 32,
			},
			{
				client_name: 'Global Industries',
				total_amount: 48000 * multiplier,
				avg_delay: scenario === 'high' ? 8 : scenario === 'low' ? 38 : 18,
			},
			{
				client_name: 'ModernTech Ltd',
				total_amount: 35000 * multiplier,
				avg_delay: scenario === 'high' ? 22 : scenario === 'low' ? 65 : 42,
			},
			{
				client_name: 'FutureSystems',
				total_amount: 28000 * multiplier,
				avg_delay: scenario === 'high' ? 5 : scenario === 'low' ? 28 : 12,
			},
		],
		clientProfile: [
			{
				client_name: 'TechCorp SA',
				metrics: {
					volume: 185000 * multiplier,
					frequency: Math.round(12 * multiplier),
					avg_amount: 15417 * multiplier,
					payment_speed: scenario === 'high' ? 95 : scenario === 'low' ? 55 : 78,
					acceptance_rate: scenario === 'high' ? 92 : scenario === 'low' ? 62 : 85,
				},
			},
		],
		kpiCards: {
			current_month_revenue: {
				value: 245000 * multiplier,
				trend: [180000, 195000, 210000, 225000, 245000].map((v) => v * multiplier),
			},
			outstanding_receivables: {
				value: 119000 * multiplier,
				trend: [145000, 138000, 128000, 122000, 119000].map((v) => v * multiplier),
			},
			average_invoice_amount: {
				value: 12500 * multiplier,
				trend: [11200, 11800, 12100, 12300, 12500].map((v) => v * multiplier),
			},
			active_clients: {
				value: Math.round(48 * multiplier),
				trend: [42, 44, 45, 47, 48].map((v) => Math.round(v * multiplier)),
			},
		},
		monthlyObjectives: {
			revenue: {
				current: 245000 * multiplier,
				objective: 280000 * multiplier,
				percentage: scenario === 'high' ? 95 : scenario === 'low' ? 45 : 87.5,
			},
			invoices: {
				current: Math.round(89 * multiplier),
				objective: Math.round(100 * multiplier),
				percentage: scenario === 'high' ? 98 : scenario === 'low' ? 52 : 89,
			},
			conversion: {
				current: scenario === 'high' ? 78 : scenario === 'low' ? 42 : 67,
				objective: 75,
				percentage: scenario === 'high' ? 104 : scenario === 'low' ? 56 : 89.3,
			},
		},
		discountImpact: [
			{ total_amount: 25000, discount_amount: 1250 },
			{ total_amount: 45000, discount_amount: 3150 },
			{ total_amount: 18000, discount_amount: 540 },
			{ total_amount: 72000, discount_amount: 5760 },
			{ total_amount: 35000, discount_amount: 1750 },
			{ total_amount: 58000, discount_amount: 4060 },
		],
		productMargin: [
			{ article_name: 'Service A', margin: 35, quantity: Math.round(45 * multiplier) },
			{ article_name: 'Service B', margin: 42, quantity: Math.round(28 * multiplier) },
			{ article_name: 'Produit X', margin: 28, quantity: Math.round(120 * multiplier) },
			{ article_name: 'Licence Y', margin: 65, quantity: Math.round(15 * multiplier) },
			{ article_name: 'Formation Z', margin: 52, quantity: Math.round(65 * multiplier) },
		],
		globalPerformance: {
			current: {
				revenue: 245000 * multiplier,
				quotes: Math.round(28 * multiplier),
				conversion: scenario === 'high' ? 78 : scenario === 'low' ? 42 : 67,
				collection: 178000 * multiplier,
				new_clients: Math.round(8 * multiplier),
			},
			previous: {
				revenue: 225000 * multiplier,
				quotes: Math.round(25 * multiplier),
				conversion: scenario === 'high' ? 72 : scenario === 'low' ? 38 : 62,
				collection: 165000 * multiplier,
				new_clients: Math.round(6 * multiplier),
			},
		},
		sectionTrends: {
			financial: [85, 88, 82, 90, 95, 92].map((v) => v * (scenario === 'high' ? 1.2 : scenario === 'low' ? 0.6 : 1)),
			commercial: [72, 75, 78, 82, 85, 88].map((v) => v * (scenario === 'high' ? 1.2 : scenario === 'low' ? 0.6 : 1)),
			operational: [90, 88, 92, 95, 93, 96].map((v) => v * (scenario === 'high' ? 1.2 : scenario === 'low' ? 0.6 : 1)),
			cashflow: [68, 72, 75, 78, 82, 85].map((v) => v * (scenario === 'high' ? 1.2 : scenario === 'low' ? 0.6 : 1)),
		},
	};
};

// ===================== CHART COLORS =====================

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

// Common chart options
const commonChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	resizeDelay: 0,
	animation: { duration: 300 },
	plugins: { tooltip: { animation: { duration: 150 } } },
};

// ===================== REUSABLE COMPONENTS =====================

interface ChartCardProps {
	title: string;
	description?: string;
	children: React.ReactNode;
	height?: number | { xs?: number; sm?: number; md?: number };
	infoTooltip?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, description, children, height, infoTooltip }) => {
	const heightSx =
		typeof height === 'number'
			? { xs: height, sm: height, md: height }
			: { xs: height?.xs ?? 300, sm: height?.sm ?? 350, md: height?.md ?? 400 };

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

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, fontWeight: 500 }}>
		{children}
	</Typography>
);

// ===================== DATE FILTER COMPONENT =====================

interface DateFilterProps {
	dateFrom: Date | null;
	dateTo: Date | null;
	onDateFromChange: (date: Date | null) => void;
	onDateToChange: (date: Date | null) => void;
	onReset: () => void;
	scenario: DummyDataScenario;
	onScenarioChange: (scenario: DummyDataScenario) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({
	dateFrom,
	dateTo,
	onDateFromChange,
	onDateToChange,
	onReset,
	scenario,
	onScenarioChange,
}) => (
	<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
		<Stack
			direction={{ xs: 'column', md: 'row' }}
			spacing={2}
			alignItems={{ xs: 'stretch', md: 'center' }}
			sx={{ mb: 3 }}
		>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
				<DatePicker
					label="Date de début"
					value={dateFrom}
					onChange={onDateFromChange}
					maxDate={dateTo || undefined}
					enableAccessibleFieldDOMStructure={false}
					slotProps={{ textField: { size: 'small', sx: { minWidth: 180 } } }}
				/>
				<DatePicker
					label="Date de fin"
					value={dateTo}
					onChange={onDateToChange}
					minDate={dateFrom || undefined}
					enableAccessibleFieldDOMStructure={false}
					slotProps={{ textField: { size: 'small', sx: { minWidth: 180 } } }}
				/>
				<Button variant="outlined" onClick={onReset} size="small">
					Réinitialiser
				</Button>
			</Stack>
			<Box>
				<Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
					Scénario de données:
				</Typography>
				<ToggleButtonGroup
					value={scenario}
					exclusive
					onChange={(_, value) => value && onScenarioChange(value)}
					size="small"
				>
					<ToggleButton value="low" sx={{ px: 2 }}>
						📉 Bas
					</ToggleButton>
					<ToggleButton value="normal" sx={{ px: 2 }}>
						📊 Normal
					</ToggleButton>
					<ToggleButton value="high" sx={{ px: 2 }}>
						📈 Haut
					</ToggleButton>
				</ToggleButtonGroup>
			</Box>
		</Stack>
	</LocalizationProvider>
);

// ===================== CHART COMPONENTS WITH DUMMY DATA =====================

interface DummyChartProps {
	data: ReturnType<typeof generateDummyData>;
}

const MonthlyRevenueChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.monthlyRevenue.map((d) => d.month),
		datasets: [
			{
				label: "Chiffre d'affaires (MAD)",
				data: data.monthlyRevenue.map((d) => d.revenue),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				fill: true,
				tension: 0.4,
			},
		],
	};
	return <Line data={chartData} options={commonChartOptions} />;
};

const RevenueByTypeChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.revenueByType.map((d) => d.type),
		datasets: [
			{
				data: data.revenueByType.map((d) => d.amount),
				backgroundColor: PIE_COLORS.slice(0, data.revenueByType.length),
			},
		],
	};
	return <Pie data={chartData} options={commonChartOptions} />;
};

const PaymentStatusChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.paymentStatus.map((d) => d.status),
		datasets: [
			{
				label: 'Nombre de factures',
				data: data.paymentStatus.map((d) => d.count),
				backgroundColor: [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.error],
			},
		],
	};
	return <Bar data={chartData} options={commonChartOptions} />;
};

const CollectionRateGauge: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: ['Encaissé', 'Restant'],
		datasets: [
			{
				data: [data.collectionRate.rate, 100 - data.collectionRate.rate],
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
					options={{ ...commonChartOptions, cutout: '70%', plugins: { legend: { display: false } } }}
				/>
			</Box>
			<Box textAlign="center">
				<Typography variant="h4" color="success.main">
					{data.collectionRate.rate}%
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Taux de recouvrement
				</Typography>
			</Box>
		</Box>
	);
};

const TopClientsChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.topClients.map((d) => d.client_name),
		datasets: [
			{
				label: 'Montant (MAD)',
				data: data.topClients.map((d) => d.total_amount),
				backgroundColor: CHART_COLORS.primary,
			},
		],
	};
	return <Bar data={chartData} options={{ ...commonChartOptions, indexAxis: 'y' as const }} />;
};

const TopProductsChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.topProducts.map((d) => d.article_name),
		datasets: [
			{ label: 'Quantité', data: data.topProducts.map((d) => d.total_quantity), backgroundColor: CHART_COLORS.success },
		],
	};
	return <Bar data={chartData} options={{ ...commonChartOptions, indexAxis: 'y' as const }} />;
};

const QuoteConversionChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.quoteConversion.map((d) => d.status),
		datasets: [
			{
				data: data.quoteConversion.map((d) => d.count),
				backgroundColor: PIE_COLORS.slice(0, data.quoteConversion.length),
			},
		],
	};
	return <Doughnut data={chartData} options={commonChartOptions} />;
};

const ProductPriceVolumeChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.productPriceVolume.map((d) => d.article_name),
		datasets: [
			{
				label: 'Quantité vendue',
				data: data.productPriceVolume.map((d) => d.total_quantity),
				backgroundColor: CHART_COLORS.primary,
				yAxisID: 'y',
			},
			{
				label: 'Prix HT (MAD)',
				data: data.productPriceVolume.map((d) => d.prix_ht),
				backgroundColor: CHART_COLORS.secondary,
				yAxisID: 'y1',
			},
		],
	};
	return (
		<Bar
			data={chartData}
			options={{
				...commonChartOptions,
				scales: {
					y: { type: 'linear', position: 'left', title: { display: true, text: 'Quantité' } },
					y1: {
						type: 'linear',
						position: 'right',
						title: { display: true, text: 'Prix (MAD)' },
						grid: { drawOnChartArea: false },
					},
				},
			}}
		/>
	);
};

const InvoiceStatusChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.invoiceStatus.map((d) => d.status),
		datasets: [
			{
				label: 'Nombre de factures',
				data: data.invoiceStatus.map((d) => d.count),
				backgroundColor: PIE_COLORS.slice(0, data.invoiceStatus.length),
			},
		],
	};
	return <Bar data={chartData} options={commonChartOptions} />;
};

const DocumentVolumeChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.documentVolume.map((d) => d.month),
		datasets: [
			{
				label: 'Devis',
				data: data.documentVolume.map((d) => d.devis),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				tension: 0.4,
			},
			{
				label: 'Factures',
				data: data.documentVolume.map((d) => d.factures),
				borderColor: CHART_COLORS.success,
				backgroundColor: CHART_COLORS.successLight,
				tension: 0.4,
			},
			{
				label: 'Bons de livraison',
				data: data.documentVolume.map((d) => d.bdl),
				borderColor: CHART_COLORS.warning,
				backgroundColor: CHART_COLORS.warningLight,
				tension: 0.4,
			},
		],
	};
	return <Line data={chartData} options={commonChartOptions} />;
};

const PaymentTimelineChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.paymentTimeline.map((d) => d.date),
		datasets: [
			{
				label: 'Facturé (MAD)',
				data: data.paymentTimeline.map((d) => d.invoiced),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				tension: 0.4,
			},
			{
				label: 'Encaissé (MAD)',
				data: data.paymentTimeline.map((d) => d.collected),
				borderColor: CHART_COLORS.success,
				backgroundColor: CHART_COLORS.successLight,
				tension: 0.4,
			},
		],
	};
	return <Line data={chartData} options={commonChartOptions} />;
};

const OverdueReceivablesChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.overdueReceivables.map((d) => d.period),
		datasets: [
			{
				label: 'Nombre de factures',
				data: data.overdueReceivables.map((d) => d.count),
				backgroundColor: [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.error, CHART_COLORS.errorLight],
			},
		],
	};
	return <Bar data={chartData} options={commonChartOptions} />;
};

const PaymentDelayChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.paymentDelay.map((d) => d.client_name),
		datasets: [
			{
				label: 'Délai moyen (jours)',
				data: data.paymentDelay.map((d) => d.avg_delay),
				backgroundColor: data.paymentDelay.map((d) =>
					d.avg_delay > 60 ? CHART_COLORS.error : d.avg_delay > 30 ? CHART_COLORS.warning : CHART_COLORS.success,
				),
			},
		],
	};
	return (
		<Bar
			data={chartData}
			options={{
				...commonChartOptions,
				indexAxis: 'y' as const,
				scales: { x: { title: { display: true, text: 'Délai moyen (jours)' } } },
			}}
		/>
	);
};

const ClientProfileMetricsChart: React.FC<DummyChartProps> = ({ data }) => {
	const topClient = data.clientProfile[0];
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

const KPICardsSection: React.FC<DummyChartProps> = ({ data }) => {
	const cards = [
		{
			title: 'CA Mois en Cours',
			value: `${data.kpiCards.current_month_revenue.value.toLocaleString()} MAD`,
			trend: data.kpiCards.current_month_revenue.trend,
			tooltip: "Chiffre d'affaires total du mois en cours avec évolution sur les 5 dernières périodes",
		},
		{
			title: 'Créances en Cours',
			value: `${data.kpiCards.outstanding_receivables.value.toLocaleString()} MAD`,
			trend: data.kpiCards.outstanding_receivables.trend,
			tooltip: 'Montant total des factures émises non encore encaissées',
		},
		{
			title: 'Montant Moyen Facture',
			value: `${data.kpiCards.average_invoice_amount.value.toLocaleString()} MAD`,
			trend: data.kpiCards.average_invoice_amount.trend,
			tooltip: 'Montant moyen des factures émises sur la période',
		},
		{
			title: 'Clients Actifs',
			value: data.kpiCards.active_clients.value.toString(),
			trend: data.kpiCards.active_clients.trend,
			tooltip: 'Nombre de clients ayant au moins une transaction sur la période',
		},
	];

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
			{cards.map((card, index) => (
				<Card elevation={2} key={index}>
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
						<Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
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

const MonthlyObjectivesSection: React.FC<DummyChartProps> = ({ data }) => {
	const objectives = [
		{
			title: 'Objectif CA',
			data: data.monthlyObjectives.revenue,
			unit: 'MAD',
			tooltip: "Progression vers l'objectif de chiffre d'affaires mensuel",
		},
		{
			title: 'Objectif Factures',
			data: data.monthlyObjectives.invoices,
			unit: '',
			tooltip: "Progression vers l'objectif de nombre de factures émises",
		},
		{
			title: 'Objectif Conversion',
			data: data.monthlyObjectives.conversion,
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
												data: [obj.data.percentage, Math.max(0, 100 - obj.data.percentage)],
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

const DiscountImpactChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.discountImpact.map((_, i) => `Doc ${i + 1}`),
		datasets: [
			{
				label: 'Montant total (MAD)',
				data: data.discountImpact.map((d) => d.total_amount),
				backgroundColor: CHART_COLORS.primary,
			},
			{
				label: 'Remise (MAD)',
				data: data.discountImpact.map((d) => d.discount_amount),
				backgroundColor: CHART_COLORS.warning,
			},
		],
	};
	return (
		<Bar
			data={chartData}
			options={{ ...commonChartOptions, scales: { y: { title: { display: true, text: 'Montant (MAD)' } } } }}
		/>
	);
};

const ProductMarginChart: React.FC<DummyChartProps> = ({ data }) => {
	const chartData = {
		labels: data.productMargin.map((d) => d.article_name),
		datasets: [
			{
				label: 'Marge (%)',
				data: data.productMargin.map((d) => d.margin),
				backgroundColor: CHART_COLORS.success,
				yAxisID: 'y',
			},
			{
				label: 'Quantité vendue',
				data: data.productMargin.map((d) => d.quantity),
				backgroundColor: CHART_COLORS.info,
				yAxisID: 'y1',
			},
		],
	};
	return (
		<Bar
			data={chartData}
			options={{
				...commonChartOptions,
				scales: {
					y: { type: 'linear', position: 'left', title: { display: true, text: 'Marge (%)' } },
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

const GlobalPerformanceComparisonChart: React.FC<DummyChartProps> = ({ data }) => {
	const labels = ['CA (x10k)', 'Devis', 'Conversion (%)', 'Encaissements (x10k)', 'Nouveaux clients'];
	const chartData = {
		labels,
		datasets: [
			{
				label: 'Mois en cours',
				data: [
					data.globalPerformance.current.revenue / 10000,
					data.globalPerformance.current.quotes,
					data.globalPerformance.current.conversion,
					data.globalPerformance.current.collection / 10000,
					data.globalPerformance.current.new_clients,
				],
				backgroundColor: CHART_COLORS.primary,
			},
			{
				label: 'Mois précédent',
				data: [
					data.globalPerformance.previous.revenue / 10000,
					data.globalPerformance.previous.quotes,
					data.globalPerformance.previous.conversion,
					data.globalPerformance.previous.collection / 10000,
					data.globalPerformance.previous.new_clients,
				],
				backgroundColor: CHART_COLORS.secondary,
			},
		],
	};
	return <Bar data={chartData} options={commonChartOptions} />;
};

const SectionMicroTrendsChart: React.FC<DummyChartProps> = ({ data }) => {
	const sectionData = [
		{ title: 'Financier', data: data.sectionTrends.financial, color: CHART_COLORS.primary },
		{ title: 'Commercial', data: data.sectionTrends.commercial, color: CHART_COLORS.success },
		{ title: 'Opérationnel', data: data.sectionTrends.operational, color: CHART_COLORS.warning },
		{ title: 'Trésorerie', data: data.sectionTrends.cashflow, color: CHART_COLORS.secondary },
	];

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, overflow: 'hidden' }}>
			{sectionData.map((section) => (
				<Card key={section.title} elevation={1} sx={{ overflow: 'hidden' }}>
					<CardContent sx={{ px: { xs: 1.5, sm: 2 } }}>
						<Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
							{section.title}
						</Typography>
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
					</CardContent>
				</Card>
			))}
		</Box>
	);
};

// ===================== MAIN DASHBOARD CONTENT =====================

const DashboardDummyContent: React.FC = () => {
	const [dateFrom, setDateFrom] = useState<Date | null>(subMonths(new Date(), 12));
	const [dateTo, setDateTo] = useState<Date | null>(new Date());
	const [scenario, setScenario] = useState<DummyDataScenario>('normal');

	const dummyData = useMemo(() => generateDummyData(scenario), [scenario]);

	const handleReset = () => {
		setDateFrom(subMonths(new Date(), 12));
		setDateTo(new Date());
		setScenario('normal');
	};

	return (
		<Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, overflowX: 'hidden', maxWidth: '100%' }}>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={2}
				alignItems={{ xs: 'flex-start', sm: 'center' }}
				sx={{ mb: { xs: 2, sm: 3, md: 4 } }}
			>
				<Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
					Tableau de Bord (Demo)
				</Typography>
				<Box sx={{ px: 2, py: 0.5, bgcolor: 'warning.light', borderRadius: 1 }}>
					<Typography variant="caption" fontWeight="bold">
						📊 DONNÉES FICTIVES
					</Typography>
				</Box>
			</Stack>

			{/* Date Filter with Scenario Selector */}
			<DateFilter
				dateFrom={dateFrom}
				dateTo={dateTo}
				onDateFromChange={setDateFrom}
				onDateToChange={setDateTo}
				onReset={handleReset}
				scenario={scenario}
				onScenarioChange={setScenario}
			/>

			{/* KPI Cards */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Indicateurs Clés</SectionTitle>
				<KPICardsSection data={dummyData} />
			</Box>

			{/* Monthly Objectives */}
			<Box sx={{ mb: { xs: 3, md: 4 } }}>
				<SectionTitle>Objectifs Mensuels</SectionTitle>
				<MonthlyObjectivesSection data={dummyData} />
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
							infoTooltip="Affiche l'évolution du chiffre d'affaires mois par mois."
						>
							<MonthlyRevenueChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Répartition du CA par Type"
							description="Tous documents"
							infoTooltip="Distribution du CA par type de document."
						>
							<RevenueByTypeChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="État des Paiements"
							description="Statut des factures"
							infoTooltip="Répartition des factures selon leur statut de paiement."
						>
							<PaymentStatusChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Taux de Recouvrement"
							description="Encaissements vs factures"
							infoTooltip="Pourcentage du montant facturé effectivement encaissé."
						>
							<CollectionRateGauge data={dummyData} />
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
							infoTooltip="Classement des 10 meilleurs clients."
						>
							<TopClientsChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Top 10 Produits"
							description="Par quantité vendue"
							infoTooltip="Classement des 10 produits les plus vendus."
						>
							<TopProductsChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Taux de Conversion Devis"
							description="Répartition par statut"
							infoTooltip="Répartition des devis selon leur statut."
						>
							<QuoteConversionChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Analyse Prix/Volume"
							description="Produits"
							infoTooltip="Relation entre le prix et le volume de vente."
						>
							<ProductPriceVolumeChart data={dummyData} />
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
							infoTooltip="Distribution des factures selon leur état."
						>
							<InvoiceStatusChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Volume de Documents"
							description="Période sélectionnée"
							infoTooltip="Évolution du nombre de documents créés."
						>
							<DocumentVolumeChart data={dummyData} />
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
							infoTooltip="Comparaison entre facturé et encaissé."
						>
							<PaymentTimelineChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Créances Impayées"
							description="Par période d'échéance"
							infoTooltip="Répartition des créances en retard."
						>
							<OverdueReceivablesChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Délai de Paiement par Client"
							description="Montant vs délai moyen"
							infoTooltip="Relation entre montant et délai de paiement."
						>
							<PaymentDelayChart data={dummyData} />
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
							infoTooltip="Profil détaillé du meilleur client."
						>
							<ClientProfileMetricsChart data={dummyData} />
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
							infoTooltip="Corrélation entre montant total et remises."
						>
							<DiscountImpactChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Marge vs Volume"
							description="Analyse produits"
							infoTooltip="Relation marge unitaire et volume de vente."
						>
							<ProductMarginChart data={dummyData} />
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
							infoTooltip="Comparaison des indicateurs clés mensuels."
						>
							<GlobalPerformanceComparisonChart data={dummyData} />
						</ChartCard>
					</Box>
					<Box>
						<ChartCard
							title="Micro-Tendances par Section"
							description="Évolution période"
							infoTooltip="Mini-graphiques des tendances par domaine."
						>
							<SectionMicroTrendsChart data={dummyData} />
						</ChartCard>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

const DashboardDummyClient: React.FC = () => {
	return <DashboardDummyContent />;
};

export default DashboardDummyClient;
