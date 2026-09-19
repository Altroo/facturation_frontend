import { auth } from '@/auth';
import StockReceiptView from '@/components/pages/dashboard/stock/stock-receipt-view';
import { redirect } from 'next/navigation';
import StockReceiptViewPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-receipt-view', () => ({
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

const pageProps = (id: string, companyId?: string) => ({
	params: Promise.resolve({ id }),
	searchParams: Promise.resolve({ company_id: companyId }),
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('StockReceiptViewPage server component', () => {
	it('exports the stock receipt detail metadata', () => {
		expect(metadata).toEqual({
			title: 'Détails de la réception',
			description: 'Consulter une réception de stock',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockReceiptViewPage(pageProps('7', '12'));

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it.each([
		['invalid id', 'invalid', '12'],
		['invalid company id', '7', 'invalid'],
	])('redirects to the receipts list for an %s', async (_case, id, companyId) => {
		const session = { user: { pk: 46, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		await StockReceiptViewPage(pageProps(id, companyId));

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/stock/receipts');
	});

	it('renders the receipt view with numeric receipt and company ids', async () => {
		const session = { user: { pk: 47, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockReceiptViewPage(pageProps('7', '12'));

		expect(result).toMatchObject({
			type: StockReceiptView,
			props: { session, id: 7, company_id: 12 },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
