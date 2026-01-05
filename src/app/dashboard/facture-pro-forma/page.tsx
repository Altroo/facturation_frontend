import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import FactureProformaListClient from '@/components/pages/dashboard/facture-pro-forma/facture-pro-forma-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Factures Pro Forma',
	description: 'Liste des factures pro forma',
};

const FactureProFormaListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <FactureProformaListClient session={session} />;
};

export default FactureProFormaListPage;
