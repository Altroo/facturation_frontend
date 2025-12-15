import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ProformaListClient from '@/components/pages/dashboard/pro-forma/pro-formaList';

const ProFormaListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ProformaListClient session={session} />;
};

export default ProFormaListPage;
