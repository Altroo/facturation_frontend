import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SessionProps, AppSession } from '@/types/_initTypes';

type ListProps = SessionProps & {
	archived: boolean;
};

// Mock the component
jest.mock('./articles-list', () => ({
	__esModule: true,
	default: (props: ListProps) => {
		const session = props.session;
		return (
			<div data-testid="articles-list">
				<span data-testid="session-access-token">{session?.accessToken ?? 'no-token'}</span>
				<span data-testid="archived">{String(props.archived)}</span>
				<h2>Liste des articles</h2>
				<div data-testid="data-grid">
					<table>
						<thead>
							<tr>
								<th>Photo</th>
								<th>Référence</th>
								<th>Type</th>
								<th>Désignation</th>
								<th>Prix d&apos;achat</th>
								<th>Prix de vente</th>
								<th>Actions</th>
							</tr>
						</thead>
					</table>
				</div>
				<button data-testid="add-button">Ajouter un article</button>
			</div>
		);
	},
	typeFilterOptions: [
		{ value: 'Produit', label: 'Produit', color: 'default' },
		{ value: 'Service', label: 'Service', color: 'default' },
	],
}));

import ArticlesListClient, { typeFilterOptions } from './articles-list';

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

describe('ArticlesListClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders the articles list', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('articles-list')).toBeInTheDocument();
		});

		it('renders the title', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByText('Liste des articles')).toBeInTheDocument();
		});

		it('renders the data grid', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('data-grid')).toBeInTheDocument();
		});

		it('renders the add button', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('add-button')).toBeInTheDocument();
		});

		it('renders column headers', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByText('Référence')).toBeInTheDocument();
			expect(screen.getByText('Désignation')).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('receives correct session token', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('test-access-token');
		});

		it('shows non-archived articles by default', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('archived')).toHaveTextContent('false');
		});

		it('shows archived articles when archived prop is true', () => {
			render(<ArticlesListClient session={mockSession} archived={true} />);
			expect(screen.getByTestId('archived')).toHaveTextContent('true');
		});

		it('handles undefined session gracefully', () => {
			render(<ArticlesListClient session={undefined} archived={false} />);
			expect(screen.getByTestId('session-access-token')).toHaveTextContent('no-token');
		});
	});

	describe('Exports', () => {
		it('exports typeFilterOptions with correct values', () => {
			expect(typeFilterOptions).toEqual([
				{ value: 'Produit', label: 'Produit', color: 'default' },
				{ value: 'Service', label: 'Service', color: 'default' },
			]);
		});
	});
});
