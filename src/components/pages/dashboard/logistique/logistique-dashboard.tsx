'use client';

import React from 'react';
import { Alert, Box, Button, Card, CardContent, CardHeader, CircularProgress, IconButton, Tooltip as MuiTooltip, Typography } from '@mui/material';
import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Title,
	Tooltip as ChartTooltip,
	type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
	AssignmentTurnedIn as AssignmentTurnedInIcon,
	BarChart as BarChartIcon,
	ErrorOutlined as ErrorOutlinedIcon,
	InfoOutlined as InfoOutlinedIcon,
	LocalShipping as LocalShippingIcon,
	Payment as PaymentIcon,
	RequestQuote as RequestQuoteIcon,
	Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import DashboardStatCard from '@/components/shared/dashboardStatCard/dashboardStatCard';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetLogistiqueDashboardQuery } from '@/store/services/logistique';
import { formatNumberWithSpaces } from '@/utils/helpers';
import { useLanguage } from '@/utils/hooks';
import type { SessionProps } from '@/types/_initTypes';
import type { LogistiqueStats } from '@/types/logistiqueTypes';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, ChartTooltip, Legend, Filler);

type DashboardContentProps = SessionProps & {
	company_id: number;
};

type ChartCardProps = {
	title: string;
	children: React.ReactNode;
	height?: number;
	wide?: boolean;
	infoTooltip?: string;
};

const CHART_COLORS = {
	primary: 'rgba(25, 118, 210, 0.82)',
	primarySoft: 'rgba(25, 118, 210, 0.14)',
	success: 'rgba(46, 125, 50, 0.82)',
	successSoft: 'rgba(46, 125, 50, 0.14)',
	warning: 'rgba(237, 108, 2, 0.82)',
	warningSoft: 'rgba(237, 108, 2, 0.16)',
	error: 'rgba(211, 47, 47, 0.82)',
	info: 'rgba(2, 136, 209, 0.82)',
	secondary: 'rgba(106, 27, 154, 0.82)',
	neutral: 'rgba(69, 90, 100, 0.82)',
	brown: 'rgba(93, 64, 55, 0.82)',
};

const PIE_COLORS = [
	CHART_COLORS.primary,
	CHART_COLORS.success,
	CHART_COLORS.warning,
	CHART_COLORS.error,
	CHART_COLORS.info,
	CHART_COLORS.secondary,
	CHART_COLORS.neutral,
	CHART_COLORS.brown,
];

const legendBottom = {
	position: 'bottom',
	labels: {
		boxWidth: 12,
		usePointStyle: true,
		padding: 14,
	},
} as const;

const doughnutOptions: ChartOptions<'doughnut'> = {
	responsive: true,
	maintainAspectRatio: false,
	cutout: '62%',
	resizeDelay: 0,
	animation: { duration: 300 },
	plugins: {
		legend: legendBottom,
		tooltip: { animation: { duration: 150 } },
	},
};

const lineOptions: ChartOptions<'line'> = {
	responsive: true,
	maintainAspectRatio: false,
	resizeDelay: 0,
	interaction: {
		mode: 'index',
		intersect: false,
	},
	elements: {
		line: {
			tension: 0.35,
			borderWidth: 3,
		},
		point: {
			radius: 4,
			hoverRadius: 6,
		},
	},
	plugins: {
		legend: legendBottom,
		tooltip: { animation: { duration: 150 } },
	},
	scales: {
		x: {
			grid: { display: false },
		},
		y: {
			beginAtZero: true,
			ticks: { precision: 0 },
		},
	},
};

const barOptions: ChartOptions<'bar'> = {
	responsive: true,
	maintainAspectRatio: false,
	resizeDelay: 0,
	plugins: {
		legend: { display: false },
		tooltip: { animation: { duration: 150 } },
	},
	scales: {
		x: {
			grid: { display: false },
		},
		y: {
			beginAtZero: true,
			ticks: { precision: 0 },
		},
	},
};

const formatMoney = (value: string | number | null | undefined, devise = 'MAD') =>
	`${formatNumberWithSpaces(value ?? 0, 2)} ${devise}`;

const numericValue = (value: string | number | null | undefined) => {
	const parsed = Number(String(value ?? 0).replace(/\s/g, '').replace(',', '.'));
	return Number.isFinite(parsed) ? parsed : 0;
};

const formatMonthLabel = (month: string) => {
	const [year, monthNumber] = month.split('-');
	return year && monthNumber ? `${monthNumber}/${year}` : month;
};

