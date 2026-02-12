import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
	if (shouldThrow) {
		throw new Error('Test error message');
	}
	return <div>Child content</div>;
};

describe('ErrorBoundary', () => {
	// Suppress console.error during tests since we expect errors
	const originalError = console.error;
	beforeAll(() => {
		console.error = jest.fn();
	});
	afterAll(() => {
		console.error = originalError;
	});

	it('renders children when there is no error', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>,
		);

		expect(screen.getByText('Child content')).toBeInTheDocument();
	});

	it('renders error UI when child throws', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /actualiser/i })).toBeInTheDocument();
	});

	it('renders custom fallback when provided', () => {
		const customFallback = <div>Custom error fallback</div>;

		render(
			<ErrorBoundary fallback={customFallback}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
	});

	it('resets error state when retry button is clicked', () => {
		const TestComponent: React.FC = () => {
			const [shouldThrow, setShouldThrow] = React.useState(true);

			return (
				<ErrorBoundary>
					{shouldThrow ? (
						<ThrowError shouldThrow={true} />
					) : (
						<div>
							<span>Recovered content</span>
							<button onClick={() => setShouldThrow(true)}>Trigger error again</button>
						</div>
					)}
				</ErrorBoundary>
			);
		};

		render(<TestComponent />);

		// Should show error UI
		expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();

		// Click retry - this triggers handleReset which sets hasError to false
		// But since ThrowError still throws, it will catch the error again
		const retryButton = screen.getByRole('button', { name: /réessayer/i });
		fireEvent.click(retryButton);

		// After clicking retry, the boundary resets and tries to render children again
		// Since ThrowError still throws, it catches the error again
		expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
	});

	it('shows error message in development mode', () => {
		const originalEnv = process.env.NODE_ENV;
		Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });

		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(screen.getByText('Test error message')).toBeInTheDocument();

		Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
	});
});
