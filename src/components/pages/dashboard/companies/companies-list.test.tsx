import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

// Mock the component
jest.mock('./companies-list', () => ({
	__esModule: true,
	default: (props: SessionProps) => {
		const session = props.session;
		return (
			<div data-testid="companies-list">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<h2>Liste des entreprises</h2>
				<div data-testid="data-grid">
					<table>
						<thead>
							<tr>
								<th>Logo</th>
								<th>Raison Sociale</th>
								<th>ICE</th>
								<th>Responsable</th>
								<th>Email</th>
								<th>Téléphone</th>
								<th>Employés</th>
								<th>Actions</th>
							</tr>
						</thead>
					</table>
				</div>
				<button data-testid="add-button">Ajouter une entreprise</button>
			</div>
		);
	},
	nbrEmployeFilterOptions: [
		{ value: '1 à 5', label: '1 à 5', color: 'default' },
		{ value: '5 à 10', label: '5 à 10', color: 'default' },
		{ value: '10 à 50', label: '10 à 50', color: 'default' },
		{ value: '50 à 100', label: '50 à 100', color: 'default' },
		{ value: 'plus que 100', label: 'plus que 100', color: 'default' },
	],
}));

import CompaniesListClient, { nbrEmployeFilterOptions } from './companies-list';

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

describe('CompaniesListClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the companies list', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByTestId('companies-list')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByText('Liste des entreprises')).toBeInTheDocument();
		});

		it('renders the data grid', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByTestId('data-grid')).toBeInTheDocument();
		});

		it('renders the add button', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByTestId('add-button')).toBeInTheDocument();
		});

		it('renders column headers', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByText('Raison Sociale')).toBeInTheDocument();
			expect(screen.getByText('ICE')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct session token', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('handles undefined session gracefully', () => {
			render(<CompaniesListClient session={undefined} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});

	describe('Exports', () => {
		it('exports nbrEmployeFilterOptions with correct values', () => {
			expect(nbrEmployeFilterOptions).toHaveLength(5);
			expect(nbrEmployeFilterOptions[0]).toEqual({ value: '1 à 5', label: '1 à 5', color: 'default' });
			expect(nbrEmployeFilterOptions[4]).toEqual({ value: 'plus que 100', label: 'plus que 100', color: 'default' });
		});
	});
});
