import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import FactureProformaListClient from '@/components/pages/dashboard/facture-pro-forma/facture-pro-forma-list';

const ProFormaListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <FactureProformaListClient session={session} />;
};

export default ProFormaListPage;
