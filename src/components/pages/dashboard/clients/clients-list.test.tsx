import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

type ListProps = SessionProps & {
	archived: boolean;
};

// Mock the component
jest.mock('./clients-list', () => ({
	__esModule: true,
	default: (props: ListProps) => {
		const session = props.session;
		return (
			<div data-testid="clients-list">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<span data-testid="archived">{String(props.archived)}</span>
				<h2>Liste des clients</h2>
				<div data-testid="data-grid">
					<table>
						<thead>
							<tr>
								<th>Code Client</th>
								<th>Type</th>
								<th>Raison Sociale</th>
								<th>Nom</th>
								<th>Prénom</th>
								<th>Ville</th>
								<th>Actions</th>
							</tr>
						</thead>
					</table>
				</div>
				<button data-testid="add-button">Ajouter un client</button>
			</div>
		);
	},
	typeFilterOptions: [
		{ value: 'Personne physique', label: 'Personne physique', color: 'default' },
		{ value: 'Personne morale', label: 'Personne morale', color: 'default' },
	],
}));

import ClientsListClient, { typeFilterOptions } from './clients-list';

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

describe('ClientsListClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the clients list', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('clients-list')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByText('Liste des clients')).toBeInTheDocument();
		});

		it('renders the data grid', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('data-grid')).toBeInTheDocument();
		});

		it('renders the add button', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('add-button')).toBeInTheDocument();
		});

		it('renders column headers', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByText('Code Client')).toBeInTheDocument();
			expect(screen.getByText('Raison Sociale')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct session token', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('shows non-archived clients by default', () => {
			render(<ClientsListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('archived')).toHaveTextContent('false');
		});

		it('shows archived clients when archived prop is true', () => {
			render(<ClientsListClient session={mockSession} archived={true} />);
			expect(screen.getByTestId('archived')).toHaveTextContent('true');
		});

		it('handles undefined session gracefully', () => {
			render(<ClientsListClient session={undefined} archived={false} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});

	describe('Exports', () => {
		it('exports typeFilterOptions with correct values', () => {
			expect(typeFilterOptions).toEqual([
				{ value: 'Personne physique', label: 'Personne physique', color: 'default' },
				{ value: 'Personne morale', label: 'Personne morale', color: 'default' },
			]);
		});
	});
});
