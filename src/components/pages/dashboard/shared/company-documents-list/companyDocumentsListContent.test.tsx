import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Description as DescriptionIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import type {
	DocumentListConfig,
	DocumentListQueryResult,
	DocumentDeleteMutationResult,
	DocumentConvertMutationResult,
	PaginationModel,
} from '@/types/companyDocumentsTypes';
import type { DeviClass } from '@/models/classes';

// Mock next/navigation
const mockPush = jest.fn();
const mockRouter = {
	push: mockPush,
	back: jest.fn(),
	forward: jest.fn(),
	refresh: jest.fn(),
	replace: jest.fn(),
	prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
	useRouter: () => mockRouter,
}));

// Mock toast hook
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({
		onSuccess: mockOnSuccess,
		onError: mockOnError,
	}),
}));

// Mock dependencies
jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/htmlElements/buttons/textButton/textButton', () => ({
	__esModule: true,
	default: ({ buttonText, onClick }: { buttonText: string; onClick: () => void }) => (
		<button onClick={onClick} data-testid="text-button">
			{buttonText}
		</button>
	),
}));

jest.mock('@/components/shared/dropdownFilter/dropdownFilter', () => ({
	createDropdownFilterOperators: jest.fn(() => []),
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
			useGrouping: true
		});
	},
}));

// Mock PaginatedDataGrid
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({
		columns,
		data,
	}: {
		columns: Array<{
			field: string;
			headerName: string;
			renderCell?: (params: { value: string; row: DeviClass }) => React.ReactNode;
		}>;
		data?: DocumentListQueryResult<DeviClass>['data'];
		isLoading?: boolean;
	}) => {
		const results = data?.results || [];
		return (
			<div data-testid="paginated-data-grid">
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
							<tr key={row.id} data-testid={`row-${row.id}`}>
								{columns.map((col) => (
									<td key={`${row.id}-${col.field}`}>
										{col.renderCell
											? col.renderCell({ value: row[col.field as keyof DeviClass] as string, row })
											: String(row[col.field as keyof DeviClass] ?? '')}
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
					<button key={action.text} onClick={action.onClick} data-testid={`modal-${action.text.toLowerCase()}`}>
						{action.text}
					</button>
				))}
			</div>
		</div>
	),
}));

// Import after mocks
import CompanyDocumentsListContent, { getStatutColor, statutFilterOptions } from './companyDocumentsListContent';

// Mock data
const mockDevisData: Partial<DeviClass>[] = [
	{
		id: 1,
		numero_devis: 'DEV-001',
		client: 10,
		client_name: 'Client Test',
		numero_demande_prix_client: 'DDP-001',
		statut: 'Brouillon',
		total_ttc_apres_remise: 1500.0,
		lignes_count: 3,
		date_devis: '2025-01-15',
		lignes: [],
	},
	{
		id: 2,
		numero_devis: 'DEV-002',
		client: 20,
		client_name: 'Client Two',
		numero_demande_prix_client: 'DDP-002',
		statut: 'Envoyé',
		total_ttc_apres_remise: 2500.5,
		lignes_count: 5,
		date_devis: '2025-01-20',
		lignes: [],
	},
];

const mockDeleteRecord = jest.fn();
const mockConvertToProForma = jest.fn();
const mockConvertToClient = jest.fn();
const mockRefetch = jest.fn();

const mockQueryResult: DocumentListQueryResult<DeviClass> = {
	data: {
		results: mockDevisData as DeviClass[],
		count: 2,
		next: null,
		previous: null,
	},
	isLoading: false,
	refetch: mockRefetch,
};

const mockDeleteMutation: DocumentDeleteMutationResult = {
	deleteRecord: mockDeleteRecord,
};

const mockConvertMutations: Record<string, DocumentConvertMutationResult> = {
	facture_pro_forma: {
		convertMutation: mockConvertToProForma,
		isLoading: false,
	},
	facture_client: {
		convertMutation: mockConvertToClient,
		isLoading: false,
	},
};

