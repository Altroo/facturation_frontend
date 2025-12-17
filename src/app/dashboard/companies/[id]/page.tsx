import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, COMPANIES_LIST } from '@/utils/routes';
import CompaniesViewClient from '@/components/pages/dashboard/companies/companies-view';

type PageProps = {
	params: Promise<{ id: number }>;
};

const CompaniesViewPage = async (props: PageProps) => {
	const session = await auth();
	const { id } = await props.params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(COMPANIES_LIST);
	}

	return <CompaniesViewClient session={session} id={id} />;
};

export default CompaniesViewPage;
