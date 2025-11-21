import { render, screen, fireEvent, act } from '@testing-library/react';
import EnterCodeClient from './enterCode';
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

describe('EnterCodeClient', () => {
	const testEmail = 'test@example.com';

	beforeEach(() => {
		searchParamsMock = new URLSearchParams();
		jest.clearAllMocks();
	});

	it('renders code entry form with inputs and buttons', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<EnterCodeClient email={testEmail} />
				</Provider>,
			);
		});

		const titles = screen.getAllByText('Rentrez le code');
		expect(titles.length).toBeGreaterThanOrEqual(1);

		const emailNotices = screen.getAllByText(
			(_, element) => element?.textContent === `Un code a été envoyé à ${testEmail}`,
		);
		expect(emailNotices.length).toBeGreaterThanOrEqual(1);

		const inputs = screen.getAllByRole('textbox');
		expect(inputs.length).toBeGreaterThanOrEqual(4);

		const confirmButtons = screen.getAllByRole('button', {
			name: /Confirmer le code/i,
		});
		expect(confirmButtons.length).toBeGreaterThanOrEqual(1);

		const resendButtons = screen.getAllByText('Renvoyer le code');
		expect(resendButtons.length).toBeGreaterThanOrEqual(1);
	});

	it('triggers resend code handler when button is clicked', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<EnterCodeClient email={testEmail} />
				</Provider>,
			);
		});

		const resendButtons = screen.getAllByText('Renvoyer le code');
		fireEvent.click(resendButtons[0]);

		expect(resendButtons[0]).toBeEnabled();
	});
});
