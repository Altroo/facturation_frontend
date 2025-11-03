import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import PasswordClient from '@/components/pages/dashboard/settings/password';
import { AUTH_LOGIN } from '@/utils/routes';

const EditPasswordPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <PasswordClient session={session} />;
};

export default EditPasswordPage;
