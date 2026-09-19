import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonthlyObjectivesView from './monthly-objectives-view';
import { fr as mockFrenchTranslations } from '@/translations/fr';
import type { AppSession } from '@/types/_initTypes';

const mockCreateObjectives = jest.fn();
const mockUpdateObjectives = jest.fn();
const mockGetObjectives = jest.fn();
const mockGetCompanies = jest.fn();
const mockUseAppSelector = jest.fn();
const mockUseCreateObjectives = jest.fn();
const mockUseUpdateObjectives = jest.fn();

jest.mock('@/contexts/InitContext', () => ({
	__esModule: true,
	useInitAccessToken: () => 'test-token',
}));

jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
	useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args),
	useLanguage: () => ({ language: 'fr' as const, setLanguage: jest.fn(), t: mockFrenchTranslations }),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getProfilState: jest.fn(),
}));

jest.mock('@/store/services/company', () => ({
	__esModule: true,
	useGetUserCompaniesQuery: (...args: unknown[]) => mockGetCompanies(...args),
}));

jest.mock('@/store/services/dashboard', () => ({
	__esModule: true,
	useGetMonthlyObjectivesSettingsByCompanyQuery: (...args: unknown[]) => mockGetObjectives(...args),
	useCreateMonthlyObjectivesSettingsMutation: () => mockUseCreateObjectives(),
	useUpdateMonthlyObjectivesSettingsMutation: () => mockUseUpdateObjectives(),
}));

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

jest.mock('@/components/shared/noPermission/noPermission', () => ({
	__esModule: true,
	default: () => <div data-testid="no-permission">Accès refusé</div>,
}));

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
	default: ({ buttonText }: { buttonText: string }) => <button data-testid="submit-button">{buttonText}</button>,
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: () => <div data-testid="api-alert">Error</div>,
}));

jest.mock('@/utils/themes', () => ({ textInputTheme: jest.fn(() => ({})) }));
jest.mock('@/utils/formValidationSchemas', () => ({ monthlyObjectivesSchema: { parse: jest.fn() } }));
jest.mock('zod-formik-adapter', () => ({ toFormikValidationSchema: jest.fn(() => undefined) }));
jest.mock('@/utils/helpers', () => ({
	parseNumber: jest.fn((value: string) => {
		const number = parseFloat(value);
		return Number.isNaN(number) ? null : number;
	}),
	setFormikAutoErrors: jest.fn(),
	getLabelForKey: jest.fn((labels: Record<string, string>, key: string) => labels[key] || key),
}));

const existingObjectives = {
	id: 1,
	company: 1,
	objectif_ca: '10000',
	objectif_ca_eur: null,
	objectif_ca_usd: null,
	objectif_factures: 50,
	objectif_conversion: '25',
	date_created: '2026-01-01T00:00:00Z',
	date_updated: '2026-01-01T00:00:00Z',
};

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
		mockUseAppSelector.mockReturnValue({ is_staff: true });
		mockGetCompanies.mockReturnValue({
			data: [{ id: 1, uses_foreign_currency: false }],
			isLoading: false,
		});
		mockGetObjectives.mockReturnValue({
			data: existingObjectives,
			isLoading: false,
			error: undefined,
		});
		mockUseCreateObjectives.mockReturnValue([
			mockCreateObjectives,
			{ isLoading: false, error: undefined },
		]);
		mockUseUpdateObjectives.mockReturnValue([
			mockUpdateObjectives,
			{ isLoading: false, error: undefined },
		]);
	});

	afterEach(cleanup);

	it('renders the existing objectives form and loads the selected company directly', () => {
		render(<MonthlyObjectivesView session={mockSession} />);

		expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		expect(screen.getByText('Paramètres - Objectifs Mensuels')).toBeInTheDocument();
		expect(screen.getByText('Objectifs Mensuels')).toBeInTheDocument();
		expect(screen.getByTestId('input-objectif_ca')).toBeInTheDocument();
		expect(screen.getByTestId('input-objectif_factures')).toBeInTheDocument();
		expect(screen.getByTestId('input-objectif_conversion')).toBeInTheDocument();
		expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		expect(mockGetObjectives).toHaveBeenCalledWith(1, { skip: false });
	});

	it('uses create mode when the company has no objectives', () => {
		mockGetObjectives.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: { status: 404, data: { detail: 'Not found' } },
		});

		render(<MonthlyObjectivesView session={mockSession} />);

		expect(screen.getByTestId('submit-button')).toHaveTextContent('Créer les objectifs');
		expect(screen.queryByTestId('api-alert')).not.toBeInTheDocument();
	});

	it('renders NoPermission when user is not staff', () => {
		mockUseAppSelector.mockReturnValue({ is_staff: false });

		render(<MonthlyObjectivesView session={mockSession} />);

		expect(screen.getByTestId('no-permission')).toBeInTheDocument();
	});

	it('renders the loader while the company objectives are loading', () => {
		mockGetObjectives.mockReturnValue({ data: undefined, isLoading: true, error: undefined });

		render(<MonthlyObjectivesView session={mockSession} />);

		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders an API error for a request failure other than not found', () => {
		mockGetObjectives.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: { status: 500, data: { details: 'Server error' } },
		});

		render(<MonthlyObjectivesView session={mockSession} />);

		expect(screen.getByTestId('api-alert')).toBeInTheDocument();
	});

	it('renders foreign-currency objectives when the company uses them', () => {
		mockGetCompanies.mockReturnValue({
			data: [{ id: 1, uses_foreign_currency: true }],
			isLoading: false,
		});
		mockGetObjectives.mockReturnValue({
			data: { ...existingObjectives, objectif_ca_eur: '5000', objectif_ca_usd: '6000' },
			isLoading: false,
			error: undefined,
		});

		render(<MonthlyObjectivesView session={mockSession} />);

		expect(screen.getByTestId('input-objectif_ca_eur')).toBeInTheDocument();
		expect(screen.getByTestId('input-objectif_ca_usd')).toBeInTheDocument();
	});

	it('renders without company metadata', () => {
		mockGetCompanies.mockReturnValue({ data: undefined, isLoading: false });

		render(<MonthlyObjectivesView session={mockSession} />);

		expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		expect(screen.queryByTestId('input-objectif_ca_eur')).not.toBeInTheDocument();
	});

	it('renders the loader while creating objectives', () => {
		mockGetObjectives.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: { status: 404, data: { detail: 'Not found' } },
		});
		mockUseCreateObjectives.mockReturnValue([
			mockCreateObjectives,
			{ isLoading: true, error: undefined },
		]);

		render(<MonthlyObjectivesView session={mockSession} />);

		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders the loader while updating objectives', () => {
		mockUseUpdateObjectives.mockReturnValue([
			mockUpdateObjectives,
			{ isLoading: true, error: undefined },
		]);

		render(<MonthlyObjectivesView session={mockSession} />);

		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders objectives whose optional values are null', () => {
		mockGetObjectives.mockReturnValue({
			data: {
				...existingObjectives,
				objectif_ca: null,
				objectif_ca_eur: null,
				objectif_ca_usd: null,
				objectif_factures: null,
				objectif_conversion: null,
			},
			isLoading: false,
			error: undefined,
		});

		render(<MonthlyObjectivesView session={mockSession} />);

		expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
	});
});
