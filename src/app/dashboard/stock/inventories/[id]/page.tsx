import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, STOCK_INVENTORIES } from '@/utils/routes';
import StockInventoryView from '@/components/pages/dashboard/stock/stock-inventory-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: "Détails de l'inventaire",
	description: 'Consulter un inventaire de stock',
};

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id?: string }>;
};

const StockInventoryViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(STOCK_INVENTORIES);
	}

	return <StockInventoryView session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default StockInventoryViewPage;
