import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

// Mock session helper
jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'test-token'),
}));

// Mock RTK Query hooks
const mockRefetch = jest.fn();
const mockDeleteRecord = jest.fn();
const mockConvertToBonDeLivraison = jest.fn();

jest.mock('@/store/services/factureClient', () => ({
	useGetFactureClientUnpaidListQuery: jest.fn(() => ({
		data: {
			results: [
				{
					id: 1,
					numero_facture: 'FC-001',
					client: 10,
					client_name: 'Client A',
					numero_bon_commande_client: 'BC-100',
					statut: 'Brouillon',
					total_ttc_apres_remise: 500.0,
					lignes_count: 2,
					date_facture: '2025-02-10',
					total_paye: 0,
					reste_a_payer: 500.0,
				},
				{
					id: 2,
					numero_facture: 'FC-002',
					client: 20,
					client_name: 'Client B',
					numero_bon_commande_client: 'BC-200',
					statut: 'Envoyé',
					total_ttc_apres_remise: 1200.25,
					lignes_count: 4,
					date_facture: '2025-02-12',
					total_paye: 200.0,
					reste_a_payer: 1000.25,
				},
			],
			count: 2,
			next: null,
			previous: null,
			total_all_reste_a_payer: 1500.25,
			total_all_paye: 200.0,
			total_all_factures: 1700.25,
		},
		isLoading: false,
		refetch: mockRefetch,
	})),
	useDeleteFactureClientMutation: jest.fn(() => [mockDeleteRecord, { isLoading: false }]),
	useConvertFactureClientToBonDeLivraisonMutation: jest.fn(() => [mockConvertToBonDeLivraison, { isLoading: false }]),
}));

// Mock company services
jest.mock('@/store/services/company', () => ({
	useGetCompanyQuery: jest.fn(() => ({
		data: {
			id: 1,
			raison_sociale: 'Test Company',
			uses_foreign_currency: false,
		},
		isLoading: false,
	})),
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

// Mock CompanyDocumentsListContent
jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent', () => ({
	__esModule: true,
	default: ({ config }: { config: { labels: { pageTitle: string } } }) => (
		<div data-testid="documents-list-content">
			<span data-testid="page-title">{config.labels.pageTitle}</span>
		</div>
	),
}));

// Import after mocks
import FactureClientUnpaidListClient from './facture-client-unpaid-list';

const mockSession: AppSession = {
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
	accessToken: 'mock-access-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: new Date(Date.now() + 3600000).toISOString(),
	refreshTokenExpiration: new Date(Date.now() + 86400000).toISOString(),
	expires: new Date(Date.now() + 86400000).toISOString(),
};

describe('FactureClientUnpaidListClient', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	it('renders the component with wrapper and correct title', () => {
		render(<FactureClientUnpaidListClient session={mockSession} />);

		expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		const titles = screen.getAllByText('Factures Impayées');
		expect(titles.length).toBeGreaterThan(0);
	});

	it('renders CompanyDocumentsListContent with correct config', () => {
		render(<FactureClientUnpaidListClient session={mockSession} />);

		expect(screen.getByTestId('documents-list-content')).toBeInTheDocument();
		expect(screen.getByTestId('page-title')).toHaveTextContent('Factures Impayées');
	});

	it('passes session to child components', () => {
		render(<FactureClientUnpaidListClient session={mockSession} />);

		expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
		expect(screen.getByTestId('documents-list-content')).toBeInTheDocument();
	});

	it('renders without session', () => {
		render(<FactureClientUnpaidListClient session={undefined} />);

		expect(screen.getByTestId('company-wrapper')).toBeInTheDocument();
	});
});
