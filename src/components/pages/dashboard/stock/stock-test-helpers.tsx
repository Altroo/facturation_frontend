import React from 'react';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
let mockListRole = 'Caissier';
let mockCompanyRole = 'Caissier';

const mockBalance = {
	id: 4,
	company: 1,
	article: 11,
	article_reference: 'LAMPE-03',
	article_designation: 'Lampe suspendue',
	emplacement: 2,
	emplacement_name: 'Dépôt principal',
	physical_quantity: '2.000',
	reserved_quantity: '3.000',
	available_quantity: '-1.000',
	incoming_quantity: '6.000',
	projected_quantity: '5.000',
	stock_minimum: '4.000',
	stock_state: 'a_approvisionner' as const,
	date_updated: '2026-09-18T10:00:00Z',
};

const mockMovement = {
	id: 6,
	balance: 4,
	article_reference: 'LAMPE-03',
	article_designation: 'Lampe suspendue',
	emplacement_name: 'Dépôt principal',
	movement_type: 'receipt' as const,
	movement_type_display: 'Réception',
	quantity: '2.000',
	balance_after: '2.000',
	source_type: 'StockReceipt',
	source_id: 14,
	note: 'Réception fournisseur',
	actor_name: 'Leila Logistique',
	date_created: '2026-09-18T10:00:00Z',
};

const mockDraftReceipt = {
	id: 14,
	company: 1,
	logistics_order: 31,
	logistics_order_number: 'LOG-2026-0031',
	status: 'draft' as const,
	reference: 'REC-2026-0014',
	note: 'Réception partielle',
	created_by_name: 'Leila Logistique',
	validated_by_name: null,
	date_created: '2026-09-18T10:00:00Z',
	date_validated: null,
	lines: [
		{
			id: 1,
			logistics_line: 301,
			article: 11,
			article_reference: 'LAMPE-03',
			article_designation: 'Lampe suspendue',
			emplacement: 2,
			emplacement_name: 'Dépôt principal',
			quantity: '2.000',
		},
	],
};

const mockValidatedReceipt = {
	...mockDraftReceipt,
	id: 15,
	status: 'validated' as const,
	reference: 'REC-2026-0015',
	validated_by_name: 'Leila Logistique',
	date_validated: '2026-09-18T11:00:00Z',
};

const mockDraftInventory = {
	id: 1,
	company: 1,
	emplacement: 2,
	emplacement_name: 'Dépôt principal',
	status: 'draft' as const,
	reference: 'INV-2026-09',
	note: 'Inventaire mensuel',
	created_by_name: 'Nadia El Mansouri',
	validated_by_name: null,
	date_created: '2026-09-18T10:00:00Z',
	date_validated: null,
	lines: [
		{
			id: 1,
			article: 11,
			article_reference: 'LAMPE-03',
			article_designation: 'Lampe suspendue',
			expected_quantity: '2.000',
			counted_quantity: '3.000',
			difference: '1.000',
		},
	],
};

const mockUseGetStockBalancesQuery = jest.fn();
const mockUseGetStockBalanceQuery = jest.fn();
const mockUseGetStockMovementsQuery = jest.fn();
const mockUseGetStockMovementQuery = jest.fn();
const mockUseGetStockReceiptsQuery = jest.fn();
const mockUseGetStockReceiptQuery = jest.fn();
const mockUseGetInventoriesQuery = jest.fn();
const mockUseGetInventoryQuery = jest.fn();
const mockCreateAdjustment = jest.fn(() => ({ unwrap: () => Promise.resolve(mockMovement) }));
const mockCreateReceipt = jest.fn(() => ({ unwrap: () => Promise.resolve(mockDraftReceipt) }));
export const mockValidateReceipt = jest.fn(() => ({ unwrap: () => Promise.resolve(mockValidatedReceipt) }));
const mockCancelReceipt = jest.fn(() => ({ unwrap: () => Promise.resolve(mockValidatedReceipt) }));
const mockCreateInventory = jest.fn(() => ({ unwrap: () => Promise.resolve(mockDraftInventory) }));
const mockValidateInventory = jest.fn(() => ({ unwrap: () => Promise.resolve(mockDraftInventory) }));