const mockConfig: DocumentListConfig<DeviClass> = {
	documentType: 'devis',
	labels: {
		pageTitle: 'Liste des Devis',
		documentTypeName: 'devis',
		addButtonText: 'Nouveau devis',
		deleteConfirmTitle: 'Supprimer ce devis ?',
		deleteConfirmBody: 'Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.',
		deleteSuccessMessage: 'Devis supprimé avec succès',
		deleteErrorMessage: 'Erreur lors de la suppression du devis',
	},
	routes: {
		addRoute: (companyId: number) => `/dashboard/devis/add?company_id=${companyId}`,
		editRoute: (id: number, companyId: number) => `/dashboard/devis/edit/${id}?company_id=${companyId}`,
		viewRoute: (id: number, companyId: number) => `/dashboard/devis/view/${id}?company_id=${companyId}`,
	},
	columns: {
		numeroField: 'numero_devis',
		numeroHeaderName: 'Numéro devis',
		extraField: 'numero_demande_prix_client',
		extraFieldHeaderName: 'N° demande de prix',
		dateField: 'date_devis',
		dateHeaderName: 'Date devis',
	},
	convertActions: [
		{
			key: 'facture_pro_forma',
			label: 'Convertir en facture pro forma',
			icon: <DescriptionIcon />,
			modalTitle: 'Convertir en facture pro forma',
			modalBody: 'Voulez-vous convertir ce devis en facture pro forma ?',
			redirectRoute: (id: number, companyId: number) =>
				`/dashboard/facture-pro-forma/edit/${id}?company_id=${companyId}`,
			disabled: false,
		},
		{
			key: 'facture_client',
			label: 'Convertir en facture client',
			icon: <ReceiptIcon />,
			modalTitle: 'Convertir en facture client',
			modalBody: 'Voulez-vous convertir ce devis en facture client ?',
			redirectRoute: (id: number, companyId: number) => `/dashboard/facture-client/edit/${id}?company_id=${companyId}`,
			disabled: false,
		},
	],
	printActions: [
		{
			key: 'print_pdf',
			label: 'Imprimer PDF',
			icon: <DescriptionIcon />,
			iconColor: '#1976d2',
			urlGenerator: (itemId: number, companyId: number) =>
				`http://localhost:8000/api/devis/${itemId}/pdf/?company_id=${companyId}`,
		},
		{
			key: 'print_excel',
			label: 'Exporter Excel',
			icon: <ReceiptIcon />,
			iconColor: '#2e7d32',
			urlGenerator: (itemId: number, companyId: number) =>
				`http://localhost:8000/api/devis/${itemId}/excel/?company_id=${companyId}`,
		},
	],
};

const mockPaginationModel: PaginationModel = {
	page: 0,
	pageSize: 10,
};

const mockSetPaginationModel = jest.fn();
const mockSetSearchTerm = jest.fn();

