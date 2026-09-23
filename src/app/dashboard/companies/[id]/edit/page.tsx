import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, COMPANIES_LIST } from '@/utils/routes';
import CompaniesForm from '@/components/pages/dashboard/companies/companies-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Modifier Société',
	description: 'Modifier une société existante',
};
import type { IdNumberRouteProps as PageProps } from '@/types/routeTypes';

const CompaniesEditPage = async (props: PageProps) => {
	const session = await auth();
	const { id } = await props.params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(COMPANIES_LIST);
	}

	return <CompaniesForm session={session} id={Number(id)} />;
};

export default CompaniesEditPage;
