import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, STOCK_RECEIPTS } from '@/utils/routes';
import StockReceiptView from '@/components/pages/dashboard/stock/stock-receipt-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Détails de la réception',
	description: 'Consulter une réception de stock',
};
import type { StockDetailRouteProps as PageProps } from '@/types/routeTypes';

const StockReceiptViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(STOCK_RECEIPTS);
	}

	return <StockReceiptView session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default StockReceiptViewPage;
