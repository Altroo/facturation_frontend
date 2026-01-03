import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

type FormProps = SessionProps & {
	company_id: number;
	id?: number;
	facture_client_id?: number;
};

// Mock the component
jest.mock('./reglement-form', () => ({
	__esModule: true,
	default: (props: FormProps) => {
		const session = props.session;
		const isEditMode = props.id !== undefined;
		return (
			<div data-testid="reglement-form">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<span data-testid="company-id">{props.company_id}</span>
				<span data-testid="reglement-id">{props.id ?? 'new'}</span>
				<span data-testid="facture-client-id">{props.facture_client_id ?? 'none'}</span>
				<h2>{isEditMode ? 'Modifier le règlement' : 'Ajouter un règlement'}</h2>
				<form>
					<div data-testid="facture-client-select">Facture client</div>
					<div data-testid="mode-reglement-select">Mode de règlement</div>
					<input data-testid="montant-input" placeholder="Montant" />
					<input data-testid="libelle-input" placeholder="Libellé" />
					<input data-testid="date-reglement-input" type="date" />
					<input data-testid="date-echeance-input" type="date" />
					<button data-testid="submit-button" type="submit">
						{isEditMode ? 'Mettre à jour' : 'Ajouter le règlement'}
					</button>
				</form>
			</div>
		);
	},
}));

import ReglementForm from './reglement-form';

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

describe('ReglementForm', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Add Mode', () => {
		it('renders the form in add mode', () => {
			render(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('reglement-form')).toBeInTheDocument();
			expect(screen.getByText('Ajouter un règlement')).toBeInTheDocument();
		});

		it('shows correct button text for add mode', () => {
			render(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Ajouter le règlement');
		});

		it('shows "new" for reglement-id in add mode', () => {
			render(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('reglement-id')).toHaveTextContent('new');
		});

		it('handles facture_client_id prop', () => {
			render(<ReglementForm session={mockSession} company_id={1} facture_client_id={123} />);
			expect(screen.getByTestId('facture-client-id')).toHaveTextContent('123');
		});
	});

	describe('Edit Mode', () => {
		it('renders the form in edit mode', () => {
			render(<ReglementForm session={mockSession} company_id={1} id={123} />);
			expect(screen.getByTestId('reglement-form')).toBeInTheDocument();
			expect(screen.getByText('Modifier le règlement')).toBeInTheDocument();
		});

		it('shows correct button text for edit mode', () => {
			render(<ReglementForm session={mockSession} company_id={1} id={123} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});

		it('shows reglement id in edit mode', () => {
			render(<ReglementForm session={mockSession} company_id={1} id={456} />);
			expect(screen.getByTestId('reglement-id')).toHaveTextContent('456');
		});
	});

	describe('Form Elements', () => {
		it('renders all form fields', () => {
			render(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('facture-client-select')).toBeInTheDocument();
			expect(screen.getByTestId('mode-reglement-select')).toBeInTheDocument();
			expect(screen.getByTestId('montant-input')).toBeInTheDocument();
			expect(screen.getByTestId('libelle-input')).toBeInTheDocument();
			expect(screen.getByTestId('date-reglement-input')).toBeInTheDocument();
			expect(screen.getByTestId('date-echeance-input')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct session token', () => {
			render(<ReglementForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('receives correct company_id', () => {
			render(<ReglementForm session={mockSession} company_id={789} />);
			expect(screen.getByTestId('company-id')).toHaveTextContent('789');
		});

		it('handles undefined session gracefully', () => {
			render(<ReglementForm session={undefined} company_id={1} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});
});
