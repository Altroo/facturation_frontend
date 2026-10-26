import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
	useGetLogistiqueQuery,
	usePurchaseActionMutation,
	useStartLogistiquePaymentMutation,
	useSetLogistiqueProofEmailStatusMutation,
} from '@/store/services/logistique';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { getInitStateToken } from '@/store/selectors';
import { useAppSelector } from '@/utils/hooks';
import { LOGISTIQUE_EDIT } from '@/utils/routes';
import SupplierPurchase from './supplier-purchase';

const mockPush = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: () => 'token' }));
jest.mock('@/store/selectors', () => ({ getInitStateToken: jest.fn(), getUserCompaniesState: jest.fn() }));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
	useLanguage: () => ({ t: jest.requireActual('@/translations').translations.fr }),
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));
jest.mock('@/store/services/company', () => ({ useGetUserCompaniesQuery: jest.fn() }));
jest.mock('@/store/services/logistique', () => ({
	useGetLogistiqueQuery: jest.fn(),
	usePurchaseActionMutation: jest.fn(),
	useStartLogistiquePaymentMutation: jest.fn(),
	useSetLogistiqueProofEmailStatusMutation: jest.fn(),
	useRetryLogistiquePaymentEmailMutation: () => [jest.fn()],
	usePatchLogistiqueStatutMutation: () => [jest.fn()],
}));
jest.mock('./use-logistique-email-polling', () => ({ useLogistiqueEmailPolling: jest.fn() }));
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

const workflow = (current: string) => {
	const keys = [
		'dossier',
		'proforma',
		'titre',
		'paiement',
		'production',
		'expedition',
		'transit',
		'reception',
		'solde',
		'couts',
	];
	return {
		etape_courante: current,
		etapes: keys.map((key, index) => ({
			key,
			label: key,
			completed: index < keys.indexOf(current),
			accessible: index <= keys.indexOf(current),
			payment_ids: key === 'paiement' ? [14] : [],
		})),
	};
};

const order = {
	workflow: workflow('proforma'),
	id: 7,
	company: 12,
	numero_commande: 'LOG-007',
	fournisseur: 'Fournisseur Test',
	statut: 'Proforma',
	statut_global: 'En cours',
	responsable: 27,
	created_by_user: 27,
	condition_achat: 'advance30_transfer70',
	echeancier_paiement: [],
	lignes: [],
	events: [],
	solde_restant: '1000',
	is_proforma_step_complete: false,
	date_reelle: null,
};
const installment = {
	id: 14,
	declencheur: 'advance',
	pourcentage: 30,
	montant_prevu: '300',
	devise: 'EUR',
	demandee_le: '2026-10-19',
	statut_traitement: 'Paiement à traiter',
	paiement_valide_le: null,
};
const mockUnwrap = jest.fn();
const mockPurchase = jest.fn(() => ({ unwrap: mockUnwrap }));
const mockStartPayment = jest.fn(() => ({ unwrap: mockUnwrap }));
const mockProofSent = jest.fn(() => ({ unwrap: mockUnwrap }));

beforeEach(() => {
	jest.clearAllMocks();
	(useAppSelector as jest.Mock).mockImplementation((selector) =>
		selector === getInitStateToken ? { user: { pk: 27 } } : [],
	);
	(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 12, role: 'Logistique' }] });
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: order });
	(usePurchaseActionMutation as jest.Mock).mockReturnValue([mockPurchase]);
	(useStartLogistiquePaymentMutation as jest.Mock).mockReturnValue([mockStartPayment]);
	(useSetLogistiqueProofEmailStatusMutation as jest.Mock).mockReturnValue([mockProofSent]);
	mockUnwrap.mockResolvedValue(undefined);
});

