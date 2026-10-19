import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useGetLogistiqueQuery, useEditLogistiqueMutation } from '@/store/services/logistique';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { getInitStateToken } from '@/store/selectors';
import { useAppSelector } from '@/utils/hooks';
import { logistiqueEmptyValues } from '@/utils/rawData';
import { LOGISTIQUE_VIEW } from '@/utils/routes';
import { translations } from '@/translations';
import LogistiqueForm from './logistique-form';

const mockPush = jest.fn();
const mockOnError = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
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
}));
jest.mock('./supplier-purchase-form', () => ({
	__esModule: true,
	default: ({ company_id, id }: { company_id: number; id?: number }) => (
		<p>
			Nouveau parcours : {company_id}/{id ?? 'new'}
		</p>
	),
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
	statut: 'Proforma',
	proformas_detail: [],
	lignes: [],
	date_prevue: '2026-10-25',
	origine_marchandise: 'Italie',
	nature_marchandise: 'Meubles',
};
const mockEdit = jest.fn();
const mockUnwrap = jest.fn();
const renderForm = async (id: number | null = 7) => {
	await act(async () => {
		render(<LogistiqueForm company_id={12} id={id ?? undefined} />);
	});
};

beforeEach(() => {
	jest.clearAllMocks();
	(useAppSelector as jest.Mock).mockImplementation((selector) =>
		selector === getInitStateToken ? { user: { pk: 27 } } : [],
	);
	(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 12, role: 'Logistique' }] });
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: order });
	(useEditLogistiqueMutation as jest.Mock).mockReturnValue([mockEdit, {}]);
	mockEdit.mockReturnValue({ unwrap: mockUnwrap });
	mockUnwrap.mockResolvedValue({ id: 7 });
});

describe('LogistiqueForm workflow routing and legacy editing', () => {
	it.each([{ workflow_version: 2 }, { can_adopt_supplier_workflow: true }])(
		'uses the supplier workflow when the record indicates %j',
		async (override) => {
			(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: { ...order, ...override } });
			await renderForm();
			expect(screen.getByText('Nouveau parcours : 12/7')).toBeInTheDocument();
		},
	);

	it('uses the supplier workflow for new dossiers and skips the record query', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({});
		await renderForm(null);
		expect(useGetLogistiqueQuery).toHaveBeenCalledWith({ id: 0 }, { skip: true });
		expect(screen.getByText('Nouveau parcours : 12/new')).toBeInTheDocument();
	});

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
