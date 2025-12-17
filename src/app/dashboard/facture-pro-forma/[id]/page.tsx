import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, FACTURE_PRO_FORMA_LIST } from '@/utils/routes';
import FactureProFormaViewClient from '@/components/pages/dashboard/facture-pro-forma/facture-pro-forma-view';

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};

const ProFormaViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(FACTURE_PRO_FORMA_LIST);
	}

	return <FactureProFormaViewClient session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default ProFormaViewPage;
