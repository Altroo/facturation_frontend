import { auth } from '@/auth';
import StockInventoryView from '@/components/pages/dashboard/stock/stock-inventory-view';
import { redirect } from 'next/navigation';
import StockInventoryViewPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-inventory-view', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN: '/login',
	STOCK_INVENTORIES: '/dashboard/stock/inventories',
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

describe('StockInventoryViewPage server component', () => {
	it('exports the stock inventory detail metadata', () => {
		expect(metadata).toEqual({
			title: "Détails de l'inventaire",
			description: 'Consulter un inventaire de stock',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockInventoryViewPage(pageProps('7', '12'));

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it.each([
		['invalid id', 'invalid', '12'],
		['invalid company id', '7', 'invalid'],
	])('redirects to the inventories list for an %s', async (_case, id, companyId) => {
		const session = { user: { pk: 48, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		await StockInventoryViewPage(pageProps(id, companyId));

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/stock/inventories');
	});

	it('renders the inventory view with numeric inventory and company ids', async () => {
		const session = { user: { pk: 49, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockInventoryViewPage(pageProps('7', '12'));

		expect(result).toMatchObject({
			type: StockInventoryView,
			props: { session, id: 7, company_id: 12 },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
