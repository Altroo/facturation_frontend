import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { translations as mockTranslations } from '@/translations';
import type { AppSession } from '@/types/_initTypes';
import FactureAvoirViewClient from './facture-avoir-view';

const mockPush = jest.fn();
const mockDeleteFactureAvoir = jest.fn(() => ({ unwrap: () => Promise.resolve({}) }));
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
let mockCompanyRole = 'Caissier';

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

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: () => 'test-token',
}));

jest.mock('@/store/selectors', () => ({
	getUserCompaniesState: jest.fn(),
}));

jest.mock('@/utils/hooks', () => ({
	useAppSelector: () => [{ id: 1, role: mockCompanyRole }],
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: mockTranslations.fr }),
}));

jest.mock('@/store/services/factureAvoir', () => ({
	useGetFactureAvoirQuery: () => ({
		data: {
			id: 12,
			numero_avoir: 'AV-001/26',
			date_avoir: '2026-09-19',
			statut: 'Brouillon',
			facture_origine: 8,
			facture_origine_numero: 'FC-008/26',
			motif_avoir_label: 'Retour marchandise',
		},
		isLoading: false,
		error: undefined,
	}),
	useDeleteFactureAvoirMutation: () => [mockDeleteFactureAvoir],
}));

jest.mock('@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView', () => ({
	__esModule: true,
	default: ({
		title,
		canEdit,
		headerActions,
		extraDocumentRows,
		query,
	}: {
		title: string;
		canEdit: boolean;
		headerActions: React.ReactNode;
		extraDocumentRows: Array<{ label: string; getValue: (data: Record<string, unknown>) => React.ReactNode }>;
		query: { data: Record<string, unknown> };
	}) => (
		<section>
			<h1>{title}</h1>
			<div>Edit: {String(canEdit)}</div>
			{headerActions}
			{extraDocumentRows.map((row) => (
				<div key={row.label}>
					<span>{row.label}</span>
					<span>{row.getValue(query.data)}</span>
				</div>
			))}
		</section>
	),
}));

jest.mock('@/components/shared/pdfLanguageModal/pdfLanguageModal', () => ({
	__esModule: true,
	default: () => <div role="dialog">Langue PDF</div>,
}));

jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: ({ title, body, actions }: { title: string; body: string; actions: Array<{ text: string; onClick: () => void }> }) => (
		<div role="dialog" aria-label={title}>
			<p>{body}</p>
			{actions.map((action) => (
				<button key={action.text} type="button" onClick={action.onClick}>
					{action.text}
				</button>
			))}
		</div>
	),
}));

jest.mock('@/utils/apiHelpers', () => ({
	fetchPdfBlob: jest.fn(),
}));

const mockSession = {} as AppSession;

describe('FactureAvoirViewClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCompanyRole = 'Caissier';
	});

	it('renders credit-note details and Caissier actions', () => {
		render(<FactureAvoirViewClient session={mockSession} company_id={1} id={12} />);

		expect(screen.getByRole('heading', { name: "Détails de la facture d'avoir" })).toBeInTheDocument();
		expect(screen.getByText('Edit: true')).toBeInTheDocument();
		expect(screen.getByText("Facture d'origine")).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'FC-008/26' })).toBeInTheDocument();
		expect(screen.getByText('Retour marchandise')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'PDF (remise)' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
	});

	it('confirms deletion before deleting and returning to the list', async () => {
		render(<FactureAvoirViewClient session={mockSession} company_id={1} id={12} />);

		fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
		expect(screen.getByRole('dialog', { name: "Supprimer cette facture d'avoir ?" })).toBeInTheDocument();
		fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer' }).at(-1)!);

		await waitFor(() => expect(mockDeleteFactureAvoir).toHaveBeenCalledWith({ id: 12 }));
		expect(mockOnSuccess).toHaveBeenCalledWith("Facture d'avoir supprimée avec succès");
		expect(mockPush).toHaveBeenCalled();
	});

	it('hides print and delete actions from a read-only role', () => {
		mockCompanyRole = 'Lecture';
		render(<FactureAvoirViewClient session={mockSession} company_id={1} id={12} />);

		expect(screen.queryByRole('button', { name: 'PDF (remise)' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
	});
});
