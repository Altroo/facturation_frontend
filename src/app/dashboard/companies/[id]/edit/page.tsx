import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, COMPANIES_LIST } from '@/utils/routes';
import CompaniesForm from '@/components/pages/dashboard/companies/companiesForm';

type CompaniesEditPageProps = {
	params: Promise<{ id: number }>;
};

const CompaniesEditPage = async (props: CompaniesEditPageProps) => {
	const session = await auth();
	const { id } = await props.params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(COMPANIES_LIST);
	}

	return <CompaniesForm session={session} id={id} />;
};

export default CompaniesEditPage;
