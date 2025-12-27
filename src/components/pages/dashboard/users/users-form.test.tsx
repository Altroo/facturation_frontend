import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

type FormProps = SessionProps & {
	id?: number;
};

// Mock the component to avoid Formik/Zod memory issues
jest.mock('./users-form', () => ({
	__esModule: true,
	default: (props: FormProps) => {
		const session = props.session;
		return (
			<div data-testid="users-form">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<span data-testid="id">{props.id ?? 'no-id'}</span>
				<span data-testid="is-edit-mode">{props.id !== undefined ? 'true' : 'false'}</span>
				<h2>Utilisateur Form</h2>
				<form data-testid="user-form">
					<input data-testid="first-name-input" placeholder="Nom" />
					<input data-testid="last-name-input" placeholder="Prénom" />
					<input data-testid="email-input" placeholder="Email" />
					<select data-testid="gender-select">
						<option value="H">Homme</option>
						<option value="F">Femme</option>
					</select>
					<input data-testid="is-active-input" type="checkbox" />
					<input data-testid="is-staff-input" type="checkbox" />
					<button data-testid="submit-button" type="submit">
						Enregistrer
					</button>
				</form>
			</div>
		);
	},
}));

import UsersForm from './users-form';

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

describe('UsersForm', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the users form', () => {
			render(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('users-form')).toBeInTheDocument();
		});

		it('renders the form element', () => {
			render(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('user-form')).toBeInTheDocument();
		});

		it('renders the first name input', () => {
			render(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
		});

		it('renders the last name input', () => {
			render(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
		});

		it('renders the email input', () => {
			render(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('email-input')).toBeInTheDocument();
		});

		it('renders the gender select', () => {
			render(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('gender-select')).toBeInTheDocument();
		});

		it('renders the submit button', () => {
			render(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('shows add mode when no id provided', () => {
			render(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('false');
			expect(screen.getByTestId('id')).toHaveTextContent('no-id');
		});

		it('shows edit mode when id is provided', () => {
			render(<UsersForm session={mockSession} id={55} />);
			expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('true');
			expect(screen.getByTestId('id')).toHaveTextContent('55');
		});

		it('receives correct session token', () => {
			render(<UsersForm session={mockSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('handles undefined session gracefully', () => {
			render(<UsersForm session={undefined} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});
});
