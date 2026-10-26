import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
	useGetLogistiqueQuery,
	useEditLogistiqueMutation,
	usePurchaseActionMutation,
} from '@/store/services/logistique';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { getInitStateToken } from '@/store/selectors';
import { useAppSelector } from '@/utils/hooks';
import { logistiqueEmptyValues } from '@/utils/rawData';
import { LOGISTIQUE_VIEW } from '@/utils/routes';
import { translations } from '@/translations';
import LogistiqueForm from './logistique-historical-form';

const mockPush = jest.fn();
const mockOnError = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: () => 'token' }));
jest.mock('@/store/selectors', () => ({ getInitStateToken: jest.fn(), getUserCompaniesState: jest.fn() }));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
	useLanguage: () => ({ language: 'fr', t: jest.requireActual('@/translations').translations.fr }),
	useToast: () => ({ onSuccess: jest.fn(), onError: mockOnError }),
}));
jest.mock('@/store/services/company', () => ({ useGetUserCompaniesQuery: jest.fn() }));
jest.mock('@/store/services/factureProForma', () => ({ useGetFactureProFormaListQuery: () => ({ data: [] }) }));
jest.mock('@/store/services/parameter', () => ({
	useGetMarqueListQuery: () => ({ data: [] }),
	useAddMarqueMutation: () => [jest.fn()],
	useEditMarqueMutation: () => [jest.fn()],
	useDeleteMarqueMutation: () => [jest.fn()],
}));
jest.mock('@/store/services/logistique', () => ({
	useGetLogistiqueQuery: jest.fn(),
	useGetLogistiqueResponsablesQuery: () => ({ data: [{ id: 27, label: 'Responsable Test' }] }),
	useGetLogistiqueSourcePreviewQuery: () => ({}),
	useAddLogistiqueMutation: () => [jest.fn(), {}],
	useEditLogistiqueMutation: jest.fn(),
	usePurchaseActionMutation: jest.fn(),
}));
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock('@/components/shared/noPermission/noPermission', () => ({
	__esModule: true,
	default: () => <p>Accès refusé</p>,
}));
jest.mock('@/components/shared/entityCrudControls/entityCrudControls', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div role="progressbar" />,
}));

const t = translations.fr;
const order = {
	...logistiqueEmptyValues,
	id: 7,
	company: 12,
	workflow_version: 1,
	responsable: 27,
	fournisseur: 'Ancien fournisseur',
	statut_paiement: 'Non demandé',
	statut: 'Expédition',
	workflow: {
		etape_courante: 'expedition',
		etapes: [{ key: 'expedition', label: 'Expédition', accessible: true, completed: false }],
	},
	proformas_detail: [],
	lignes: [],
	date_prevue: '2026-10-25',
	origine_marchandise: 'Italie',
	nature_marchandise: 'Meubles',
};
const mockEdit = jest.fn();
const mockPropose = jest.fn();
const mockUnwrap = jest.fn();
const renderForm = async (id: number | null = 7) => {
	await act(async () => {
		render(<LogistiqueForm company_id={12} id={id ?? undefined} />);
	});
};

beforeEach(() => {
	jest.clearAllMocks();
	window.history.replaceState(null, '', '/dashboard/logistique/7?company_id=12');
	(useAppSelector as jest.Mock).mockImplementation((selector) =>
		selector === getInitStateToken ? { user: { pk: 27 } } : [],
	);
	(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 12, role: 'Logistique' }] });
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: order });
	(useEditLogistiqueMutation as jest.Mock).mockReturnValue([mockEdit, {}]);
	(usePurchaseActionMutation as jest.Mock).mockReturnValue([mockPropose]);
	mockPropose.mockReturnValue({ unwrap: mockUnwrap });
	mockEdit.mockReturnValue({ unwrap: mockUnwrap });
	mockUnwrap.mockResolvedValue({ id: 7 });
});

