import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LogistiqueListClient from '@/components/pages/dashboard/logistique/logistique-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Suivi logistique',
	description: 'Suivi logistique',
};

const LogistiqueListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <LogistiqueListClient session={session} />;
};

export default LogistiqueListPage;
