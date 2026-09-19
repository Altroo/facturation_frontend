import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import StockMovementsListClient from '@/components/pages/dashboard/stock/stock-movements-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Mouvements de stock',
	description: 'Historique des mouvements de stock',
};

const StockMovementsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <StockMovementsListClient session={session} />;
};

export default StockMovementsPage;
