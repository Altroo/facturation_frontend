import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, LOGISTIQUE_SUPPLIERS } from '@/utils/routes';
import LogistiqueSuppliersForm from '@/components/pages/dashboard/logistique/logistique-suppliers-form';
import type { CompanyScopedNewRouteProps as PageProps } from '@/types/routeTypes';

export const metadata: Metadata = {
	title: 'Nouveau fournisseur',
	description: 'Créer un nouveau fournisseur logistique',
};

const LogistiqueSuppliersNewPage = async (props: PageProps) => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	const { company_id } = await props.searchParams;

	if (!company_id || !/^\d+$/.test(company_id) || !Number.isSafeInteger(Number(company_id)) || Number(company_id) < 1) {
		redirect(LOGISTIQUE_SUPPLIERS);
	}

	return <LogistiqueSuppliersForm session={session} company_id={Number(company_id)} />;
};

export default LogistiqueSuppliersNewPage;
