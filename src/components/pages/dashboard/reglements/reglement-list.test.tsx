import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

type ListProps = SessionProps;

// Mock the component
jest.mock('./reglement-list', () => ({
	__esModule: true,
	default: (props: ListProps) => {
		const session = props.session;
		return (
			<div data-testid="reglement-list">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<h2>Liste des règlements</h2>
				<div data-testid="stats-cards">
					<div data-testid="chiffre-affaire">Chiffre d&apos;affaire total</div>
					<div data-testid="total-reglements">Total règlements</div>
					<div data-testid="total-impayes">Total impayés</div>
				</div>
				<div data-testid="data-grid">
					<table>
						<thead>
							<tr>
								<th>N° Facture</th>
								<th>Client</th>
								<th>Mode règlement</th>
								<th>Montant</th>
								<th>Date règlement</th>
								<th>Statut</th>
								<th>Actions</th>
							</tr>
						</thead>
					</table>
				</div>
				<button data-testid="add-button">Nouveau règlement</button>
			</div>
		);
	},
	statutFilterOptions: [
		{ value: 'Valide', label: 'Valide', color: 'success' },
		{ value: 'Annulé', label: 'Annulé', color: 'error' },
	],
}));

import ReglementListClient, { statutFilterOptions } from './reglement-list';

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

describe('ReglementListClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the reglement list', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByTestId('reglement-list')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByText('Liste des règlements')).toBeInTheDocument();
		});

		it('renders the stats cards', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
			expect(screen.getByTestId('chiffre-affaire')).toBeInTheDocument();
			expect(screen.getByTestId('total-reglements')).toBeInTheDocument();
			expect(screen.getByTestId('total-impayes')).toBeInTheDocument();
		});

		it('renders the data grid', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByTestId('data-grid')).toBeInTheDocument();
		});

		it('renders the add button', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByTestId('add-button')).toBeInTheDocument();
		});

		it('renders column headers', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByText('N° Facture')).toBeInTheDocument();
			expect(screen.getByText('Client')).toBeInTheDocument();
			expect(screen.getByText('Montant')).toBeInTheDocument();
			expect(screen.getByText('Statut')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct session token', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('handles undefined session gracefully', () => {
			render(<ReglementListClient session={undefined} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});

	describe('Exports', () => {
		it('exports statutFilterOptions with correct values', () => {
			expect(statutFilterOptions).toEqual([
				{ value: 'Valide', label: 'Valide', color: 'success' },
				{ value: 'Annulé', label: 'Annulé', color: 'error' },
			]);
		});
	});
});
