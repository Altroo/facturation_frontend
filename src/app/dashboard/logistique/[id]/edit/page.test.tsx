import { auth } from '@/auth';
import LogistiqueForm from '@/components/pages/dashboard/logistique/logistique-form';
import { redirect } from 'next/navigation';
import LogistiqueEditPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
}));

jest.mock('@/components/pages/dashboard/logistique/logistique-form', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN: '/login',
	LOGISTIQUE_LIST: '/dashboard/logistique',
}));

type TestSession = {
	user: { pk: number; email: string };
};

const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<TestSession | null>>;
const mockRedirect = jest.mocked(redirect);

const pageProps = (id: string, companyId: string) => ({
	params: Promise.resolve({ id }),
	searchParams: Promise.resolve({ company_id: companyId }),
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('LogistiqueEditPage server component', () => {
	it('exports the logistics edit metadata', () => {
		expect(metadata).toEqual({
			title: 'Modifier le dossier logistique',
			description: 'Modifier un dossier logistique existant',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await LogistiqueEditPage(pageProps('7', '12'));

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it.each([
		['invalid id', 'invalid', '12'],
		['invalid company id', '7', 'invalid'],
	])('redirects to the logistics list for an %s', async (_case, id, companyId) => {
		const session = { user: { pk: 27, email: 'logistique@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		await LogistiqueEditPage(pageProps(id, companyId));

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/logistique');
	});

	it('renders the logistics edit form with numeric record and company ids', async () => {
		const session = { user: { pk: 28, email: 'logistique@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await LogistiqueEditPage(pageProps('7', '12'));

		expect(result).toMatchObject({
			type: LogistiqueForm,
			props: { session, id: 7, company_id: 12 },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
