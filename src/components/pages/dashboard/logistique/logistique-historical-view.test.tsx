import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useGetLogistiqueQuery } from '@/store/services/logistique';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { getInitStateToken } from '@/store/selectors';
import { useAppSelector } from '@/utils/hooks';
import { logistiqueEmptyValues } from '@/utils/rawData';
import { LOGISTIQUE_EDIT } from '@/utils/routes';
import { translations } from '@/translations';
import LogistiqueView from './logistique-historical-view';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => new URLSearchParams(window.location.search),
}));
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
			'usePurchaseActionMutation',
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
	window.history.replaceState(null, '', '/dashboard/logistique/7?company_id=12');
	(useAppSelector as jest.Mock).mockImplementation((selector) =>
		selector === getInitStateToken ? { user: { pk: 27 } } : [],
	);
	(useGetUserCompaniesQuery as jest.Mock).mockReturnValue({ data: [{ id: 12, role: 'Logistique' }] });
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: order });
});

describe('LogistiqueView historical dossier details', () => {
	it('keeps historical dossiers in the legacy detail view with company-scoped edit navigation', () => {
		render(<LogistiqueView company_id={12} id={7} />);
		expect(screen.queryByText(/Nouveau parcours/)).not.toBeInTheDocument();
		expect(screen.getAllByText('LOG-LEGACY').length).toBeGreaterThan(0);
		fireEvent.click(screen.getByRole('button', { name: t.common.edit }));
		expect(mockPush).toHaveBeenCalledWith(`${LOGISTIQUE_EDIT(7, 12)}&etape=dossier`);
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

it('shows only the current card, allows read-only completed steps and locks future steps', () => {
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({
		data: {
			...order,
			is_launch_step_complete: true,
			is_proforma_step_complete: true,
			statut: 'Paiement demandé',
			workflow: {
				etape_courante: 'paiement',
				etapes: [
					{ key: 'dossier', label: 'Commande & lancement', completed: true, accessible: true },
					{ key: 'proforma', label: 'Proforma & conformité', completed: true, accessible: true },
					{ key: 'paiement', label: 'Banque & paiement', completed: false, accessible: true },
					{ key: 'production', label: 'Préparation fournisseur', completed: false, accessible: false },
				],
			},
		},
	});
	render(<LogistiqueView company_id={12} id={7} />);
	expect(screen.getByRole('heading', { name: 'Banque & paiement' })).toBeInTheDocument();
	expect(screen.queryByRole('heading', { name: t.logistique.commandLaunchSection })).not.toBeInTheDocument();
	expect(screen.queryByRole('heading', { name: t.logistique.proformaComplianceSection })).not.toBeInTheDocument();
	expect(screen.getByRole('tab', { name: /Préparation fournisseur/ })).toBeDisabled();
	fireEvent.click(screen.getByRole('tab', { name: 'Commande & lancement' }));
	expect(screen.getByRole('heading', { name: 'Commande & lancement' })).toBeInTheDocument();
	expect(screen.queryByRole('heading', { name: 'Banque & paiement' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: t.common.edit })).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Proposer une modification' })).toBeInTheDocument();
});
