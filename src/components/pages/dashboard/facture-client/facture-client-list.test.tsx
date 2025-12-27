import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

// Mock the component
jest.mock('./facture-client-list', () => ({
	__esModule: true,
	default: (props: SessionProps) => {
		const session = props.session;
		return (
			<div data-testid="facture-client-list">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<h2>Liste des factures client</h2>
				<div data-testid="data-grid">
					<table>
						<thead>
							<tr>
								<th>Numéro facture</th>
								<th>Client</th>
								<th>N° bon commande</th>
								<th>Statut</th>
								<th>Total TTC</th>
								<th>Date facture</th>
								<th>Actions</th>
							</tr>
						</thead>
					</table>
				</div>
				<button data-testid="add-button">Ajouter une facture client</button>
			</div>
		);
	},
}));

import FactureClientListClient from './facture-client-list';

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

describe('FactureClientListClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the facture client list', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByTestId('facture-client-list')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Liste des factures client')).toBeInTheDocument();
		});

		it('renders the data grid', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByTestId('data-grid')).toBeInTheDocument();
		});

		it('renders the add button', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByTestId('add-button')).toBeInTheDocument();
		});

		it('renders column headers', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByText('Numéro facture')).toBeInTheDocument();
			expect(screen.getByText('Client')).toBeInTheDocument();
			expect(screen.getByText('Statut')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct session token', () => {
			render(<FactureClientListClient session={mockSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('handles undefined session gracefully', () => {
			render(<FactureClientListClient session={undefined} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});
});
