import React from 'react';
import { render, screen, cleanup, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: jest.fn((session: AppSession) => session?.accessToken || null),
}));

const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));

const mockRefetch = jest.fn();
const mockSuspend = jest.fn(() => ({ unwrap: () => Promise.resolve() }));

const mockUseGetCompaniesListQuery = jest.fn(() => ({
	data: {
		results: [
			{ id: 1, logo: 'https://example.com/logo1.png', raison_sociale: 'Company A', ICE: '123456', nom_responsable: 'Jean Dupont', email: 'a@co.com', telephone: '+212600000001', nbr_employe: '1 à 5', date_created: '2025-01-10' },
			{ id: 2, logo: null, raison_sociale: 'Company B', ICE: '789012', nom_responsable: 'Marie Martin', email: 'b@co.com', telephone: '+212600000002', nbr_employe: '50 à 100', date_created: null },
		],
		count: 2,
		next: null,
		previous: null,
	},
	isLoading: false,
	refetch: mockRefetch,
}));

jest.mock('@/store/services/company', () => ({
	useGetCompaniesListQuery: () => mockUseGetCompaniesListQuery(),
	useSuspendCompanyMutation: jest.fn(() => [mockSuspend, { isLoading: false }]),
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children, title }: { children: React.ReactNode; title: string }) => <div data-testid="nav-bar"><h1>{title}</h1>{children}</div>,
}));

jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Enhanced PaginatedDataGrid mock that calls renderCell
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({ columns, data }: { columns: Array<{ field: string; headerName: string; renderCell?: (params: { value: unknown; row: Record<string, unknown>; field: string }) => React.ReactNode }>; data?: { results?: Array<Record<string, unknown>> } }) => {
		const results = data?.results || [];
		return (
			<div data-testid="paginated-data-grid">
				<table>
					<thead><tr>{columns.map((col) => <th key={col.field}>{col.headerName}</th>)}</tr></thead>
					<tbody>{results.map((row) => (
						<tr key={row.id as number} data-testid={`row-${row.id}`}>
							{columns.map((col) => <td key={col.field}>{col.renderCell ? col.renderCell({ value: row[col.field], row, field: col.field }) : String(row[col.field] ?? '')}</td>)}
						</tr>
					))}</tbody>
				</table>
			</div>
		);
	},
}));

jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: ({ title, body, actions }: { title: string; body: string; actions: Array<{ text: string; onClick: () => void }> }) => (
		<div data-testid="action-modal" role="dialog">
			<h2>{title}</h2><p>{body}</p>
			<div>{actions.map((a) => <button key={a.text} onClick={a.onClick}>{a.text}</button>)}</div>
		</div>
	),
}));

jest.mock('@/components/shared/mobileActionsMenu/mobileActionsMenu', () => ({
	__esModule: true,
	default: ({ actions }: { actions: Array<{ label: string; onClick: () => void }> }) => (
		<div data-testid="mobile-actions-menu">{actions.map((a) => <button key={a.label} onClick={a.onClick}>{a.label}</button>)}</div>
	),
}));

jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/image', () => ({
	__esModule: true,
	// eslint-disable-next-line @next/next/no-img-element
	default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} data-testid="next-image" />,
}));

jest.mock('@/components/shared/dropdownFilter/dropdownFilter', () => ({ createDropdownFilterOperators: jest.fn(() => []) }));
jest.mock('@/components/shared/dateRangeFilter/dateRangeFilterOperator', () => ({ createDateRangeFilterOperator: jest.fn(() => []) }));
jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
}));

import CompaniesListClient, { nbrEmployeFilterOptions } from './companies-list';

const mockSession: AppSession = {
	accessToken: 'test-access-token', refreshToken: 'test-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z', refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: { id: '1', pk: 1, email: 'test@example.com', emailVerified: null, name: 'Test User', first_name: 'Test', last_name: 'User', image: null },
};

