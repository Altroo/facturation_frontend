import { auth } from '@/auth';
import StockForm from '@/components/pages/dashboard/stock/stock-form';
import { redirect } from 'next/navigation';
import StockNewPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-form', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN: '/login',
	STOCK_LIST: '/dashboard/stock',
}));

type TestSession = {
	user: { pk: number; email: string };
};

const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<TestSession | null>>;
const mockRedirect = jest.mocked(redirect);

const pageProps = (companyId?: string, balanceId?: string) => ({
	searchParams: Promise.resolve({ company_id: companyId, balance_id: balanceId }),
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('StockNewPage server component', () => {
	it('exports the stock adjustment metadata', () => {
		expect(metadata).toEqual({
			title: 'Ajustement de stock',
			description: 'Enregistrer un mouvement de stock',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockNewPage(pageProps('12'));

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('redirects to the stock list when company_id is invalid', async () => {
		const session = { user: { pk: 35, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		await StockNewPage(pageProps('invalid'));

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/stock');
	});

	it('renders the adjustment form with numeric company and balance ids', async () => {
		const session = { user: { pk: 36, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockNewPage(pageProps('12', '8'));

		expect(result).toMatchObject({
			type: StockForm,
			props: { session, company_id: 12, balance_id: 8 },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	it('omits balance_id when it is invalid', async () => {
		const session = { user: { pk: 37, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockNewPage(pageProps('12', 'invalid'));

		expect(result).toMatchObject({
			type: StockForm,
			props: { session, company_id: 12, balance_id: undefined },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
