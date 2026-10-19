import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useGetLogistiqueQuery } from '@/store/services/logistique';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { getInitStateToken } from '@/store/selectors';
import { useAppSelector } from '@/utils/hooks';
import { logistiqueEmptyValues } from '@/utils/rawData';
import { LOGISTIQUE_EDIT } from '@/utils/routes';
import { translations } from '@/translations';
import LogistiqueView from './logistique-view';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: () => 'token' }));
jest.mock('@/store/selectors', () => ({ getInitStateToken: jest.fn(), getUserCompaniesState: jest.fn() }));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
	useLanguage: () => ({ language: 'fr', t: jest.requireActual('@/translations').translations.fr }),
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
}));
jest.mock('@/store/services/company', () => ({ useGetUserCompaniesQuery: jest.fn() }));
jest.mock('@/store/services/logistique', () => ({
	useGetLogistiqueQuery: jest.fn(),
	...Object.fromEntries(
		[
			'useDeleteLogistiqueMutation',
			'usePatchLogistiqueStatutMutation',
			'usePatchLogistiqueWorkflowStatusMutation',
			'usePatchLogistiqueLaunchStatusMutation',
			'useRecordLogistiqueProformaRequestMutation',
			'useReviewLogistiqueSupplierProformaMutation',
			'useRequestLogistiquePaymentMutation',
			'useRetryLogistiquePaymentEmailMutation',
			'useStartLogistiquePaymentMutation',
			'useRecordLogistiquePaymentExecutionMutation',
			'useValidateLogistiquePaymentMutation',
			'useRejectLogistiquePaymentMutation',
			'useSetLogistiqueProofEmailStatusMutation',
			'useAddLogistiqueProcessNoteMutation',
			'useConfirmLogistiquePaymentReceiptMutation',
		].map((name) => [name, () => [jest.fn(), {}]]),
	),
}));
jest.mock('./supplier-purchase', () => ({
	__esModule: true,
	default: ({ company_id, id }: { company_id: number; id?: number }) => (
		<p>
			Nouveau parcours : {company_id}/{id}
		</p>
	),
}));
jest.mock('./use-logistique-email-polling', () => ({ useLogistiqueEmailPolling: jest.fn() }));
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock('@/components/shared/noPermission/noPermission', () => ({
	__esModule: true,
	default: () => <p>Accès refusé</p>,
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
	numero_commande: 'LOG-LEGACY',
	fournisseur: 'Ancien fournisseur',
	statut_global: 'En cours',
	statut: 'Proforma',
	responsable: 27,
	lignes: [],
	alerts: [],
	proformas_detail: [],
	echeancier_paiement: [],
	process_notes: [],
	events: [],
};

beforeEach(() => {
	jest.clearAllMocks();
	(useAppSelector as jest.Mock).mockImplementation((selector) =>
		selector === getInitStateToken ? { user: { pk: 27 } } : [],
	);
	(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 12, role: 'Logistique' }] });
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: order });
});

describe('LogistiqueView workflow routing and legacy details', () => {
	it.each([{ workflow_version: 2 }, { can_adopt_supplier_workflow: true }])(
		'uses the supplier workflow for %j',
		(override) => {
			(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: { ...order, ...override } });
			render(<LogistiqueView company_id={12} id={7} />);
			expect(screen.getByText('Nouveau parcours : 12/7')).toBeInTheDocument();
		},
	);

	it('keeps historical dossiers in the legacy detail view with company-scoped edit navigation', () => {
		render(<LogistiqueView company_id={12} id={7} />);
		expect(screen.queryByText(/Nouveau parcours/)).not.toBeInTheDocument();
		expect(screen.getAllByText('LOG-LEGACY').length).toBeGreaterThan(0);
		fireEvent.click(screen.getByRole('button', { name: t.common.edit }));
		expect(mockPush).toHaveBeenCalledWith(LOGISTIQUE_EDIT(7, 12));
	});

	it('denies legacy detail access outside the user company', () => {
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 34, role: 'Caissier' }] });
		render(<LogistiqueView company_id={12} id={7} />);
		expect(screen.getByText('Accès refusé')).toBeInTheDocument();
	});

	it('waits for company membership loading before showing historical details', () => {
		(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ isLoading: true });
		render(<LogistiqueView company_id={12} id={7} />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
		expect(screen.queryByText('Ancien fournisseur')).not.toBeInTheDocument();
	});

	it('shows API failures instead of historical dossier details', () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
			data: order,
			error: { status: 500, data: { details: { detail: ['Dossier indisponible.'] } } },
		});
		render(<LogistiqueView company_id={12} id={7} />);
		expect(screen.getByRole('alert')).toHaveTextContent('Dossier indisponible.');
		expect(screen.queryByText('Ancien fournisseur')).not.toBeInTheDocument();
	});
});
