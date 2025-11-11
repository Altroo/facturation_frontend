import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CompaniesAddClient from '@/components/pages/dashboard/companies/CompaniesAdd';

const CompaniesNewPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CompaniesAddClient session={session} />;
};

export default CompaniesNewPage;
