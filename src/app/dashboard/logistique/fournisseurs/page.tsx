import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import LogistiqueSuppliers from '@/components/pages/dashboard/logistique/logistique-suppliers';
import { AUTH_LOGIN } from '@/utils/routes';

export const metadata: Metadata = {
	title: 'Liste des fournisseurs',
	description: 'Fournisseurs des dossiers logistiques',
};

const LogistiqueSuppliersPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <LogistiqueSuppliers session={session} />;
};

export default LogistiqueSuppliersPage;
