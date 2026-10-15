import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle, { AuthThemeToggle } from './themeToggle';
import ThemeProvider from '@/providers/themeProvider';
import { LanguageContext } from '@/contexts/languageContext';
import { translations } from '@/translations';
import type { Language } from '@/types/languageTypes';
import type { ColorMode } from '@/utils/colorMode';

let mockPathname: string | null = '/login';
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }));

const renderToggle = (language: Language = 'fr', mode: ColorMode = 'light', auth = false) =>
	render(
		<LanguageContext.Provider value={{ language, setLanguage: jest.fn(), t: translations[language] }}>
			<ThemeProvider initialTheme={mode}>{auth ? <AuthThemeToggle /> : <ThemeToggle />}</ThemeProvider>
		</LanguageContext.Provider>,
	);

beforeEach(() => {
	mockPathname = '/login';
});
afterEach(() => {
	delete document.documentElement.dataset.theme;
	document.cookie = 'app-theme=;path=/;max-age=0';
});

it.each([
	['fr', 'light', 'Activer le mode sombre', 'Activer le mode clair'],
	['fr', 'dark', 'Activer le mode clair', 'Activer le mode sombre'],
	['en', 'light', 'Switch to dark mode', 'Switch to light mode'],
	['en', 'dark', 'Switch to light mode', 'Switch to dark mode'],
] as const)('switches %s from %s and updates its accessible label', (language, initial, before, after) => {
	renderToggle(language, initial);
	const next = initial === 'light' ? 'dark' : 'light';
	expect(document.documentElement).toHaveAttribute('data-theme', initial);
	fireEvent.click(screen.getByRole('button', { name: before }));
	expect(screen.getByRole('button', { name: after })).toBeVisible();
	expect(document.documentElement).toHaveAttribute('data-theme', next);
	expect(document.cookie).toContain(`app-theme=${next}`);
	fireEvent.click(screen.getByRole('button', { name: after }));
	expect(document.documentElement).toHaveAttribute('data-theme', initial);
});

it('supports keyboard activation', async () => {
	const user = userEvent.setup();
	renderToggle('en');
	await user.tab();
	expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toHaveFocus();
	await user.keyboard('{Enter}');
	expect(screen.getByRole('button', { name: 'Switch to light mode' })).toHaveFocus();
});

it.each([
	'/login',
	'/reset-password',
	'/reset-password/enter-code',
	'/reset-password/set-password',
	'/reset-password/set-password-complete',
])('shows the authentication toggle on %s', (pathname) => {
	mockPathname = pathname;
	renderToggle('fr', 'light', true);
	expect(screen.getByRole('button', { name: 'Activer le mode sombre' })).toBeVisible();
});

it.each(['/dashboard', '/dashboard/articles', '/sso/start', '/', null])(
	'hides the authentication toggle on %s',
	(pathname) => {
		mockPathname = pathname;
		renderToggle('fr', 'light', true);
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	},
);
