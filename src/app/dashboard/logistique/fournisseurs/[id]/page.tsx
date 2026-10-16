import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, LOGISTIQUE_SUPPLIERS } from '@/utils/routes';
import LogistiqueSuppliersView from '@/components/pages/dashboard/logistique/logistique-suppliers-view';
import type { CompanyScopedDetailRouteProps as Props } from '@/types/routeTypes';

export const metadata = { title: 'Détails du fournisseur' };
export default async function Page(props: Props) {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	const { id } = await props.params;
	const { company_id } = await props.searchParams;
	if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) notFound();
	if (!company_id || !/^\d+$/.test(company_id) || !Number.isSafeInteger(Number(company_id)) || Number(company_id) < 1)
		redirect(LOGISTIQUE_SUPPLIERS);
	return <LogistiqueSuppliersView session={session} id={Number(id)} company_id={Number(company_id)} />;
}
