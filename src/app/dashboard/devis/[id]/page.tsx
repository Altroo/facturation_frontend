import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, DEVIS_LIST } from '@/utils/routes';
import DevisViewClient from '@/components/pages/dashboard/devis/devis-view';

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};

const DevisViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(DEVIS_LIST);
	}

	return <DevisViewClient session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default DevisViewPage;
