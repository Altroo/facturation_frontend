import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import CompanyDocumentsWrapperView from './companyDocumentsWrapperView';
import type { CompanyDocumentsViewProps, CompanyDocumentData } from '@/types/companyDocumentsTypes';

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children?: React.ReactNode }) => <div data-testid="nav">{children}</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div>ApiProgressMock</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: ({ errorDetails }: { errorDetails?: unknown }) => (
		<div data-testid="api-alert">{errorDetails ? 'ApiAlertWithDetails' : 'ApiAlert'}</div>
	),
}));

jest.mock('@/components/shared/factureDevistotalCard/factureDevisTotalsCard', () => ({
	__esModule: true,
	default: () => <div data-testid="totals-card">TotalsCardMock</div>,
}));

jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children?: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
}));

jest.mock('next/image', () => ({
	__esModule: true,
	default: () => <div data-testid="next-image" />,
}));

jest.mock('@mui/x-data-grid', () => ({
	__esModule: true,
	DataGrid: ({ rows }: { rows: Array<unknown> }) => (
		<div data-testid="datagrid">rows:{Array.isArray(rows) ? rows.length : 0}</div>
	),
}));

jest.mock('@/components/pages/dashboard/devis/devis-list', () => ({
	__esModule: true,
	getStatutColor: () => 'default',
}));

jest.mock('@/utils/helpers', () => ({
	__esModule: true,
	formatDate: (d: unknown) => (d ? '01/01/2025' : ''),
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

jest.mock('@/store/session', () => ({
	__esModule: true,
	getAccessTokenFromSession: jest.fn(),
}));

jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useAppSelector: jest.fn(),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getUserCompaniesState: jest.fn(),
}));

jest.mock('@/store/services/article', () => ({
	__esModule: true,
	useGetArticlesListQuery: jest.fn(),
}));

jest.mock('@/store/services/company', () => ({
	__esModule: true,
	useGetCompanyQuery: jest.fn(() => ({ data: { uses_foreign_currency: false }, isLoading: false })),
}));

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
	__esModule: true,
	useRouter: () => ({ push: pushMock }),
}));

import { getAccessTokenFromSession } from '@/store/session';
import { useAppSelector } from '@/utils/hooks';
import { useGetArticlesListQuery } from '@/store/services/article';

const mockedGetAccessToken = getAccessTokenFromSession as jest.MockedFunction<typeof getAccessTokenFromSession>;
const mockedUseAppSelector = useAppSelector as jest.MockedFunction<typeof useAppSelector>;
const mockedUseGetArticlesListQuery = useGetArticlesListQuery as jest.MockedFunction<typeof useGetArticlesListQuery>;

type TestDoc = CompanyDocumentData & {
	numero?: string | null;
	date_doc?: string | null;
	terms?: string | null;
};

const buildProps = (overrides?: Partial<CompanyDocumentsViewProps<TestDoc>>): CompanyDocumentsViewProps<TestDoc> => {
	const base: CompanyDocumentsViewProps<TestDoc> = {
		session: {} as CompanyDocumentsViewProps<TestDoc>['session'],
		company_id: 1,
		id: 10,
		type: 'devis',
		title: 'Doc view',
		backLabel: 'Back',
		backTo: '/back',
		editTo: (id: number, companyId: number) => `/edit/${companyId}/${id}`,
		documentNumberLabel: 'Number',
		getDocumentNumber: (d) => d?.numero,
		documentDateLabel: 'Date',
		getDocumentDateRaw: (d) => d?.date_doc,
		statusTitle: 'Status',
		linesTitle: 'Lines',
		termsSecondLabel: 'Terms2',
		getTermsSecondValue: (d) => d?.terms,
		query: { data: undefined, isLoading: false, error: undefined },
	};
	return { ...base, ...overrides };
};

