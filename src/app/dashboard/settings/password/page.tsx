import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import PasswordClient from '@/components/pages/dashboard/settings/password';
import { AUTH_LOGIN } from '@/utils/routes';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Modifier le Mot de Passe',
	description: 'Modifier le mot de passe du compte',
};

const EditPasswordPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <PasswordClient />;
};

export default EditPasswordPage;
