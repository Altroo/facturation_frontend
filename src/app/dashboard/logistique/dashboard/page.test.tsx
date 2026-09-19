import { auth } from '@/auth';
import LogistiqueDashboard from '@/components/pages/dashboard/logistique/logistique-dashboard';
import { redirect } from 'next/navigation';
import LogistiqueDashboardPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/logistique/logistique-dashboard', () => ({
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

describe('LogistiqueDashboardPage server component', () => {
	it('exports the logistics dashboard metadata', () => {
		expect(metadata).toEqual({
			title: 'Tableau de bord logistique',
			description: 'Tableau de bord du suivi logistique',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await LogistiqueDashboardPage();

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('renders the logistics dashboard with the authenticated session', async () => {
		const session = { user: { pk: 22, email: 'logistique@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await LogistiqueDashboardPage();

		expect(result).toMatchObject({
			type: LogistiqueDashboard,
			props: { session },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
