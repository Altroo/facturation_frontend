import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import StockListClient from '@/components/pages/dashboard/stock/stock-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Gestion du stock',
	description: 'Stock physique, réservé et entrant',
};

const StockPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <StockListClient session={session} />;
};

export default StockPage;
