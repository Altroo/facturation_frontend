import { render, screen, fireEvent, act } from '@testing-library/react';
import LoginClient from './login';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import React from 'react';

// Dynamic mock for search params
let searchParamsMock = new URLSearchParams();

// Mocks
jest.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
	signIn: jest.fn(),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, replace: mockReplace }),
	useSearchParams: () => searchParamsMock,
}));

jest.mock('@/store/actions/_initActions', () => ({
	refreshAppTokenStatesAction: jest.fn(),
}));

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LoginClient', () => {
	beforeEach(() => {
		searchParamsMock = new URLSearchParams(); // reset between tests
		jest.clearAllMocks();
	});

	it('renders login form with title and button', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<LoginClient />
				</Provider>,
			);
		});

		const headings = screen.getAllByText('Connexion');
		expect(headings.length).toBeGreaterThan(0);

		const forgotButtons = screen.getAllByText('Mot de passe oublié ?');
		expect(forgotButtons.length).toBeGreaterThan(0);

		const loginButtons = screen.getAllByRole('button', {
			name: /Me connecter/i,
		});
		expect(loginButtons.length).toBeGreaterThanOrEqual(1);
	});

	it('shows error message when error=AccessDenied in search params', async () => {
		searchParamsMock = new URLSearchParams('error=AccessDenied');

		await act(async () => {
			render(
				<Provider store={store}>
					<LoginClient />
				</Provider>,
			);
		});

		const errors = screen.getAllByText('Service non disponible.');
		expect(errors.length).toBeGreaterThanOrEqual(1);
	});

	it('navigates to reset password when forgot button is clicked', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<LoginClient />
				</Provider>,
			);
		});

		const forgotButtons = screen.getAllByText('Mot de passe oublié ?');
		fireEvent.click(forgotButtons[0]);
		expect(mockPush).toHaveBeenCalled();
	});
});
