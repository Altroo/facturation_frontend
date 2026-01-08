import { type Metadata } from 'next';
import DashboardDummyClient from '@/components/pages/dashboard/dashboard-home/dashboard-dummy-view';

export const metadata: Metadata = {
	title: 'Tableau de bord - Demo',
	description: 'Version démo du tableau de bord avec données fictives',
};

const DashboardDemoPage = () => {
	return <DashboardDummyClient />;
};

export default DashboardDemoPage;
