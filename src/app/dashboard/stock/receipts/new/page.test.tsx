import { auth } from '@/auth';
import StockReceiptForm from '@/components/pages/dashboard/stock/stock-receipt-form';
import { redirect } from 'next/navigation';
import StockReceiptNewPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-receipt-form', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN: '/login',
	STOCK_RECEIPTS: '/dashboard/stock/receipts',
}));

type TestSession = {
	user: { pk: number; email: string };
};

const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<TestSession | null>>;
const mockRedirect = jest.mocked(redirect);

const pageProps = (companyId?: string) => ({
	searchParams: Promise.resolve({ company_id: companyId }),
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('StockReceiptNewPage server component', () => {
	it('exports the new stock receipt metadata', () => {
		expect(metadata).toEqual({
			title: 'Nouvelle réception de stock',
			description: 'Réceptionner un stock entrant',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockReceiptNewPage(pageProps('12'));

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('redirects to the receipts list when company_id is invalid', async () => {
		const session = { user: { pk: 38, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		await StockReceiptNewPage(pageProps('invalid'));

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/stock/receipts');
	});

	it('renders the receipt form with a numeric company id', async () => {
		const session = { user: { pk: 39, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockReceiptNewPage(pageProps('12'));

		expect(result).toMatchObject({
			type: StockReceiptForm,
			props: { session, company_id: 12 },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
