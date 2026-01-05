import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, DEVIS_LIST } from '@/utils/routes';
import DevisForm from '@/components/pages/dashboard/devis/devis-form';

export const metadata: Metadata = {
	title: 'Nouveau Devis',
	description: 'Créer un nouveau devis',
};

type PageProps = {
	searchParams: Promise<{ company_id: string }>;
};

const DeviNewPage = async (props: PageProps) => {
	const session = await auth();

	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(DEVIS_LIST);
	}

	return <DevisForm session={session} company_id={Number(company_id)} />;
};

export default DeviNewPage;
