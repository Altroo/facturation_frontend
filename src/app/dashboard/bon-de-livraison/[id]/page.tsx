import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, BON_DE_LIVRAISON_LIST } from '@/utils/routes';
import BonDeLivraisonViewClient from '@/components/pages/dashboard/bon-de-livraison/bon-de-livraison-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Détails du Bon de Livraison',
	description: 'Consulter les détails d\'un bon de livraison',
};

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};

const BonDeLivraisonViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(BON_DE_LIVRAISON_LIST);
	}

	return <BonDeLivraisonViewClient session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default BonDeLivraisonViewPage;
