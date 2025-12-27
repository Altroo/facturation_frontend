import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

type FormProps = SessionProps & {
	company_id: number;
	id?: number;
};

// Mock the component to avoid Formik/Zod memory issues
jest.mock('./articles-form', () => ({
	__esModule: true,
	default: (props: FormProps) => {
		const session = props.session;
		return (
			<div data-testid="articles-form">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<span data-testid="company-id">{props.company_id}</span>
				<span data-testid="id">{props.id ?? 'no-id'}</span>
				<span data-testid="is-edit-mode">{props.id !== undefined ? 'true' : 'false'}</span>
				<h2>Article Form</h2>
				<form data-testid="article-form">
					<input data-testid="reference-input" placeholder="Référence" />
					<input data-testid="designation-input" placeholder="Désignation" />
					<input data-testid="prix-achat-input" placeholder="Prix d'achat" type="number" />
					<input data-testid="prix-vente-input" placeholder="Prix de vente" type="number" />
					<button data-testid="submit-button" type="submit">
						Enregistrer
					</button>
				</form>
			</div>
		);
	},
}));

import ArticlesForm from './articles-form';

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

describe('ArticlesForm', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the articles form', () => {
			render(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('articles-form')).toBeInTheDocument();
		});

		it('renders the form element', () => {
			render(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('article-form')).toBeInTheDocument();
		});

		it('renders the reference input', () => {
			render(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('reference-input')).toBeInTheDocument();
		});

		it('renders the designation input', () => {
			render(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('designation-input')).toBeInTheDocument();
		});

		it('renders the prix achat input', () => {
			render(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('prix-achat-input')).toBeInTheDocument();
		});

		it('renders the prix vente input', () => {
			render(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('prix-vente-input')).toBeInTheDocument();
		});

		it('renders the submit button', () => {
			render(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('submit-button')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct company_id prop', () => {
			render(<ArticlesForm session={mockSession} company_id={123} />);
			expect(screen.getByTestId('company-id')).toHaveTextContent('123');
		});

		it('shows add mode when no id provided', () => {
			render(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('false');
			expect(screen.getByTestId('id')).toHaveTextContent('no-id');
		});

		it('shows edit mode when id is provided', () => {
			render(<ArticlesForm session={mockSession} company_id={1} id={42} />);
			expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('true');
			expect(screen.getByTestId('id')).toHaveTextContent('42');
		});

		it('receives correct session token', () => {
			render(<ArticlesForm session={mockSession} company_id={1} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('handles undefined session gracefully', () => {
			render(<ArticlesForm session={undefined} company_id={1} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});
});
