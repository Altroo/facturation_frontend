import { auth } from '@/auth';
import StockView from '@/components/pages/dashboard/stock/stock-view';
import { redirect } from 'next/navigation';
import StockViewPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-view', () => ({
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

const pageProps = (id: string, companyId?: string) => ({
	params: Promise.resolve({ id }),
	searchParams: Promise.resolve({ company_id: companyId }),
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('StockViewPage server component', () => {
	it('exports the stock detail metadata', () => {
		expect(metadata).toEqual({
			title: 'Détails du stock',
			description: "Consulter l'état et l'historique du stock",
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockViewPage(pageProps('7', '12'));

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it.each([
		['invalid id', 'invalid', '12'],
		['invalid company id', '7', 'invalid'],
	])('redirects to the stock list for an %s', async (_case, id, companyId) => {
		const session = { user: { pk: 42, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		await StockViewPage(pageProps(id, companyId));

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/stock');
	});

	it('renders the stock view with numeric stock and company ids', async () => {
		const session = { user: { pk: 43, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockViewPage(pageProps('7', '12'));

		expect(result).toMatchObject({
			type: StockView,
			props: { session, id: 7, company_id: 12 },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
