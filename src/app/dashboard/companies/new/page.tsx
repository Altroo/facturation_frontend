import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CompaniesForm from '@/components/pages/dashboard/companies/companies-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Nouvelle Société',
	description: 'Créer une nouvelle société',
};

const CompaniesNewPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CompaniesForm session={session} />;
};

export default CompaniesNewPage;