const hasPositiveData = (values: number[]) => values.some((value) => value > 0);

const ChartCard: React.FC<ChartCardProps> = ({ title, children, height = 320, wide = false, infoTooltip }) => (
	<Card
		elevation={2}
		sx={{
			overflow: 'hidden',
			maxWidth: '100%',
			gridColumn: wide ? { xs: 'auto', md: 'span 2' } : undefined,
		}}
	>
		<CardHeader
			title={
				<Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 700, overflowWrap: 'anywhere' }}>
					{title}
				</Typography>
			}
			action={
				infoTooltip && (
					<MuiTooltip title={infoTooltip} arrow placement="top">
						<IconButton size="small" sx={{ color: 'text.secondary' }} aria-label={infoTooltip}>
							<InfoOutlinedIcon fontSize="small" />
						</IconButton>
					</MuiTooltip>
				)
			}
			sx={{ pb: 0 }}
		/>
		<CardContent sx={{ pt: 2 }}>
			<Box sx={{ height: { xs: Math.min(height, 280), sm: height }, width: '100%', overflow: 'hidden' }}>{children}</Box>
		</CardContent>
	</Card>
);

const EmptyChart: React.FC<{ message?: string }> = ({ message }) => {
	const { t } = useLanguage();

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				border: '1px dashed',
				borderColor: 'grey.300',
				borderRadius: 2,
				bgcolor: 'grey.50',
				px: 2,
				textAlign: 'center',
				gap: 1,
			}}
		>
			<BarChartIcon sx={{ color: 'text.secondary', fontSize: 34 }} />
			<Typography variant="body2" color="text.secondary">
				{message || t.logistique.noChartData}
			</Typography>
		</Box>
	);
};

const MonthlyFlowChart: React.FC<{ stats: LogistiqueStats }> = ({ stats }) => {
	const { t } = useLanguage();
	const flow = stats.monthly_flow ?? [];
	const labels = flow.map((item) => formatMonthLabel(item.month));
	const orders = flow.map((item) => item.commandes);
	const deliveries = flow.map((item) => item.livraisons);
	const payments = flow.map((item) => item.paiements);

	if (!hasPositiveData([...orders, ...deliveries, ...payments])) {
		return <EmptyChart message={t.logistique.noChartData} />;
	}

	return (
		<Line
			data={{
				labels,
				datasets: [
					{
						label: t.logistique.createdOrders,
						data: orders,
						borderColor: CHART_COLORS.primary,
						backgroundColor: CHART_COLORS.primarySoft,
						fill: true,
					},
					{
						label: t.logistique.completedDeliveries,
						data: deliveries,
						borderColor: CHART_COLORS.success,
						backgroundColor: CHART_COLORS.successSoft,
						fill: true,
					},
					{
						label: t.logistique.validatedPayments,
						data: payments,
						borderColor: CHART_COLORS.warning,
						backgroundColor: CHART_COLORS.warningSoft,
						fill: true,
					},
				],
			}}
			options={lineOptions}
		/>
	);
};

const WorkflowChart: React.FC<{ stats: LogistiqueStats }> = ({ stats }) => {
	const { t } = useLanguage();
	const workflowStats = stats.statuts_workflow ?? [];
	const phases = [
		{
			label: t.logistique.phaseProcurement,
			statuses: ['Réception commande', 'Commande fournisseur', 'Proforma'],
		},
		{
			label: t.logistique.phaseImport,
			statuses: ["Titre d'Importation", 'Validation'],
		},
		{
			label: t.logistique.phasePaymentSwift,
			statuses: ['Paiement demandé', 'Paiement effectué', 'SWIFT / Draft LC', 'Envoi SWIFT / Draft LC'],
		},
		{
			label: t.logistique.phaseProduction,
			statuses: ['Production', 'Expédition'],
		},
		{
			label: t.logistique.phaseTransitCustoms,
			statuses: ['Documents originaux', 'Transit', 'Dédouanement'],
		},
		{
			label: t.logistique.phaseDelivery,
			statuses: ['Réception locale', 'Livraison client'],
		},
		{
			label: t.logistique.phaseClosed,
			statuses: ['Clôture', 'Annulé'],
		},
	].map((phase) => ({
		label: phase.label,
		total: workflowStats
			.filter((item) => phase.statuses.includes(item.statut))
			.reduce((sum, item) => sum + item.total, 0),
	}));
	const visiblePhases = phases.filter((phase) => phase.total > 0);
	const labels = visiblePhases.map((phase) => phase.label);
	const values = visiblePhases.map((phase) => phase.total);

	if (!hasPositiveData(values)) return <EmptyChart message={t.logistique.noChartData} />;

	return (
		<Doughnut
			data={{
				labels,
				datasets: [{ data: values, backgroundColor: PIE_COLORS.slice(0, labels.length) }],
			}}
			options={doughnutOptions}
		/>
	);
};

