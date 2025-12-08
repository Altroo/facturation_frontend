import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, DEVIS_LIST } from '@/utils/routes';
import DevisEditForm from '@/components/pages/dashboard/devis/devisEditForm';

type DevisEditPageProps = {
	params: Promise<{ id: number }>;
	searchParams: Promise<{ company_id: string }>;
};

const DevisEditPage = async (props: DevisEditPageProps) => {
	const session = await auth();
	const { id } = await props.params;
	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(DEVIS_LIST);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(DEVIS_LIST);
	}

	return <DevisEditForm session={session} id={id} company_id={Number(company_id)} />;
};

export default DevisEditPage;
