import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ClientsForm from '@/components/pages/dashboard/clients/clientsForm';

const ClientsEditPage = async ({ params }: { params: Promise<{ id: number; company_id: number }> }) => {
	const session = await auth();
	const { id, company_id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ClientsForm session={session} id={id} company={company_id} />;
};

export default ClientsEditPage;
