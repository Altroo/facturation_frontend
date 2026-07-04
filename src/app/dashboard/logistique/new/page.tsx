import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, LOGISTIQUE_LIST } from '@/utils/routes';
import LogistiqueForm from '@/components/pages/dashboard/logistique/logistique-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Nouvelle commande logistique',
	description: 'Créer une nouvelle commande logistique',
};

type PageProps = {
	searchParams: Promise<{ company_id: string }>;
};

const LogistiqueNewPage = async (props: PageProps) => {
	const session = await auth();
	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(LOGISTIQUE_LIST);
	}

	return <LogistiqueForm session={session} company_id={Number(company_id)} />;
};

export default LogistiqueNewPage;
