import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, LOGISTIQUE_LIST } from '@/utils/routes';
import LogistiqueViewClient from '@/components/pages/dashboard/logistique/logistique-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Détails de la commande logistique',
	description: "Consulter les détails d'une commande logistique",
};

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};

const LogistiqueViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(LOGISTIQUE_LIST);
	}

	return <LogistiqueViewClient session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default LogistiqueViewPage;
