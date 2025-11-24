import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ClientsForm from '@/components/pages/dashboard/clients/clientsForm';

const ClientsNewCompanyIDPage = async ({ params }: { params: Promise<{ company_id: number }> }) => {
	const session = await auth();
	const { company_id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ClientsForm session={session} company={company_id} />;
};

export default ClientsNewCompanyIDPage;
