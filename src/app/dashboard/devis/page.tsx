import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import DevisListClient from '@/components/pages/dashboard/devis/devis-list';

export const metadata: Metadata = {
	title: 'Liste des devis',
	description: 'Liste des devis',
};

const DevisListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <DevisListClient session={session} />;
};

export default DevisListPage;
