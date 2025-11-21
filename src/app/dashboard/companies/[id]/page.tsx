import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CompaniesViewClient from '@/components/pages/dashboard/companies/companiesView';

const CompaniesViewPage = async ({ params }: { params: Promise<{ id: number }> }) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CompaniesViewClient session={session} id={id} />;
};

export default CompaniesViewPage;
