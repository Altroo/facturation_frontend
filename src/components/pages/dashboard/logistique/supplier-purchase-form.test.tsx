import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
	useGetLogistiqueQuery,
	useAddLogistiqueMutation,
	usePurchaseActionMutation,
	useAddLogistiqueProcessNoteMutation,
} from '@/store/services/logistique';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { getInitStateToken } from '@/store/selectors';
import { useAppSelector } from '@/utils/hooks';
import { LOGISTIQUE_VIEW } from '@/utils/routes';
import SupplierPurchaseForm from './supplier-purchase-form';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, replace: mockReplace }),
	useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: () => 'token' }));
jest.mock('@/store/selectors', () => ({ getInitStateToken: jest.fn(), getUserCompaniesState: jest.fn() }));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
	useLanguage: () => ({ language: 'fr', t: jest.requireActual('@/translations').translations.fr }),
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));
jest.mock('@/store/services/company', () => ({
	useGetUserCompaniesQuery: jest.fn(),
	useGetCompanyQuery: () => ({ data: { stock_management_enabled: false } }),
}));
jest.mock('@/store/services/article', () => ({ useGetArticlesListQuery: () => ({ data: [] }) }));
jest.mock('@/store/services/parameter', () => ({
	useGetMarqueListQuery: () => ({ data: [] }),
	useGetEmplacementListQuery: () => ({ data: [] }),
}));
jest.mock('@/store/services/logistique', () => ({
	useGetLogistiqueQuery: jest.fn(),
	useAddLogistiqueMutation: jest.fn(),
	usePurchaseActionMutation: jest.fn(),
	useAddLogistiqueProcessNoteMutation: jest.fn(),
	useGetLogistiqueResponsablesQuery: () => ({ data: [{ id: 27, label: 'Responsable Test' }] }),
	useGetLogistiqueSuppliersQuery: () => ({ currentData: [] }),
	useExtractImportTitleMutation: () => [jest.fn(), {}],
	useRequestPurchasePaymentMutation: () => [jest.fn()],
	useRecordLogistiquePaymentExecutionMutation: () => [jest.fn()],
	useValidateLogistiquePaymentMutation: () => [jest.fn()],
	useAddLogistiqueSupplierMutation: () => [jest.fn()],
	useEditLogistiqueSupplierMutation: () => [jest.fn()],
}));
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ title, children }: { title: string; children: ReactNode }) => (
		<>
			<h1>{title}</h1>
			{children}
		</>
	),
}));
jest.mock('@/components/shared/noPermission/noPermission', () => ({
	__esModule: true,
	default: () => <p>Accès refusé</p>,
}));

const order = {
	id: 7,
	company: 12,
	numero_commande: 'LOG-007',
	fournisseur: 'Fournisseur Test',
	responsable: 27,
	statut: 'Proforma',
	statut_global: 'En cours',
	paiement_assigne_a: 27,
	lignes: [],
	echeancier_paiement: [],
};
const mockUnwrap = jest.fn();
const mockAdd = jest.fn<{ unwrap: typeof mockUnwrap }, [{ company_id: number; data: Record<string, unknown> }]>(() => ({
	unwrap: mockUnwrap,
}));
const mockPurchase = jest.fn(() => ({ unwrap: mockUnwrap }));
const mockAddNote = jest.fn<{ unwrap: typeof mockUnwrap }, [{ id: number; data: FormData }]>(() => ({
	unwrap: mockUnwrap,
}));
const mockRefetch = jest.fn();
const renderForm = async (mode: string, id: number | undefined = 7) => {
	window.history.replaceState(null, '', `/dashboard/logistique/7/edit?company_id=12&etape=${mode}`);
	await act(async () => {
		render(<SupplierPurchaseForm company_id={12} id={id} />);
	});
};
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
	(useAppSelector as jest.Mock).mockImplementation((selector) =>
		selector === getInitStateToken ? { user: { pk: 27 } } : [],
	);
	(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 12, role: 'Logistique' }] });
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: order, refetch: mockRefetch });
	(useAddLogistiqueMutation as jest.Mock).mockReturnValue([mockAdd]);
	(usePurchaseActionMutation as jest.Mock).mockReturnValue([mockPurchase]);
	(useAddLogistiqueProcessNoteMutation as jest.Mock).mockReturnValue([mockAddNote]);
	mockUnwrap.mockResolvedValue({ orders: [{ id: 7 }] });
});

