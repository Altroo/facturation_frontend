import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LogistiqueDashboard from '@/components/pages/dashboard/logistique/logistique-dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Tableau de bord logistique',
	description: 'Tableau de bord du suivi logistique',
};

const LogistiqueDashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <LogistiqueDashboard session={session} />;
};

export default LogistiqueDashboardPage;
