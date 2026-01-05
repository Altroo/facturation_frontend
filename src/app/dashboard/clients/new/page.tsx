import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, CLIENTS_LIST } from '@/utils/routes';
import ClientsForm from '@/components/pages/dashboard/clients/clients-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Nouveau Client',
	description: 'Créer un nouveau client',
};

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
