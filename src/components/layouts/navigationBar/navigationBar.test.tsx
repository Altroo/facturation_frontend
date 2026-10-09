import { render, screen, waitFor } from '@testing-library/react';
import { Portal } from '@mui/material';
import userEvent from '@testing-library/user-event';
import NavigationBar from './navigationBar';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { type ReactNode } from 'react';
import { translations } from '@/translations';
import { DASHBOARD_CHANGELOG } from '@/utils/routes';

jest.mock('@/utils/routes', () => ({
	...jest.requireActual('@/utils/routes'),
	SITE_ROOT: 'http://localhost/',
	DASHBOARD_CHANGELOG: 'http://localhost/dashboard/changelog',
}));

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children?: ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

// Dynamic mock for pathname
let mockPathname = '/dashboard';
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
	useRouter: () => ({
		push: mockRouterPush,
	}),
}));

// controllable mock for MUI useMediaQuery
let mockIsMobile = false;
jest.mock('@mui/material', () => {
	const actual = jest.requireActual('@mui/material');
	return {
		...actual,
		useMediaQuery: () => mockIsMobile,
	};
});

const mockCookiesDeleter = jest.fn();
jest.mock('@/utils/apiHelpers', () => ({
	cookiesDeleter: (...args: unknown[]) => mockCookiesDeleter(...(args as unknown[])),
}));

const mockFetchNotifications = jest.fn();
const mockMarkRead = jest.fn();
const mockUseGetNotificationsQuery = jest.fn();
const mockUseLazyGetNotificationsQuery = jest.fn();
const mockUseGetUnreadNotificationCountQuery = jest.fn();
const mockUseMarkNotificationsReadMutation = jest.fn();
jest.mock('@/store/services/notification', () => {
	const actual = jest.requireActual('@/store/services/notification');
	return {
		...actual,
		notificationApi: actual.notificationApi,
		useGetNotificationsQuery: (...args: unknown[]) => mockUseGetNotificationsQuery(...args),
		useLazyGetNotificationsQuery: (...args: unknown[]) => mockUseLazyGetNotificationsQuery(...args),
		useGetUnreadNotificationCountQuery: (...args: unknown[]) => mockUseGetUnreadNotificationCountQuery(...args),
		useMarkNotificationsReadMutation: (...args: unknown[]) => mockUseMarkNotificationsReadMutation(...args),
	};
});

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
	signOut: (...args: unknown[]) => mockSignOut(...(args as unknown[])),
	useSession: () => mockUseSession(),
}));

const mockUseIsClient = jest.fn(() => true);
const mockDispatch = jest.fn();
const mockSetLanguage = jest.fn();
let mockProfile = {
	avatar_cropped: undefined as string | undefined,
	first_name: 'John',
	last_name: 'Doe',
	gender: 'Homme' as 'Homme' | 'Femme' | undefined,
	is_staff: false,
};
const buildSelectorState = () => ({
	account: { profil: mockProfile },
	notification: { unreadCount: 0 },
});
const mockUseAppSelector = jest.fn((selector: (state: ReturnType<typeof buildSelectorState>) => unknown) =>
	selector(buildSelectorState()),
);
jest.mock('@/utils/hooks', () => ({
	useAppDispatch: () => mockDispatch,
	useAppSelector: (selector: (state: ReturnType<typeof buildSelectorState>) => unknown) => mockUseAppSelector(selector),
	useIsClient: () => mockUseIsClient(),
	useLanguage: () => ({
		language: 'fr' as const,
		setLanguage: mockSetLanguage,
		t: translations.fr,
	}),
}));

