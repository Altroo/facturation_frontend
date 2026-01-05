import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import BonDeLivraisonListClient from '@/components/pages/dashboard/bon-de-livraison/bon-de-livraison-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Bons de Livraison',
	description: 'Liste des bons de livraison',
};

const BonDeLivraisonListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <BonDeLivraisonListClient session={session} />;
};

export default BonDeLivraisonListPage;