afterEach(() => jest.restoreAllMocks());

describe('SupplierPurchaseForm', () => {
	it('creates an independent supplier dossier with optional dates and no client proforma', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({});
		window.history.replaceState(null, '', '/dashboard/logistique/new?company_id=12');
		await act(async () => {
			render(<SupplierPurchaseForm company_id={12} />);
		});
		fireEvent.change(screen.getByRole('textbox', { name: 'Fournisseur' }), {
			target: { value: 'Nouveau fournisseur' },
		});
		save();

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(LOGISTIQUE_VIEW(7, 12)));
		const [request] = mockAdd.mock.calls[0];
		expect(request).toMatchObject({
			company_id: 12,
			data: { fournisseur: 'Nouveau fournisseur', responsable: 27, date_prevue: null, date_commande_client: null },
		});
		expect(request.data).not.toHaveProperty('proformas');
	});

	it('falls back to dossier mode for an unknown URL step', async () => {
		await renderForm('unknown-step');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Informations du dossier');
		expect(screen.getByRole('textbox', { name: 'Fournisseur' })).toHaveValue('Fournisseur Test');
	});

	it('requires an explicit adoption save for eligible historical dossiers', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: { ...order, can_adopt_supplier_workflow: true } });
		await renderForm('proforma');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Informations du dossier');
		expect(mockPurchase).not.toHaveBeenCalled();
		save();
		await waitFor(() =>
			expect(mockPurchase).toHaveBeenCalledWith({
				id: 7,
				data: expect.objectContaining({ action: 'adopter_parcours_fournisseur' }),
			}),
		);
	});

	it.each(['paiement', 'justificatif'])('restricts %s to the assigned accountant', async (mode) => {
		await renderForm(mode);
		expect(screen.getByText('Accès refusé')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
	});

	it('prevents accounting submission without a matching payment installment', async () => {
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 12, role: 'Comptable' }] });
		await renderForm('paiement');
		expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
	});

	it('locks completed or cancelled dossiers', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: { ...order, statut_global: 'Annulé' } });
		await renderForm('couts');
		expect(screen.getByText(/Ce formulaire est verrouillé/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
	});

	it('normalizes blank optional costs to zero and sends only the cost update', async () => {
		await renderForm('couts');
		save();
		await waitFor(() => expect(mockPush).toHaveBeenCalledWith(LOGISTIQUE_VIEW(7, 12)));
		expect(mockPurchase).toHaveBeenCalledWith({
			id: 7,
			data: {
				action: 'progression',
				cout_transport: '0',
				frais_transit: '0',
				frais_douane: '0',
				tva: '0',
				livraison_locale: '0',
				autres_frais: '0',
				remarque: '',
			},
		});
	});

	it('validates an empty remark before submitting', async () => {
		await renderForm('remarque');
		save();
		expect(await screen.findByText('Vérifiez les informations du formulaire.')).toBeInTheDocument();
		expect(mockAddNote).not.toHaveBeenCalled();
	});

	it('submits a remark as multipart data attached to the current dossier', async () => {
		await renderForm('remarque');
		fireEvent.change(screen.getByRole('textbox', { name: 'Remarque' }), {
			target: { value: 'Livraison à confirmer.' },
		});
		save();
		await waitFor(() => expect(mockAddNote).toHaveBeenCalledTimes(1));
		const [request] = mockAddNote.mock.calls[0];
		expect(request.id).toBe(7);
		expect(request.data).toBeInstanceOf(FormData);
		expect(request.data.get('remarque')).toBe('Livraison à confirmer.');
	});

	it('shows API failures without navigating or reporting success', async () => {
		mockUnwrap.mockRejectedValueOnce({ data: { details: { detail: ['Dossier verrouillé.'] } } });
		await renderForm('couts');
		save();
		await waitFor(() => expect(mockOnError).toHaveBeenCalledWith('Dossier verrouillé.'));
		expect(screen.getAllByRole('alert').some((alert) => alert.textContent === 'Dossier verrouillé.')).toBe(true);
		expect(mockOnSuccess).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it('allows retrying a failed dossier load', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ error: { status: 500 }, refetch: mockRefetch });
		await renderForm('dossier');
		fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
		expect(mockRefetch).toHaveBeenCalledTimes(1);
	});
});
