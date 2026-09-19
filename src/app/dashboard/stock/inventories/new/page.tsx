import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, STOCK_INVENTORIES } from '@/utils/routes';
import StockInventoryForm from '@/components/pages/dashboard/stock/stock-inventory-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Nouvel inventaire de stock',
	description: 'Créer et valider un inventaire de stock',
};

type PageProps = {
	searchParams: Promise<{ company_id?: string }>;
};

const StockInventoryNewPage = async (props: PageProps) => {
	const session = await auth();
	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(STOCK_INVENTORIES);
	}

	return <StockInventoryForm session={session} company_id={Number(company_id)} />;
};

export default StockInventoryNewPage;
