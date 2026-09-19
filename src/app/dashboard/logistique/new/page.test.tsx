import { auth } from '@/auth';
import LogistiqueForm from '@/components/pages/dashboard/logistique/logistique-form';
import { redirect } from 'next/navigation';
import LogistiqueNewPage, { metadata } from './page';

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

beforeEach(() => {
	jest.clearAllMocks();
});

describe('LogistiqueNewPage server component', () => {
	it('exports the new logistics record metadata', () => {
		expect(metadata).toEqual({
			title: 'Nouveau dossier logistique',
			description: 'Créer un nouveau dossier logistique',
		});
	});

	it('redirects to login when no session exists', async () => {
		mockAuth.mockResolvedValueOnce(null);

		await LogistiqueNewPage({ searchParams: Promise.resolve({ company_id: '12' }) });

		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('redirects to the logistics list when company_id is invalid', async () => {
		const session = { user: { pk: 23, email: 'logistique@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		await LogistiqueNewPage({ searchParams: Promise.resolve({ company_id: 'invalid' }) });

		expect(mockRedirect).toHaveBeenCalledWith('/dashboard/logistique');
	});

	it('renders the logistics form with the session and numeric company id', async () => {
		const session = { user: { pk: 24, email: 'logistique@example.com' } };
		mockAuth.mockResolvedValueOnce(session);

		const result = await LogistiqueNewPage({ searchParams: Promise.resolve({ company_id: '42' }) });

		expect(result).toMatchObject({
			type: LogistiqueForm,
			props: { session, company_id: 42 },
		});
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
