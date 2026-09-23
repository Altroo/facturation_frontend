import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, STOCK_MOVEMENTS } from '@/utils/routes';
import StockMovementView from '@/components/pages/dashboard/stock/stock-movement-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Détails du mouvement de stock',
	description: 'Consulter un mouvement de stock',
};
import type { StockDetailRouteProps as PageProps } from '@/types/routeTypes';

const StockMovementViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(STOCK_MOVEMENTS);
	}

	return <StockMovementView session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default StockMovementViewPage;