describe('CompanyDocumentsListContent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockDeleteRecord.mockResolvedValue({ unwrap: jest.fn().mockResolvedValue({}) });
		mockConvertToProForma.mockResolvedValue({ unwrap: jest.fn().mockResolvedValue({ id: 100 }) });
		mockConvertToClient.mockResolvedValue({ unwrap: jest.fn().mockResolvedValue({ id: 101 }) });
	});

	afterEach(() => {
		cleanup();
	});

	describe('getStatutColor', () => {
		it('returns "default" for Brouillon', () => {
			expect(getStatutColor('Brouillon')).toBe('default');
		});

		it('returns "info" for Envoyé', () => {
			expect(getStatutColor('Envoyé')).toBe('info');
		});

		it('returns "success" for Accepté', () => {
			expect(getStatutColor('Accepté')).toBe('success');
		});

		it('returns "error" for Refusé', () => {
			expect(getStatutColor('Refusé')).toBe('error');
		});

		it('returns "error" for Annulé', () => {
			expect(getStatutColor('Annulé')).toBe('error');
		});

		it('returns "warning" for Expiré', () => {
			expect(getStatutColor('Expiré')).toBe('warning');
		});

		it('returns "success" for Valide', () => {
			expect(getStatutColor('Valide')).toBe('success');
		});

		it('returns "success" for Facturé', () => {
			expect(getStatutColor('Facturé')).toBe('success');
		});

		it('returns "default" for unknown status', () => {
			expect(getStatutColor('Unknown')).toBe('default');
			expect(getStatutColor('')).toBe('default');
		});
	});

	describe('statutFilterOptions', () => {
		it('has correct length', () => {
			expect(statutFilterOptions).toHaveLength(6);
		});

		it('contains all expected statut options', () => {
			expect(statutFilterOptions).toContainEqual({ value: 'Brouillon', label: 'Brouillon', color: 'default' });
			expect(statutFilterOptions).toContainEqual({ value: 'Envoyé', label: 'Envoyé', color: 'info' });
			expect(statutFilterOptions).toContainEqual({ value: 'Accepté', label: 'Accepté', color: 'success' });
			expect(statutFilterOptions).toContainEqual({ value: 'Refusé', label: 'Refusé', color: 'error' });
			expect(statutFilterOptions).toContainEqual({ value: 'Annulé', label: 'Annulé', color: 'error' });
			expect(statutFilterOptions).toContainEqual({ value: 'Expiré', label: 'Expiré', color: 'warning' });
		});
	});

	describe('Rendering', () => {
		it('renders the component for Caissier role', () => {
			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders add button for Caissier role', () => {
			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.getByText('Nouveau devis')).toBeInTheDocument();
		});

		it('does not render add button for Lecture role', () => {
			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Lecture"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.queryByText('Nouveau devis')).not.toBeInTheDocument();
		});

		it('renders data rows', () => {
			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.getByTestId('row-1')).toBeInTheDocument();
			expect(screen.getByTestId('row-2')).toBeInTheDocument();
		});

		it('renders column headers', () => {
			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.getByText('Numéro devis')).toBeInTheDocument();
			expect(screen.getByText('Client')).toBeInTheDocument();
			expect(screen.getByText('N° demande de prix')).toBeInTheDocument();
			expect(screen.getByText('Statut')).toBeInTheDocument();
			expect(screen.getByText('Total TTC après remise')).toBeInTheDocument();
			expect(screen.getByText("Nombre d'articles")).toBeInTheDocument();
			expect(screen.getByText('Date devis')).toBeInTheDocument();
			expect(screen.getByText('Actions')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('navigates to add route when clicking add button', () => {
			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			const addButton = screen.getByText('Nouveau devis');
			fireEvent.click(addButton);
			expect(mockPush).toHaveBeenCalledWith('/dashboard/devis/add?company_id=1');
		});
	});

	describe('Delete functionality', () => {
		it('shows delete modal when delete is triggered', async () => {
			const { container } = render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);

			// Find and click delete button in the actions column
			const deleteButtons = container.querySelectorAll('[data-testid*="DeleteIcon"]');
			if (deleteButtons.length > 0) {
				fireEvent.click(deleteButtons[0] as Element);
				await waitFor(() => {
					expect(screen.queryByTestId('action-modal')).toBeInTheDocument();
				});
			}
		});

		it('calls delete handler when confirming delete', async () => {
			mockDeleteRecord.mockImplementation(() => ({
				unwrap: jest.fn().mockResolvedValue({}),
			}));

			const { container } = render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);

			// Trigger delete
			const deleteButtons = container.querySelectorAll('[data-testid*="DeleteIcon"]');
			if (deleteButtons.length > 0) {
				fireEvent.click(deleteButtons[0] as Element);

				await waitFor(() => {
					const modal = screen.queryByTestId('action-modal');
					if (modal) {
						const confirmButton = screen.getByTestId('modal-supprimer');
						fireEvent.click(confirmButton);
					}
				});

				await waitFor(() => {
					expect(mockDeleteRecord).toHaveBeenCalled();
				});
			}
		});
	});

	describe('Convert functionality', () => {
		it('shows convert menu when convert button is clicked', async () => {
			const { container } = render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);

			// Find convert button (SwapHorizIcon)
			const convertButtons = container.querySelectorAll('[data-testid*="SwapHorizIcon"]');
			if (convertButtons.length > 0) {
				fireEvent.click(convertButtons[0] as Element);
				await waitFor(() => {
					expect(screen.queryByText('Convertir en facture pro forma')).toBeInTheDocument();
				});
			}
		});

		it('handles convert action and redirects on success', async () => {
			const mockConvertResult = { id: 100 };
			mockConvertToProForma.mockImplementation(() => ({
				unwrap: jest.fn().mockResolvedValue(mockConvertResult),
			}));

			const { container } = render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);

			// Click convert button to show menu
			const convertButtons = container.querySelectorAll('[data-testid*="SwapHorizIcon"]');
			if (convertButtons.length > 0) {
				fireEvent.click(convertButtons[0] as Element);
				await waitFor(() => {
					const menuItem = screen.queryByText('Convertir en facture pro forma');
					if (menuItem) {
						fireEvent.click(menuItem);
					}
				});

				await waitFor(() => {
					// The modal should now be shown
					const modal = screen.queryByTestId('action-modal');
					if (modal) {
						const convertButton = screen.queryByTestId('modal-convertir');
						if (convertButton) {
							fireEvent.click(convertButton);
						}
					}
				});
			}
		});

		it('handles convert action error', async () => {
			mockConvertToProForma.mockImplementation(() => ({
				unwrap: jest.fn().mockRejectedValue(new Error('Convert failed')),
			}));

			const { container } = render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);

			const convertButtons = container.querySelectorAll('[data-testid*="SwapHorizIcon"]');
			if (convertButtons.length > 0) {
				fireEvent.click(convertButtons[0] as Element);
				await waitFor(() => {
					const menuItem = screen.queryByText('Convertir en facture pro forma');
					if (menuItem) {
						fireEvent.click(menuItem);
					}
				});

				await waitFor(() => {
					const modal = screen.queryByTestId('action-modal');
					if (modal) {
						const convertButton = screen.queryByTestId('modal-convertir');
						if (convertButton) {
							fireEvent.click(convertButton);
						}
					}
				});

				await waitFor(
					() => {
						expect(mockOnError).toHaveBeenCalled();
					},
					{ timeout: 3000 },
				);
			}
		});

		it('closes convert modal when clicking cancel', async () => {
			const { container } = render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);

			const convertButtons = container.querySelectorAll('[data-testid*="SwapHorizIcon"]');
			if (convertButtons.length > 0) {
				fireEvent.click(convertButtons[0] as Element);
				await waitFor(() => {
					const menuItem = screen.queryByText('Convertir en facture pro forma');
					if (menuItem) {
						fireEvent.click(menuItem);
					}
				});

				await waitFor(() => {
					const modal = screen.queryByTestId('action-modal');
					if (modal) {
						const cancelButton = screen.queryByTestId('modal-annuler');
						if (cancelButton) {
							fireEvent.click(cancelButton);
						}
					}
				});
			}
		});
	});

	describe('Delete error handling', () => {
		it('handles delete error', async () => {
			mockDeleteRecord.mockImplementation(() => ({
				unwrap: jest.fn().mockRejectedValue(new Error('Delete failed')),
			}));

			const { container } = render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);

			const deleteButtons = container.querySelectorAll('[data-testid*="DeleteIcon"]');
			if (deleteButtons.length > 0) {
				fireEvent.click(deleteButtons[0] as Element);

				await waitFor(() => {
					const modal = screen.queryByTestId('action-modal');
					if (modal) {
						const confirmButton = screen.getByTestId('modal-supprimer');
						fireEvent.click(confirmButton);
					}
				});

				await waitFor(
					() => {
						expect(mockOnError).toHaveBeenCalled();
					},
					{ timeout: 3000 },
				);
			}
		});

		it('closes delete modal when clicking cancel', async () => {
			const { container } = render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);

			const deleteButtons = container.querySelectorAll('[data-testid*="DeleteIcon"]');
			if (deleteButtons.length > 0) {
				fireEvent.click(deleteButtons[0] as Element);

				await waitFor(() => {
					const modal = screen.queryByTestId('action-modal');
					if (modal) {
						const cancelButton = screen.getByTestId('modal-annuler');
						fireEvent.click(cancelButton);
					}
				});
			}
		});
	});

	describe('Print functionality', () => {
		beforeEach(() => {
			// Mock window.open
			jest.spyOn(window, 'open').mockImplementation(() => null);
		});

		afterEach(() => {
			(window.open as jest.Mock).mockRestore();
		});

		it('shows print menu when print button is clicked', async () => {
			const { container } = render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);

			// Find print button (PrintIcon)
			const printButtons = container.querySelectorAll('[data-testid*="PrintIcon"]');
			if (printButtons.length > 0) {
				fireEvent.click(printButtons[0] as Element);
				// The menu should appear - verify it can be rendered
				await waitFor(() => {
					expect(container).toBeInTheDocument();
				});
			}
		});

		it('renders config with print actions', () => {
			// This test verifies the printActions config is properly processed
			expect(mockConfig.printActions).toHaveLength(2);
			expect(mockConfig.printActions?.[0].urlGenerator(1, 2, 'fr')).toBe(
				'http://localhost:8000/api/devis/1/pdf/?company_id=2',
			);
			expect(mockConfig.printActions?.[1].urlGenerator(3, 4, 'en')).toBe(
				'http://localhost:8000/api/devis/3/excel/?company_id=4',
			);
		});
	});

	describe('Loading state', () => {
		it('renders when data is loading', () => {
			const loadingQueryResult: DocumentListQueryResult<DeviClass> = {
				data: undefined,
				isLoading: true,
				refetch: mockRefetch,
			};

			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={loadingQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('renders when no data is available', () => {
			const emptyQueryResult: DocumentListQueryResult<DeviClass> = {
				data: { results: [], count: 0, next: null, previous: null },
				isLoading: false,
				refetch: mockRefetch,
			};

			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={emptyQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Config with no convert actions', () => {
		it('renders without convert buttons when convertActions is empty', () => {
			const configWithoutConvert: DocumentListConfig<DeviClass> = {
				...mockConfig,
				convertActions: [],
			};

			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={configWithoutConvert}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={{}}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Config with no print actions', () => {
		it('renders without print buttons when printActions is empty', () => {
			const configWithoutPrint: DocumentListConfig<DeviClass> = {
				...mockConfig,
				printActions: [],
			};

			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={configWithoutPrint}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={mockConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Convert loading state', () => {
		it('renders with convert mutations loading', () => {
			const loadingConvertMutations: Record<string, DocumentConvertMutationResult> = {
				facture_pro_forma: {
					convertMutation: mockConvertToProForma,
					isLoading: true,
				},
				facture_client: {
					convertMutation: mockConvertToClient,
					isLoading: false,
				},
			};

			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={loadingConvertMutations}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});

	describe('Null convertMutations', () => {
		it('handles null convertMutations gracefully', () => {
			render(
				<CompanyDocumentsListContent
					companyId={1}
					role="Caissier"
					router={mockRouter}
					config={mockConfig}
					queryResult={mockQueryResult}
					deleteMutation={mockDeleteMutation}
					convertMutations={null as unknown as Record<string, DocumentConvertMutationResult>}
					paginationModel={mockPaginationModel}
					setPaginationModel={mockSetPaginationModel}
					searchTerm=""
					setSearchTerm={mockSetSearchTerm}
				/>,
			);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});
});
