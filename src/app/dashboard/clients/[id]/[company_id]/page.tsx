import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ClientsViewClient from '@/components/pages/dashboard/clients/clientsView';

const ClientsViewPage = async ({ params }: { params: Promise<{ id: number; company_id: number }> }) => {
	const session = await auth();
	const { id, company_id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ClientsViewClient session={session} id={id} company_id={company_id} />;
};

export default ClientsViewPage;
