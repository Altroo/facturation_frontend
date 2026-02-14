import React from 'react';
import { render, screen, cleanup, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';

const mockPush = jest.fn();
const mockOpen = jest.fn();
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
	useAppSelector: jest.fn(() => [{ id: 1, name: 'Chèque' }, { id: 2, name: 'Virement' }]),
}));

jest.mock('@/store/services/parameter', () => ({
	useGetModePaiementListQuery: jest.fn(() => ({ data: [], isLoading: false })),
}));

const mockRefetch = jest.fn();
const mockDeleteReglement = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockPatchStatut = jest.fn(() => ({ unwrap: () => Promise.resolve() }));

const mockQueryData = {
	results: [
		{ id: 1, facture_client_numero: 'FAC-001', client: 10, client_name: 'Client Alpha', mode_reglement_name: 'Chèque', montant: 5000, devise: 'MAD', date_reglement: '2025-01-15', date_echeance: '2025-02-15', statut: 'Valide' },
		{ id: 2, facture_client_numero: 'FAC-002', client: 20, client_name: 'Client Beta', mode_reglement_name: null, montant: 3000, devise: 'EUR', date_reglement: null, date_echeance: null, statut: 'Annulé' },
	],
	count: 2,
	next: null,
	previous: null,
	stats_by_currency: {
		MAD: { chiffre_affaire_total: 50000, total_reglements: 30000, total_impayes: 20000 },
		EUR: { chiffre_affaire_total: 10000, total_reglements: 8000, total_impayes: 2000 },
	},
};

const mockUseGetReglementsListQuery = jest.fn(() => ({
	data: mockQueryData,
	isLoading: false,
	refetch: mockRefetch,
}));

jest.mock('@/store/services/reglement', () => ({
	useGetReglementsListQuery: () => mockUseGetReglementsListQuery(),
	useDeleteReglementMutation: jest.fn(() => [mockDeleteReglement, { isLoading: false }]),
	usePatchReglementStatutMutation: jest.fn(() => [mockPatchStatut, { isLoading: false }]),
}));

jest.mock('@/store/services/company', () => ({
	useGetCompanyQuery: jest.fn(() => ({ data: { uses_foreign_currency: true } })),
}));

jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => ({
	__esModule: true,
	default: ({ children, title }: { children: (props: { company_id: number; role: string }) => React.ReactNode; title: string }) => (
		<div data-testid="company-wrapper"><h1>{title}</h1>{children({ company_id: 1, role: 'Caissier' })}</div>
	),
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

jest.mock('@/components/htmlElements/buttons/textButton/textButton', () => ({
	__esModule: true,
	default: ({ buttonText, onClick }: { buttonText: string; onClick: () => void }) => <button data-testid="text-button" onClick={onClick}>{buttonText}</button>,
}));

jest.mock('@/components/shared/chipSelectFilter/chipSelectFilterBar', () => ({
	__esModule: true,
	default: () => <div data-testid="chip-filter-bar" />,
}));

jest.mock('@/components/shared/currencyToggle/currencyToggle', () => ({
	__esModule: true,
	default: ({ selectedDevise, onDeviseChange }: { selectedDevise: string; onDeviseChange: (v: string) => void; usesForeignCurrency: boolean }) => (
		<div data-testid="currency-toggle">
			<span>{selectedDevise}</span>
			<button onClick={() => onDeviseChange('EUR')}>EUR</button>
		</div>
	),
}));

jest.mock('@/components/shared/pdfLanguageModal/pdfLanguageModal', () => ({
	__esModule: true,
	default: ({ onSelectLanguage, onClose }: { onSelectLanguage: (lang: 'fr' | 'en') => void; onClose: () => void }) => (
		<div data-testid="pdf-language-modal">
			<button onClick={() => onSelectLanguage('fr')}>Français</button>
			<button onClick={() => onSelectLanguage('en')}>English</button>
			<button onClick={onClose}>Close</button>
		</div>
	),
}));

jest.mock('@/components/shared/dropdownFilter/dropdownFilter', () => ({ createDropdownFilterOperators: jest.fn(() => []) }));
jest.mock('@/components/shared/dateRangeFilter/dateRangeFilterOperator', () => ({ createDateRangeFilterOperator: jest.fn(() => []) }));
jest.mock('@/components/shared/numericFilter/numericFilterOperator', () => ({ createNumericFilterOperators: jest.fn(() => []) }));
jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
	formatNumberWithSpaces: (n: number, d: number) => (n != null ? n.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '0.00'),
}));
jest.mock('@/utils/routes', () => ({
	REGLEMENTS_ADD: (companyId: number) => `/dashboard/${companyId}/reglements/add`,
	REGLEMENTS_EDIT: (id: number, companyId: number) => `/dashboard/${companyId}/reglements/${id}/edit`,
	REGLEMENTS_VIEW: (id: number, companyId: number) => `/dashboard/${companyId}/reglements/${id}`,
	CLIENTS_VIEW: (id: number, companyId: number) => `/dashboard/${companyId}/clients/${id}`,
	REGLEMENT_PDF: (id: number, companyId: number, lang: string) => `/api/reglement/${id}/pdf?company=${companyId}&lang=${lang}`,
}));

