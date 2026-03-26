import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';

// Mock InitContext
jest.mock('@/contexts/InitContext', () => ({
	__esModule: true,
	useInitAccessToken: () => 'test-token',
}));

// Mock hooks
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useToast: () => ({
		onSuccess: jest.fn(),
		onError: jest.fn(),
	}),
	useAppSelector: jest.fn(() => ({ is_staff: true })),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getProfilState: jest.fn(),
}));

// Mock RTK Query hooks
const mockCreateObjectives = jest.fn();
const mockUpdateObjectives = jest.fn();

jest.mock('@/store/services/company', () => ({
	__esModule: true,
	useGetUserCompaniesQuery: jest.fn(() => ({
		data: [{ id: 1, uses_foreign_currency: false }],
		isLoading: false,
	})),
}));

jest.mock('@/store/services/dashboard', () => ({
	__esModule: true,
	useGetAllMonthlyObjectivesSettingsQuery: jest.fn(() => ({
		data: [
			{
				id: 1,
				company: 1,
				objectif_ca: '10000',
				objectif_factures: 50,
				objectif_conversion: '25',
			},
		],
		isLoading: false,
	})),
	useCreateMonthlyObjectivesSettingsMutation: () => [mockCreateObjectives, { isLoading: false, error: undefined }],
	useUpdateMonthlyObjectivesSettingsMutation: () => [mockUpdateObjectives, { isLoading: false, error: undefined }],
}));

// Mock CompanyDocumentsWrapperList
jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => ({
	__esModule: true,
	default: ({
		children,
		title,
	}: {
		children: (props: { company_id: number; role: string }) => React.ReactNode;
		title: string;
	}) => (
		<div data-testid="company-wrapper">
			<h1>{title}</h1>
			{children({ company_id: 1, role: 'Caissier' })}
		</div>
	),
}));

// Mock NoPermission
jest.mock('@/components/shared/noPermission/noPermission', () => ({
	__esModule: true,
	default: () => <div data-testid="no-permission">Accès refusé</div>,
}));

// Mock form sub-components
jest.mock('@/components/formikElements/formattedNumberInput/formattedNumberInput', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText }: { buttonText: string }) => (
		<button data-testid="submit-button">{buttonText}</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: () => <div data-testid="api-alert">Error</div>,
}));

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	monthlyObjectivesSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/helpers', () => ({
	parseNumber: jest.fn((val: string) => {
		const n = parseFloat(val);
		return Number.isNaN(n) ? null : n;
	}),
	setFormikAutoErrors: jest.fn(),
	getLabelForKey: jest.fn((labels: Record<string, string>, key: string) => labels[key] || key),
}));

// Import after mocks
import MonthlyObjectivesView from './monthly-objectives-view';

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
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

