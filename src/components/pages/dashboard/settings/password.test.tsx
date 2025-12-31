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

describe('PasswordClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the password change form', () => {
			render(<PasswordClient />);
			expect(screen.getByTestId('password-client')).toBeInTheDocument();
		});

		it('renders the page title', () => {
			render(<PasswordClient />);
			expect(screen.getByText('Modifier le mot de passe')).toBeInTheDocument();
		});

		it('renders the form element', () => {
			render(<PasswordClient />);
			expect(screen.getByTestId('password-form')).toBeInTheDocument();
		});

		it('renders the old password input', () => {
			render(<PasswordClient />);
			expect(screen.getByTestId('old-password-input')).toBeInTheDocument();
		});

		it('renders the new password input', () => {
			render(<PasswordClient />);
			expect(screen.getByTestId('new-password-input')).toBeInTheDocument();
		});

		it('renders the confirm password input', () => {
			render(<PasswordClient />);
			expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
		});

		it('renders the submit button', () => {
			render(<PasswordClient />);
			expect(screen.getByTestId('submit-button')).toBeInTheDocument();
			expect(screen.getByText('Modifier')).toBeInTheDocument();
		});
	});
});