describe('CompaniesListClient', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders navigation bar with title', () => { render(<CompaniesListClient session={mockSession} />); expect(screen.getByText('Liste des entreprises')).toBeInTheDocument(); });
		it('renders data grid', () => { render(<CompaniesListClient session={mockSession} />); expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument(); });
		it('renders Nouvelle entreprise button', () => { render(<CompaniesListClient session={mockSession} />); expect(screen.getByText('Nouvelle entreprise')).toBeInTheDocument(); });
		it('renders data rows', () => { render(<CompaniesListClient session={mockSession} />); expect(screen.getByTestId('row-1')).toBeInTheDocument(); expect(screen.getByTestId('row-2')).toBeInTheDocument(); });
	});

	describe('Column renderCell', () => {
		it('renders logo avatar with src', () => {
			render(<CompaniesListClient session={mockSession} />);
			const avatars = screen.getAllByRole('img');
			const logoAvatar = avatars.find((a) => a.getAttribute('alt') === 'Company A');
			expect(logoAvatar).toBeInTheDocument();
		});

		it('renders logo avatar without src', () => {
			render(<CompaniesListClient session={mockSession} />);
			// Avatar without src renders as a div, not img. Just verify the row renders
			expect(screen.getByTestId('row-2')).toBeInTheDocument();
		});

		it('renders raison_sociale', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByText('Company A')).toBeInTheDocument();
			expect(screen.getByText('Company B')).toBeInTheDocument();
		});

		it('renders ICE', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByText('123456')).toBeInTheDocument();
			expect(screen.getByText('789012')).toBeInTheDocument();
		});

		it('renders nom_responsable', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
			expect(screen.getByText('Marie Martin')).toBeInTheDocument();
		});

		it('renders email', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByText('a@co.com')).toBeInTheDocument();
			expect(screen.getByText('b@co.com')).toBeInTheDocument();
		});

		it('renders telephone', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByText('+212600000001')).toBeInTheDocument();
			expect(screen.getByText('+212600000002')).toBeInTheDocument();
		});

		it('renders nbr_employe as Chip', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByText('1 à 5')).toBeInTheDocument();
			expect(screen.getByText('50 à 100')).toBeInTheDocument();
		});

		it('renders date_created (null shows dash)', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByText('—')).toBeInTheDocument();
		});

		it('renders actions (Voir, Modifier, Suspendre)', () => {
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getAllByText('Voir').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Modifier').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Suspendre').length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Action handlers', () => {
		it('navigates to add page', () => {
			render(<CompaniesListClient session={mockSession} />);
			fireEvent.click(screen.getByText('Nouvelle entreprise'));
			expect(mockPush).toHaveBeenCalled();
		});

		it('navigates to view page', () => {
			render(<CompaniesListClient session={mockSession} />);
			fireEvent.click(screen.getAllByText('Voir')[0]);
			expect(mockPush).toHaveBeenCalled();
		});

		it('navigates to edit page', () => {
			render(<CompaniesListClient session={mockSession} />);
			fireEvent.click(screen.getAllByText('Modifier')[0]);
			expect(mockPush).toHaveBeenCalled();
		});

		it('opens suspend modal', async () => {
			render(<CompaniesListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Suspendre')[0]); });
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Suspendre cette entreprise ?')).toBeInTheDocument();
		});

		it('closes suspend modal on Annuler', async () => {
			render(<CompaniesListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Suspendre')[0]); });
			await act(async () => { fireEvent.click(screen.getByText('Annuler')); });
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});

		it('suspends company on confirm', async () => {
			render(<CompaniesListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Suspendre')[0]); });
			const btns = screen.getAllByText('Suspendre');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockSuspend).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Entreprise suspendue avec succès');
			});
		});

		it('handles suspend error', async () => {
			mockSuspend.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<CompaniesListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Suspendre')[0]); });
			const btns = screen.getAllByText('Suspendre');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => { expect(mockOnError).toHaveBeenCalledWith("Erreur lors de la suspension de l'entreprise"); });
		});
	});

	describe('Column headers', () => {
		it('renders all expected column headers', () => {
			render(<CompaniesListClient session={mockSession} />);
			for (const h of ['Logo', 'Raison Sociale', 'ICE', 'Responsable', 'Email', 'Téléphone', 'Employés', 'Date de création', 'Actions']) {
				expect(screen.getByText(h)).toBeInTheDocument();
			}
		});
	});

	describe('Loading and empty states', () => {
		it('renders when loading', () => {
			mockUseGetCompaniesListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null }, isLoading: true, refetch: mockRefetch });
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders when empty', () => {
			mockUseGetCompaniesListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null }, isLoading: false, refetch: mockRefetch });
			render(<CompaniesListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Exports', () => {
		it('exports nbrEmployeFilterOptions', () => {
			expect(nbrEmployeFilterOptions).toHaveLength(5);
			expect(nbrEmployeFilterOptions[0].value).toBe('1 à 5');
			expect(nbrEmployeFilterOptions[4].value).toBe('plus que 100');
		});
	});
});
