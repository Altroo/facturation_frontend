import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, CLIENTS_LIST } from '@/utils/routes';
import ClientsForm from '@/components/pages/dashboard/clients/clientsForm';

type PageProps = {
	searchParams: Promise<{ company_id: string }>;
};

const ClientsNewCompanyIDPage = async (props: PageProps) => {
	const session = await auth();
	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(CLIENTS_LIST);
	}

	return <ClientsForm session={session} company_id={Number(company_id)} />;
};

export default ClientsNewCompanyIDPage;
