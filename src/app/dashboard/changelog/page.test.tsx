import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import ChangelogPage, { generateMetadata } from './page';
import Changelog from '@/components/pages/dashboard/changelog/changelog';
import { AUTH_LOGIN } from '@/utils/routes';
import { translations } from '@/translations';

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('next/navigation', () => ({
	redirect: jest.fn(() => {
		throw new Error('redirect');
	}),
}));
jest.mock('@/components/pages/dashboard/changelog/changelog', () => ({ __esModule: true, default: () => null }));
beforeEach(() => jest.clearAllMocks());
it('requires a signed-in user', async () => {
	(auth as jest.Mock).mockResolvedValue(null);
	await expect(ChangelogPage()).rejects.toThrow('redirect');
	expect(redirect).toHaveBeenCalledWith(AUTH_LOGIN);
});
it('is available to an ordinary signed-in user', async () => {
	(auth as jest.Mock).mockResolvedValue({ user: { is_staff: false } });
	expect((await ChangelogPage()).type).toBe(Changelog);
	expect(redirect).not.toHaveBeenCalled();
});

it.each(['fr', 'en', undefined, 'unsupported'])(
	'uses the language cookie %s for localized metadata, defaulting to French',
	async (language) => {
		const get = jest.fn(() => (language ? { value: language } : undefined));
		(cookies as jest.Mock).mockResolvedValue({ get });

		const metadata = await generateMetadata();

		const t = translations[language === 'en' ? 'en' : 'fr'];
		expect(metadata).toEqual({ title: t.navigation.changelog, description: t.changelog.description });
		expect(get).toHaveBeenCalledWith('app-language');
	},
);
