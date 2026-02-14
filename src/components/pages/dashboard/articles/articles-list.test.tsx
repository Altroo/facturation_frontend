import React from 'react';
import { render, screen, cleanup, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

// Mock session helper
jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: jest.fn((session: AppSession) => session?.accessToken || null),
}));

// Mock toast hook
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
	useAppSelector: jest.fn(() => []),
}));

// Mock RTK Query hooks
const mockRefetch = jest.fn();
const mockDeleteArticle = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockPatchArchive = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockImportArticles = jest.fn(() => ({ unwrap: () => Promise.resolve({ created: 2, errors: [] }) }));
const mockSendCSVExampleEmail = jest.fn(() => ({ unwrap: () => Promise.resolve() }));

const mockUseGetArticlesListQuery = jest.fn(() => ({
	data: {
		results: [
			{
				id: 1,
				reference: 'ART-001',
				type_article: 'Produit',
				designation: 'Widget A',
				prix_achat: 100.0,
				prix_vente: 150.0,
				date_created: '2025-01-10',
				photo: 'https://example.com/photo.jpg',
				devise_prix_achat: 'EUR',
				devise_prix_vente: 'USD',
			},
			{
				id: 2,
				reference: 'ART-002',
				type_article: 'Service',
				designation: 'Consulting B',
				prix_achat: 200.0,
				prix_vente: 300.0,
				date_created: null,
				photo: null,
				devise_prix_achat: 'MAD',
				devise_prix_vente: 'MAD',
			},
		],
		count: 2,
		next: null,
		previous: null,
	},
	isLoading: false,
	refetch: mockRefetch,
}));

// Mock parameter service
jest.mock('@/store/services/parameter', () => ({
	useGetCategorieListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useGetEmplacementListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useGetUniteListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useGetMarqueListQuery: jest.fn(() => ({ data: [], isLoading: false })),
}));

jest.mock('@/store/services/article', () => ({
	useGetArticlesListQuery: () => mockUseGetArticlesListQuery(),
	useDeleteArticleMutation: jest.fn(() => [mockDeleteArticle, { isLoading: false }]),
	usePatchArchiveMutation: jest.fn(() => [mockPatchArchive, { isLoading: false }]),
	useImportArticlesMutation: jest.fn(() => [mockImportArticles, { isLoading: false }]),
	useSendCSVExampleEmailMutation: jest.fn(() => [mockSendCSVExampleEmail, { isLoading: false }]),
}));

jest.mock('@/store/services/company', () => ({
	__esModule: true,
	useGetCompanyQuery: jest.fn(() => ({ data: { uses_foreign_currency: false }, isLoading: false })),
}));

// Mock CompanyDocumentsWrapperList
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

