import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, STOCK_LIST } from '@/utils/routes';
import StockView from '@/components/pages/dashboard/stock/stock-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Détails du stock',
	description: "Consulter l'état et l'historique du stock",
};

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id?: string }>;
};

const StockViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(STOCK_LIST);
	}

	return <StockView session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default StockViewPage;
