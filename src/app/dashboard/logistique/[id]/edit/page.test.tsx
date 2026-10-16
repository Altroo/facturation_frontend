import { auth } from '@/auth';
import LogistiqueForm from '@/components/pages/dashboard/logistique/logistique-form';
import { notFound, redirect } from 'next/navigation';
import LogistiqueEditPage, { metadata } from './page';

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: jest.fn(),
	notFound: jest.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
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
const mockNotFound = jest.mocked(notFound);

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

	it.each(['gantt', 'invalid', '', '0', '-1', '1.5', '9007199254740992'])(
		'returns not found for invalid dossier id %s',
		async (id) => {
			mockAuth.mockResolvedValueOnce({ user: { pk: 27, email: 'logistique@example.com' } });

			await expect(LogistiqueEditPage(pageProps(id, '12'))).rejects.toThrow('NEXT_NOT_FOUND');

			expect(mockNotFound).toHaveBeenCalledTimes(1);
			expect(mockRedirect).not.toHaveBeenCalled();
		},
	);

	it('redirects to the logistics list for an invalid company id', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 27, email: 'logistique@example.com' } });

		await LogistiqueEditPage(pageProps('7', 'invalid'));

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/logistique');
		expect(mockNotFound).not.toHaveBeenCalled();
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
