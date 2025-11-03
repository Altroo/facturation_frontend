import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import ResetPasswordClient from '@/components/pages/auth/reset-password/resetPassword';
import { DASHBOARD } from '@/utils/routes';

const ResetPasswordPage = async () => {
	const session = await auth();

	if (session) {
		redirect(DASHBOARD);
	}

	return <ResetPasswordClient />;
};

export default ResetPasswordPage;
