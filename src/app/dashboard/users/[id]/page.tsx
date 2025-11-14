import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import UsersViewClient from '@/components/pages/dashboard/users/UsersView';

const UsersViewPage = async ({ params }: { params: Promise<{ id: number }> }) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <UsersViewClient session={session} id={id} />;
};

export default UsersViewPage;
