import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import UsersListClient from '@/components/pages/dashboard/users/UsersList';

const UsersListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <UsersListClient session={session} />;
};

export default UsersListPage;
