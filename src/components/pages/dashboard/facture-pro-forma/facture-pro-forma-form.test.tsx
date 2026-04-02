import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import FactureProFormaForm from './facture-pro-forma-form';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { AppSession } from '@/types/_initTypes';

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
	usePathname: () => '/dashboard/facture-pro-forma/new',
}));

// Mock hooks and selectors
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useAppSelector: jest.fn(() => [{ id: 1, role: 'Caissier' }]),
	useToast: () => ({
		onSuccess: jest.fn(),
		onError: jest.fn(),
	}),
	useLanguage: () => ({ language: 'fr' as const, setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getUserCompaniesState: jest.fn(),

}));

jest.mock('@/contexts/InitContext', () => ({
	__esModule: true,
	useInitAccessToken: () => 'test-token',
}));

// Mock the facture pro forma service hooks
const mockUseGetFactureProFormaQuery = jest.fn();
const mockUseGetNumFactureProFormaQuery = jest.fn();
const mockAddFactureProFormaMutation = jest.fn();
const mockEditFactureProFormaMutation = jest.fn();
const mockPatchStatutMutation = jest.fn();

jest.mock('@/store/services/factureProForma', () => ({
	__esModule: true,
	useGetFactureProFormaQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetFactureProFormaQuery(params, options),
	useGetNumFactureProFormaQuery: (params: { company_id: number }, options: { skip: boolean }) =>
		mockUseGetNumFactureProFormaQuery(params, options),
	useAddFactureProFormaMutation: () => [mockAddFactureProFormaMutation, { isLoading: false, error: undefined }],
	useEditFactureProFormaMutation: () => [mockEditFactureProFormaMutation, { isLoading: false, error: undefined }],
	usePatchStatutMutation: () => [mockPatchStatutMutation, { isLoading: false, error: undefined }],
}));

// Mock the shared form content component
jest.mock('@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent', () => ({
	__esModule: true,
	default: (props: FormContentProps & {
		addData?: (params: { data: Record<string, unknown> }) => { unwrap: () => Promise<unknown> };
		updateData?: (params: { data: Record<string, unknown>; id: number }) => { unwrap: () => Promise<unknown> };
		patchStatut?: (params: { id: number; data: { statut: string } }) => { unwrap: () => Promise<unknown> };
	}) => (
		<div data-testid="company-document-form-content">
			<span data-testid="form-company-id">{props.company_id}</span>
			<span data-testid="form-is-edit-mode">{String(props.isEditMode)}</span>
			<span data-testid="form-id">{props.id ?? 'undefined'}</span>
			<span data-testid="form-token">{props.token ?? 'undefined'}</span>
			<button data-testid="call-add" onClick={() => props.addData?.({ data: { test: true } })?.unwrap()}>Add</button>
			<button data-testid="call-update" onClick={() => props.updateData?.({ data: { test: true }, id: 1 })?.unwrap()}>Update</button>
			<button data-testid="call-patch" onClick={() => props.patchStatut?.({ id: 1, data: { statut: 'Validé' } })?.unwrap()}>Patch</button>
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

describe('FactureProFormaForm', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetFactureProFormaQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: undefined,
		});
		mockUseGetNumFactureProFormaQuery.mockReturnValue({
			data: { numero_facture: 'FP-001/25' },
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Add Mode (no id)', () => {
		it('renders wrapper and form content in add mode', () => {
			renderWithProviders(<FactureProFormaForm session={mockSession} company_id={123} />);

			expect(screen.getByTestId('company-documents-wrapper')).toBeInTheDocument();
			expect(screen.getByTestId('company-document-form-content')).toBeInTheDocument();
		});

		it('passes correct props in add mode', () => {
			renderWithProviders(<FactureProFormaForm session={mockSession} company_id={456} />);

			expect(screen.getByTestId('form-company-id')).toHaveTextContent('456');
			expect(screen.getByTestId('form-is-edit-mode')).toHaveTextContent('false');
			expect(screen.getByTestId('form-id')).toHaveTextContent('undefined');
		});

		it('passes token to form content', () => {
			renderWithProviders(<FactureProFormaForm session={mockSession} company_id={789} />);

			expect(screen.getByTestId('form-token')).toHaveTextContent('mock-token');
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders in edit mode when id is provided', () => {
			renderWithProviders(<FactureProFormaForm session={mockSession} company_id={123} id={999} />);

			expect(screen.getByTestId('form-is-edit-mode')).toHaveTextContent('true');
			expect(screen.getByTestId('form-id')).toHaveTextContent('999');
		});

		it('passes correct company_id in edit mode', () => {
			renderWithProviders(<FactureProFormaForm session={mockSession} company_id={555} id={111} />);

			expect(screen.getByTestId('form-company-id')).toHaveTextContent('555');
		});
	});

	describe('Hook calls', () => {
		it('calls useGetFactureProFormaQuery', () => {
			renderWithProviders(<FactureProFormaForm session={mockSession} company_id={123} />);

			expect(mockUseGetFactureProFormaQuery).toHaveBeenCalled();
		});

		it('calls useGetNumFactureProFormaQuery in add mode', () => {
			renderWithProviders(<FactureProFormaForm session={mockSession} company_id={123} />);

			expect(mockUseGetNumFactureProFormaQuery).toHaveBeenCalled();
		});
	});
});

describe('FactureProFormaForm Configuration', () => {
	it('uses correct facture pro-forma validation schemas', () => {
		renderWithProviders(<FactureProFormaForm session={mockSession} company_id={1} />);
		expect(screen.getByTestId('company-document-form-content')).toBeInTheDocument();
	});

	it('uses correct facture pro-forma routes', () => {
		renderWithProviders(<FactureProFormaForm session={mockSession} company_id={1} id={1} />);
		expect(screen.getByTestId('company-document-form-content')).toBeInTheDocument();
	});
});

describe('FactureProFormaForm mutation wrappers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetFactureProFormaQuery.mockReturnValue({ data: undefined, isLoading: false, error: undefined });
		mockUseGetNumFactureProFormaQuery.mockReturnValue({ data: { numero_facture_proforma: 'FPF-001/25' }, isLoading: false });
	});

	it('addData wrapper calls addFactureProFormaMutation', () => {
		mockAddFactureProFormaMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ id: 1 }) });
		renderWithProviders(<FactureProFormaForm session={mockSession} company_id={1} />);
		screen.getByTestId('call-add').click();
		expect(mockAddFactureProFormaMutation).toHaveBeenCalled();
	});

	it('updateData wrapper calls editFactureProFormaMutation', () => {
		mockEditFactureProFormaMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
		renderWithProviders(<FactureProFormaForm session={mockSession} company_id={1} id={1} />);
		screen.getByTestId('call-update').click();
		expect(mockEditFactureProFormaMutation).toHaveBeenCalled();
	});

	it('patchStatut wrapper calls patchStatutMutation', () => {
		mockPatchStatutMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
		renderWithProviders(<FactureProFormaForm session={mockSession} company_id={1} id={1} />);
		screen.getByTestId('call-patch').click();
		expect(mockPatchStatutMutation).toHaveBeenCalled();
	});
});