describe('SupplierPurchase', () => {
	it('places cancellation in the compact top action group and keeps confirmation required', () => {
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({
			data: [{ id: 12, role: 'Logistique', can_change_document_status: true }],
		});
		render(<SupplierPurchase company_id={12} id={7} />);
		const actions = screen.getByRole('group', { name: 'Actions du dossier' });
		const cancel = within(actions).getByRole('button', { name: 'Annuler le dossier' });
		expect(cancel).toHaveClass('MuiButton-sizeSmall');
		fireEvent.click(cancel);
		expect(screen.getByRole('button', { name: 'Confirmer' })).toBeInTheDocument();
		expect(mockPurchase).not.toHaveBeenCalled();
	});

	it('shows one step and opens completed dossier information read-only', () => {
		render(<SupplierPurchase company_id={12} id={7} />);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dossier LOG-007');
		expect(screen.getByRole('button', { name: 'Contrôler la proforma' })).toBeEnabled();
		expect(screen.queryByText('Informations du dossier')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('tab', { name: /dossier/ }));
		expect(screen.getByText('Fournisseur Test')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Modifier le dossier' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Contrôler la proforma' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Proposer une modification' })).toBeInTheDocument();
	});

	it('keeps an empty proforma compact while retaining the action to enter it', () => {
		render(<SupplierPurchase company_id={12} id={7} />);
		expect(screen.getByText('Aucune proforma fournisseur renseignée.')).toBeInTheDocument();
		expect(screen.queryByText('Montant fournisseur')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Contrôler la proforma' }));
		expect(mockPush).toHaveBeenCalledWith(`${LOGISTIQUE_EDIT(7, 12)}&etape=proforma`);
	});

	it('preserves partially entered proforma details and keeps history available on demand', () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: {
				...order,
				origine_marchandise: 'Italie',
				statut_proforma_conformite: 'En attente',
				events: [
					{
						id: 1,
						action: 'Création du dossier fournisseur',
						old_value: '',
						new_value: 'LOG-007',
						note: '',
						user_name: 'Service IT',
						date_created: '2026-10-26T10:00:00Z',
					},
				],
			},
		});
		render(<SupplierPurchase company_id={12} id={7} />);
		expect(screen.queryByText('Aucune proforma fournisseur renseignée.')).not.toBeInTheDocument();
		expect(screen.getByText('Italie')).toBeInTheDocument();
		expect(screen.getByText('À contrôler')).toBeInTheDocument();
		const history = screen.getByRole('button', { name: /Historique/ });
		expect(history).toHaveAttribute('aria-expanded', 'false');
		fireEvent.click(history);
		expect(history).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByText('Création du dossier fournisseur')).toBeVisible();
	});

	it('denies access to a dossier outside the user companies', () => {
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [] });
		render(<SupplierPurchase company_id={12} id={7} />);
		expect(screen.getByText('Accès refusé')).toBeInTheDocument();
	});

	it('requires proforma completion before opening production follow-up', () => {
		const { rerender } = render(<SupplierPurchase company_id={12} id={7} />);
		expect(screen.queryByRole('button', { name: 'Suivre la production' })).not.toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /production/ })).toBeDisabled();
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: { ...order, workflow: workflow('production'), is_proforma_step_complete: true },
		});
		rerender(<SupplierPurchase company_id={12} id={7} />);
		fireEvent.click(screen.getByRole('button', { name: 'Suivre la production' }));
		expect(mockPush).toHaveBeenCalledWith(`${LOGISTIQUE_EDIT(7, 12)}&etape=production`);
	});

	it('requires complete receipt and zero remaining balance before closure', () => {
		const { rerender } = render(<SupplierPurchase company_id={12} id={7} />);
		expect(screen.queryByRole('button', { name: 'Clôturer le dossier' })).not.toBeInTheDocument();
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: { ...order, workflow: workflow('couts'), date_reelle: '2026-10-19', solde_restant: '0' },
		});
		rerender(<SupplierPurchase company_id={12} id={7} />);
		fireEvent.click(screen.getByRole('button', { name: 'Clôturer le dossier' }));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(mockPurchase).not.toHaveBeenCalled();
	});

	it('submits closure only after confirmation', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: { ...order, workflow: workflow('couts'), date_reelle: '2026-10-19', solde_restant: '0' },
		});
		render(<SupplierPurchase company_id={12} id={7} />);
		fireEvent.click(screen.getByRole('button', { name: 'Clôturer le dossier' }));
		fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));
		await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
		expect(mockPurchase).toHaveBeenCalledWith({
			id: 7,
			data: { action: 'progression', etape: 'couts', statut: 'Clôture' },
		});
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('allows only the assigned accountant to start a requested payment', async () => {
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 12, role: 'Comptable' }] });
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: { ...order, workflow: workflow('paiement'), paiement_assigne_a: 27, echeancier_paiement: [installment] },
		});
		const { rerender } = render(<SupplierPurchase company_id={12} id={7} />);
		fireEvent.click(screen.getByRole('button', { name: 'Commencer le paiement' }));
		await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
		expect(mockStartPayment).toHaveBeenCalledWith({ id: 7, echeance_id: 14 });
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: { ...order, workflow: workflow('paiement'), paiement_assigne_a: 28, echeancier_paiement: [installment] },
		});
		rerender(<SupplierPurchase company_id={12} id={7} />);
		expect(screen.queryByRole('button', { name: 'Commencer le paiement' })).not.toBeInTheDocument();
	});

	it('records the creator confirmation that validated payment proof was sent to the supplier', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: {
				...order,
				workflow: workflow('paiement'),
				echeancier_paiement: [{ ...installment, paiement_valide_le: '2026-10-19' }],
			},
		});
		render(<SupplierPurchase company_id={12} id={7} />);
		fireEvent.click(screen.getByRole('button', { name: 'Justificatif transmis au fournisseur' }));
		await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
		expect(mockProofSent).toHaveBeenCalledWith({ id: 7, echeance_id: 14, email_envoye: true });
	});

	it('reports action errors without claiming success', async () => {
		mockUnwrap.mockRejectedValueOnce({ data: { details: { detail: ['Paiement verrouillé.'] } } });
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 12, role: 'Comptable' }] });
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: { ...order, workflow: workflow('paiement'), paiement_assigne_a: 27, echeancier_paiement: [installment] },
		});
		render(<SupplierPurchase company_id={12} id={7} />);
		fireEvent.click(screen.getByRole('button', { name: 'Commencer le paiement' }));
		await waitFor(() => expect(mockOnError).toHaveBeenCalledWith('Paiement verrouillé.'));
		expect(screen.getByText('Paiement verrouillé.')).toBeInTheDocument();
		expect(mockOnSuccess).not.toHaveBeenCalled();
	});

	it('hides editing controls for cancelled dossiers', () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: { ...order, statut_global: 'Annulé' } });
		render(<SupplierPurchase company_id={12} id={7} />);
		expect(screen.queryByRole('button', { name: 'Modifier le dossier' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Clôturer le dossier' })).not.toBeInTheDocument();
	});
});
