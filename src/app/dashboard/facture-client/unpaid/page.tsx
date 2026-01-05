import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import FactureClientUnpaidListClient from '@/components/pages/dashboard/facture-client/facture-client-unpaid-list';

export const metadata: Metadata = {
	title: 'Factures Impayées',
	description: 'Liste des factures impayées',
};

export default async function FactureClientUnpaidListPage() {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <FactureClientUnpaidListClient session={session} />;
}