describe('LogistiqueForm historical dossier editing', () => {
	it('keeps existing legacy dossier values and saves edits through the legacy endpoint', async () => {
		await renderForm();
		expect(screen.queryByText(/Nouveau parcours/)).not.toBeInTheDocument();
		expect(screen.getByText('Ancien fournisseur')).toBeInTheDocument();
		const input = screen.getByPlaceholderText(t.logistique.placeholders.transport);
		fireEvent.change(input, { target: { value: 'Transport corrigé' } });
		fireEvent.click(screen.getByRole('button', { name: t.common.save }));

		await waitFor(() => expect(mockPush).toHaveBeenCalledWith(LOGISTIQUE_VIEW(7, 12)));
		expect(mockEdit).toHaveBeenCalledWith({ id: 7, data: expect.objectContaining({ transport: 'Transport corrigé' }) });
		expect(mockEdit.mock.calls[0][0].data).not.toHaveProperty('fournisseur');
	});

	it('denies legacy edits outside the user company', async () => {
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 34, role: 'Caissier' }] });
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: { ...order, responsable: 28 } });
		await renderForm();
		expect(screen.getByText('Accès refusé')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: t.common.save })).not.toBeInTheDocument();
	});

	it('retains entered values and reports a failed legacy save', async () => {
		mockUnwrap.mockRejectedValueOnce({ data: { details: { fournisseur: ['Fournisseur invalide.'] } } });
		await renderForm();
		fireEvent.click(screen.getByRole('button', { name: t.common.save }));

		await waitFor(() => expect(mockOnError).toHaveBeenCalledWith('Fournisseur invalide.'));
		expect(screen.getByText('Ancien fournisseur')).toBeInTheDocument();
		expect(mockPush).not.toHaveBeenCalled();
	});
});

it('refuses direct access to an unapproved completed stage', async () => {
	window.history.replaceState(null, '', '/dashboard/logistique/7/edit?company_id=12&etape=dossier');
	await renderForm();
	expect(screen.getByText('Accès refusé')).toBeInTheDocument();
});
it('limits an approved correction to that requester and step', async () => {
	window.history.replaceState(null, '', '/dashboard/logistique/7/edit?company_id=12&etape=dossier&correction_id=9');
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: { ...order, change_requests: [{ id: 9, demandeur: 27, etape: 'dossier', statut: 'approved' }] },
	});
	await renderForm();
	expect(screen.queryByPlaceholderText(t.logistique.placeholders.transport)).not.toBeInTheDocument();
	fireEvent.change(screen.getByPlaceholderText(t.logistique.placeholders.description), {
		target: { value: 'Description corrigée' },
	});
	fireEvent.click(screen.getByRole('button', { name: t.common.save }));
	await waitFor(() =>
		expect(mockEdit).toHaveBeenCalledWith({
			id: 7,
			data: expect.objectContaining({ description: 'Description corrigée', etape: 'dossier', correction_id: 9 }),
		}),
	);
	expect(mockEdit.mock.calls[0][0].data).not.toHaveProperty('transport');
});

it('proposes actual edits on a completed historical step with a reason', async () => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: {
			...order,
			workflow: {
				etape_courante: 'expedition',
				etapes: [{ key: 'dossier', label: 'Dossier', completed: true, accessible: true }],
			},
		},
	});
	window.history.replaceState(null, '', '/dashboard/logistique/7/edit?company_id=12&etape=dossier&proposer=1');
	await renderForm();
	const submit = screen.getByRole('button', { name: 'Soumettre les modifications' });
	expect(submit).toBeDisabled();
	fireEvent.change(screen.getByRole('textbox', { name: /Description|Remarque/i }), {
		target: { value: 'Correction du dossier' },
	});
	fireEvent.change(screen.getByRole('textbox', { name: /Motif de la modification/ }), {
		target: { value: 'Erreur de saisie' },
	});
	fireEvent.click(submit);
	await waitFor(() =>
		expect(mockPropose).toHaveBeenCalledWith({
			id: 7,
			data: expect.objectContaining({
				action: 'demander_modification',
				etape: 'dossier',
				remarque: 'Erreur de saisie',
				modifications: expect.objectContaining({ action: 'historical', description: 'Correction du dossier' }),
			}),
		}),
	);
	expect(mockEdit).not.toHaveBeenCalled();
});
