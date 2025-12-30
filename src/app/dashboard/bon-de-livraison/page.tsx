import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import BonDeLivraisonListClient from '@/components/pages/dashboard/bon-de-livraison/bon-de-livraison-list';

const BonDeLivraisonListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <BonDeLivraisonListClient session={session} />;
};

export default BonDeLivraisonListPage;
