import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, LOGISTIQUE_LIST } from '@/utils/routes';
import LogistiqueForm from '@/components/pages/dashboard/logistique/logistique-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Modifier commande logistique',
	description: 'Modifier une commande logistique existante',
};

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};

const LogistiqueEditPage = async (props: PageProps) => {
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

	return <LogistiqueForm session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default LogistiqueEditPage;
