import { auth } from '@/auth';
import StockInventoryForm from '@/components/pages/dashboard/stock/stock-inventory-form';
import { redirect } from 'next/navigation';
import StockInventoryNewPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-inventory-form', () => ({
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

const pageProps = (companyId?: string) => ({
	searchParams: Promise.resolve({ company_id: companyId }),
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('StockInventoryNewPage server component', () => {
	it('exports the new stock inventory metadata', () => {
		expect(metadata).toEqual({
			title: 'Nouvel inventaire de stock',
			description: 'Créer et valider un inventaire de stock',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockInventoryNewPage(pageProps('12'));

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('redirects to the inventories list when company_id is invalid', async () => {
		const session = { user: { pk: 40, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		await StockInventoryNewPage(pageProps('invalid'));

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/stock/inventories');
	});

	it('renders the inventory form with a numeric company id', async () => {
		const session = { user: { pk: 41, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockInventoryNewPage(pageProps('12'));

		expect(result).toMatchObject({
			type: StockInventoryForm,
			props: { session, company_id: 12 },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
