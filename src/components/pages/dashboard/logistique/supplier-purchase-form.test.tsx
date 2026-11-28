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
import { LOGISTIQUE_VIEW } from '@/utils/routes';
import SupplierPurchaseForm from './supplier-purchase-form';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
const mockExtractProforma = jest.fn();
const mockProformaFields = jest.fn();
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
jest.mock('../articles/articles-form', () => ({
	ArticleFormContent: ({ onCancel }: { onCancel: () => void }) => (
		<button onClick={onCancel}>Annuler la création</button>
	),
}));
jest.mock('@/store/services/article', () => ({
	useGetArticlesListQuery: () => ({ data: [] }),
	useGetArticleQuery: () => ({}),
}));
jest.mock('@/store/services/parameter', () => ({
	useGetMarqueListQuery: () => ({ data: [] }),
	useGetLogisticsParameterListQuery: ({ kind }: { kind: string }) => ({
		currentData:
			kind === 'incoterm'
				? ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'].map((nom, index) => ({
						id: index + 1,
						nom,
						company: 12,
					}))
				: [],
	}),
	useAddLogisticsParameterMutation: () => [jest.fn()],
	useEditLogisticsParameterMutation: () => [jest.fn()],
	useDeleteLogisticsParameterMutation: () => [jest.fn()],
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
	useExtractSupplierProformaMutation: () => [mockExtractProforma, {}],
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
const mockPurchase = jest.fn<{ unwrap: typeof mockUnwrap }, [{ id: number; data: Record<string, unknown> | FormData }]>(
	() => ({ unwrap: mockUnwrap }),
);
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
const save = () => fireEvent.click(screen.getByRole('button', { name: /^(Enregistrer|Valider la proforma)$/ }));

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
	(useAppSelector as jest.Mock).mockImplementation((selector) =>
		selector === getInitStateToken ? { user: { pk: 27 } } : [],
	);
	(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 12, role: 'Logistique' }] });
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: order, refetch: mockRefetch });
	(useGetNumLogistiqueQuery as jest.Mock).mockReturnValue({ currentData: { numero_commande: 'COM008/26' } });
	(useAddLogistiqueMutation as jest.Mock).mockReturnValue([mockAdd]);
	(usePurchaseActionMutation as jest.Mock).mockReturnValue([mockPurchase]);
	(useAddLogistiqueProcessNoteMutation as jest.Mock).mockReturnValue([mockAddNote]);
	mockUnwrap.mockResolvedValue({ orders: [{ id: 7 }] });
	mockProformaFields.mockReset();
	mockExtractProforma.mockReturnValue({ unwrap: mockProformaFields });
});

afterEach(() => jest.restoreAllMocks());

