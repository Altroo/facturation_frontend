import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, USERS_LIST } from '@/utils/routes';
import UsersForm from '@/components/pages/dashboard/users/users-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Modifier Utilisateur',
	description: 'Modifier un utilisateur existant',
};

type UsersEditPageProps = {
	params: Promise<{ id: number }>;
};

const UsersEditPage = async (props: UsersEditPageProps) => {
	const session = await auth();
	const id = (await props.params).id;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(USERS_LIST);
	}

	return <UsersForm session={session} id={id} />;
};

export default UsersEditPage;
