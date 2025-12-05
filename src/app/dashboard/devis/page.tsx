import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import DevisListClient from '@/components/pages/dashboard/devis/devisList';

const DevisListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <DevisListClient session={session} />;
};

export default DevisListPage;
