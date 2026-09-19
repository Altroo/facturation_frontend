import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import StockInventoriesListClient from '@/components/pages/dashboard/stock/stock-inventories-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Inventaires de stock',
	description: 'Liste des inventaires de stock',
};

const StockInventoriesPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <StockInventoriesListClient session={session} />;
};

export default StockInventoriesPage;
