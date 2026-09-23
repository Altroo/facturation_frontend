import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { translations as mockTranslations } from '@/translations';
import type { AppSession } from '@/types/_initTypes';
import FactureAvoirListClient from './facture-avoir-list';

type CapturedListConfig = {
	documentType: string;
	labels: { addButtonText: string };
	columns: { numeroField: string; dateField: string; extraField: string };
	printActions: Array<{ key: string }>;
};

let mockCapturedConfig: CapturedListConfig | undefined;
const mockRefetch = jest.fn();
const mockDeleteRecord = jest.fn();
const mockBulkDeleteRecords = jest.fn();

jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: () => 'test-token',
}));

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: mockTranslations.fr }),
}));

jest.mock('@/store/services/company', () => ({
	useGetCompanyQuery: () => ({ data: { id: 1, uses_foreign_currency: true } }),
}));

jest.mock('@/store/services/factureAvoir', () => ({
	useGetFactureAvoirListQuery: () => ({
		data: {
			count: 1,
			results: [],
			stats_by_currency: { MAD: { total_avoirs: '1500', total_tva: '300' } },
		},
		isLoading: false,
		refetch: mockRefetch,
	}),
	useDeleteFactureAvoirMutation: () => [mockDeleteRecord],
	useBulkDeleteFactureAvoirMutation: () => [mockBulkDeleteRecords],
}));

jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList', () => ({
	__esModule: true,
	default: ({
		title,
		children,
	}: {
		title: string;
		children: (value: { company_id: number; role: string }) => ReactNode;
	}) => (
		<section>
			<h1>{title}</h1>
			{children({ company_id: 1, role: 'Caissier' })}
		</section>
	),
}));

jest.mock('@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent', () => ({
	__esModule: true,
	default: ({ config, role }: { config: CapturedListConfig; role: string }) => {
		mockCapturedConfig = config;
		return <div data-testid="document-list-content">Role: {role}</div>;
	},
}));

jest.mock('@/components/shared/currencyToggle/currencyToggle', () => ({
	__esModule: true,
	default: () => <div data-testid="currency-toggle">Devise</div>,
}));

const mockSession = {} as AppSession;

describe('FactureAvoirListClient', () => {
	it('renders the shared list with credit-note totals and configuration', () => {
		render(<FactureAvoirListClient session={mockSession} />);

		expect(screen.getByRole('heading', { name: "Liste des Factures d'Avoir" })).toBeInTheDocument();
		expect(screen.getByTestId('currency-toggle')).toBeInTheDocument();
		expect(screen.getByText('Total des avoirs')).toBeInTheDocument();
		expect(screen.getByText(/1[\s\u202f]?500,00 MAD/)).toBeInTheDocument();
		expect(screen.getByText('TVA à déduire')).toBeInTheDocument();
		expect(screen.getByText(/300,00 MAD/)).toBeInTheDocument();
		expect(screen.getByTestId('document-list-content')).toHaveTextContent('Role: Caissier');
		expect(mockCapturedConfig).toMatchObject({
			documentType: 'facture-avoir',
			labels: { addButtonText: "Nouvelle facture d'avoir" },
			columns: {
				numeroField: 'numero_avoir',
				dateField: 'date_avoir',
				extraField: 'motif_avoir_label',
			},
		});
		expect(mockCapturedConfig?.printActions).toHaveLength(4);
	});
});