describe('SupplierPurchaseForm', () => {
	it('offers exactly the eleven Incoterms 2020 and retains the selected code', async () => {
		await renderForm('proforma');
		fireEvent.mouseDown(screen.getByRole('combobox', { name: /Incoterm/ }));
		const options = within(screen.getByRole('listbox')).getAllByRole('option');
		expect(options.map((option) => option.textContent)).toEqual([
			'EXW',
			'FCA',
			'CPT',
			'CIP',
			'DAP',
			'DPU',
			'DDP',
			'FAS',
			'FOB',
			'CFR',
			'CIF',
		]);
		fireEvent.click(screen.getByRole('option', { name: 'CIF' }));
		expect(screen.getByRole('combobox', { name: /Incoterm/ })).toHaveValue('CIF');
	});
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
		expect(screen.getByRole('button', { name: 'Valider la proforma' })).toBeEnabled();
		expect(screen.queryByRole('combobox', { name: 'Décision' })).not.toBeInTheDocument();
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

	it('opens article creation in a modal while retaining the proforma values', async () => {
		await renderForm('proforma');
		fireEvent.change(screen.getByRole('textbox', { name: /N° de proforma fournisseur/ }), {
			target: { value: 'PRESERVED-PF' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter un article' }));
		const field = screen
			.getByRole('combobox', { name: /Article : référence et désignation/ })
			.closest('.MuiInputBase-root')!;
		fireEvent.click(within(field as HTMLElement).getByRole('button', { name: 'Ajouter' }));
		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		expect(mockPush).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Annuler la création' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(screen.getByRole('textbox', { name: /N° de proforma fournisseur/ })).toHaveValue('PRESERVED-PF');
	});

	it('creates an independent supplier dossier without date inputs or a client proforma', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({});
		window.history.replaceState(null, '', '/dashboard/logistique/new?company_id=12');
		await act(async () => {
			render(<SupplierPurchaseForm company_id={12} />);
		});
		expect(screen.getByRole('textbox', { name: 'Référence dossier' })).toHaveValue('COM008/26');
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
				livraison_locale: '0',
				autres_frais: '0',
				cout_achat_mad: null,
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
	expect(submit).toBeEnabled();
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

it.each(['', '   '])('shows the proposal reason field error after submitting %p', async (reasonValue) => {
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
	const reason = screen.getByRole('textbox', { name: /Motif de la modification/ });
	expect(submit).toBeEnabled();
	expect(reason).not.toHaveAttribute('aria-invalid', 'true');
	fireEvent.change(reason, { target: { value: reasonValue } });
	fireEvent.click(submit);
	await waitFor(() => expect(reason).toHaveAttribute('aria-invalid', 'true'));
	expect(reason).toHaveAccessibleDescription('Ce champ est obligatoire.');
	expect(mockPurchase).not.toHaveBeenCalled();
	expect(mockPush).not.toHaveBeenCalled();
	fireEvent.change(reason, { target: { value: 'Coordonnées à corriger' } });
	await waitFor(() => expect(reason).not.toHaveAttribute('aria-invalid', 'true'));
	expect(submit).toBeEnabled();
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

it.each(['Dédouanement', 'Réception locale'])(
	'preserves the current phase %s when saving transit without a phase selector',
	async (statut) => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: { ...order, statut } });
		await renderForm('transit');
		expect(screen.queryByRole('combobox', { name: 'Phase du dossier' })).not.toBeInTheDocument();
		save();
		await waitFor(() =>
			expect(mockPurchase).toHaveBeenCalledWith(
				expect.objectContaining({ data: expect.objectContaining({ action: 'progression', statut }) }),
			),
		);
	},
);

it('uploads the selected cost document with the manual MAD amount', async () => {
	await renderForm('couts');
	fireEvent.change(screen.getByRole('textbox', { name: 'Coût d’achat converti (MAD)' }), { target: { value: '440' } });
	const file = new File(['%PDF-1.4 proof'], 'fees.pdf', { type: 'application/pdf' });
	fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
	save();
	await waitFor(() => expect(mockPurchase).toHaveBeenCalled());
	const body = mockPurchase.mock.calls[0][0].data as FormData;
	expect(body).toBeInstanceOf(FormData);
	expect(body.get('cout_achat_mad')).toBe('440');
	expect(body.get('justificatifs_file')).toBe(file);
});

it('reads a revised supplier proforma into the form without submitting it', async () => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: {
			...order,
			numero_proforma_fournisseur: 'OLD-2026',
			proforma_fournisseur_file: '/media/ancien.pdf',
		},
	});
	mockProformaFields.mockResolvedValue({
		fields: { numero_proforma_fournisseur: '026001', montant_proforma_fournisseur: '100.01' },
		warnings: [],
	});
	await renderForm('proforma');
	const upload = new File(['%PDF-1.4'], 'revised.pdf', { type: 'application/pdf' });
	fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [upload] } });
	await waitFor(() =>
		expect(screen.getByRole('textbox', { name: /N° de proforma fournisseur/ })).toHaveValue('026001'),
	);
	expect(mockExtractProforma.mock.calls[0][0].data.get('file')).toBe(upload);
	expect(screen.getByText(/Vérifiez les champs préremplis/).closest('.MuiAlert-root')).toHaveClass(
		'MuiAlert-colorInfo',
	);
	expect(screen.queryByText(/Champs à vérifier ou à renseigner/)).not.toBeInTheDocument();
	expect(mockPurchase).not.toHaveBeenCalled();
});

