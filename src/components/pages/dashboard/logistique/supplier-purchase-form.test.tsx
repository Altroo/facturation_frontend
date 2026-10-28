import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
	useGetLogistiqueQuery,
	useGetNumLogistiqueQuery,
	useAddLogistiqueMutation,
	usePurchaseActionMutation,
	useAddLogistiqueProcessNoteMutation,
} from '@/store/services/logistique';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { getInitStateToken } from '@/store/selectors';
import { useAppSelector } from '@/utils/hooks';
import { purchaseDraft } from '@/utils/helpers';
import { LOGISTIQUE_VIEW } from '@/utils/routes';
import SupplierPurchaseForm from './supplier-purchase-form';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/helpers', () => ({ ...jest.requireActual('@/utils/helpers'), purchaseDraft: jest.fn() }));
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
jest.mock('@/store/services/article', () => ({
	useGetArticlesListQuery: () => ({ data: [] }),
	useGetArticleQuery: () => ({}),
}));
jest.mock('@/store/services/parameter', () => ({
	useGetMarqueListQuery: () => ({ data: [] }),
	useGetEmplacementListQuery: () => ({ data: [] }),
}));
jest.mock('@/store/services/logistique', () => ({
	useGetLogistiqueQuery: jest.fn(),
	useGetNumLogistiqueQuery: jest.fn(),
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
	(useGetNumLogistiqueQuery as jest.Mock).mockReturnValue({ currentData: { numero_commande: 'LOG008/26' } });
	(useAddLogistiqueMutation as jest.Mock).mockReturnValue([mockAdd]);
	(usePurchaseActionMutation as jest.Mock).mockReturnValue([mockPurchase]);
	(useAddLogistiqueProcessNoteMutation as jest.Mock).mockReturnValue([mockAddNote]);
	mockUnwrap.mockResolvedValue({ orders: [{ id: 7 }] });
});

afterEach(() => jest.restoreAllMocks());

describe('SupplierPurchaseForm', () => {
	it('opens the current step when Edit from the list has no step parameter', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: {
				...order,
				workflow: { etape_courante: 'proforma', etapes: [] },
			},
		});
		window.history.replaceState(null, '', '/dashboard/logistique/7/edit?company_id=12');
		await act(async () => {
			render(<SupplierPurchaseForm company_id={12} id={7} />);
		});
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Proforma fournisseur et conformité');
		expect(screen.queryByText('Accès refusé')).not.toBeInTheDocument();
	});

	it('keeps completed steps protected when explicitly requested without approval', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: {
				...order,
				workflow: { etape_courante: 'proforma', etapes: [] },
			},
		});
		await renderForm('dossier');
		expect(screen.getByText('Accès refusé')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
	});

	it.each(['paiement', 'solde'])(
		'opens the permitted accounting actions for %s instead of an unscoped payment form',
		async (step) => {
			(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
				data: {
					...order,
					workflow: { etape_courante: step, etapes: [] },
				},
			});
			window.history.replaceState(null, '', '/dashboard/logistique/7/edit?company_id=12');
			await act(async () => {
				render(<SupplierPurchaseForm company_id={12} id={7} />);
			});
			expect(mockReplace).toHaveBeenCalledWith(`${LOGISTIQUE_VIEW(7, 12)}&etape=${step}`);
			expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
		},
	);

	it('opens article creation from the selector after preserving the proforma draft', async () => {
		(purchaseDraft as jest.Mock).mockResolvedValue(undefined);
		await renderForm('proforma');
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter un article' }));
		const field = screen
			.getByRole('combobox', { name: /Article : référence et désignation/ })
			.closest('.MuiInputBase-root')!;
		expect(screen.queryByRole('button', { name: 'Nouvel article' })).not.toBeInTheDocument();
		fireEvent.click(within(field as HTMLElement).getByRole('button', { name: 'Ajouter' }));
		await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
		expect(purchaseDraft).toHaveBeenCalledWith(
			expect.stringContaining('purchase:27:12:7:'),
			'write',
			expect.objectContaining({ lignes: expect.any(Array) }),
		);
		const destination = new URL(mockPush.mock.calls[0][0], 'http://localhost');
		expect(destination.pathname).toBe('/dashboard/articles/new/');
		expect(destination.searchParams.get('company_id')).toBe('12');
		const back = new URL(destination.searchParams.get('retour')!, 'http://localhost');
		expect(back.pathname).toBe('/dashboard/logistique/7/edit');
		expect(back.searchParams.get('etape')).toBe('proforma');
		expect(back.searchParams.get('brouillon')).toBeTruthy();
	});

	it('creates an independent supplier dossier without date inputs or a client proforma', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({});
		window.history.replaceState(null, '', '/dashboard/logistique/new?company_id=12');
		await act(async () => {
			render(<SupplierPurchaseForm company_id={12} />);
		});
		expect(screen.getByRole('textbox', { name: 'Référence dossier' })).toHaveValue('LOG008/26');
		expect(screen.getByRole('textbox', { name: 'Référence dossier' })).toBeDisabled();
		expect(useGetNumLogistiqueQuery).toHaveBeenCalledWith(
			{ company_id: 12 },
			{ skip: false, refetchOnMountOrArgChange: true },
		);
		expect(screen.queryByText('Date de commande')).not.toBeInTheDocument();
		expect(screen.queryByText('Date cible de livraison')).not.toBeInTheDocument();
		fireEvent.change(screen.getByRole('textbox', { name: 'Fournisseur' }), {
			target: { value: 'Nouveau fournisseur' },
		});
		save();

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(LOGISTIQUE_VIEW(7, 12)));
		const [request] = mockAdd.mock.calls[0];
		expect(request).toMatchObject({
			company_id: 12,
			data: { fournisseur: 'Nouveau fournisseur', responsable: 27 },
		});
		expect(request.data).not.toHaveProperty('proformas');
		expect(request.data).not.toHaveProperty('numero_commande');
	});

	it('keeps the saved dossier number and skips the preview when editing', async () => {
		await renderForm('dossier');
		expect(screen.getByRole('textbox', { name: 'Référence dossier' })).toHaveValue('LOG-007');
		expect(useGetNumLogistiqueQuery).toHaveBeenCalledWith(
			{ company_id: 12 },
			{ skip: true, refetchOnMountOrArgChange: true },
		);
	});

	it.each([{ data: { numero_commande: 'OTHER-COMPANY' }, isFetching: true }, { error: { status: 503 } }])(
		'keeps a new form usable without a current number preview: %j',
		async (preview) => {
			(useGetLogistiqueQuery as jest.Mock).mockReturnValue({});
			(useGetNumLogistiqueQuery as jest.Mock).mockReturnValue(preview);
			window.history.replaceState(null, '', '/dashboard/logistique/new?company_id=12');
			await act(async () => {
				render(<SupplierPurchaseForm company_id={12} />);
			});
			expect(screen.getByRole('textbox', { name: 'Référence dossier' })).toHaveValue('');
			expect(screen.getByRole('textbox', { name: 'Fournisseur' })).toBeEnabled();
			expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
			if ('error' in preview) expect(screen.getByText(/Aperçu indisponible/)).toBeInTheDocument();
		},
	);

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
				etape: 'couts',
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

