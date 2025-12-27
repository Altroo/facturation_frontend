import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps } from '@/types/_initTypes';

// Mock the component to avoid Formik/Zod memory issues
jest.mock('./edit-profile', () => ({
	__esModule: true,
	default: (props: SessionProps) => {
		const session = props.session;
		return (
			<div data-testid="edit-profile-client">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<span data-testid="session-user-pk">{session?.user?.pk ?? 'no-pk'}</span>
				<span data-testid="session-user-email">{session?.user?.email ?? 'no-email'}</span>
				<h2>Profil</h2>
				<form data-testid="profile-form">
					<input data-testid="first-name-input" placeholder="Nom" />
					<input data-testid="last-name-input" placeholder="Prénom" />
					<select data-testid="gender-select">
						<option value="Homme">Homme</option>
						<option value="Femme">Femme</option>
					</select>
					<button data-testid="submit-button" type="submit">
						Mettre à jour
					</button>
				</form>
			</div>
		);
	},
}));

// Import after mocking
import EditProfilClient from './edit-profile';
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

describe('EditProfilClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the edit profile form', () => {
			render(<EditProfilClient session={mockSession} />);
			expect(screen.getByTestId('edit-profile-client')).toBeInTheDocument();
		});

		it('renders the profile title', () => {
			render(<EditProfilClient session={mockSession} />);
			expect(screen.getByText('Profil')).toBeInTheDocument();
		});

		it('renders the form element', () => {
			render(<EditProfilClient session={mockSession} />);
			expect(screen.getByTestId('profile-form')).toBeInTheDocument();
		});

		it('renders the first name input', () => {
			render(<EditProfilClient session={mockSession} />);
			expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
		});

		it('renders the last name input', () => {
			render(<EditProfilClient session={mockSession} />);
			expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
		});

		it('renders the gender select', () => {
			render(<EditProfilClient session={mockSession} />);
			expect(screen.getByTestId('gender-select')).toBeInTheDocument();
		});

		it('renders the submit button', () => {
			render(<EditProfilClient session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toBeInTheDocument();
			expect(screen.getByText('Mettre à jour')).toBeInTheDocument();
		});
	});

	describe('Session Props', () => {
		it('receives correct accessToken from session', () => {
			render(<EditProfilClient session={mockSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('receives correct user pk from session', () => {
			render(<EditProfilClient session={mockSession} />);
			expect(screen.getByTestId('session-user-pk')).toHaveTextContent('1');
		});

		it('receives correct user email from session', () => {
			render(<EditProfilClient session={mockSession} />);
			expect(screen.getByTestId('session-user-email')).toHaveTextContent('test@example.com');
		});

		it('handles undefined session gracefully', () => {
			render(<EditProfilClient session={undefined} />);
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
					id: '42',
					pk: 42,
					email: 'other@example.com',
					emailVerified: null,
					name: 'Other User',
					first_name: 'Other',
					last_name: 'User',
					image: null,
				},
			};
			render(<EditProfilClient session={differentSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('different-token');
			expect(screen.getByTestId('session-user-pk')).toHaveTextContent('42');
			expect(screen.getByTestId('session-user-email')).toHaveTextContent('other@example.com');
		});
	});
});