const PaymentChart: React.FC<{ stats: LogistiqueStats }> = ({ stats }) => {
	const { t } = useLanguage();
	const labels = stats.statuts_paiement?.map((item) => item.statut_paiement) ?? [];
	const values = stats.statuts_paiement?.map((item) => item.total) ?? [];

	if (!hasPositiveData(values)) return <EmptyChart message={t.logistique.noChartData} />;

	return (
		<Doughnut
			data={{
				labels,
				datasets: [{ data: values, backgroundColor: PIE_COLORS.slice(0, labels.length) }],
			}}
			options={doughnutOptions}
		/>
	);
};

const AlertsChart: React.FC<{ stats: LogistiqueStats }> = ({ stats }) => {
	const { t } = useLanguage();
	const labels = [t.logistique.delays, t.logistique.pendingPayments, t.logistique.swiftMissing, t.logistique.docsMissing, t.logistique.transitNotStarted];
	const values = [stats.retards, stats.paiements_en_attente, stats.swift_manquant, stats.documents_non_recus, stats.transit_non_lance];

	if (!hasPositiveData(values)) return <EmptyChart message={t.logistique.noChartData} />;

	return (
		<Bar
			data={{
				labels,
				datasets: [
					{
						data: values,
						backgroundColor: [CHART_COLORS.error, CHART_COLORS.warning, CHART_COLORS.brown, CHART_COLORS.neutral, CHART_COLORS.info],
						borderRadius: 6,
					},
				],
			}}
			options={barOptions}
		/>
	);
};

const CostBreakdownChart: React.FC<{ stats: LogistiqueStats }> = ({ stats }) => {
	const { t } = useLanguage();
	const labels = [
		t.articles.colPrixAchat,
		t.logistique.fieldCoutTransport,
		t.logistique.fieldFraisTransit,
		t.logistique.fieldFraisDouane,
		t.logistique.fieldTva,
		t.logistique.fieldLivraisonLocale,
		t.logistique.fieldAutresFrais,
	];
	const values = [
		numericValue(stats.couts_detail?.achat),
		numericValue(stats.couts_detail?.transport),
		numericValue(stats.couts_detail?.transit),
		numericValue(stats.couts_detail?.douane),
		numericValue(stats.couts_detail?.tva),
		numericValue(stats.couts_detail?.livraison_locale),
		numericValue(stats.couts_detail?.autres),
	];

	if (!hasPositiveData(values)) return <EmptyChart message={t.logistique.noChartData} />;

	return (
		<Doughnut
			data={{
				labels,
				datasets: [{ data: values, backgroundColor: PIE_COLORS.slice(0, labels.length) }],
			}}
			options={doughnutOptions}
		/>
	);
};

const CostTrendChart: React.FC<{ stats: LogistiqueStats }> = ({ stats }) => {
	const { t } = useLanguage();
	const flow = stats.monthly_flow ?? [];
	const labels = flow.map((item) => formatMonthLabel(item.month));
	const values = flow.map((item) => numericValue(item.cout_total));

	if (!hasPositiveData(values)) return <EmptyChart message={t.logistique.noChartData} />;

	return (
		<Line
			data={{
				labels,
				datasets: [
					{
						label: t.logistique.monthlyCosts,
						data: values,
						borderColor: CHART_COLORS.secondary,
						backgroundColor: 'rgba(106, 27, 154, 0.14)',
						fill: true,
					},
				],
			}}
			options={lineOptions}
		/>
	);
};

