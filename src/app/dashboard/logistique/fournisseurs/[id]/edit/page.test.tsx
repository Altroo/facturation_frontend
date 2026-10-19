import { auth } from '@/auth';
import LogistiqueSuppliersForm from '@/components/pages/dashboard/logistique/logistique-suppliers-form';
import { notFound, redirect } from 'next/navigation';
import { AUTH_LOGIN, LOGISTIQUE_SUPPLIERS } from '@/utils/routes';
import LogistiqueSuppliersEditPage from './page';

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/navigation', () => ({
	redirect: jest.fn(() => {
		throw new Error('NEXT_REDIRECT');
	}),
	notFound: jest.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));
jest.mock('@/components/pages/dashboard/logistique/logistique-suppliers-form', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

const session = { user: { pk: 27, email: 'logistique@example.com' } };
const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<typeof session | null>>;
const pageProps = (id: string, company_id = '12') => ({
	params: Promise.resolve({ id }),
	searchParams: Promise.resolve({ company_id }),
});

beforeEach(() => {
	jest.clearAllMocks();
	mockAuth.mockResolvedValue(session);
});

describe('LogistiqueSuppliersEditPage', () => {
	it('redirects unauthenticated users before validating route ids', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await expect(LogistiqueSuppliersEditPage(pageProps('invalid'))).rejects.toThrow('NEXT_REDIRECT');

		expect(redirect).toHaveBeenCalledWith(AUTH_LOGIN);
		expect(notFound).not.toHaveBeenCalled();
	});

	it.each(['', 'new', 'invalid', '0', '-1', '1.5', '1e2', '0x10', ' 1 ', '9007199254740992'])(
		'returns not found for invalid supplier id %s',
		async (id) => {
			await expect(LogistiqueSuppliersEditPage(pageProps(id))).rejects.toThrow('NEXT_NOT_FOUND');

			expect(notFound).toHaveBeenCalledTimes(1);
			expect(redirect).not.toHaveBeenCalled();
		},
	);

	it.each(['', 'invalid', '0', '-1', '1.5', '1e2', '0x10', ' 1 ', '9007199254740992'])(
		'redirects invalid company id %s to the supplier list',
		async (companyId) => {
			await expect(LogistiqueSuppliersEditPage(pageProps('7', companyId))).rejects.toThrow('NEXT_REDIRECT');

			expect(redirect).toHaveBeenCalledWith(LOGISTIQUE_SUPPLIERS);
			expect(notFound).not.toHaveBeenCalled();
		},
	);

	it('passes numeric supplier and company ids with the session to the edit form', async () => {
		expect(await LogistiqueSuppliersEditPage(pageProps('7'))).toMatchObject({
			type: LogistiqueSuppliersForm,
			props: { session, id: 7, company_id: 12 },
		});
		expect(redirect).not.toHaveBeenCalled();
		expect(notFound).not.toHaveBeenCalled();
	});
});
