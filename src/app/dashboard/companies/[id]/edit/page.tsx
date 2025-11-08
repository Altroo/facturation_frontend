import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CompaniesEditClient from '@/components/pages/dashboard/companies/CompaniesEdit';

const CompaniesEditPage = async ({ params }: { params: Promise<{ id: number }> }) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CompaniesEditClient session={session} id={id} />;
};

export default CompaniesEditPage;
