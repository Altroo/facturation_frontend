import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, FACTURE_AVOIR_LIST } from '@/utils/routes';
import FactureAvoirForm from '@/components/pages/dashboard/facture-avoir/facture-avoir-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: "Nouvelle facture d'avoir",
	description: "Créer une nouvelle facture d'avoir",
};

type PageProps = {
	searchParams: Promise<{ company_id: string }>;
};

const FactureAvoirNewPage = async (props: PageProps) => {
	const session = await auth();
	const { company_id } = await props.searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(FACTURE_AVOIR_LIST);
	}

	return <FactureAvoirForm session={session} company_id={Number(company_id)} />;
};

export default FactureAvoirNewPage;
