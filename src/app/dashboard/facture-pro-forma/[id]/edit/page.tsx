import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, PRO_FORMA_LIST } from '@/utils/routes';
import FactureProForma from '@/components/pages/dashboard/pro-forma/pro-formaForm';

type PageProps = {
	params: Promise<{ id: number }>;
	searchParams: Promise<{ company_id: string }>;
};

const FactureProFormaEditPage = async (props: PageProps) => {
	const session = await auth();
	const { id } = await props.params;
	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(PRO_FORMA_LIST);
	}

	return <FactureProForma session={session} id={id} company_id={Number(company_id)} />;
};

export default FactureProFormaEditPage;
