import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, USERS_LIST } from '@/utils/routes';
import UsersViewClient from '@/components/pages/dashboard/users/users-view';

type UsersViewPageProps = {
	params: Promise<{ id: number }>;
};

const UsersViewPage = async (props: UsersViewPageProps) => {
	const session = await auth();
	const id = (await props.params).id;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(USERS_LIST);
	}

	return <UsersViewClient session={session} id={id} />;
};

export default UsersViewPage;
