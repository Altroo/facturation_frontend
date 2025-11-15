import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import UsersForm from '@/components/pages/dashboard/users/UsersForm';

const UsersEditPage = async ({ params }: { params: Promise<{ id: number }> }) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <UsersForm session={session} id={id} />;
};

export default UsersEditPage;
