import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import FactureClientListClient from '@/components/pages/dashboard/facture-client/facture-client-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Factures Client',
	description: 'Liste des factures client',
};

const FactureClientListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <FactureClientListClient session={session} />;
};

export default FactureClientListPage;