// Enhanced PaginatedDataGrid mock that calls renderCell for each column/row
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({
		columns,
		data,
		toolbarActions,
	}: {
		columns: Array<{
			field: string;
			headerName: string;
			renderCell?: (params: { value: unknown; row: Record<string, unknown>; field: string }) => React.ReactNode;
		}>;
		data?: { results?: Array<Record<string, unknown>> };
		isLoading?: boolean;
		onCustomFilterParamsChange?: (params: Record<string, string>) => void;
		toolbarActions?: React.ReactNode;
	}) => {
		const results = data?.results || [];
		return (
			<div data-testid="paginated-data-grid">
				{toolbarActions && <div data-testid="toolbar-actions">{toolbarActions}</div>}
				<table>
					<thead>
						<tr>
							{columns.map((col) => (
								<th key={col.field}>{col.headerName}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{results.map((row) => (
							<tr key={row.id as number} data-testid={`row-${row.id}`}>
								{columns.map((col) => (
									<td key={col.field}>
										{col.renderCell
											? col.renderCell({
													value: row[col.field],
													row,
													field: col.field,
												})
											: String(row[col.field] ?? '')}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	},
}));

// Mock ActionModals
jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: ({
		title,
		body,
		actions,
	}: {
		title: string;
		body: string;
		actions: Array<{ text: string; onClick: () => void }>;
	}) => (
		<div data-testid="action-modal" role="dialog">
			<h2>{title}</h2>
			<p>{body}</p>
			<div>
				{actions.map((action) => (
					<button key={action.text} onClick={action.onClick}>
						{action.text}
					</button>
				))}
			</div>
		</div>
	),
}));

// Mock MobileActionsMenu
jest.mock('@/components/shared/mobileActionsMenu/mobileActionsMenu', () => ({
	__esModule: true,
	default: ({ actions }: { actions: Array<{ label: string; onClick: () => void }> }) => (
		<div data-testid="mobile-actions-menu">
			{actions.map((a) => (
				<button key={a.label} onClick={a.onClick}>
					{a.label}
				</button>
			))}
		</div>
	),
}));

// Mock ChipSelectFilterBar
jest.mock('@/components/shared/chipSelectFilter/chipSelectFilterBar', () => ({
	__esModule: true,
	default: () => <div data-testid="chip-filter-bar" />,
}));

jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/shared/dropdownFilter/dropdownFilter', () => ({
	createDropdownFilterOperators: jest.fn(() => []),
}));

jest.mock('@/components/shared/dateRangeFilter/dateRangeFilterOperator', () => ({
	createDateRangeFilterOperator: jest.fn(() => []),
}));

jest.mock('@/components/shared/numericFilter/numericFilterOperator', () => ({
	createNumericFilterOperators: jest.fn(() => []),
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
	formatNumberWithSpaces: (value: string | number | null | undefined, decimals: number = 2): string => {
		if (value === null || value === undefined || value === '') return '';
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (Number.isNaN(num)) return '';
		return num.toLocaleString('fr-FR', {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
			useGrouping: true,
		});
	},
}));

jest.mock('next/image', () => ({
	__esModule: true,
	// eslint-disable-next-line @next/next/no-img-element
	default: (props: Record<string, unknown>) => <img {...props} alt="" />,
}));

// Import after mocks
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
		it('renders wrapper and title and data grid', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('articles-list')).toBeInTheDocument();
			expect(screen.getByText('Liste des Articles')).toBeInTheDocument();
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders archived title when archived=true', () => {
			render(<ArticlesListClient session={mockSession} archived={true} />);
			expect(screen.getByText('Articles Archivés')).toBeInTheDocument();
		});

		it('renders the add button when not archived and role allows it', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByText('Nouvel article')).toBeInTheDocument();
		});

		it('does not show add button when archived is true', () => {
			render(<ArticlesListClient session={mockSession} archived={true} />);
			expect(screen.queryByText('Nouvel article')).toBeNull();
		});

		it('renders chip filter bar', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('chip-filter-bar')).toBeInTheDocument();
		});
	});

	describe('Column renderCell functions', () => {
		it('renders photo column with avatar (with src)', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			const imgs = screen.getAllByRole('img');
			expect(imgs.length).toBeGreaterThan(0);
		});

		it('renders photo column without src (null photo)', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			const row2 = screen.getByTestId('row-2');
			expect(row2).toBeInTheDocument();
		});

		it('renders reference column values', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByText('ART-001')).toBeInTheDocument();
			expect(screen.getByText('ART-002')).toBeInTheDocument();
		});

		it('renders type_article column with Chip', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByText('Produit')).toBeInTheDocument();
			expect(screen.getByText('Service')).toBeInTheDocument();
		});

		it('renders designation column', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByText('Widget A')).toBeInTheDocument();
			expect(screen.getByText('Consulting B')).toBeInTheDocument();
		});

		it('renders prix_achat and prix_vente with formatted values and MAD', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			const cells = screen.getAllByText(/MAD/);
			expect(cells.length).toBeGreaterThan(0);
		});

		it('renders date_created column (formatted and dash for null)', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByText('—')).toBeInTheDocument();
		});

		it('renders actions column with action buttons', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			const voirBtns = screen.getAllByText('Voir');
			expect(voirBtns.length).toBeGreaterThanOrEqual(2);
			const modifierBtns = screen.getAllByText('Modifier');
			expect(modifierBtns.length).toBeGreaterThanOrEqual(2);
			const supprimerBtns = screen.getAllByText('Supprimer');
			expect(supprimerBtns.length).toBeGreaterThanOrEqual(2);
			const archiverBtns = screen.getAllByText('Archiver');
			expect(archiverBtns.length).toBeGreaterThanOrEqual(2);
		});

		it('renders Désarchiver action when archived=true', () => {
			render(<ArticlesListClient session={mockSession} archived={true} />);
			const desarchiverBtns = screen.getAllByText('Désarchiver');
			expect(desarchiverBtns.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Action handlers', () => {
		it('navigates to view page on Voir click', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			fireEvent.click(screen.getAllByText('Voir')[0]);
			expect(mockPush).toHaveBeenCalled();
		});

		it('navigates to edit page on Modifier click', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			fireEvent.click(screen.getAllByText('Modifier')[0]);
			expect(mockPush).toHaveBeenCalled();
		});

		it('navigates to add page on Nouvel article click', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			fireEvent.click(screen.getByText('Nouvel article'));
			expect(mockPush).toHaveBeenCalled();
		});

		it('opens delete modal on Supprimer click', async () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			await act(async () => {
				fireEvent.click(screen.getAllByText('Supprimer')[0]);
			});
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Supprimer cette article ?')).toBeInTheDocument();
		});

		it('closes delete modal on Annuler click', async () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			await act(async () => {
				fireEvent.click(screen.getAllByText('Supprimer')[0]);
			});
			await act(async () => {
				fireEvent.click(screen.getByText('Annuler'));
			});
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});

		it('deletes article when confirming delete modal', async () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			await act(async () => {
				fireEvent.click(screen.getAllByText('Supprimer')[0]);
			});
			const modalBtns = screen.getAllByText('Supprimer');
			await act(async () => {
				fireEvent.click(modalBtns[modalBtns.length - 1]);
			});
			await waitFor(() => {
				expect(mockDeleteArticle).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Article supprimé avec succès');
			});
		});

		it('handles delete error', async () => {
			mockDeleteArticle.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ArticlesListClient session={mockSession} archived={false} />);
			await act(async () => {
				fireEvent.click(screen.getAllByText('Supprimer')[0]);
			});
			const modalBtns = screen.getAllByText('Supprimer');
			await act(async () => {
				fireEvent.click(modalBtns[modalBtns.length - 1]);
			});
			await waitFor(() => {
				expect(mockOnError).toHaveBeenCalledWith("Erreur lors de la suppression d'article");
			});
		});

		it('opens archive modal on Archiver click', async () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			await act(async () => {
				fireEvent.click(screen.getAllByText('Archiver')[0]);
			});
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Archiver cette article ?')).toBeInTheDocument();
		});

		it('archives article when confirming archive modal', async () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			await act(async () => {
				fireEvent.click(screen.getAllByText('Archiver')[0]);
			});
			const archiveBtns = screen.getAllByText('Archiver');
			await act(async () => {
				fireEvent.click(archiveBtns[archiveBtns.length - 1]);
			});
			await waitFor(() => {
				expect(mockPatchArchive).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Article archivé avec succès');
			});
		});

		it('unarchives article when confirming in archived mode', async () => {
			render(<ArticlesListClient session={mockSession} archived={true} />);
			await act(async () => {
				fireEvent.click(screen.getAllByText('Désarchiver')[0]);
			});
			const confirmBtns = screen.getAllByText('Désarchiver');
			await act(async () => {
				fireEvent.click(confirmBtns[confirmBtns.length - 1]);
			});
			await waitFor(() => {
				expect(mockPatchArchive).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Article désarchivé avec succès');
			});
		});

		it('handles archive error', async () => {
			mockPatchArchive.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ArticlesListClient session={mockSession} archived={false} />);
			await act(async () => {
				fireEvent.click(screen.getAllByText('Archiver')[0]);
			});
			const archiveBtns = screen.getAllByText('Archiver');
			await act(async () => {
				fireEvent.click(archiveBtns[archiveBtns.length - 1]);
			});
			await waitFor(() => {
				expect(mockOnError).toHaveBeenCalledWith("Erreur lors de l\u2019archivage d'article");
			});
		});

		it('handles unarchive error', async () => {
			mockPatchArchive.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ArticlesListClient session={mockSession} archived={true} />);
			await act(async () => {
				fireEvent.click(screen.getAllByText('Désarchiver')[0]);
			});
			const confirmBtns = screen.getAllByText('Désarchiver');
			await act(async () => {
				fireEvent.click(confirmBtns[confirmBtns.length - 1]);
			});
			await waitFor(() => {
				expect(mockOnError).toHaveBeenCalledWith("Erreur lors de la désarchivation d'article");
			});
		});

		it('cancels archive modal on Annuler', async () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			await act(async () => {
				fireEvent.click(screen.getAllByText('Archiver')[0]);
			});
			await act(async () => {
				fireEvent.click(screen.getByText('Annuler'));
			});
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});
	});

	describe('CSV import and email', () => {
		it('renders toolbar actions (email and CSV import buttons)', () => {
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('toolbar-actions')).toBeInTheDocument();
		});

		it('does not render toolbar actions when archived', () => {
			render(<ArticlesListClient session={mockSession} archived={true} />);
			expect(screen.queryByTestId('toolbar-actions')).not.toBeInTheDocument();
		});
	});

	describe('Loading and empty states', () => {
		it('renders grid when loading', () => {
			mockUseGetArticlesListQuery.mockReturnValueOnce({
				data: { results: [], count: 0, next: null, previous: null },
				isLoading: true,
				refetch: mockRefetch,
			});
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders grid when no data', () => {
			mockUseGetArticlesListQuery.mockReturnValueOnce({
				data: { results: [], count: 0, next: null, previous: null },
				isLoading: false,
				refetch: mockRefetch,
			});
			render(<ArticlesListClient session={mockSession} archived={false} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
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
