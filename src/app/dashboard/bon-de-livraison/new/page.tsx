import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, BON_DE_LIVRAISON_LIST } from '@/utils/routes';
import BonDeLivraisonForm from '@/components/pages/dashboard/bon-de-livraison/bon-de-livraison-form';

type PageProps = {
	searchParams: Promise<{ company_id: string }>;
};

const BonDeLivraisonNewPage = async (props: PageProps) => {
	const session = await auth();

	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(BON_DE_LIVRAISON_LIST);
	}

	return <BonDeLivraisonForm session={session} company_id={Number(company_id)} />;
};

export default BonDeLivraisonNewPage;