it('sends every original from Transit and keeps previously attached files visible', async () => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: { ...order, documents_originaux_file: '/media/ancien.pdf' },
	});
	await renderForm('transit');
	const documents = screen.getByRole('combobox', { name: 'Libellé' });
	fireEvent.mouseDown(documents);
	fireEvent.click(screen.getByRole('option', { name: 'Documents originaux' }));
	const input = document.querySelector('input[type="file"]') as HTMLInputElement;
	expect(input.multiple).toBe(true);
	const files = [
		new File(['%PDF-1.4'], 'packing-list.pdf', { type: 'application/pdf' }),
		new File(['%PDF-1.4'], 'certificat.pdf', { type: 'application/pdf' }),
	];
	fireEvent.change(input, { target: { files } });
	expect(screen.getByText(/ancien.pdf/)).toBeInTheDocument();
	expect(screen.getByText(/packing-list.pdf/)).toBeInTheDocument();
	expect(screen.getByText(/certificat.pdf/)).toBeInTheDocument();
	save();
	await waitFor(() => expect(mockPurchase).toHaveBeenCalled());
	const body = mockPurchase.mock.calls[0][0].data as FormData;
	expect(body.getAll('documents_originaux_files')).toEqual(files);
	expect(body.get('etape')).toBe('transit');
});

it.each(['remove', 'replace'])('discards values suggested by a proforma after %s', async (change) => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: {
			...order,
			numero_proforma_fournisseur: 'OLD-2026',
			proforma_fournisseur_file: '/media/ancien.pdf',
		},
	});
	mockProformaFields
		.mockResolvedValueOnce({ fields: { numero_proforma_fournisseur: 'REVISED' }, warnings: [] })
		.mockResolvedValueOnce({ fields: {}, warnings: ['Vérifiez le numéro manuellement.'] });
	await renderForm('proforma');
	const input = document.querySelector('input[type="file"]')!;
	const number = screen.getByRole('textbox', { name: /N° de proforma fournisseur/ });
	fireEvent.change(input, {
		target: { files: [new File(['%PDF-1.4'], 'revised.pdf', { type: 'application/pdf' })] },
	});
	await waitFor(() => expect(number).toHaveValue('REVISED'));
	if (change === 'remove') {
		fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
	} else {
		fireEvent.change(input, {
			target: { files: [new File(['%PDF-1.4'], 'unreadable.pdf', { type: 'application/pdf' })] },
		});
		await screen.findByText('Vérifiez le numéro manuellement.');
	}
	await waitFor(() => expect(number).toHaveValue('OLD-2026'));
});

it('rereads a validated proforma while flagging financial differences for accounting', async () => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: {
			...order,
			is_proforma_step_complete: true,
			numero_proforma_fournisseur: 'OLD-2026',
			montant_proforma_fournisseur: '100.01',
			devise_proforma_fournisseur: 'EUR',
			proforma_fournisseur_file: '/media/ancien.pdf',
			workflow: {
				etape_courante: 'production',
				etapes: [{ key: 'proforma', completed: true, accessible: true }],
			},
		},
	});
	mockProformaFields.mockResolvedValue({
		fields: {
			numero_proforma_fournisseur: '026001',
			montant_proforma_fournisseur: '250.00',
			devise_proforma_fournisseur: 'MAD',
		},
		warnings: [],
	});
	await renderForm('proforma&proposer=1');
	fireEvent.click(screen.getByRole('button', { name: 'Relire la proforma jointe' }));
	expect(mockExtractProforma).toHaveBeenCalledWith({ id: 7 });
	expect(await screen.findByText(/diffère de l’échéancier validé/)).toBeInTheDocument();
	expect(screen.getByRole('textbox', { name: /N° de proforma fournisseur/ })).toHaveValue('026001');
	expect(screen.getByRole('textbox', { name: /Montant total fournisseur/ })).toHaveValue('100,01');
	expect(screen.getByRole('combobox', { name: /Devise de la proforma fournisseur/ })).toHaveTextContent('EUR');
});

