import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import UsersForm from '@/components/pages/dashboard/users/UsersForm';

const UsersNewPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <UsersForm session={session} />;
};

export default UsersNewPage;
