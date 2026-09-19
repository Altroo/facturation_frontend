import { auth } from '@/auth';
import StockMovementsListClient from '@/components/pages/dashboard/stock/stock-movements-list';
import { redirect } from 'next/navigation';
import StockMovementsPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-movements-list', () => ({
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

describe('StockMovementsPage server component', () => {
	it('exports the stock movements metadata', () => {
		expect(metadata).toEqual({
			title: 'Mouvements de stock',
			description: 'Historique des mouvements de stock',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockMovementsPage();

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('renders the stock movements list with the authenticated session', async () => {
		const session = { user: { pk: 32, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockMovementsPage();

		expect(result).toMatchObject({
			type: StockMovementsListClient,
			props: { session },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
