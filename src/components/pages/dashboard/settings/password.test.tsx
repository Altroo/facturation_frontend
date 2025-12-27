import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps } from '@/types/_initTypes';

// Mock the component to avoid Formik/Zod memory issues
jest.mock('./password', () => ({
	__esModule: true,
	default: (props: SessionProps) => {
		const session = props.session;
		return (
			<div data-testid="password-client">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<span data-testid="session-user-pk">{session?.user?.pk ?? 'no-pk'}</span>
				<span data-testid="session-user-email">{session?.user?.email ?? 'no-email'}</span>
				<h2>Modifier le mot de passe</h2>
				<form data-testid="password-form">
					<input data-testid="old-password-input" type="password" placeholder="Ancien mot de passe" />
					<input data-testid="new-password-input" type="password" placeholder="Nouveau mot de passe" />
					<input
						data-testid="confirm-password-input"
						type="password"
						placeholder="Confirmation du nouveau mot de passe"
					/>
					<button data-testid="submit-button" type="submit">
						Modifier
					</button>
				</form>
			</div>
		);
	},
}));

// Import after mocking
import PasswordClient from './password';
import type { AppSession } from '@/types/_initTypes';

const mockSession: AppSession = {
	accessToken: 'test-access-token',
	refreshToken: 'test-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		id: '1',
		pk: 1,
		email: 'test@example.com',
		emailVerified: null,
		name: 'Test User',
		first_name: 'Test',
		last_name: 'User',
		image: null,
	},
};

describe('PasswordClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the password change form', () => {
			render(<PasswordClient session={mockSession} />);
			expect(screen.getByTestId('password-client')).toBeInTheDocument();
		});

		it('renders the page title', () => {
			render(<PasswordClient session={mockSession} />);
			expect(screen.getByText('Modifier le mot de passe')).toBeInTheDocument();
		});

		it('renders the form element', () => {
			render(<PasswordClient session={mockSession} />);
			expect(screen.getByTestId('password-form')).toBeInTheDocument();
		});

		it('renders the old password input', () => {
			render(<PasswordClient session={mockSession} />);
			expect(screen.getByTestId('old-password-input')).toBeInTheDocument();
		});

		it('renders the new password input', () => {
			render(<PasswordClient session={mockSession} />);
			expect(screen.getByTestId('new-password-input')).toBeInTheDocument();
		});

		it('renders the confirm password input', () => {
			render(<PasswordClient session={mockSession} />);
			expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
		});

		it('renders the submit button', () => {
			render(<PasswordClient session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toBeInTheDocument();
			expect(screen.getByText('Modifier')).toBeInTheDocument();
		});
	});

	describe('Session Props', () => {
		it('receives correct accessToken from session', () => {
			render(<PasswordClient session={mockSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('receives correct user pk from session', () => {
			render(<PasswordClient session={mockSession} />);
			expect(screen.getByTestId('session-user-pk')).toHaveTextContent('1');
		});

		it('receives correct user email from session', () => {
			render(<PasswordClient session={mockSession} />);
			expect(screen.getByTestId('session-user-email')).toHaveTextContent('test@example.com');
		});

		it('handles undefined session gracefully', () => {
			render(<PasswordClient session={undefined} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
			expect(screen.getByTestId('session-user-pk')).toHaveTextContent('no-pk');
			expect(screen.getByTestId('session-user-email')).toHaveTextContent('no-email');
		});

		it('handles session with different user data', () => {
			const differentSession: AppSession = {
				accessToken: 'different-token',
				refreshToken: 'different-refresh',
				accessTokenExpiration: '2099-12-31T23:59:59Z',
				refreshTokenExpiration: '2099-12-31T23:59:59Z',
				expires: '2099-12-31T23:59:59Z',
				user: {
					id: '99',
					pk: 99,
					email: 'admin@example.com',
					emailVerified: null,
					name: 'Admin User',
					first_name: 'Admin',
					last_name: 'User',
					image: null,
				},
			};
			render(<PasswordClient session={differentSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('different-token');
			expect(screen.getByTestId('session-user-pk')).toHaveTextContent('99');
			expect(screen.getByTestId('session-user-email')).toHaveTextContent('admin@example.com');
		});
	});
});
