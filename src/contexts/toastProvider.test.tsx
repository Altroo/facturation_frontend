import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, ToastContext } from './toastProvider';

// Mock the Portal used by the provider to avoid DOM/portal complexity
jest.mock('@/contexts/Portal', () => ({
	__esModule: true,
	default: (props: React.PropsWithChildren<Record<string, unknown>>) => (
		<div data-testid="portal">{props.children}</div>
	),
}));

// Mock CustomToast to expose received props via attributes when `show` is true
jest.mock('@/components/portals/customToast/customToast', () => ({
	__esModule: true,
	default: (props: { type?: string; message?: string; show?: boolean }) =>
		props.show ? <div data-testid="custom-toast" data-type={props.type} data-message={props.message} /> : null,
}));

const TestConsumer: React.FC<{ action: 'success' | 'error'; message: string }> = ({ action, message }) => {
	const ctx = React.useContext(ToastContext);
	return (
		<button
			onClick={() => {
				if (!ctx) return;
				if (action === 'success') ctx.onSuccess(message);
				else ctx.onError(message);
			}}
		>
			trigger
		</button>
	);
};

describe('ToastProvider', () => {
	it('shows success toast with correct message when onSuccess is called', () => {
		render(
			<ToastProvider>
				<TestConsumer action="success" message="Success msg" />
			</ToastProvider>,
		);

		const btn = screen.getByRole('button', { name: /trigger/i });
		act(() => btn.click());

		const toast = screen.getByTestId('custom-toast');
		expect(toast).toHaveAttribute('data-type', 'success');
		expect(toast).toHaveAttribute('data-message', 'Success msg');
	});

	it('shows error toast with correct message when onError is called', () => {
		render(
			<ToastProvider>
				<TestConsumer action="error" message="Error msg" />
			</ToastProvider>,
		);

		const btn = screen.getByRole('button', { name: /trigger/i });
		act(() => btn.click());

		const toast = screen.getByTestId('custom-toast');
		expect(toast).toHaveAttribute('data-type', 'error');
		expect(toast).toHaveAttribute('data-message', 'Error msg');
	});
});
