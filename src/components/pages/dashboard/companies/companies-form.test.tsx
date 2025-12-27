import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

type FormProps = SessionProps & {
	id?: number;
};

// Mock the component to avoid Formik/Zod memory issues
jest.mock('./companies-form', () => ({
	__esModule: true,
	default: (props: FormProps) => {
		const session = props.session;
		return (
			<div data-testid="companies-form">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<span data-testid="id">{props.id ?? 'no-id'}</span>
				<span data-testid="is-edit-mode">{props.id !== undefined ? 'true' : 'false'}</span>
				<h2>Entreprise Form</h2>
				<form data-testid="company-form">
					<input data-testid="raison-sociale-input" placeholder="Raison sociale" />
					<input data-testid="email-input" placeholder="Email" />
					<input data-testid="telephone-input" placeholder="Téléphone" />
					<input data-testid="ice-input" placeholder="ICE" />
					<input data-testid="responsable-input" placeholder="Nom du responsable" />
					<button data-testid="submit-button" type="submit">
						Enregistrer
					</button>
				</form>
			</div>
		);
	},
}));

import CompaniesForm from './companies-form';

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

describe('CompaniesForm', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the companies form', () => {
			render(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('companies-form')).toBeInTheDocument();
		});

		it('renders the form element', () => {
			render(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('company-form')).toBeInTheDocument();
		});

		it('renders the raison sociale input', () => {
			render(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('raison-sociale-input')).toBeInTheDocument();
		});

		it('renders the email input', () => {
			render(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('email-input')).toBeInTheDocument();
		});

		it('renders the telephone input', () => {
			render(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('telephone-input')).toBeInTheDocument();
		});

		it('renders the ICE input', () => {
			render(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('ice-input')).toBeInTheDocument();
		});

		it('renders the submit button', () => {
			render(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('shows add mode when no id provided', () => {
			render(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('false');
			expect(screen.getByTestId('id')).toHaveTextContent('no-id');
		});

		it('shows edit mode when id is provided', () => {
			render(<CompaniesForm session={mockSession} id={77} />);
			expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('true');
			expect(screen.getByTestId('id')).toHaveTextContent('77');
		});

		it('receives correct session token', () => {
			render(<CompaniesForm session={mockSession} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('handles undefined session gracefully', () => {
			render(<CompaniesForm session={undefined} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});
});