describe('CompanyDocumentsView', () => {
	afterEach(() => {
		jest.clearAllMocks();
		cleanup();
	});

	test('shows ApiProgress while loading', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: { data: undefined, isLoading: true, error: undefined },
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByText('ApiProgressMock')).toBeInTheDocument();
	});

	test('shows ApiAlert when error status \\> 400', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const errorObj = { status: 500, data: { details: 'boom' } };

		const props = buildProps({
			query: { data: undefined, isLoading: false, error: errorObj },
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByTestId('api-alert')).toBeInTheDocument();
	});

	test('renders content and shows \\`Modifier\\` button for Caissier, clicking navigates to edit route', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: {
				isLoading: false,
				error: undefined,
				data: {
					statut: 'Brouillon',
					numero: 'D\\-001',
					date_doc: '2025\\-01\\-01',
					client_name: 'Client A',
					mode_paiement_name: 'Cash',
					terms: 'T\\-01',
					lignes: [{ article: 1, designation: 'Item', prix_vente: 10, quantity: 2 }],
				},
			},
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByTestId('totals-card')).toBeInTheDocument();
		expect(screen.getByTestId('datagrid')).toHaveTextContent('rows:1');
		expect(screen.getByText('Client A')).toBeInTheDocument();

		const editBtn = screen.getByRole('button', { name: /Modifier/i });
		fireEvent.click(editBtn);

		expect(pushMock).toHaveBeenCalledWith('/edit/1/10');
	});

	test('does not show \\`Modifier\\` button for Lecture', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Lecture' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: { isLoading: false, error: undefined, data: { statut: 'Brouillon', lignes: [] } },
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.queryByRole('button', { name: /Modifier/i })).not.toBeInTheDocument();
	});

	test('clicking back button navigates to back route', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			backTo: '/documents',
			query: { isLoading: false, error: undefined, data: { statut: 'Brouillon', lignes: [] } },
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		fireEvent.click(screen.getByRole('button', { name: 'Back' }));
		expect(pushMock).toHaveBeenCalledWith('/documents');
	});

	test('shows Modifier button for Commercial role', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Commercial' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: { isLoading: false, error: undefined, data: { statut: 'Brouillon', lignes: [] } },
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByRole('button', { name: /Modifier/i })).toBeInTheDocument();
	});

	test('shows ApiProgress when articles are loading', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: true } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: { data: { statut: 'Brouillon', lignes: [] }, isLoading: false, error: undefined },
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByText('ApiProgressMock')).toBeInTheDocument();
	});

	test('renders Livré par field for bon-de-livraison type', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			type: 'bon-de-livraison',
			query: {
				isLoading: false,
				error: undefined,
				data: { statut: 'Brouillon', lignes: [], livre_par_name: 'Transporteur A' },
			},
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByText('Livré par')).toBeInTheDocument();
		expect(screen.getByText('Transporteur A')).toBeInTheDocument();
	});

	test('renders global remise card when remise is positive and has type', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: {
				isLoading: false,
				error: undefined,
				data: {
					statut: 'Brouillon',
					lignes: [],
					remise: 10,
					remise_type: 'Pourcentage',
				},
			},
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByText('Remise globale')).toBeInTheDocument();
		expect(screen.getByText('10%')).toBeInTheDocument();
	});

	test('renders global remise card with fixed type', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: {
				isLoading: false,
				error: undefined,
				data: {
					statut: 'Brouillon',
					lignes: [],
					remise: 500,
					remise_type: 'Fixe',
				},
			},
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByText('Remise globale')).toBeInTheDocument();
		expect(screen.getByText('500 MAD')).toBeInTheDocument();
	});

	test('renders remarque card when remarque is provided', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: {
				isLoading: false,
				error: undefined,
				data: {
					statut: 'Brouillon',
					lignes: [],
					remarque: 'Important note about this document',
				},
			},
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		const remarqueElements = screen.getAllByText('Remarque');
		expect(remarqueElements.length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText('Important note about this document')).toBeInTheDocument();
	});

	test('does not render remarque card when remarque is empty', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: {
				isLoading: false,
				error: undefined,
				data: {
					statut: 'Brouillon',
					lignes: [],
					remarque: '',
				},
			},
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		// The Remarque card should not be rendered - no card with h6 containing Remarque
		const remarqueHeaders = screen.queryAllByRole('heading', { name: 'Remarque' });
		expect(remarqueHeaders.length).toBe(0);
	});

	test('handles data with server totals', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: {
				isLoading: false,
				error: undefined,
				data: {
					statut: 'Validée',
					lignes: [],
					total_ht: 10000,
					total_tva: 2000,
					total_ttc: 12000,
					total_ttc_apres_remise: 11500,
				},
			},
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByTestId('totals-card')).toBeInTheDocument();
	});

	test('renders lines in data grid with article details', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({
			data: [
				{ id: 1, reference: 'REF-001', marque_name: 'Brand A', categorie_name: 'Cat1', tva: 20, photo: 'photo.jpg' },
				{ id: 2, reference: 'REF-002', marque_name: 'Brand B', categorie_name: 'Cat2', tva: 20 },
			],
			isLoading: false,
		} as unknown as ReturnType<typeof useGetArticlesListQuery>);

		const props = buildProps({
			query: {
				isLoading: false,
				error: undefined,
				data: {
					statut: 'Brouillon',
					lignes: [
						{ article: 1, designation: 'Item 1', prix_vente: 100, quantity: 2, remise: 10, remise_type: 'Pourcentage' },
						{ article: 2, designation: 'Item 2', prix_vente: 50, quantity: 1, remise: 5, remise_type: 'Fixe' },
					],
				},
			},
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByTestId('datagrid')).toHaveTextContent('rows:2');
	});

	test('handles system info display with dates', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);
		mockedUseGetArticlesListQuery.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
			typeof useGetArticlesListQuery
		>);

		const props = buildProps({
			query: {
				isLoading: false,
				error: undefined,
				data: {
					statut: 'Brouillon',
					lignes: [],
					date_created: '2025-01-15T10:00:00Z',
					date_updated: '2025-01-20T14:30:00Z',
					created_by_user_name: 'Admin User',
				},
			},
		});

		render(<CompanyDocumentsWrapperView<TestDoc> {...props} />);

		expect(screen.getByText('Informations système')).toBeInTheDocument();
		expect(screen.getByText('Date de création')).toBeInTheDocument();
		expect(screen.getByText('Admin User')).toBeInTheDocument();
	});
});