const BrandCostShareChart: React.FC<{ stats: LogistiqueStats }> = ({ stats }) => {
	const { t } = useLanguage();
	const brands = stats.kpi_marques?.length
		? stats.kpi_marques.map((brand) => ({
				name: brand.marque__nom || '-',
				cout_total: brand.cout_total,
			}))
		: (stats.kpi_fournisseurs ?? []).map((brand) => ({
				name: brand.fournisseur || '-',
				cout_total: brand.cout_total,
			}));
	const labels = brands.map((brand) => brand.name);
	const values = brands.map((brand) => numericValue(brand.cout_total));

	if (!hasPositiveData(values)) return <EmptyChart message={t.logistique.noSupplierKpi} />;

	return (
		<Doughnut
			data={{
				labels,
				datasets: [{ data: values, backgroundColor: PIE_COLORS.slice(0, labels.length) }],
			}}
			options={doughnutOptions}
		/>
	);
};

const DashboardContent: React.FC<DashboardContentProps> = ({ session, company_id }) => {
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const { data: stats, isLoading, error, refetch } = useGetLogistiqueDashboardQuery({ company_id }, { skip: !token });

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error || !stats) {
		return (
			<Alert
				severity="error"
				action={
					<Button color="inherit" size="small" onClick={() => refetch()}>
						{t.common.retry}
					</Button>
				}
			>
				{t.common.genericError}
			</Alert>
		);
	}

	return (
		<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2, md: 3 } }}>
			<Box sx={{ mb: 3 }}>
				<Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
					{t.logistique.dashboardTitle}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{t.logistique.colCoutTotal}: {formatMoney(stats.couts_detail?.total ?? stats.couts_logistiques)}
				</Typography>
			</Box>

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
					gap: 2,
					mb: 3,
				}}
			>
				<DashboardStatCard icon={<RequestQuoteIcon />} label={t.logistique.totalOrders} value={String(stats.total_commandes)} color="#1565C0" testId="logistique-dashboard-total" />
				<DashboardStatCard icon={<WarehouseIcon />} label={t.logistique.inProgress} value={String(stats.commandes_en_cours)} color="#2E7D32" testId="logistique-dashboard-progress" />
				<DashboardStatCard icon={<ErrorOutlinedIcon />} label={t.logistique.delays} value={String(stats.retards)} color="#C62828" testId="logistique-dashboard-delays" />
				<DashboardStatCard icon={<PaymentIcon />} label={t.logistique.pendingPayments} value={String(stats.paiements_en_attente)} color="#EF6C00" testId="logistique-dashboard-payments" />
				<DashboardStatCard icon={<AssignmentTurnedInIcon />} label={t.logistique.deliveries} value={String(stats.livraisons)} color="#6A1B9A" testId="logistique-dashboard-deliveries" />
				<DashboardStatCard icon={<LocalShippingIcon />} label={t.logistique.logisticsCosts} value={formatMoney(stats.couts_logistiques)} color="#00695C" testId="logistique-dashboard-costs" />
			</Box>

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
					gap: 2,
					mb: 3,
				}}
			>
				<ChartCard title={t.logistique.flowChartTitle} height={360} wide infoTooltip={t.logistique.flowChartTooltip}>
					<MonthlyFlowChart stats={stats} />
				</ChartCard>
				<ChartCard title={t.logistique.workflowChartTitle} height={340} infoTooltip={t.logistique.workflowChartTooltip}>
					<WorkflowChart stats={stats} />
				</ChartCard>
				<ChartCard title={t.logistique.paymentChartTitle} height={340} infoTooltip={t.logistique.paymentChartTooltip}>
					<PaymentChart stats={stats} />
				</ChartCard>
				<ChartCard title={t.logistique.alertChartTitle} infoTooltip={t.logistique.alertChartTooltip}>
					<AlertsChart stats={stats} />
				</ChartCard>
				<ChartCard title={t.logistique.costBreakdownChartTitle} infoTooltip={t.logistique.costBreakdownChartTooltip}>
					<CostBreakdownChart stats={stats} />
					</ChartCard>
					<ChartCard title={t.logistique.costTrendChartTitle} infoTooltip={t.logistique.costTrendChartTooltip}>
						<CostTrendChart stats={stats} />
					</ChartCard>
					<ChartCard title={t.logistique.supplierCostShareChartTitle} infoTooltip={t.logistique.supplierCostShareChartTooltip}>
						<BrandCostShareChart stats={stats} />
					</ChartCard>
			</Box>
		</Box>
	);
};

const LogistiqueDashboard: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();

	return (
		<CompanyDocumentsWrapperList session={session} title={t.logistique.dashboardTitle}>
			{({ company_id }) => <DashboardContent session={session} company_id={company_id} />}
		</CompanyDocumentsWrapperList>
	);
};

export default LogistiqueDashboard;
