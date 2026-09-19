import { auth } from '@/auth';
import StockListClient from '@/components/pages/dashboard/stock/stock-list';
import { redirect } from 'next/navigation';
import StockPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-list', () => ({
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

describe('StockPage server component', () => {
	it('exports the stock list metadata', () => {
		expect(metadata).toEqual({
			title: 'Gestion du stock',
			description: 'Stock physique, réservé et entrant',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockPage();

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('renders the stock list with the authenticated session', async () => {
		const session = { user: { pk: 31, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockPage();

		expect(result).toMatchObject({
			type: StockListClient,
			props: { session },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
