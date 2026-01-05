import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import DashboardClient from '@/components/pages/dashboard/dashboard';

export const metadata: Metadata = {
	title: 'Tableau de bord',
	description: "Vue d'ensemble du tableau de bord",
};

const DashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <DashboardClient session={session} />;
};

export default DashboardPage;
