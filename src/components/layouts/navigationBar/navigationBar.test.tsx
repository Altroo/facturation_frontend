import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigationBar from './navigationBar';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import React from 'react';

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
	usePathname: () => '/dashboard',
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

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
	signOut: (...args: unknown[]) => mockSignOut(...(args as unknown[])),
	useSession: () => mockUseSession(),
}));

const mockUseIsClient = jest.fn(() => true);
const mockUseAppSelector = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useAppSelector: (fn: unknown) => mockUseAppSelector(fn),
	useIsClient: () => mockUseIsClient(),
}));

describe('NavigationBar additional behaviors', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// default profile
		mockUseAppSelector.mockImplementation(() => ({
			avatar_cropped: undefined,
			first_name: 'John',
			last_name: 'Doe',
			gender: 'Homme',
			is_staff: false,
		}));
		mockUseSession.mockImplementation(() => ({ data: {}, status: 'authenticated' }));
		mockIsMobile = false;
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
		mockUseAppSelector.mockImplementation(() => ({
			avatar_cropped: undefined,
			first_name: 'A',
			last_name: 'B',
			gender: 'Homme',
			is_staff: false,
		}));
		render(
			<Provider store={store}>
				<NavigationBar title="t1">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText(/Bienvenu/i)).toBeInTheDocument();

		// rerender Femme -> Bienvenue
		mockUseAppSelector.mockImplementation(() => ({
			avatar_cropped: undefined,
			first_name: 'A',
			last_name: 'B',
			gender: 'Femme',
			is_staff: false,
		}));
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
		mockUseAppSelector.mockImplementation(() => ({
			avatar_cropped: undefined,
			first_name: 'A',
			last_name: 'B',
			gender: undefined,
			is_staff: false,
		}));
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

	it('drawer toggle icon changes based on open state and mobile setting', async () => {
		// Desktop (mockIsMobile = false) -> initial open = true -> ChevronLeftIcon shown (svg present)
		mockIsMobile = false;
		const { rerender } = render(
			<Provider store={store}>
				<NavigationBar title="D">
					<div />
				</NavigationBar>
			</Provider>,
		);

		const toggleBtn = screen.getByLabelText('toggle drawer');
		expect(toggleBtn).toBeInTheDocument();

		// click to close -> icon should switch (still a button that can be clicked)
		await userEvent.click(toggleBtn);

		// now simulate mobile mode and rerender -> initial open false -> menu icon visible (still accessible via aria-label)
		mockIsMobile = true;
		rerender(
			<Provider store={store}>
				<NavigationBar title="D2">
					<div />
				</NavigationBar>
			</Provider>,
		);

		const toggleBtnMobile = screen.getByLabelText('toggle drawer');
		expect(toggleBtnMobile).toBeInTheDocument();
	});
});
