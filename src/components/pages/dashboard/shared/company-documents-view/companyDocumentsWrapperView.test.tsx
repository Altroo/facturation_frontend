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
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Admin' }]);
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
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Admin' }]);
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

	test('renders content and shows \\`Modifier\\` button for Admin, clicking navigates to edit route', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Admin' }]);
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

	test('does not show \\`Modifier\\` button for non\\-Admin', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'User' }]);
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
		mockedUseAppSelector.mockReturnValue([{ id: 1, role: 'Admin' }]);
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
});
