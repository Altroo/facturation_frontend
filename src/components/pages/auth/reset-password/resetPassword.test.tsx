import { render, screen, fireEvent, act } from '@testing-library/react';
import ResetPasswordClient from './resetPassword';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import React from 'react';

// Dynamic mock for search params
let searchParamsMock = new URLSearchParams();

// Mocks
jest.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, replace: jest.fn() }),
	useSearchParams: () => searchParamsMock,
}));

jest.mock('@/store/actions/_initActions', () => ({
	refreshAppTokenStatesAction: jest.fn(),
}));

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/store/services/account', () => {
	const actual = jest.requireActual('@/store/services/account');

	type TriggerFn = (args: unknown) => Promise<unknown>;
	const mockTrigger: TriggerFn = jest.fn().mockResolvedValue({});

	return {
		...actual,
		accountApi: {
			reducerPath: 'accountApi',
			reducer: (_state = {}) => _state,
			middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
		},
		useSendPasswordResetCodeMutation: (): [TriggerFn, { isLoading: boolean }] => [mockTrigger, { isLoading: false }],
	};
});

describe('ResetPasswordClient', () => {
	beforeEach(() => {
		searchParamsMock = new URLSearchParams();
		jest.clearAllMocks();
	});

	it('renders reset password form with email input and button', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<ResetPasswordClient />
				</Provider>,
			);
		});

		const titles = screen.getAllByText('Récupération');
		expect(titles.length).toBeGreaterThanOrEqual(1);

		const subtitles = screen.getAllByText('du mot de passe');
		expect(subtitles.length).toBeGreaterThanOrEqual(1);

		const instructions = screen.getAllByText(
			'Entrez votre email pour recevoir un code et modifier votre mot de passe.',
		);
		expect(instructions.length).toBeGreaterThanOrEqual(1);

		const emailInputs = screen.getAllByPlaceholderText('Adresse email');
		expect(emailInputs.length).toBeGreaterThanOrEqual(1);

		const submitButtons = screen.getAllByRole('button', {
			name: /Renvoyer le code/i,
		});
		expect(submitButtons.length).toBeGreaterThanOrEqual(1);
	});

	it('submits the form when button is clicked', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<ResetPasswordClient />
				</Provider>,
			);
		});

		const emailInputs = screen.getAllByPlaceholderText('Adresse email');
		const submitButtons = screen.getAllByRole('button', {
			name: /Renvoyer le code/i,
		});

		await act(async () => {
			fireEvent.change(emailInputs[0], {
				target: { value: 'test@example.com' },
			});
			fireEvent.click(submitButtons[0]);
		});

		expect(submitButtons[0]).toBeEnabled();
	});
});
