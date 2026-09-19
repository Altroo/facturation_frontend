import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, STOCK_RECEIPTS } from '@/utils/routes';
import StockReceiptForm from '@/components/pages/dashboard/stock/stock-receipt-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Nouvelle réception de stock',
	description: 'Réceptionner un stock entrant',
};

type PageProps = { searchParams: Promise<{ company_id?: string }> };

const StockReceiptNewPage = async (props: PageProps) => {
	const session = await auth();
	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(STOCK_RECEIPTS);
	}

	return <StockReceiptForm session={session} company_id={Number(company_id)} />;
};

export default StockReceiptNewPage;
