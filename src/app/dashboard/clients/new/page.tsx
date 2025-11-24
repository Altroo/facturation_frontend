import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, CLIENTS_LIST } from '@/utils/routes';

const ClientsNewPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	redirect(CLIENTS_LIST);
};

export default ClientsNewPage;
