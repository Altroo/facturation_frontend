import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import StockReceiptsListClient from '@/components/pages/dashboard/stock/stock-receipts-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Réceptions de stock',
	description: 'Liste des réceptions de stock',
};

const StockReceiptsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <StockReceiptsListClient session={session} />;
};

export default StockReceiptsPage;
