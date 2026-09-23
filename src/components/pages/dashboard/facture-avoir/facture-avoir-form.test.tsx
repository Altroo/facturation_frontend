import { type ComponentType, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { translations as mockTranslations } from '@/translations';
import type { AppSession } from '@/types/_initTypes';
import FactureAvoirForm from './facture-avoir-form';

type FormComponentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	role?: string;
};

const mockPush = jest.fn();
const mockRefetchNumber = jest.fn();

jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
	useSearchParams: () => ({ get: () => null }),
}));

jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: mockTranslations.fr }),
}));

jest.mock('@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm', () => ({
	__esModule: true,
	default: ({
		company_id,
		id,
		documentConfig,
		FormComponent,
	}: {
		company_id: number;
		id?: number;
		documentConfig: { addTitle: string; editTitle: string };
		FormComponent: ComponentType<FormComponentProps>;
	}) => (
		<section data-testid="company-document-form-wrapper">
			<h1>{id ? documentConfig.editTitle : documentConfig.addTitle}</h1>
			<FormComponent token="test-token" company_id={company_id} id={id} isEditMode={Boolean(id)} role="Caissier" />
		</section>
	),
}));

jest.mock('@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent', () => ({
	generateRowId: (article: number, index: number) => `${article}-${index}`,
}));

jest.mock('@/components/pages/dashboard/shared/company-documents-form/useDocumentLinesColumns', () => ({
	useDocumentLinesColumns: () => ({ linesColumns: [] }),
}));

jest.mock('@/components/shared/linesGrid/linesGrid', () => ({
	__esModule: true,
	default: ({ title }: { title: string }) => <div data-testid="lines-grid">{title}</div>,
}));

jest.mock('@/components/shared/addArticleModal/addArticleModal', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('@/components/shared/globalRemiseModal/globalRemiseModal', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('@/components/shared/factureDevistotalCard/factureDevisTotalsCard', () => ({
	__esModule: true,
	default: () => <div data-testid="totals-card">Totaux</div>,
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, type }: { buttonText: string; type?: 'button' | 'submit' }) => (
		<button type={type ?? 'button'}>{buttonText}</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div>Chargement</div>,
}));

jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label, disabled }: { id: string; label: string; disabled?: boolean }) => (
		<label htmlFor={id}>
			{label}
			<input id={id} disabled={disabled} />
		</label>
	),
}));

jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: ({ id, label, disabled }: { id: string; label: string; disabled?: boolean }) => (
		<label htmlFor={id}>
			{label}
			<input id={id} disabled={disabled} />
		</label>
	),
}));

jest.mock('@/components/formikElements/customDropDownSelect/customDropDownSelect', () => ({
	__esModule: true,
	default: ({ id, label, disabled }: { id: string; label: string; disabled?: boolean }) => (
		<label htmlFor={id}>
			{label}
			<select id={id} disabled={disabled} />
		</label>
	),
}));

jest.mock('@mui/x-date-pickers/DatePicker', () => ({
	DatePicker: ({ label }: { label: string }) => <div>{label}</div>,
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
	LocalizationProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('@/store/services/article', () => ({
	useGetArticlesListQuery: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/store/services/client', () => ({
	useGetClientsListQuery: () => ({ data: [] }),
}));

jest.mock('@/store/services/factureClient', () => ({
	useGetFactureClientListQuery: () => ({ data: [] }),
}));

jest.mock('@/store/services/parameter', () => ({
	useGetModePaiementListQuery: () => ({ data: [] }),
}));

jest.mock('@/store/services/factureAvoir', () => ({
	useGetFactureAvoirQuery: (_args: unknown, options: { skip: boolean }) => ({
		data: options.skip
			? undefined
			: {
					numero_avoir: 'AV-001/26',
					date_avoir: '2026-09-19',
					statut: 'Brouillon',
					motif_avoir: 'retour_marchandise',
					lignes: [],
				},
		isLoading: false,
		error: undefined,
	}),
	useGetNumFactureAvoirQuery: () => ({
		data: { numero_avoir: 'AV-002/26' },
		isLoading: false,
		refetch: mockRefetchNumber,
	}),
	useGetFactureAvoirFromFactureQuery: () => ({ data: undefined, isFetching: false }),
	useLazyGetFactureAvoirFromFactureQuery: () => [jest.fn(), { isFetching: false }],
	useAddFactureAvoirMutation: () => [jest.fn(), { isLoading: false, error: undefined }],
	useEditFactureAvoirMutation: () => [jest.fn(), { isLoading: false, error: undefined }],
	usePatchFactureAvoirStatutMutation: () => [jest.fn(), { isLoading: false }],
}));

jest.mock('@/utils/themes', () => ({
	textInputTheme: () => ({}),
	customDropdownTheme: () => ({}),
}));

const mockSession = {} as AppSession;

describe('FactureAvoirForm', () => {
	it('renders the add form with the shared document structure', () => {
		render(<FactureAvoirForm session={mockSession} company_id={1} />);

		expect(screen.getByRole('heading', { name: "Ajouter une facture d'avoir" })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: "Liste des factures d'avoir" })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Informations du document' })).toBeInTheDocument();
		expect(screen.getByLabelText("Motif de l'avoir *")).toBeInTheDocument();
		expect(screen.getByLabelText("Sélectionner une facture d'origine *")).toBeInTheDocument();
		expect(screen.getByTestId('lines-grid')).toHaveTextContent("Lignes de l'avoir");
		expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
	});

	it('renders the edit form with status and update controls', () => {
		render(<FactureAvoirForm session={mockSession} company_id={1} id={12} />);

		expect(screen.getByRole('heading', { name: "Modifier la facture d'avoir" })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: "Statut de l'avoir" })).toBeInTheDocument();
		expect(screen.getByLabelText('Statut')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Mettre à jour' })).toBeInTheDocument();
	});
});
