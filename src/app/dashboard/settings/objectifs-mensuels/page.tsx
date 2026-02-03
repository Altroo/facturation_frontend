import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import MonthlyObjectivesView from '@/components/pages/dashboard/settings/monthly-objectives-view';

export const metadata: Metadata = {
	title: 'Objectifs Mensuels',
	description: 'Configuration des objectifs mensuels pour chaque société',
};

const MonthlyObjectivesPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <MonthlyObjectivesView session={session} />;
};

export default MonthlyObjectivesPage;
