import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, FACTURE_AVOIR_LIST } from '@/utils/routes';
import FactureAvoirForm from '@/components/pages/dashboard/facture-avoir/facture-avoir-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: "Modifier facture d'avoir",
	description: "Modifier une facture d'avoir existante",
};

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};

const FactureAvoirEditPage = async (props: PageProps) => {
	const session = await auth();
	const { id } = await props.params;
	const { company_id } = await props.searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(FACTURE_AVOIR_LIST);
	}

	return <FactureAvoirForm session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default FactureAvoirEditPage;
