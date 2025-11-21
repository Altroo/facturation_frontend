import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CompaniesForm from '@/components/pages/dashboard/companies/companiesForm';

const CompaniesEditPage = async ({ params }: { params: Promise<{ id: number }> }) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CompaniesForm session={session} id={id} />;
};

export default CompaniesEditPage;
