import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, FACTURE_CLIENT_LIST } from '@/utils/routes';
import FactureClientViewClient from '@/components/pages/dashboard/facture-client/facture-client-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Détails de la Facture Client',
	description: 'Consulter les détails d\'une facture client',
};

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};

const FactureClientViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(FACTURE_CLIENT_LIST);
	}

	return <FactureClientViewClient session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default FactureClientViewPage;
