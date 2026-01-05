import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, DEVIS_LIST } from '@/utils/routes';
import DevisForm from '@/components/pages/dashboard/devis/devis-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Modifier Devis',
	description: 'Modifier un devis existant',
};

type PageProps = {
	params: Promise<{ id: number }>;
	searchParams: Promise<{ company_id: string }>;
};

const DevisEditPage = async (props: PageProps) => {
	const session = await auth();
	const { id } = await props.params;
	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(DEVIS_LIST);
	}

	return <DevisForm session={session} id={id} company_id={Number(company_id)} />;
};

export default DevisEditPage;
