import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, FACTURE_CLIENT_LIST } from '@/utils/routes';
import FactureClientForm from '@/components/pages/dashboard/facture-client/facture-client-form';

type PageProps = {
	searchParams: Promise<{ company_id: string }>;
};

const FactureClientNewPage = async (props: PageProps) => {
	const session = await auth();

	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(FACTURE_CLIENT_LIST);
	}

	return <FactureClientForm session={session} company_id={Number(company_id)} />;
};

export default FactureClientNewPage;
