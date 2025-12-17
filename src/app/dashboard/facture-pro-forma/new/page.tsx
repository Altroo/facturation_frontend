import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, FACTURE_PRO_FORMA_LIST } from '@/utils/routes';
import FactureProFormaForm from '@/components/pages/dashboard/facture-pro-forma/facture-pro-forma-form';

type PageProps = {
	searchParams: Promise<{ company_id: string }>;
};

const FactureProFormaNewPage = async (props: PageProps) => {
	const session = await auth();

	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(FACTURE_PRO_FORMA_LIST);
	}

	return <FactureProFormaForm session={session} company_id={Number(company_id)} />;
};

export default FactureProFormaNewPage;