it('starts proforma in EUR, removes volume, and disables the motif until an anomaly is selected', async () => {
	await renderForm('proforma');
	expect(screen.queryByLabelText(/Volume/)).not.toBeInTheDocument();
	expect(screen.getByRole('combobox', { name: /Devise de la proforma/ })).toHaveTextContent('EUR');
	const motif = screen.getByRole('textbox', { name: /motif/i });
	expect(motif).toBeDisabled();
	fireEvent.click(screen.getByRole('checkbox', { name: /prix/i }));
	await waitFor(() => expect(screen.getByRole('textbox', { name: /motif/i })).toBeEnabled());
	fireEvent.click(screen.getByRole('checkbox', { name: /prix/i }));
	await waitFor(() => expect(screen.getByRole('textbox', { name: /motif/i })).toBeDisabled());
});
it('defaults the import title to the proforma total even when the saved amount is 0.00', async () => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: {
			...order,
			montant_titre_importation: '0.00',
			montant_proforma_fournisseur: '1250.50',
			devise_titre_importation: 'MAD',
		},
	});
	await renderForm('titre');
	expect(screen.getByRole('combobox', { name: /Devise du titre/ })).toHaveTextContent('EUR');
	expect(screen.getByRole('textbox', { name: /Montant du titre/ })).toHaveValue('1\u202f250,50');
});

it('submits edited values and a reason for approval instead of directly saving the dossier', async () => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: {
			...order,
			workflow: {
				etape_courante: 'proforma',
				etapes: [{ key: 'dossier', label: 'Dossier', completed: true, accessible: true }],
			},
		},
	});
	await renderForm('dossier&proposer=1');
	const submit = screen.getByRole('button', { name: 'Soumettre les modifications' });
	expect(submit).toBeDisabled();
	fireEvent.change(screen.getByRole('textbox', { name: 'E-mail du fournisseur' }), {
		target: { value: 'corrected@example.com' },
	});
	fireEvent.change(screen.getByRole('textbox', { name: /Motif de la modification/ }), {
		target: { value: 'Coordonnées corrigées' },
	});
	await waitFor(() => expect(submit).toBeEnabled());
	fireEvent.click(submit);
	await waitFor(() =>
		expect(mockPurchase).toHaveBeenCalledWith({
			id: 7,
			data: expect.objectContaining({
				action: 'demander_modification',
				etape: 'dossier',
				remarque: 'Coordonnées corrigées',
				modifications: expect.objectContaining({ action: 'dossier', fournisseur_email: 'corrected@example.com' }),
			}),
		}),
	);
	expect(mockPush).toHaveBeenCalledWith(`${LOGISTIQUE_VIEW(7, 12)}&etape=dossier`);
});

it('does not allow proposal mode to open a future step', async () => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: {
			...order,
			workflow: {
				etape_courante: 'proforma',
				etapes: [{ key: 'titre', label: 'Titre', completed: false, accessible: false }],
			},
		},
	});
	await renderForm('titre&proposer=1');
	expect(screen.getByText('Accès refusé')).toBeInTheDocument();
});