function mockCompanyDocumentsWrapper(props: {
	title: string;
	children: (context: { company_id: number; role: string }) => React.ReactNode;
}) {
	return (
		<section data-testid="company-list-wrapper">
			<h1>{props.title}</h1>
			{props.children({ company_id: 1, role: mockListRole })}
		</section>
	);
}

function mockNavigationBar(props: { title: string; children?: React.ReactNode }) {
	return (
		<section data-testid="navigation-bar">
			<h1>{props.title}</h1>
			{props.children}
		</section>
	);
}

function mockStockFormWrapper(props: {
	title: string;
	allowedRoles: string[];
	children: (token?: string) => React.ReactNode;
}) {
	return (
		<section data-testid="stock-form-wrapper" data-allowed-roles={props.allowedRoles.join(',')}>
			<h1>{props.title}</h1>
			{props.children('test-token')}
		</section>
	);
}

function mockPaginatedDataGrid(props: {
	columns: Array<{
		field: string;
		headerName?: string;
		renderCell?: (params: { row: Record<string, unknown>; value: unknown }) => React.ReactNode;
	}>;
	data?: { results?: Array<Record<string, unknown>> };
	embedded?: boolean;
}) {
	return (
		<div data-testid="paginated-data-grid" data-embedded={props.embedded ? 'true' : 'false'}>
			<div>Colonnes</div>
			<div>Filtres</div>
			<div>Exporter</div>
			<div>Recherche</div>
			<div>Pagination</div>
			{props.columns.map((column) => (
				<span key={column.field}>{column.headerName}</span>
			))}
			{(props.data?.results ?? []).map((row) => (
				<div key={String(row.id)} data-testid={`row-${String(row.id)}`}>
					{props.columns.map((column) => (
						<div key={column.field}>
							{column.renderCell
								? column.renderCell({ row, value: row[column.field] })
								: String(row[column.field] ?? '')}
						</div>
					))}
				</div>
			))}
		</div>
	);
}

function mockDataGrid(props: {
	columns: Array<{
		field: string;
		headerName?: string;
		renderCell?: (params: { row: Record<string, unknown>; value: unknown }) => React.ReactNode;
	}>;
	rows: Array<Record<string, unknown>>;
	showToolbar?: boolean;
}) {
	return (
		<div data-testid="mui-data-grid">
			{props.showToolbar && (
				<div>
					Colonnes Filtres Exporter Recherche Pagination
				</div>
			)}
			{props.columns.map((column) => (
				<span key={column.field}>{column.headerName}</span>
			))}
			{props.rows.map((row) => (
				<div key={String(row.id)}>
					{props.columns.map((column) => (
						<div key={column.field}>
							{column.renderCell
								? column.renderCell({ row, value: row[column.field] })
								: String(row[column.field] ?? '')}
						</div>
					))}
				</div>
			))}
		</div>
	);
}

function mockMobileActionsMenu(props: { actions: Array<{ label: string; onClick: () => void; disabled?: boolean }> }) {
	return (
		<div>
			{props.actions.map((action) => (
				<button key={action.label} type="button" onClick={action.onClick} disabled={action.disabled}>
					{action.label}
				</button>
			))}
		</div>
	);
}

function mockActionModals(props: {
	title: string;
	body: string;
	actions: Array<{ text: string; onClick: () => void; disabled?: boolean }>;
}) {
	return (
		<div role="dialog" aria-label={props.title}>
			<h2>{props.title}</h2>
			<p>{props.body}</p>
			{props.actions.map((action) => (
				<button key={action.text} type="button" onClick={action.onClick} disabled={action.disabled}>
					{action.text}
				</button>
			))}
		</div>
	);
}

function mockAutoCompleteInput(props: { id: string; label: string; disabled?: boolean }) {
	return (
		<label htmlFor={props.id}>
			{props.label}
			<input id={props.id} disabled={props.disabled} />
		</label>
	);
}

