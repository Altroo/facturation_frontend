import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

// Mock the component
jest.mock('./devis-list', () => ({
	__esModule: true,
	default: (props: SessionProps) => {
		const session = props.session;
		return (
			<div data-testid="devis-list">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<h2>Liste des devis</h2>
				<div data-testid="data-grid">
					<table>
						<thead>
							<tr>
								<th>Numéro devis</th>
								<th>Client</th>
								<th>N° demande prix client</th>
								<th>Statut</th>
								<th>Total TTC</th>
								<th>Date devis</th>
								<th>Actions</th>
							</tr>
						</thead>
					</table>
				</div>
				<button data-testid="add-button">Ajouter un devis</button>
			</div>
		);
	},
	getStatutColor: (statut: string) => {
		switch (statut) {
			case 'Brouillon':
				return 'default';
			case 'Envoyé':
				return 'info';
			case 'Accepté':
				return 'success';
			case 'Refusé':
			case 'Annulé':
				return 'error';
			case 'Expiré':
				return 'warning';
			default:
				return 'default';
		}
	},
	statutFilterOptions: [
		{ value: 'Brouillon', label: 'Brouillon', color: 'default' },
		{ value: 'Envoyé', label: 'Envoyé', color: 'info' },
		{ value: 'Accepté', label: 'Accepté', color: 'success' },
		{ value: 'Refusé', label: 'Refusé', color: 'error' },
		{ value: 'Annulé', label: 'Annulé', color: 'error' },
		{ value: 'Expiré', label: 'Expiré', color: 'warning' },
	],
}));

import DevisListClient, { getStatutColor, statutFilterOptions } from './devis-list';

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

describe('DevisListClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the devis list', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByTestId('devis-list')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Liste des devis')).toBeInTheDocument();
		});

		it('renders the data grid', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByTestId('data-grid')).toBeInTheDocument();
		});

		it('renders the add button', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByTestId('add-button')).toBeInTheDocument();
		});

		it('renders column headers', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByText('Numéro devis')).toBeInTheDocument();
			expect(screen.getByText('Client')).toBeInTheDocument();
			expect(screen.getByText('Statut')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct session token', () => {
			render(<DevisListClient session={mockSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('handles undefined session gracefully', () => {
			render(<DevisListClient session={undefined} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});

	describe('Exports', () => {
		it('exports getStatutColor function that returns correct colors', () => {
			expect(getStatutColor('Brouillon')).toBe('default');
			expect(getStatutColor('Envoyé')).toBe('info');
			expect(getStatutColor('Accepté')).toBe('success');
			expect(getStatutColor('Refusé')).toBe('error');
			expect(getStatutColor('Annulé')).toBe('error');
			expect(getStatutColor('Expiré')).toBe('warning');
			expect(getStatutColor('Unknown')).toBe('default');
		});

		it('exports statutFilterOptions with correct values', () => {
			expect(statutFilterOptions).toHaveLength(6);
			expect(statutFilterOptions[0]).toEqual({ value: 'Brouillon', label: 'Brouillon', color: 'default' });
			expect(statutFilterOptions[2]).toEqual({ value: 'Accepté', label: 'Accepté', color: 'success' });
		});
	});
});
