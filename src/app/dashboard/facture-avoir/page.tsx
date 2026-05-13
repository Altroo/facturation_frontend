import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import FactureAvoirListClient from '@/components/pages/dashboard/facture-avoir/facture-avoir-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: "Liste des factures d'avoir",
	description: "Liste des factures d'avoir",
};

const FactureAvoirListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <FactureAvoirListClient session={session} />;
};

export default FactureAvoirListPage;
