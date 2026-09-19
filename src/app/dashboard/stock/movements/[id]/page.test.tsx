import { auth } from '@/auth';
import StockMovementView from '@/components/pages/dashboard/stock/stock-movement-view';
import { redirect } from 'next/navigation';
import StockMovementViewPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/stock/stock-movement-view', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN: '/login',
	STOCK_MOVEMENTS: '/dashboard/stock/movements',
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

describe('StockMovementViewPage server component', () => {
	it('exports the stock movement detail metadata', () => {
		expect(metadata).toEqual({
			title: 'Détails du mouvement de stock',
			description: 'Consulter un mouvement de stock',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await StockMovementViewPage(pageProps('7', '12'));

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it.each([
		['invalid id', 'invalid', '12'],
		['invalid company id', '7', 'invalid'],
	])('redirects to the movements list for an %s', async (_case, id, companyId) => {
		const session = { user: { pk: 44, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		await StockMovementViewPage(pageProps(id, companyId));

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/stock/movements');
	});

	it('renders the movement view with numeric movement and company ids', async () => {
		const session = { user: { pk: 45, email: 'stock@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await StockMovementViewPage(pageProps('7', '12'));

		expect(result).toMatchObject({
			type: StockMovementView,
			props: { session, id: 7, company_id: 12 },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
