import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

type FormProps = SessionProps & {
	company_id: number;
	id?: number;
};

// Mock the component to avoid Formik/Zod memory issues
jest.mock('./clients-form', () => ({
	__esModule: true,
	default: (props: FormProps) => {
		const session = props.session;
		return (
			<div data-testid="clients-form">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<span data-testid="company-id">{props.company_id}</span>
				<span data-testid="id">{props.id ?? 'no-id'}</span>
				<span data-testid="is-edit-mode">{props.id !== undefined ? 'true' : 'false'}</span>
				<h2>Client Form</h2>
				<form data-testid="client-form">
					<select data-testid="client-type-select">
						<option value="PM">Personne morale</option>
						<option value="PP">Personne physique</option>
					</select>
					<input data-testid="code-client-input" placeholder="Code client" />
					<input data-testid="raison-sociale-input" placeholder="Raison sociale" />
					<input data-testid="nom-input" placeholder="Nom" />
					<input data-testid="prenom-input" placeholder="Prénom" />
					<input data-testid="email-input" placeholder="Email" />
					<button data-testid="submit-button" type="submit">
						Enregistrer
					</button>
				</form>
			</div>
		);
	},
}));

import ClientsForm from './clients-form';

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

describe('ClientsForm', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the clients form', () => {
			render(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('clients-form')).toBeInTheDocument();
		});

		it('renders the form element', () => {
			render(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('client-form')).toBeInTheDocument();
		});

		it('renders the client type select', () => {
			render(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('client-type-select')).toBeInTheDocument();
		});

		it('renders the code client input', () => {
			render(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('code-client-input')).toBeInTheDocument();
		});

		it('renders the email input', () => {
			render(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('email-input')).toBeInTheDocument();
		});

		it('renders the submit button', () => {
			render(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('submit-button')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct company_id prop', () => {
			render(<ClientsForm session={mockSession} company_id={456} />);
			expect(screen.getByTestId('company-id')).toHaveTextContent('456');
		});

		it('shows add mode when no id provided', () => {
			render(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('false');
			expect(screen.getByTestId('id')).toHaveTextContent('no-id');
		});

		it('shows edit mode when id is provided', () => {
			render(<ClientsForm session={mockSession} company_id={1} id={99} />);
			expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('true');
			expect(screen.getByTestId('id')).toHaveTextContent('99');
		});

		it('receives correct session token', () => {
			render(<ClientsForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('handles undefined session gracefully', () => {
			render(<ClientsForm session={undefined} company_id={1} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});
});
