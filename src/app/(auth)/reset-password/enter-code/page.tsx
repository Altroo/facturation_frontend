import { cookies } from 'next/headers';
import React from 'react';
import EnterCodeClient from '@/components/pages/auth/reset-password/enterCode';
import { redirect } from 'next/navigation';
import { AUTH_RESET_PASSWORD, DASHBOARD } from '@/utils/routes';
import { auth } from '@/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Saisir le Code',
	description: 'Entrer le code de vérification reçu par email',
};

const EnterCodePage = async () => {
	// check if user is logged in
	const session = await auth();
	if (session) {
		// user is already logged in → redirect to dashboard
		redirect(DASHBOARD);
	}

	const cookieStore = await cookies();
	const email = cookieStore.get('@new_email')?.value ?? '';
	if (!email) {
		redirect(AUTH_RESET_PASSWORD);
	}
	return <EnterCodeClient email={email} />;
};

export default EnterCodePage;
