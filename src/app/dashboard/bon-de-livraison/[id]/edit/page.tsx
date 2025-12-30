import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, BON_DE_LIVRAISON_LIST } from '@/utils/routes';
import BonDeLivraisonForm from '@/components/pages/dashboard/bon-de-livraison/bon-de-livraison-form';

type PageProps = {
	params: Promise<{ id: number }>;
	searchParams: Promise<{ company_id: string }>;
};

const BonDeLivraisonEditPage = async (props: PageProps) => {
	const session = await auth();
	const { id } = await props.params;
	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(BON_DE_LIVRAISON_LIST);
	}

	return <BonDeLivraisonForm session={session} id={id} company_id={Number(company_id)} />;
};

export default BonDeLivraisonEditPage;
