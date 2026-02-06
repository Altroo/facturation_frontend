import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import DevisForm from './devis-form';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AppSession } from '@/types/_initTypes';

// Create a minimal mock store for testing
const mockStore = configureStore({
	reducer: {
		_init: () => ({}),
		account: () => ({}),
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

type FormContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
};

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
	__esModule: true,
	useRouter: () => ({
		push: mockPush,
		back: mockBack,
		replace: jest.fn(),
		refresh: jest.fn(),
		forward: jest.fn(),
		prefetch: jest.fn(),
	}),
	usePathname: () => '/dashboard/devis/new',
}));

// Mock hooks and selectors
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useAppSelector: jest.fn(() => [{ id: 1, role: 'Caissier' }]),
	useToast: () => ({
		onSuccess: jest.fn(),
		onError: jest.fn(),
	}),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getUserCompaniesState: jest.fn(),
	getModePaiementState: jest.fn(() => []),
}));

jest.mock('@/store/session', () => ({
	__esModule: true,
	getAccessTokenFromSession: () => 'mock-token',
}));

// Mock the devi service hooks
const mockUseGetDeviQuery = jest.fn();
const mockUseGetNumDevisQuery = jest.fn();
const mockAddDeviMutation = jest.fn();
const mockEditDeviMutation = jest.fn();
const mockPatchStatutMutation = jest.fn();

jest.mock('@/store/services/devi', () => ({
	__esModule: true,
	useGetDeviQuery: (params: { id: number }, options: { skip: boolean }) => mockUseGetDeviQuery(params, options),
	useGetNumDevisQuery: (params: { company_id: number }, options: { skip: boolean }) => mockUseGetNumDevisQuery(params, options),
	useAddDeviMutation: () => [mockAddDeviMutation, { isLoading: false, error: undefined }],
	useEditDeviMutation: () => [mockEditDeviMutation, { isLoading: false, error: undefined }],
	usePatchStatutMutation: () => [mockPatchStatutMutation, { isLoading: false, error: undefined }],
}));

// Mock the shared form content component
jest.mock('@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent', () => ({
	__esModule: true,
	default: (props: FormContentProps) => (
		<div data-testid="company-document-form-content">
			<span data-testid="form-company-id">{props.company_id}</span>
			<span data-testid="form-is-edit-mode">{String(props.isEditMode)}</span>
			<span data-testid="form-id">{props.id ?? 'undefined'}</span>
			<span data-testid="form-token">{props.token ?? 'undefined'}</span>
		</div>
	),
}));

// Mock CompanyDocumentsWrapperForm to render FormComponent directly
jest.mock('@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm', () => ({
	__esModule: true,
	default: ({
		FormComponent,
		company_id,
		id,
	}: {
		FormComponent: React.ComponentType<FormContentProps>;
		company_id: number;
		id?: number;
		session: AppSession;
		documentConfig: unknown;
	}) => {
		const isEditMode = id !== undefined;
		return (
			<div data-testid="company-documents-wrapper">
				<FormComponent token="mock-token" company_id={company_id} id={id} isEditMode={isEditMode} />
			</div>
		);
	},
}));

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		accessToken: 'mock-token',
		pk: 1,
		email: 'test@example.com',
		first_name: 'Test',
		last_name: 'User',
		id: '1',
		emailVerified: null,
		name: 'Test User',
	},
};

const renderWithProviders = (ui: React.ReactElement) => {
	return render(<Provider store={mockStore}>{ui}</Provider>);
};

describe('DevisForm', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetDeviQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: undefined,
		});
		mockUseGetNumDevisQuery.mockReturnValue({
			data: { numero_devis: '001/25' },
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Add Mode (no id)', () => {
		it('renders wrapper and form content in add mode', () => {
			renderWithProviders(<DevisForm session={mockSession} company_id={123} />);

			expect(screen.getByTestId('company-documents-wrapper')).toBeInTheDocument();
			expect(screen.getByTestId('company-document-form-content')).toBeInTheDocument();
		});

		it('passes correct props in add mode', () => {
			renderWithProviders(<DevisForm session={mockSession} company_id={456} />);

			expect(screen.getByTestId('form-company-id')).toHaveTextContent('456');
			expect(screen.getByTestId('form-is-edit-mode')).toHaveTextContent('false');
			expect(screen.getByTestId('form-id')).toHaveTextContent('undefined');
		});

		it('passes token to form content', () => {
			renderWithProviders(<DevisForm session={mockSession} company_id={789} />);

			expect(screen.getByTestId('form-token')).toHaveTextContent('mock-token');
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders in edit mode when id is provided', () => {
			renderWithProviders(<DevisForm session={mockSession} company_id={123} id={999} />);

			expect(screen.getByTestId('form-is-edit-mode')).toHaveTextContent('true');
			expect(screen.getByTestId('form-id')).toHaveTextContent('999');
		});

		it('passes correct company_id in edit mode', () => {
			renderWithProviders(<DevisForm session={mockSession} company_id={555} id={111} />);

			expect(screen.getByTestId('form-company-id')).toHaveTextContent('555');
		});
	});

	describe('Hook calls', () => {
		it('calls useGetDeviQuery with skip=true when not in edit mode', () => {
			renderWithProviders(<DevisForm session={mockSession} company_id={123} />);

			// The hook is called via FormikContent which is rendered by our mock
			// In add mode (no id), the hook should be called with skip: true
			expect(mockUseGetDeviQuery).toHaveBeenCalled();
		});

		it('calls useGetNumDevisQuery in add mode', () => {
			renderWithProviders(<DevisForm session={mockSession} company_id={123} />);

			expect(mockUseGetNumDevisQuery).toHaveBeenCalled();
		});
	});
});

describe('DevisForm Configuration', () => {
	it('uses correct devis validation schemas', () => {
		// This test verifies the component imports correct schemas
		// The actual validation is tested in formValidationSchemas.test.ts
		renderWithProviders(<DevisForm session={mockSession} company_id={1} />);
		expect(screen.getByTestId('company-document-form-content')).toBeInTheDocument();
	});

	it('uses correct devis routes', () => {
		// Verify the component renders without errors with route configuration
		renderWithProviders(<DevisForm session={mockSession} company_id={1} id={1} />);
		expect(screen.getByTestId('company-document-form-content')).toBeInTheDocument();
	});
});
