import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CompaniesList from '@/components/pages/dashboard/companies/CompaniesList';

const CompaniesListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CompaniesList session={session} />;
};

export default CompaniesListPage;
