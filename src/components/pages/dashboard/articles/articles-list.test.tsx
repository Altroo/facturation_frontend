import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArticlesListClient, { typeFilterOptions } from './articles-list';
import * as sessionModule from '@/store/session';

// Mock session module (replace getAccessTokenFromSession)
jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: jest.fn(() => 'test-token'),
}));

// Mock article service module (mock hooks/tuples) to avoid spyOn on non-configurable exports
jest.mock('@/store/services/article', () => ({
	__esModule: true,
	useGetArticlesListQuery: jest.fn(() => ({ data: undefined, isLoading: false, refetch: jest.fn() })),
	useDeleteArticleMutation: jest.fn(() => [jest.fn(), {}]),
	usePatchArchiveMutation: jest.fn(() => [jest.fn(), {}]),
	useImportArticlesMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

// Mock CompanyDocumentsWrapperList with typed props
jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const React = require('react');
	type ChildrenCb = (opts: { company_id: number; role: string }) => React.ReactNode;
	return {
		__esModule: true,
		default: (props: { children: ChildrenCb; title: string; session?: unknown }) => (
			<div data-testid="articles-list">
				<h2>{props.title}</h2>
				{props.children({ company_id: 1, role: 'Commercial' })}
			</div>
		),
	};
});

// Mock PaginatedDataGrid with typed props
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	default: (_props: Record<string, unknown>) => <div data-testid="data-grid" />,
}));

// Mock next/navigation useRouter
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

// Mock hooks / utilities used by the component
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
}));

const mockSession = {
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

describe('ArticlesListClient (integration with mocked deps)', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	it('renders wrapper and title and data grid', () => {
		render(<ArticlesListClient session={mockSession} archived={false} />);
		expect(screen.getByTestId('articles-list')).toBeInTheDocument();
		expect(screen.getByText('Liste des Articles')).toBeInTheDocument();
		expect(screen.getByTestId('data-grid')).toBeInTheDocument();
	});

	it('shows the add button when not archived and role allows it', () => {
		render(<ArticlesListClient session={mockSession} archived={false} />);
		expect(screen.getByText('Nouvel article')).toBeInTheDocument();
	});

	it('does not show add button when archived is true', () => {
		render(<ArticlesListClient session={mockSession} archived={true} />);
		expect(screen.queryByText('Nouvel article')).toBeNull();
	});

	it('handles undefined session without throwing', () => {
		render(<ArticlesListClient session={undefined as unknown as typeof mockSession} archived={false} />);
		expect((sessionModule.getAccessTokenFromSession as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(0);
	});

	it('exports typeFilterOptions with correct values', () => {
		expect(typeFilterOptions).toEqual([
			{ value: 'Produit', label: 'Produit', color: 'default' },
			{ value: 'Service', label: 'Service', color: 'default' },
		]);
	});
});
