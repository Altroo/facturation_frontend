import { auth } from '@/auth';
import StockReceiptsListClient from '@/components/pages/dashboard/stock/stock-receipts-list';
import { redirect } from 'next/navigation';
import StockReceiptsPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-receipts-list', () => ({
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

describe('StockReceiptsPage server component', () => {
	it('exports the stock receipts metadata', () => {
		expect(metadata).toEqual({
			title: 'Réceptions de stock',
			description: 'Liste des réceptions de stock',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockReceiptsPage();

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('renders the stock receipts list with the authenticated session', async () => {
		const session = { user: { pk: 33, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockReceiptsPage();

		expect(result).toMatchObject({
			type: StockReceiptsListClient,
			props: { session },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
