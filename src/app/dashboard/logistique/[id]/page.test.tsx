import { auth } from '@/auth';
import LogistiqueViewClient from '@/components/pages/dashboard/logistique/logistique-view';
import { notFound, redirect } from 'next/navigation';
import LogistiqueViewPage, { metadata } from './page';

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

jest.mock('@/components/pages/dashboard/logistique/logistique-view', () => ({
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

describe('LogistiqueViewPage server component', () => {
	it('exports the logistics detail metadata', () => {
		expect(metadata).toEqual({
			title: 'Détails du dossier logistique',
			description: "Consulter les détails d'un dossier logistique",
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await LogistiqueViewPage(pageProps('7', '12'));

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it.each(['gantt', 'invalid', '', '0', '-1', '1.5', '9007199254740992'])(
		'returns not found for invalid dossier id %s',
		async (id) => {
			mockAuth.mockResolvedValueOnce({ user: { pk: 25, email: 'logistique@example.com' } });

			await expect(LogistiqueViewPage(pageProps(id, '12'))).rejects.toThrow('NEXT_NOT_FOUND');

			expect(mockNotFound).toHaveBeenCalledTimes(1);
			expect(mockRedirect).not.toHaveBeenCalled();
		},
	);

	it('redirects to the logistics list for an invalid company id', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 25, email: 'logistique@example.com' } });

		await LogistiqueViewPage(pageProps('7', 'invalid'));

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/logistique');
		expect(mockNotFound).not.toHaveBeenCalled();
	});

	it('renders the logistics view with numeric record and company ids', async () => {
		const session = { user: { pk: 26, email: 'logistique@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await LogistiqueViewPage(pageProps('7', '12'));

		expect(result).toMatchObject({
			type: LogistiqueViewClient,
			props: { session, id: 7, company_id: 12 },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
