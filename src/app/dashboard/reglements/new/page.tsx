import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, REGLEMENTS_LIST } from '@/utils/routes';
import ReglementForm from '@/components/pages/dashboard/reglements/reglement-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Nouveau Règlement',
	description: 'Créer un nouveau règlement',
};

type PageProps = {
	searchParams: Promise<{ company_id: string; facture_client_id?: string }>;
};

const ReglementNewPage = async (props: PageProps) => {
	const session = await auth();
	const { searchParams } = props;
	const { company_id, facture_client_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(REGLEMENTS_LIST);
	}

	return (
		<ReglementForm
			session={session}
			company_id={Number(company_id)}
			facture_client_id={facture_client_id ? Number(facture_client_id) : undefined}
		/>
	);
};

export default ReglementNewPage;
