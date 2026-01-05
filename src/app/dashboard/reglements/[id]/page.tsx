import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, REGLEMENTS_LIST } from '@/utils/routes';
import ReglementViewClient from '@/components/pages/dashboard/reglements/reglement-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Détails du Règlement',
	description: "Consulter les détails d'un règlement",
};

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};

const ReglementViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(REGLEMENTS_LIST);
	}

	return <ReglementViewClient session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default ReglementViewPage;
