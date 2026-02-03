import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CompaniesListClient from '@/components/pages/dashboard/companies/companies-list';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Liste des sociétés',
	description: 'Liste des sociétés',
};

const CompaniesListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CompaniesListClient session={session} />;
};

export default CompaniesListPage;
