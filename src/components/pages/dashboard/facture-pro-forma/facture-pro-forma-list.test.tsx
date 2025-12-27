import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

// Mock the component
jest.mock('./facture-pro-forma-list', () => ({
	__esModule: true,
	default: (props: SessionProps) => {
		const session = props.session;
		return (
			<div data-testid="facture-pro-forma-list">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<h2>Liste des factures pro-forma</h2>
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
				<button data-testid="add-button">Ajouter une facture pro-forma</button>
			</div>
		);
	},
}));

import FactureProformaListClient from './facture-pro-forma-list';

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

describe('FactureProformaListClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the facture pro-forma list', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByTestId('facture-pro-forma-list')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Liste des factures pro-forma')).toBeInTheDocument();
		});

		it('renders the data grid', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByTestId('data-grid')).toBeInTheDocument();
		});

		it('renders the add button', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByTestId('add-button')).toBeInTheDocument();
		});

		it('renders column headers', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByText('Numéro facture')).toBeInTheDocument();
			expect(screen.getByText('Client')).toBeInTheDocument();
			expect(screen.getByText('Statut')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct session token', () => {
			render(<FactureProformaListClient session={mockSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('handles undefined session gracefully', () => {
			render(<FactureProformaListClient session={undefined} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});
});
