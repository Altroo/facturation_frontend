import { auth } from '@/auth';
import StockInventoriesListClient from '@/components/pages/dashboard/stock/stock-inventories-list';
import { redirect } from 'next/navigation';
import StockInventoriesPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-inventories-list', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN: '/login',
}));

type TestSession = {
	user: { pk: number; email: string };
};

const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<TestSession | null>>;
const mockRedirect = jest.mocked(redirect);

beforeEach(() => {
	jest.clearAllMocks();
});

describe('StockInventoriesPage server component', () => {
	it('exports the stock inventories metadata', () => {
		expect(metadata).toEqual({
			title: 'Inventaires de stock',
			description: 'Liste des inventaires de stock',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockInventoriesPage();

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('renders the stock inventories list with the authenticated session', async () => {
		const session = { user: { pk: 34, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockInventoriesPage();

		expect(result).toMatchObject({
			type: StockInventoriesListClient,
			props: { session },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
