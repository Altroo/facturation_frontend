import { auth } from '@/auth';
import LogistiqueSuppliers from '@/components/pages/dashboard/logistique/logistique-suppliers-list';
import { redirect } from 'next/navigation';
import { AUTH_LOGIN } from '@/utils/routes';
import LogistiqueSuppliersPage from './page';

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/navigation', () => ({
	redirect: jest.fn(() => {
		throw new Error('NEXT_REDIRECT');
	}),
}));
jest.mock('@/components/pages/dashboard/logistique/logistique-suppliers-list', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

const session = { user: { pk: 27, email: 'logistique@example.com' } };
const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<typeof session | null>>;

beforeEach(() => jest.clearAllMocks());

describe('LogistiqueSuppliersPage', () => {
	it('redirects unauthenticated users before rendering the supplier list', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await expect(LogistiqueSuppliersPage()).rejects.toThrow('NEXT_REDIRECT');

		expect(redirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('passes the authenticated session to the supplier list', async () => {
		mockAuth.mockResolvedValueOnce(session);

		expect(await LogistiqueSuppliersPage()).toMatchObject({ type: LogistiqueSuppliers, props: { session } });
		expect(redirect).not.toHaveBeenCalled();
	});
});