function mockTextInput(props: { id: string; label: string; disabled?: boolean }) {
	return (
		<label htmlFor={props.id}>
			{props.label}
			<input id={props.id} disabled={props.disabled} />
		</label>
	);
}

function mockPrimaryLoadingButton(props: { buttonText: string; type?: 'button' | 'submit' }) {
	return <button type={props.type ?? 'button'}>{props.buttonText}</button>;
}

jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		replace: mockReplace,
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		prefetch: jest.fn(),
	}),
	useSearchParams: () => ({ get: (key: string) => (key === 'company_id' ? '1' : null) }),
}));

jest.mock('@mui/x-data-grid', () => ({
	DataGrid: mockDataGrid,
	GridLogicOperator: { And: 'and', Or: 'or' },
}));

jest.mock('@mui/x-data-grid/locales', () => ({
	frFR: { components: { MuiDataGrid: { defaultProps: { localeText: {} } } } },
}));

jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => ({
	__esModule: true,
	default: mockCompanyDocumentsWrapper,
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: mockNavigationBar,
}));

jest.mock('@/components/pages/dashboard/stock/stock-form-wrapper', () => ({
	__esModule: true,
	default: mockStockFormWrapper,
}));

jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: mockPaginatedDataGrid,
}));

jest.mock('@/components/shared/mobileActionsMenu/mobileActionsMenu', () => ({
	__esModule: true,
	default: mockMobileActionsMenu,
}));

jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: mockActionModals,
}));

jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: mockAutoCompleteInput,
}));

jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: mockTextInput,
}));

jest.mock('@/components/formikElements/formattedNumberInput/formattedNumberInput', () => ({
	__esModule: true,
	default: mockTextInput,
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: mockPrimaryLoadingButton,
}));

jest.mock('@/components/shared/chipSelectFilter/chipSelectFilterBar', () => ({
	__esModule: true,
	default: ({ filters }: { filters: Array<{ label: string }> }) => (
		<div data-testid="chip-filter-bar">{filters.map((filter) => filter.label).join(' ')}</div>
	),
}));

jest.mock('@/components/shared/dashboardStatCard/dashboardStatCard', () => ({
	__esModule: true,
	default: ({ label, value }: { label: string; value: string }) => (
		<div>
			{label}: {value}
		</div>
	),
}));

jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-progress">Chargement</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: () => <div data-testid="api-alert">Erreur API</div>,
}));

jest.mock('@/components/shared/dateRangeFilter/dateRangeFilterOperator', () => ({
	createDateRangeFilterOperator: () => [],
}));

jest.mock('@/components/shared/dropdownFilter/dropdownFilter', () => ({
	createDropdownFilterOperators: () => [],
}));

jest.mock('@/components/shared/numericFilter/numericFilterOperator', () => ({
	createNumericFilterOperators: () => [],
}));

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: () => 'test-token',
}));

jest.mock('@/store/selectors', () => ({
	getUserCompaniesState: jest.fn(),
}));

