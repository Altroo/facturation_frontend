import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, STOCK_LIST } from '@/utils/routes';
import StockForm from '@/components/pages/dashboard/stock/stock-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Ajustement de stock',
	description: 'Enregistrer un mouvement de stock',
};

type PageProps = {
	searchParams: Promise<{ company_id?: string; balance_id?: string }>;
};

const StockNewPage = async (props: PageProps) => {
	const session = await auth();
	const { searchParams } = props;
	const { company_id, balance_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(STOCK_LIST);
	}

	return (
		<StockForm
			session={session}
			company_id={Number(company_id)}
			balance_id={balance_id && !isNaN(Number(balance_id)) ? Number(balance_id) : undefined}
		/>
	);
};

export default StockNewPage;
