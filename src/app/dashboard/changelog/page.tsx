import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import Changelog from '@/components/pages/dashboard/changelog/changelog';

export const metadata = { title: 'Changelog', description: 'Les nouveautés et améliorations de Facturation' };

const ChangelogPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <Changelog />;
};

export default ChangelogPage;