jest.mock('@/utils/hooks', () => ({
	useAppSelector: () => [{ id: 1, role: mockCompanyRole }],
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));

jest.mock('@/store/services/company', () => ({
	useGetCompanyQuery: () => ({ data: { id: 1, stock_management_enabled: true }, isLoading: false }),
}));

jest.mock('@/store/services/parameter', () => ({
	useGetEmplacementListQuery: () => ({ data: [{ id: 2, nom: 'Dépôt principal' }], isLoading: false }),
}));

jest.mock('@/store/services/article', () => ({
	useGetArticlesListQuery: () => ({
		data: {
			results: [
				{
					id: 11,
					reference: 'LAMPE-03',
					designation: 'Lampe suspendue',
					type_article: 'Produit',
					emplacement: 2,
				},
			],
		},
		isLoading: false,
	}),
}));

jest.mock('@/store/services/logistique', () => ({
	useGetLogistiqueListQuery: () => ({
		data: {
			results: [
				{
					id: 31,
					numero_commande: 'LOG-2026-0031',
					fournisseur: 'Fournisseur Atlas',
					statut_commande_lancement: 'Terminée',
					statut_global: 'Terminée',
					statut: 'Transport international',
				},
			],
		},
		isLoading: false,
	}),
	useGetLogistiqueQuery: () => ({
		data: {
			lignes: [
				{
					id: 301,
					article: 11,
					article_reference: 'LAMPE-03',
					designation: 'Lampe suspendue',
					incoming_active: true,
					remaining_quantity: '6.000',
					expected_emplacement: 2,
				},
			],
		},
		isLoading: false,
	}),
}));

jest.mock('@/store/services/stock', () => ({
	useGetStockBalancesQuery: (...args: unknown[]) => mockUseGetStockBalancesQuery(...args),
	useGetStockBalanceQuery: (...args: unknown[]) => mockUseGetStockBalanceQuery(...args),
	useGetStockMovementsQuery: (...args: unknown[]) => mockUseGetStockMovementsQuery(...args),
	useGetStockMovementQuery: (...args: unknown[]) => mockUseGetStockMovementQuery(...args),
	useCreateStockAdjustmentMutation: () => [mockCreateAdjustment, { isLoading: false, error: undefined }],
	useGetStockReceiptsQuery: (...args: unknown[]) => mockUseGetStockReceiptsQuery(...args),
	useGetStockReceiptQuery: (...args: unknown[]) => mockUseGetStockReceiptQuery(...args),
	useCreateStockReceiptMutation: () => [mockCreateReceipt, { isLoading: false, error: undefined }],
	useValidateStockReceiptMutation: () => [mockValidateReceipt, { isLoading: false, error: undefined }],
	useCancelStockReceiptMutation: () => [mockCancelReceipt, { isLoading: false, error: undefined }],
	useGetInventoriesQuery: (...args: unknown[]) => mockUseGetInventoriesQuery(...args),
	useGetInventoryQuery: (...args: unknown[]) => mockUseGetInventoryQuery(...args),
	useCreateInventoryMutation: () => [mockCreateInventory, { isLoading: false, error: undefined }],
	useValidateInventoryMutation: () => [mockValidateInventory, { isLoading: false, error: undefined }],
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: () => undefined,
}));

jest.mock('@/utils/themes', () => ({
	textInputTheme: () => ({}),
}));

export const mockSession: AppSession = {
	accessToken: 'test-access-token',
	refreshToken: 'test-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		id: '1',
		pk: 1,
		email: 'stock@example.com',
		emailVerified: null,
		name: 'Stock User',
		first_name: 'Stock',
		last_name: 'User',
		image: null,
	},
};

export const setMockListRole = (role: string) => {
	mockListRole = role;
};

export const setMockCompanyRole = (role: string) => {
	mockCompanyRole = role;
};

beforeEach(() => {
	jest.clearAllMocks();
	mockListRole = 'Caissier';
	mockCompanyRole = 'Caissier';
	mockUseGetStockBalancesQuery.mockReturnValue({
		data: { count: 1, results: [mockBalance] },
		isLoading: false,
		isFetching: false,
	});
	mockUseGetStockBalanceQuery.mockReturnValue({ data: mockBalance, isLoading: false, isError: false });
	mockUseGetStockMovementsQuery.mockReturnValue({
		data: { count: 1, results: [mockMovement] },
		isLoading: false,
		isFetching: false,
	});
	mockUseGetStockMovementQuery.mockReturnValue({ data: mockMovement, isLoading: false, isError: false });
	mockUseGetStockReceiptsQuery.mockReturnValue({
		data: { count: 2, results: [mockDraftReceipt, mockValidatedReceipt] },
		isLoading: false,
		isFetching: false,
	});
	mockUseGetStockReceiptQuery.mockReturnValue({ data: mockDraftReceipt, isLoading: false, error: undefined });
	mockUseGetInventoriesQuery.mockReturnValue({
		data: { count: 1, results: [mockDraftInventory] },
		isLoading: false,
		isFetching: false,
	});
	mockUseGetInventoryQuery.mockReturnValue({ data: mockDraftInventory, isLoading: false, isError: false });
});
