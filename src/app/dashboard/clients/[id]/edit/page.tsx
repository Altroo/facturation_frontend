import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, CLIENTS_LIST } from '@/utils/routes';
import ClientsForm from '@/components/pages/dashboard/clients/clients-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Modifier Client',
	description: 'Modifier un client existant',
};
import type { CompanyScopedDetailRouteProps as PageProps } from '@/types/routeTypes';

const ClientsEditPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(CLIENTS_LIST);
	}

	return <ClientsForm session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default ClientsEditPage;