describe('MonthlyObjectivesView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the wrapper with correct title', () => {
		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		expect(screen.getByText('Paramètres - Objectifs Mensuels')).toBeInTheDocument();
	});

	it('renders the section title "Objectifs Mensuels"', () => {
		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByText('Objectifs Mensuels')).toBeInTheDocument();
	});

	it('renders objectif CA input', () => {
		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('input-objectif_ca')).toBeInTheDocument();
	});

	it('renders objectif factures input', () => {
		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('input-objectif_factures')).toBeInTheDocument();
	});

	it('renders objectif conversion input', () => {
		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('input-objectif_conversion')).toBeInTheDocument();
	});

	it('renders submit button with "Mettre à jour" when objectives exist', () => {
		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
	});

	it('renders submit button with "Créer les objectifs" when no objectives exist', () => {
		const { useGetAllMonthlyObjectivesSettingsQuery } = jest.requireMock('@/store/services/dashboard') as {
			useGetAllMonthlyObjectivesSettingsQuery: jest.Mock;
		};
		useGetAllMonthlyObjectivesSettingsQuery.mockReturnValueOnce({
			data: [],
			isLoading: false,
		});

		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('submit-button')).toHaveTextContent('Créer les objectifs');
	});

	it('renders NoPermission when user is not staff', () => {
		const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
		useAppSelector.mockReturnValueOnce({ is_staff: false });

		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('no-permission')).toBeInTheDocument();
	});

	it('renders loading state when objectives are loading', () => {
		const { useGetAllMonthlyObjectivesSettingsQuery } = jest.requireMock('@/store/services/dashboard') as {
			useGetAllMonthlyObjectivesSettingsQuery: jest.Mock;
		};
		useGetAllMonthlyObjectivesSettingsQuery.mockReturnValueOnce({
			data: undefined,
			isLoading: true,
		});

		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders with foreign currency fields when company uses foreign currency', () => {
		const companyService = jest.requireMock('@/store/services/company') as {
			useGetUserCompaniesQuery: jest.Mock;
		};
		companyService.useGetUserCompaniesQuery.mockReturnValue({
			data: [{ id: 1, uses_foreign_currency: true }],
			isLoading: false,
		});

		const dashboardService = jest.requireMock('@/store/services/dashboard') as {
			useGetAllMonthlyObjectivesSettingsQuery: jest.Mock;
		};
		dashboardService.useGetAllMonthlyObjectivesSettingsQuery.mockReturnValue({
			data: [
				{
					id: 1,
					company: 1,
					objectif_ca: '10000',
					objectif_ca_eur: '5000',
					objectif_ca_usd: '6000',
					objectif_factures: 50,
					objectif_conversion: '25',
				},
			],
			isLoading: false,
		});

		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('input-objectif_ca')).toBeInTheDocument();
		expect(screen.getByTestId('input-objectif_ca_eur')).toBeInTheDocument();
		expect(screen.getByTestId('input-objectif_ca_usd')).toBeInTheDocument();

		// Restore defaults
		companyService.useGetUserCompaniesQuery.mockReturnValue({
			data: [{ id: 1, uses_foreign_currency: false }],
			isLoading: false,
		});
	});

	it('renders create mode when objectives is empty array and no match for company', () => {
		const dashboardService = jest.requireMock('@/store/services/dashboard') as {
			useGetAllMonthlyObjectivesSettingsQuery: jest.Mock;
		};
		dashboardService.useGetAllMonthlyObjectivesSettingsQuery.mockReturnValue({
			data: [{ id: 2, company: 99, objectif_ca: '5000', objectif_factures: 20, objectif_conversion: '10' }],
			isLoading: false,
		});

		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('submit-button')).toHaveTextContent('Créer les objectifs');
	});

	it('renders without companies data', () => {
		const companyService = jest.requireMock('@/store/services/company') as {
			useGetUserCompaniesQuery: jest.Mock;
		};
		companyService.useGetUserCompaniesQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
		});

		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();

		// Restore
		companyService.useGetUserCompaniesQuery.mockReturnValue({
			data: [{ id: 1, uses_foreign_currency: false }],
			isLoading: false,
		});
	});

	it('renders when companies is loading', () => {
		const companyService = jest.requireMock('@/store/services/company') as {
			useGetUserCompaniesQuery: jest.Mock;
		};
		companyService.useGetUserCompaniesQuery.mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		render(<MonthlyObjectivesView session={mockSession} />);
		// The wrapper still renders, even when loading
		expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();

		// Restore
		companyService.useGetUserCompaniesQuery.mockReturnValue({
			data: [{ id: 1, uses_foreign_currency: false }],
			isLoading: false,
		});
	});

	it('handles create mutation loading state', () => {
		const dashboardService = jest.requireMock('@/store/services/dashboard') as {
			useGetAllMonthlyObjectivesSettingsQuery: jest.Mock;
			useCreateMonthlyObjectivesSettingsMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
		};
		dashboardService.useGetAllMonthlyObjectivesSettingsQuery.mockReturnValue({
			data: [],
			isLoading: false,
		});
		const mockMutate = jest.fn();
		dashboardService.useCreateMonthlyObjectivesSettingsMutation = () => [mockMutate, { isLoading: true, error: undefined }];

		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('handles update mutation loading state', () => {
		const dashboardService = jest.requireMock('@/store/services/dashboard') as {
			useGetAllMonthlyObjectivesSettingsQuery: jest.Mock;
			useUpdateMonthlyObjectivesSettingsMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
		};
		dashboardService.useGetAllMonthlyObjectivesSettingsQuery.mockReturnValue({
			data: [{ id: 1, company: 1, objectif_ca: '10000', objectif_factures: 50, objectif_conversion: '25' }],
			isLoading: false,
		});
		const mockMutate = jest.fn();
		dashboardService.useUpdateMonthlyObjectivesSettingsMutation = () => [mockMutate, { isLoading: true, error: undefined }];

		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders with objectives data having null optional fields', () => {
		const dashboardService = jest.requireMock('@/store/services/dashboard') as {
			useGetAllMonthlyObjectivesSettingsQuery: jest.Mock;
		};
		dashboardService.useGetAllMonthlyObjectivesSettingsQuery.mockReturnValue({
			data: [
				{
					id: 1,
					company: 1,
					objectif_ca: null,
					objectif_ca_eur: null,
					objectif_ca_usd: null,
					objectif_factures: null,
					objectif_conversion: null,
				},
			],
			isLoading: false,
		});

		render(<MonthlyObjectivesView session={mockSession} />);
		// Even with null fields, the component should render
		expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
	});

	it('renders with multiple companies and selects correct one', () => {
		const companyService = jest.requireMock('@/store/services/company') as {
			useGetUserCompaniesQuery: jest.Mock;
		};
		companyService.useGetUserCompaniesQuery.mockReturnValue({
			data: [
				{ id: 1, uses_foreign_currency: false },
				{ id: 2, uses_foreign_currency: true },
			],
			isLoading: false,
		});

		const dashboardService = jest.requireMock('@/store/services/dashboard') as {
			useGetAllMonthlyObjectivesSettingsQuery: jest.Mock;
		};
		dashboardService.useGetAllMonthlyObjectivesSettingsQuery.mockReturnValue({
			data: [
				{ id: 1, company: 1, objectif_ca: '10000', objectif_factures: 50, objectif_conversion: '25' },
				{ id: 2, company: 2, objectif_ca: '20000', objectif_factures: 100, objectif_conversion: '30' },
			],
			isLoading: false,
		});

		render(<MonthlyObjectivesView session={mockSession} />);
		expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();

		// Restore
		companyService.useGetUserCompaniesQuery.mockReturnValue({
			data: [{ id: 1, uses_foreign_currency: false }],
			isLoading: false,
		});
	});
});
