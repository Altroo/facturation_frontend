import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import FactureClientListClient from '@/components/pages/dashboard/facture-client/facture-client-list';

const FactureClientListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <FactureClientListClient session={session} />;
};

export default FactureClientListPage;
