import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, PRO_FORMA_LIST } from '@/utils/routes';
import ProFormaForm from '@/components/pages/dashboard/pro-forma/pro-formaForm';

type PageProps = {
	searchParams: Promise<{ company_id: string }>;
};

const ProFormaNewPage = async (props: PageProps) => {
	const session = await auth();

	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(PRO_FORMA_LIST);
	}

	return <ProFormaForm session={session} company_id={Number(company_id)} />;
};

export default ProFormaNewPage;
