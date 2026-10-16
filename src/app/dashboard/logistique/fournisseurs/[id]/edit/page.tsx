import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, LOGISTIQUE_SUPPLIERS } from '@/utils/routes';
import LogistiqueSuppliersForm from '@/components/pages/dashboard/logistique/logistique-suppliers-form';
import type { CompanyScopedEditRouteProps as Props } from '@/types/routeTypes';

export const metadata = { title: 'Modifier le fournisseur' };
export default async function Page(props: Props) {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	const { company_id } = await props.searchParams;
	if (!company_id || !/^\d+$/.test(company_id) || !Number.isSafeInteger(Number(company_id)) || Number(company_id) < 1)
		redirect(LOGISTIQUE_SUPPLIERS);
	const { id } = await props.params;
	if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) notFound();
	return <LogistiqueSuppliersForm session={session} company_id={Number(company_id)} id={Number(id)} />;
}
