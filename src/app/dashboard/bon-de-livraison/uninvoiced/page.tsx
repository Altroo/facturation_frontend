import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import BonDeLivraisonUninvoicedListClient from '@/components/pages/dashboard/bon-de-livraison/bon-de-livraison-uninvoiced-list';

export const metadata: Metadata = {
	title: 'BLs Non Facturés',
	description: 'Liste des bons de livraison non facturés',
};

export default async function BonDeLivraisonUninvoicedListPage() {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <BonDeLivraisonUninvoicedListClient session={session} />;
}
