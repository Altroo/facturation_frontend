import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, PRO_FORMA_LIST } from '@/utils/routes';
import ProFormaViewClient from '@/components/pages/dashboard/pro-forma/pro-formaView';

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};

const ProFormaViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(PRO_FORMA_LIST);
	}

	return <ProFormaViewClient session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default ProFormaViewPage;
