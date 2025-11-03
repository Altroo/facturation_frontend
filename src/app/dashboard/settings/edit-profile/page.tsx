import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import EditProfilClient from '@/components/pages/dashboard/settings/edit-profile';
import { AUTH_LOGIN } from '@/utils/routes';

const EditProfilePage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <EditProfilClient session={session} />;
};

export default EditProfilePage;
