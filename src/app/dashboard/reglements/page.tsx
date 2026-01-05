import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ReglementListClient from '@/components/pages/dashboard/reglements/reglement-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Règlements',
	description: 'Liste des règlements',
};

const ReglementsListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ReglementListClient session={session} />;
};

export default ReglementsListPage;