it('keeps successive original document selections in the Expédition correction', async () => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: {
			...order,
			statut: 'Transit',
			date_expedition_reelle: '2026-11-26',
			documents_originaux_file: '/media/ancien.pdf',
			documents: [{ champ: 'documents_originaux_files', etape: 'transit', url: '/media/transit-only.pdf' }],
			workflow: {
				etape_courante: 'transit',
				etapes: [{ key: 'expedition', completed: true, accessible: true }],
			},
		},
	});
	await renderForm('expedition&proposer=1');
	fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Libellé' }));
	fireEvent.click(screen.getByRole('option', { name: 'Documents originaux' }));
	const input = document.querySelector('input[type="file"]') as HTMLInputElement;
	expect(input.multiple).toBe(true);
	const packingList = new File(['%PDF-1.4 list'], 'packing-list.pdf', { type: 'application/pdf' });
	const certificate = new File(['%PDF-1.4 certificate'], 'certificat.pdf', { type: 'application/pdf' });
	fireEvent.change(input, { target: { files: [packingList] } });
	fireEvent.change(input, { target: { files: [certificate] } });
	expect(screen.getByText('Document original 1')).toBeInTheDocument();
	expect(screen.getByText('Document original 2')).toBeInTheDocument();
	expect(screen.getByText('Document original 3')).toBeInTheDocument();
	expect(screen.queryByText(/transit-only/)).not.toBeInTheDocument();
	fireEvent.change(screen.getByRole('textbox', { name: /Motif de la modification/ }), {
		target: { value: 'Ajouter la liste de colisage et le certificat.' },
	});
	fireEvent.click(screen.getByRole('button', { name: 'Soumettre les modifications' }));
	await waitFor(() => expect(mockPurchase).toHaveBeenCalled());
	const body = mockPurchase.mock.calls[0][0].data as FormData;
	expect(body.get('action')).toBe('demander_modification');
	expect(body.get('etape')).toBe('expedition');
	expect(body.getAll('documents_originaux_files')).toEqual([packingList, certificate]);
});

it('prefills and proposes a revised total while installments are still unsubmitted', async () => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: {
			...order,
			is_proforma_step_complete: true,
			numero_proforma_fournisseur: 'ZLZ2-2388/26',
			date_proforma_fournisseur: '2026-10-29',
			montant_proforma_fournisseur: '40121.80',
			devise_proforma_fournisseur: 'EUR',
			condition_achat: 'advance30_documentary70',
			incoterm: 'CIF',
			delai_proforma_jours: 10,
			proforma_fournisseur_file: '/media/ancien.pdf',
			lignes: [
				{
					article: 1,
					article_reference: 'QA',
					designation: 'Article QA',
					quantity: '1',
					prix_achat: '38888.89',
					expected_emplacement: null,
				},
			],
			workflow: {
				etape_courante: 'titre',
				etapes: [{ key: 'proforma', completed: true, accessible: true }],
				proforma_total_editable: true,
			},
		},
	});
	mockProformaFields.mockResolvedValue({
		fields: { montant_proforma_fournisseur: '38888.89', devise_proforma_fournisseur: 'EUR', incoterm: 'CFR' },
		warnings: [],
	});
	await renderForm('proforma&proposer=1');
	const upload = new File(['%PDF-1.4'], 'revised.pdf', { type: 'application/pdf' });
	fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [upload] } });
	const total = screen.getByRole('textbox', { name: /Montant total fournisseur/ });
	await waitFor(() => expect(total).toHaveValue('38\u202f888,89'));
	expect(total).toBeEnabled();
	expect(screen.getByText(/Les échéances seront recalculées/)).toBeInTheDocument();
	expect(screen.queryByText(/diffère de l’échéancier validé/)).not.toBeInTheDocument();
	fireEvent.change(screen.getByRole('textbox', { name: /Motif de la modification/ }), {
		target: { value: 'Nouveau montant indiqué sur la proforma fournisseur.' },
	});
	fireEvent.click(screen.getByRole('button', { name: 'Soumettre les modifications' }));
	await waitFor(() => expect(mockPurchase).toHaveBeenCalled());
	const body = mockPurchase.mock.calls[0][0].data as FormData;
	expect(body.get('proforma_fournisseur_file')).toBe(upload);
	expect(JSON.parse(String(body.get('modifications')))).toMatchObject({
		montant_proforma_fournisseur: '38888.89',
		devise_proforma_fournisseur: 'EUR',
		condition_achat: 'advance30_documentary70',
	});
});
