import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ClientsListClient from '@/components/pages/dashboard/clients/clients-list';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Clients Archivés',
	description: 'Liste des clients archivés',
};

const ClientsArchivedListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ClientsListClient session={session} archived={true} />;
};

export default ClientsArchivedListPage;