describe('NavigationBar additional behaviors', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// reset pathname to default
		mockPathname = '/dashboard';
		// default profile
		mockProfile = {
			avatar_cropped: undefined,
			first_name: 'John',
			last_name: 'Doe',
			gender: 'Homme',
			is_staff: false,
		};
		mockUseAppSelector.mockImplementation((selector: (state: ReturnType<typeof buildSelectorState>) => unknown) =>
			selector(buildSelectorState()),
		);
		mockUseGetNotificationsQuery.mockReturnValue({
			data: { results: [], next: null },
			isLoading: false,
		});
		mockFetchNotifications.mockReturnValue({
			unwrap: jest.fn().mockResolvedValue({ results: [], next: null }),
		});
		mockUseLazyGetNotificationsQuery.mockReturnValue([mockFetchNotifications]);
		mockUseGetUnreadNotificationCountQuery.mockReturnValue({
			data: { count: 0 },
			isLoading: false,
		});
		mockUseMarkNotificationsReadMutation.mockReturnValue([mockMarkRead]);
		mockUseSession.mockImplementation(() => ({ data: {}, status: 'authenticated' }));
		mockIsMobile = false;
	});

	it.each([false, true])('links directly to Changelog after Settings for staff=%s', (isStaff) => {
		mockProfile.is_staff = isStaff;
		mockPathname = new URL(DASHBOARD_CHANGELOG, 'http://localhost').pathname;
		render(
			<Provider store={store}>
				<NavigationBar title={translations.fr.navigation.changelog}>
					<div />
				</NavigationBar>
			</Provider>,
		);
		const settings = screen.getByRole('button', { name: 'Paramètres' });
		const link = screen.getByRole('link', { name: translations.fr.navigation.changelog });
		expect(settings.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(link).toHaveAttribute('aria-current', 'page');
		expect(link.getAttribute('href')).toContain('/dashboard/changelog');
		expect(screen.queryByRole('button', { name: translations.fr.navigation.changelog })).not.toBeInTheDocument();
		expect(settings).toHaveAttribute('aria-expanded', 'false');
	});

	it('calls cookiesDeleter and signOut when logout clicked', async () => {
		render(
			<Provider store={store}>
				<NavigationBar title="Dashboard">
					<div>Content</div>
				</NavigationBar>
			</Provider>,
		);

		// "Se déconnecter" is the Desktop logout button text
		const logoutBtn = screen.getByRole('button', { name: /Se déconnecter/i });
		await userEvent.click(logoutBtn);

		expect(mockCookiesDeleter).toHaveBeenCalledTimes(1);
		expect(mockSignOut).toHaveBeenCalledTimes(1);
		// signOut should be called with an object containing redirect true
		expect(mockSignOut.mock.calls[0][0]).toMatchObject({ redirect: true });
	});

	it('shows correct greeting for genders', () => {
		// Homme -> Bienvenu
		mockProfile = {
			avatar_cropped: undefined,
			first_name: 'A',
			last_name: 'B',
			gender: 'Homme',
			is_staff: false,
		};
		render(
			<Provider store={store}>
				<NavigationBar title="t1">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText(/Bienvenu/i)).toBeInTheDocument();

		// rerender Femme -> Bienvenue
		mockProfile = {
			avatar_cropped: undefined,
			first_name: 'A',
			last_name: 'B',
			gender: 'Femme',
			is_staff: false,
		};
		render(
			<Provider store={store}>
				<NavigationBar title="t2">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(
			screen.getAllByText(/Bienvenue|Bienvenu/i).some((el) => /Bienvenue/.test(el.textContent || '')),
		).toBeTruthy();

		// rerender undefined -> Bienvenu(e)
		mockProfile = {
			avatar_cropped: undefined,
			first_name: 'A',
			last_name: 'B',
			gender: undefined,
			is_staff: false,
		};
		render(
			<Provider store={store}>
				<NavigationBar title="t3">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(
			screen.getAllByText(/Bienvenu|Bienvenue/i).some((el) => /Bienvenu\(e\)|Bienvenu/i.test(el.textContent || '')),
		).toBeTruthy();
	});

	it('expands default panel based on pathname (dashboard) and shows its item', () => {
		render(
			<Provider store={store}>
				<NavigationBar title="Dashboard">
					<div />
				</NavigationBar>
			</Provider>,
		);

		// the dashboard section's details include the label "Consulter le tableau de bord"
		expect(screen.getByText('Consulter le tableau de bord')).toBeInTheDocument();
	});

	it('clicking another section expands it (Articles) and its items become visible', async () => {
		render(
			<Provider store={store}>
				<NavigationBar title="NavTest">
					<div />
				</NavigationBar>
			</Provider>,
		);

		// The section title text "Articles" is clickable; click to expand it
		const articlesSummary = screen.getAllByText('Articles')[0];
		await userEvent.click(articlesSummary);

		// after clicking, the articles details should reveal "Liste des articles"
		expect(screen.getByText('Liste des articles')).toBeInTheDocument();
	});

	it('does not hide the assistant or lock scrolling when resizing desktop to mobile', async () => {
		const content = (
			<Provider store={store}>
				<NavigationBar title="Dashboard">
					<div>Content</div>
				</NavigationBar>
				<Portal>
					<div role="dialog" aria-label="Assistant test">
						Conversation
					</div>
				</Portal>
			</Provider>
		);
		const { rerender } = render(content);
		expect(screen.getByRole('dialog', { name: 'Assistant test' })).toBeVisible();
		mockIsMobile = true;
		rerender(
			<Provider store={store}>
				<NavigationBar title="Dashboard mobile">
					<div>Content</div>
				</NavigationBar>
				<Portal>
					<div role="dialog" aria-label="Assistant test">
						Conversation
					</div>
				</Portal>
			</Provider>,
		);
		expect(screen.getByRole('dialog', { name: 'Assistant test' })).toBeVisible();
		expect(document.querySelector('.MuiDrawer-modal')).toBeNull();
		expect(document.body.style.overflow).not.toBe('hidden');
		// A deliberately opened native modal must still hide background content,
		// then restore it after normal close; never bypass ModalManager's guard.
		await userEvent.click(screen.getByLabelText('Basculer le tiroir de navigation'));
		expect(screen.queryByRole('dialog', { name: 'Assistant test' })).not.toBeInTheDocument();
		await userEvent.keyboard('{Escape}');
		await waitFor(() => expect(screen.getByRole('dialog', { name: 'Assistant test' })).toBeVisible());
		expect(document.body.style.overflow).not.toBe('hidden');
	});

	it('does not carry an open mobile drawer across a desktop round trip', async () => {
		mockIsMobile = true;
		const view = (title: string) => (
			<Provider store={store}>
				<NavigationBar title={title}>
					<div>Content</div>
				</NavigationBar>
				<Portal>
					<div role="dialog" aria-label="Assistant test">
						Conversation
					</div>
				</Portal>
			</Provider>
		);
		const { rerender } = render(view('Mobile'));
		await userEvent.click(screen.getByLabelText('Basculer le tiroir de navigation'));
		expect(screen.queryByRole('dialog', { name: 'Assistant test' })).not.toBeInTheDocument();
		mockIsMobile = false;
		rerender(view('Desktop'));
		expect(screen.getByRole('dialog', { name: 'Assistant test' })).toBeVisible();
		mockIsMobile = true;
		rerender(view('Mobile again'));
		expect(screen.getByRole('dialog', { name: 'Assistant test' })).toBeVisible();
		expect(document.querySelector('.MuiDrawer-modal')).toBeNull();
		expect(document.body.style.overflow).not.toBe('hidden');
	});

	it('drawer toggle button only appears on mobile, not on desktop', async () => {
		// Desktop (mockIsMobile = false) -> button should NOT be visible
		mockIsMobile = false;
		const { rerender } = render(
			<Provider store={store}>
				<NavigationBar title="D">
					<div />
				</NavigationBar>
			</Provider>,
		);

		// On desktop, toggle button should not exist
		expect(screen.queryByLabelText('toggle drawer')).not.toBeInTheDocument();

		// now simulate mobile mode and rerender -> button should now be visible
		mockIsMobile = true;
		rerender(
			<Provider store={store}>
				<NavigationBar title="D2">
					<div />
				</NavigationBar>
			</Provider>,
		);

		// On mobile, toggle button should exist and be clickable
		const toggleBtnMobile = screen.getByLabelText('Basculer le tiroir de navigation');
		expect(toggleBtnMobile).toBeInTheDocument();

		// Clicking should toggle the drawer on mobile
		await userEvent.click(toggleBtnMobile);
	});
	it('finds exact match for pathname and expands correct panel', () => {
		// Set pathname to exactly match articles list path
		mockPathname = '/dashboard/articles';

		render(
			<Provider store={store}>
				<NavigationBar title="Test">
					<div />
				</NavigationBar>
			</Provider>,
		);

		// The Articles panel should be expanded since pathname matches
		expect(screen.getByText('Liste des articles')).toBeInTheDocument();
	});

	it('handles partial path matching with different segments', () => {
		// Set pathname to a subpath that partially matches
		mockPathname = '/dashboard/companies/123';

		mockProfile = {
			avatar_cropped: undefined,
			first_name: 'A',
			last_name: 'B',
			gender: 'Homme',
			is_staff: true,
		};

		render(
			<Provider store={store}>
				<NavigationBar title="Test">
					<div />
				</NavigationBar>
			</Provider>,
		);

		// The companies panel should be expanded due to partial match
		expect(screen.getByText('Entreprises')).toBeInTheDocument();
	});

	it('handles pathname with no matching menu item', () => {
		// Set pathname to something that doesn't match any menu
		mockPathname = '/some/random/path';

		render(
			<Provider store={store}>
				<NavigationBar title="Test">
					<div />
				</NavigationBar>
			</Provider>,
		);

		// Should still render without errors
		expect(screen.getByText('Test')).toBeInTheDocument();
	});

	it('handles path segment mismatch in partial matching', () => {
		// Set pathname where first segments match but later ones don't
		mockPathname = '/dashboard/articles/different/path';

		render(
			<Provider store={store}>
				<NavigationBar title="Test">
					<div />
				</NavigationBar>
			</Provider>,
		);

		// Articles panel should still be expanded due to partial match on /dashboard/articles
		expect(screen.getByText('Liste des articles')).toBeInTheDocument();
	});

	it('refreshes notifications on open and navigates linked notifications', async () => {
		const user = userEvent.setup();
		mockUseGetNotificationsQuery.mockReturnValue({
			data: {
				results: [
					{
						id: 27,
						title: 'Nouveau document — P001/26',
						message: 'support@elbouazzatiholding.ma a créé facture pro-forma P001/26 pour Sitiane Mohamed.',
						notification_type: 'document_created',
						object_id: 41,
						target_url: '',
						is_read: true,
						date_created: '2026-06-26T00:00:00Z',
					},
				],
				next: null,
			},
			isLoading: false,
		});
		mockFetchNotifications.mockReturnValue({
			unwrap: jest.fn().mockResolvedValue({
				results: [
					{
						id: 27,
						title: 'Nouveau document — P001/26',
						message: 'support@elbouazzatiholding.ma a créé facture pro-forma P001/26 pour Sitiane Mohamed.',
						notification_type: 'document_created',
						object_id: 41,
						target_url: '/dashboard/facture-pro-forma/41?company_id=3',
						is_read: true,
						date_created: '2026-06-26T00:00:00Z',
					},
				],
				next: null,
			}),
		});

		render(
			<Provider store={store}>
				<NavigationBar title="Dashboard">
					<div />
				</NavigationBar>
			</Provider>,
		);

		await user.click(screen.getByRole('button', { name: /notifications/i }));
		expect(mockFetchNotifications).toHaveBeenCalledWith({ page: 1 }, false);
		await screen.findByRole('button', { name: /facture pro-forma P001\/26/i });

		await user.click(screen.getByRole('button', { name: /facture pro-forma P001\/26/i }));

		expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/facture-pro-forma/41?company_id=3');
	});

	it('refreshes notifications when opened from the compact actions menu', async () => {
		const user = userEvent.setup();

		render(
			<Provider store={store}>
				<NavigationBar title="Dashboard">
					<div />
				</NavigationBar>
			</Provider>,
		);

		await user.click(screen.getByRole('button', { name: /plus d'actions/i }));
		await user.click(screen.getByRole('menuitem', { name: /notifications/i }));

		expect(mockFetchNotifications).toHaveBeenCalledWith({ page: 1 }, false);
	});
});
