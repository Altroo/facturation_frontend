import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import ResetPasswordClient from '@/components/pages/auth/reset-password/resetPassword';
import { DASHBOARD } from '@/utils/routes';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Réinitialisation du Mot de Passe',
	description: 'Réinitialiser votre mot de passe',
};

const ResetPasswordPage = async () => {
	const session = await auth();

	if (session) {
		redirect(DASHBOARD);
	}

	return <ResetPasswordClient />;
};

export default ResetPasswordPage;
