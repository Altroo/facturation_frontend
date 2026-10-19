import { auth } from '@/auth';
import LogistiqueSuppliersForm from '@/components/pages/dashboard/logistique/logistique-suppliers-form';
import { redirect } from 'next/navigation';
import { AUTH_LOGIN, LOGISTIQUE_SUPPLIERS } from '@/utils/routes';
import LogistiqueSuppliersNewPage from './page';

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/navigation', () => ({
	redirect: jest.fn(() => {
		throw new Error('NEXT_REDIRECT');
	}),
}));
jest.mock('@/components/pages/dashboard/logistique/logistique-suppliers-form', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

const session = { user: { pk: 27, email: 'logistique@example.com' } };
const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<typeof session | null>>;
const pageProps = (company_id: string) => ({ searchParams: Promise.resolve({ company_id }) });

beforeEach(() => {
	jest.clearAllMocks();
	mockAuth.mockResolvedValue(session);
});

describe('LogistiqueSuppliersNewPage', () => {
	it('redirects unauthenticated users to login before validating the company', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await expect(LogistiqueSuppliersNewPage(pageProps('invalid'))).rejects.toThrow('NEXT_REDIRECT');

		expect(redirect).toHaveBeenCalledTimes(1);
		expect(redirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it.each(['', 'invalid', '0', '-1', '1.5', '1e2', '0x10', ' 1 ', '9007199254740992'])(
		'redirects an invalid company id %s to the supplier list',
		async (companyId) => {
			await expect(LogistiqueSuppliersNewPage(pageProps(companyId))).rejects.toThrow('NEXT_REDIRECT');

			expect(redirect).toHaveBeenCalledWith(LOGISTIQUE_SUPPLIERS);
		},
	);

	it('passes the numeric company id and session to the new supplier form', async () => {
		expect(await LogistiqueSuppliersNewPage(pageProps('12'))).toMatchObject({
			type: LogistiqueSuppliersForm,
			props: { session, company_id: 12 },
		});
		expect(redirect).not.toHaveBeenCalled();
	});
});