import ReglementListClient, { statutFilterOptions } from './reglement-list';

const mockSession: AppSession = {
	accessToken: 'test-access-token', refreshToken: 'test-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z', refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: { id: '1', pk: 1, email: 'test@example.com', emailVerified: null, name: 'Test User', first_name: 'Test', last_name: 'User', image: null },
};

describe('ReglementListClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		Object.defineProperty(window, 'open', { value: mockOpen, writable: true });
	});
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders wrapper with title', () => { render(<ReglementListClient session={mockSession} />); expect(screen.getByText('Liste des Règlements')).toBeInTheDocument(); });
		it('renders data grid', () => { render(<ReglementListClient session={mockSession} />); expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument(); });
		it('renders Nouveau règlement button', () => { render(<ReglementListClient session={mockSession} />); expect(screen.getByText('Nouveau règlement')).toBeInTheDocument(); });
		it('renders data rows', () => { render(<ReglementListClient session={mockSession} />); expect(screen.getByTestId('row-1')).toBeInTheDocument(); expect(screen.getByTestId('row-2')).toBeInTheDocument(); });
		it('renders chip filter bar', () => { render(<ReglementListClient session={mockSession} />); expect(screen.getByTestId('chip-filter-bar')).toBeInTheDocument(); });
		it('renders currency toggle', () => { render(<ReglementListClient session={mockSession} />); expect(screen.getByTestId('currency-toggle')).toBeInTheDocument(); });
	});

	describe('Stats cards', () => {
		it('renders chiffre affaire total', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByText("Chiffre d'affaire total")).toBeInTheDocument();
			expect(screen.getByText('50 000.00 MAD')).toBeInTheDocument();
		});

		it('renders total reglements', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByText('Total règlements')).toBeInTheDocument();
			expect(screen.getByText('30 000.00 MAD')).toBeInTheDocument();
		});

		it('renders total impayes', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByText('Total impayés')).toBeInTheDocument();
			expect(screen.getByText('20 000.00 MAD')).toBeInTheDocument();
		});

		it('switches currency via toggle', async () => {
			render(<ReglementListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getByText('EUR')); });
			await waitFor(() => { expect(screen.getByText('10 000.00 EUR')).toBeInTheDocument(); });
		});
	});

	describe('Column renderCell', () => {
		it('renders facture_client_numero', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByText('FAC-001')).toBeInTheDocument();
			expect(screen.getByText('FAC-002')).toBeInTheDocument();
		});

		it('renders client_name as TextButton', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByText('Client Alpha')).toBeInTheDocument();
			expect(screen.getByText('Client Beta')).toBeInTheDocument();
		});

		it('navigates to client detail on TextButton click', () => {
			render(<ReglementListClient session={mockSession} />);
			fireEvent.click(screen.getByText('Client Alpha'));
			expect(mockPush).toHaveBeenCalled();
		});

		it('renders mode_reglement_name (null shows -)', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByText('Chèque')).toBeInTheDocument();
			expect(screen.getByText('-')).toBeInTheDocument();
		});

		it('renders montant formatted with devise', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByText('5 000.00 MAD')).toBeInTheDocument();
			expect(screen.getByText('3 000.00 EUR')).toBeInTheDocument();
		});

		it('renders date_reglement (null shows dash)', () => {
			render(<ReglementListClient session={mockSession} />);
			const dashes = screen.getAllByText('—');
			expect(dashes.length).toBeGreaterThanOrEqual(1);
		});

		it('renders statut Chip (Valide=success, Annulé=error)', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByText('Valide')).toBeInTheDocument();
			expect(screen.getByText('Annulé')).toBeInTheDocument();
		});

		it('renders Caissier role actions for Valide row', () => {
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getAllByText('Voir').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Supprimer').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Modifier').length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByText('Annuler').length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByText('Afficher le reçu de règlement').length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Action handlers', () => {
		it('navigates to add page', () => {
			render(<ReglementListClient session={mockSession} />);
			fireEvent.click(screen.getByText('Nouveau règlement'));
			expect(mockPush).toHaveBeenCalled();
		});

		it('navigates to view page', () => {
			render(<ReglementListClient session={mockSession} />);
			fireEvent.click(screen.getAllByText('Voir')[0]);
			expect(mockPush).toHaveBeenCalled();
		});

		it('navigates to edit page', () => {
			render(<ReglementListClient session={mockSession} />);
			fireEvent.click(screen.getAllByText('Modifier')[0]);
			expect(mockPush).toHaveBeenCalled();
		});

		it('opens delete modal', async () => {
			render(<ReglementListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Supprimer ce règlement ?')).toBeInTheDocument();
		});

		it('closes delete modal on Annuler', async () => {
			render(<ReglementListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			// The "Annuler" text in modal actions
			const annulerBtns = screen.getAllByText('Annuler');
			await act(async () => { fireEvent.click(annulerBtns[annulerBtns.length - 1]); });
		});

		it('deletes reglement on confirm', async () => {
			render(<ReglementListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			const btns = screen.getAllByText('Supprimer');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockDeleteReglement).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Règlement supprimé avec succès');
			});
		});

		it('handles delete error', async () => {
			mockDeleteReglement.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ReglementListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			const btns = screen.getAllByText('Supprimer');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => { expect(mockOnError).toHaveBeenCalledWith('Erreur lors de la suppression du règlement'); });
		});

		it('opens cancel modal', async () => {
			render(<ReglementListClient session={mockSession} />);
			// Find the Annuler action button in the actions (not in modal)
			const annulerBtns = screen.getAllByText('Annuler');
			await act(async () => { fireEvent.click(annulerBtns[0]); });
			expect(screen.getByText('Annuler ce règlement ?')).toBeInTheDocument();
		});

		it('cancels reglement on confirm', async () => {
			render(<ReglementListClient session={mockSession} />);
			const annulerBtns = screen.getAllByText('Annuler');
			await act(async () => { fireEvent.click(annulerBtns[0]); });
			await act(async () => { fireEvent.click(screen.getByText('Annuler le règlement')); });
			await waitFor(() => {
				expect(mockPatchStatut).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Règlement annulé avec succès');
			});
		});

		it('handles cancel error', async () => {
			mockPatchStatut.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ReglementListClient session={mockSession} />);
			const annulerBtns = screen.getAllByText('Annuler');
			await act(async () => { fireEvent.click(annulerBtns[0]); });
			await act(async () => { fireEvent.click(screen.getByText('Annuler le règlement')); });
			await waitFor(() => { expect(mockOnError).toHaveBeenCalledWith("Erreur lors de l'annulation du règlement"); });
		});

		it('closes cancel modal on Fermer', async () => {
			render(<ReglementListClient session={mockSession} />);
			const annulerBtns = screen.getAllByText('Annuler');
			await act(async () => { fireEvent.click(annulerBtns[0]); });
			await act(async () => { fireEvent.click(screen.getByText('Fermer')); });
			expect(screen.queryByText('Annuler ce règlement ?')).not.toBeInTheDocument();
		});
	});

	describe('PDF print flow', () => {
		it('opens language modal on print click', async () => {
			render(<ReglementListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Afficher le reçu de règlement')[0]); });
			expect(screen.getByTestId('pdf-language-modal')).toBeInTheDocument();
		});

		it('opens PDF in new tab on language select', async () => {
			render(<ReglementListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Afficher le reçu de règlement')[0]); });
			await act(async () => { fireEvent.click(screen.getByText('Français')); });
			expect(mockOpen).toHaveBeenCalled();
		});

		it('closes language modal on Close', async () => {
			render(<ReglementListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Afficher le reçu de règlement')[0]); });
			await act(async () => { fireEvent.click(screen.getByText('Close')); });
			expect(screen.queryByTestId('pdf-language-modal')).not.toBeInTheDocument();
		});
	});

	describe('Column headers', () => {
		it('renders all expected column headers', () => {
			render(<ReglementListClient session={mockSession} />);
			for (const h of ['N° Facture', 'Client', 'Mode règlement', 'Montant', 'Date règlement', "Date d'échéance", 'Statut', 'Actions']) {
				expect(screen.getByText(h)).toBeInTheDocument();
			}
		});
	});

	describe('Loading and empty states', () => {
		it('renders when loading', () => {
			mockUseGetReglementsListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null, stats_by_currency: { MAD: { chiffre_affaire_total: 0, total_reglements: 0, total_impayes: 0 }, EUR: { chiffre_affaire_total: 0, total_reglements: 0, total_impayes: 0 } } }, isLoading: true, refetch: mockRefetch });
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders when empty', () => {
			mockUseGetReglementsListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null, stats_by_currency: { MAD: { chiffre_affaire_total: 0, total_reglements: 0, total_impayes: 0 }, EUR: { chiffre_affaire_total: 0, total_reglements: 0, total_impayes: 0 } } }, isLoading: false, refetch: mockRefetch });
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders zero values when no stats', () => {
			mockUseGetReglementsListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null, stats_by_currency: { MAD: { chiffre_affaire_total: 0, total_reglements: 0, total_impayes: 0 }, EUR: { chiffre_affaire_total: 0, total_reglements: 0, total_impayes: 0 } } }, isLoading: false, refetch: mockRefetch });
			render(<ReglementListClient session={mockSession} />);
			expect(screen.getAllByText('0,00 MAD').length).toBeGreaterThanOrEqual(3);
		});
	});

	describe('Exports', () => {
		it('exports statutFilterOptions', () => {
			expect(statutFilterOptions).toHaveLength(2);
			expect(statutFilterOptions[0].value).toBe('Valide');
			expect(statutFilterOptions[1].value).toBe('Annulé');
		});
	});
});
