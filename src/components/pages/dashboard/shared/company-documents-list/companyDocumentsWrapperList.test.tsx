import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyDocumentsWrapperList, { CompanyDocumentsListProps } from './companyDocumentsWrapperList';

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children?: React.ReactNode }) => <div data-testid="nav">{children}</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div>ApiProgressMock</div>,
}));

jest.mock('@/store/session', () => ({
	__esModule: true,
	getAccessTokenFromSession: jest.fn(),
}));

jest.mock('@/store/services/company', () => ({
	__esModule: true,
	useGetUserCompaniesQuery: jest.fn(),
}));

// Provide a stable mock for next/navigation::useRouter
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
	__esModule: true,
	useRouter: () => ({ push: pushMock }),
}));

import { getAccessTokenFromSession } from '@/store/session';
import { useGetUserCompaniesQuery } from '@/store/services/company';

const mockedGetAccessToken = getAccessTokenFromSession as jest.MockedFunction<typeof getAccessTokenFromSession>;
const mockedUseGetUserCompaniesQuery = useGetUserCompaniesQuery as jest.MockedFunction<
	(...args: unknown[]) => { data?: unknown; isLoading: boolean }
>;

const defaultProps: Partial<CompanyDocumentsListProps> = {
	session: {} as CompanyDocumentsListProps['session'],
	title: 'Documents',
};

describe('CompanyDocumentsList', () => {
	afterEach(() => {
		jest.clearAllMocks();
		cleanup();
	});

	test('shows ApiProgress while loading', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseGetUserCompaniesQuery.mockReturnValue({ data: undefined, isLoading: true });

		render(
			<CompanyDocumentsWrapperList {...(defaultProps as CompanyDocumentsListProps)}>
				{() => <div>child</div>}
			</CompanyDocumentsWrapperList>,
		);

		expect(screen.getByText('ApiProgressMock')).toBeInTheDocument();
	});

	test('renders empty state when no companies and shows admin branch correctly (no create button)', () => {
		mockedGetAccessToken.mockReturnValue('token');
		mockedUseGetUserCompaniesQuery.mockReturnValue({ data: [], isLoading: false });

		render(
			<CompanyDocumentsWrapperList {...(defaultProps as CompanyDocumentsListProps)}>
				{() => <div data-testid="child">child</div>}
			</CompanyDocumentsWrapperList>,
		);

		expect(screen.getByText('Aucune entreprise trouvée')).toBeInTheDocument();
		// Should show the "contactez votre administrateur" message (admin branch not taken)
		expect(screen.getByText(/Veuillez contacter votre administrateur/i)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Créer une entreprise/i })).not.toBeInTheDocument();
	});

	test('renders tabs and invokes children with selected company props', () => {
		mockedGetAccessToken.mockReturnValue('token');
		const companies = [
			{ id: 1, raison_sociale: 'Company One', role: 'Admin' },
			{ id: 2, raison_sociale: 'Company Two', role: 'User' },
		];
		mockedUseGetUserCompaniesQuery.mockReturnValue({ data: companies, isLoading: false });

		const childFn = jest.fn(({ company_id, role }: { company_id: number; role: string }) => (
			<div data-testid="child">
				id:{company_id} role:{role}
			</div>
		));

		render(
			<CompanyDocumentsWrapperList {...(defaultProps as CompanyDocumentsListProps)}>
				{childFn}
			</CompanyDocumentsWrapperList>,
		);

		// Tabs labels rendered
		expect(screen.getByText('Company One')).toBeInTheDocument();
		expect(screen.getByText('Company Two')).toBeInTheDocument();

		// Child rendered and called with first company (selectedIndex defaults to 0)
		expect(screen.getByTestId('child')).toHaveTextContent('id:1 role:Admin');
		expect(childFn).toHaveBeenCalledWith({ company_id: 1, role: 'Admin' });
	});
});
