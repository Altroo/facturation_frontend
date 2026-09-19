import { auth } from '@/auth';
import LogistiqueListClient from '@/components/pages/dashboard/logistique/logistique-list';
import { redirect } from 'next/navigation';
import LogistiqueListPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/logistique/logistique-list', () => ({
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

describe('LogistiqueListPage server component', () => {
	it('exports the logistics list metadata', () => {
		expect(metadata).toEqual({
			title: 'Suivi logistique',
			description: 'Suivi logistique',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await LogistiqueListPage();

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('renders the logistics list with the authenticated session', async () => {
		const session = { user: { pk: 21, email: 'logistique@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await LogistiqueListPage();

		expect(result).toMatchObject({
			type: LogistiqueListClient,
			props: { session },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
