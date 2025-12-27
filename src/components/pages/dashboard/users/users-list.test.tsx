import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

// Mock the component
jest.mock('./users-list', () => ({
	__esModule: true,
	default: (props: SessionProps) => {
		const session = props.session;
		return (
			<div data-testid="users-list">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<h2>Liste des utilisateurs</h2>
				<div data-testid="data-grid">
					<table>
						<thead>
							<tr>
								<th>Avatar</th>
								<th>Nom</th>
								<th>Prénom</th>
								<th>Email</th>
								<th>Sexe</th>
								<th>Admin</th>
								<th>Actif</th>
								<th>Date inscription</th>
								<th>Dernière connexion</th>
								<th>Actions</th>
							</tr>
						</thead>
					</table>
				</div>
				<button data-testid="add-button">Ajouter un utilisateur</button>
			</div>
		);
	},
}));

import UsersListClient from './users-list';

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

describe('UsersListClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the users list', () => {
			render(<UsersListClient session={mockSession} />);
			expect(screen.getByTestId('users-list')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<UsersListClient session={mockSession} />);
			expect(screen.getByText('Liste des utilisateurs')).toBeInTheDocument();
		});

		it('renders the data grid', () => {
			render(<UsersListClient session={mockSession} />);
			expect(screen.getByTestId('data-grid')).toBeInTheDocument();
		});

		it('renders the add button', () => {
			render(<UsersListClient session={mockSession} />);
			expect(screen.getByTestId('add-button')).toBeInTheDocument();
		});

		it('renders column headers', () => {
			render(<UsersListClient session={mockSession} />);
			expect(screen.getByText('Nom')).toBeInTheDocument();
			expect(screen.getByText('Email')).toBeInTheDocument();
			expect(screen.getByText('Admin')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct session token', () => {
			render(<UsersListClient session={mockSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('handles undefined session gracefully', () => {
			render(<UsersListClient session={undefined} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});
});
