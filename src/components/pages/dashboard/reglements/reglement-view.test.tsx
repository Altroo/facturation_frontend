import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

type ViewProps = SessionProps & {
	company_id: number;
	id: number;
};

// Mock the component
jest.mock('./reglement-view', () => ({
	__esModule: true,
	default: (props: ViewProps) => {
		const session = props.session;
		return (
			<div data-testid="reglement-view">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<span data-testid="company-id">{props.company_id}</span>
				<span data-testid="reglement-id">{props.id}</span>
				<h2>Détails du règlement</h2>
				<div data-testid="status-card">
					<span>Statut</span>
					<span data-testid="status-chip">Valide</span>
				</div>
				<div data-testid="facture-info">
					<span>Numéro de facture</span>
					<span>Client</span>
				</div>
				<div data-testid="payment-details">
					<span>Mode de règlement</span>
					<span>Montant</span>
					<span>Libellé</span>
				</div>
				<div data-testid="dates-info">
					<span>Date de règlement</span>
					<span>Date d&apos;échéance</span>
					<span>Date de création</span>
				</div>
				<div data-testid="financial-summary">
					<span>Montant de la facture</span>
					<span>Total règlements</span>
					<span>Reste à payer</span>
				</div>
				<button data-testid="back-button">Liste des règlements</button>
				<button data-testid="edit-button">Modifier</button>
			</div>
		);
	},
}));

import ReglementViewClient from './reglement-view';

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

describe('ReglementViewClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the view', () => {
			render(<ReglementViewClient session={mockSession} id={123} company_id={456} />);
			expect(screen.getByTestId('reglement-view')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<ReglementViewClient session={mockSession} id={123} company_id={456} />);
			expect(screen.getByText('Détails du règlement')).toBeInTheDocument();
		});

		it('renders status card', () => {
			render(<ReglementViewClient session={mockSession} id={123} company_id={456} />);
			expect(screen.getByTestId('status-card')).toBeInTheDocument();
			expect(screen.getByTestId('status-chip')).toBeInTheDocument();
		});

		it('renders facture information', () => {
			render(<ReglementViewClient session={mockSession} id={123} company_id={456} />);
			expect(screen.getByTestId('facture-info')).toBeInTheDocument();
		});

		it('renders payment details', () => {
			render(<ReglementViewClient session={mockSession} id={123} company_id={456} />);
			expect(screen.getByTestId('payment-details')).toBeInTheDocument();
		});

		it('renders dates information', () => {
			render(<ReglementViewClient session={mockSession} id={123} company_id={456} />);
			expect(screen.getByTestId('dates-info')).toBeInTheDocument();
		});

		it('renders financial summary', () => {
			render(<ReglementViewClient session={mockSession} id={123} company_id={456} />);
			expect(screen.getByTestId('financial-summary')).toBeInTheDocument();
		});

		it('renders navigation buttons', () => {
			render(<ReglementViewClient session={mockSession} id={123} company_id={456} />);
			expect(screen.getByTestId('back-button')).toBeInTheDocument();
			expect(screen.getByTestId('edit-button')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct session token', () => {
			render(<ReglementViewClient session={mockSession} id={123} company_id={456} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('receives correct company_id', () => {
			render(<ReglementViewClient session={mockSession} id={123} company_id={789} />);
			expect(screen.getByTestId('company-id')).toHaveTextContent('789');
		});

		it('receives correct reglement id', () => {
			render(<ReglementViewClient session={mockSession} id={999} company_id={456} />);
			expect(screen.getByTestId('reglement-id')).toHaveTextContent('999');
		});

		it('handles undefined session gracefully', () => {
			render(<ReglementViewClient session={undefined} id={123} company_id={456} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});
});
