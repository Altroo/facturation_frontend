import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { DocumentFormConfig } from '@/types/companyDocumentsTypes';
import { DeviClass, BonDeLivraisonClass, FactureClass } from '@/models/classes';

// ── Mock external dependencies ────────────────────────────────────
jest.mock('formik', () => {
	const actual = jest.requireActual('formik');
	return {
		...actual,
		useFormik: jest.fn(() => ({
			values: {
				numero_part: '001',
				year_part: '25',
				client: null,
				date_devis: '2025-01-01',
				numero_demande_prix_client: null,
				mode_paiement: null,
				remarque: null,
				remise_type: undefined,
				remise: undefined,
				devise: 'MAD',
				lignes: [],
				globalError: '',
			},
			errors: {},
			touched: {},
			handleSubmit: jest.fn(),
			handleBlur: jest.fn(() => jest.fn()),
			handleChange: jest.fn(() => jest.fn()),
			setFieldValue: jest.fn(),
			submitCount: 0,
		})),
	};
});
jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
jest.mock('next/image', () => ({
	__esModule: true,
	// eslint-disable-next-line @next/next/no-img-element
	default: (props: Record<string, unknown>) => <img {...props}  alt="" />,
}));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(() => []),
	useToast: jest.fn(() => ({ onSuccess: jest.fn(), onError: jest.fn() })),
}));
jest.mock('@/store/services/client', () => ({
	useGetClientsListQuery: jest.fn(() => ({ data: [], isLoading: false })),
}));
jest.mock('@/store/services/company', () => ({
	useGetCompanyQuery: jest.fn(() => ({ data: { uses_foreign_currency: false } })),
}));
jest.mock('@/store/services/article', () => ({
	useGetArticlesListQuery: jest.fn(() => ({ data: [], isLoading: false })),
}));
jest.mock('@/store/services/parameter', () => ({
	useGetModePaiementListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useGetLivreParListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useAddModePaiementMutation: jest.fn(() => [jest.fn()]),
	useAddLivreParMutation: jest.fn(() => [jest.fn()]),
}));
jest.mock('@/utils/rawData', () => ({
	bonDeLivraisonStatusItemsList: [],
	devisFactureStatusItemsList: [],
	remiseTypeItemsList: [],
}));
jest.mock('@/utils/helpers', () => ({
	getCompanyDocumentLabelForKey: jest.fn((_, k) => k),
	parseNumber: jest.fn((v) => Number(v)),
	safeParseForInput: jest.fn((v) => v ?? ''),
	setFormikAutoErrors: jest.fn(),
	ValidatePricesHelper: jest.fn(() => ({})),
	formatNumberWithSpaces: jest.fn((v) => String(v)),
}));
jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
	customDropdownTheme: jest.fn(() => ({})),
	gridInputTheme: jest.fn(() => ({})),
	customGridDropdownTheme: jest.fn(() => ({})),
}));
jest.mock('@/utils/routes', () => ({
	CLIENTS_ADD: jest.fn((id: number) => `/dashboard/clients/add?company_id=${id}`),
}));

// Mock form subcomponents
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: (props: { id?: string; label?: string }) => <div data-testid={`text-input-${props.id}`}>{props.label}</div>,
}));
jest.mock('@/components/formikElements/formattedNumberInput/formattedNumberInput', () => ({
	__esModule: true,
	default: (props: { id?: string; label?: string }) => <div data-testid={`num-input-${props.id}`}>{props.label}</div>,
}));
jest.mock('@/components/formikElements/customDropDownSelect/customDropDownSelect', () => ({
	__esModule: true,
	default: (props: { id?: string; label?: string }) => <div data-testid={`dropdown-${props.id}`}>{props.label}</div>,
}));
jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: (props: { id?: string; label?: string }) => <div data-testid={`autocomplete-${props.id}`}>{props.label}</div>,
}));
jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: (props: { buttonText?: string }) => <button>{props.buttonText}</button>,
}));
jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-progress">Loading...</div>,
}));
jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: () => <div data-testid="api-alert">Error</div>,
}));
jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: () => <div data-testid="action-modals" />,
}));
jest.mock('@/components/shared/addArticleModal/addArticleModal', () => ({
	__esModule: true,
	default: () => <div data-testid="add-article-modal" />,
}));
jest.mock('@/components/shared/globalRemiseModal/globalRemiseModal', () => ({
	__esModule: true,
	default: () => <div data-testid="global-remise-modal" />,
}));
jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/shared/addEntityModal/addEntityModal', () => ({
	__esModule: true,
	default: () => <div data-testid="add-entity-modal" />,
}));
jest.mock('@/components/shared/factureDevistotalCard/factureDevisTotalsCard', () => ({
	__esModule: true,
	default: () => <div data-testid="totals-card" />,
}));
jest.mock('@/components/shared/linesGrid/linesGrid', () => ({
	__esModule: true,
	default: (props: { title?: string }) => <div data-testid="lines-grid">{props.title}</div>,
}));
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
	DatePicker: (props: { label?: string }) => <div data-testid="date-picker">{props.label}</div>,
}));
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
	LocalizationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
	AdapterDateFns: jest.fn(),
}));
jest.mock('date-fns/locale', () => ({ fr: {} }));

// ── Import the REAL component ─────────────────────────────────────
import CompanyDocumentFormContent, { generateRowId, type SharedDocumentFormContentProps } from './companyDocumentFormContent';

const mockDevisConfig: DocumentFormConfig<DeviClass> = {
	documentType: 'devis',
	labels: {
		documentTypeName: 'devis',
		listLabel: 'Liste des devis',
		dateLabel: 'Date du devis',
		statusLabel: 'Statut du devis',
		linesLabel: 'Lignes du devis',
		deleteLineMessage: 'Supprimer cette ligne ?',
		addSuccessMessage: 'Devis créé.',
		updateSuccessMessage: 'Devis mis à jour.',
		addErrorMessage: 'Erreur création.',
		updateErrorMessage: 'Erreur mise à jour.',
	},
	fields: {
		numeroField: 'numero_devis',
		dateField: 'date_devis',
		extraField: 'numero_demande_prix_client',
		extraFieldLabel: 'N° demande de prix client',
	},
	routes: {
		listRoute: '/dashboard/devis',
		editRoute: (id: number, companyId: number) => `/dashboard/devis/${id}/edit?company_id=${companyId}`,
	},
	validation: {
		editSchema: { parse: jest.fn() } as unknown as DocumentFormConfig<DeviClass>['validation']['editSchema'],
		addSchema: { parse: jest.fn() } as unknown as DocumentFormConfig<DeviClass>['validation']['addSchema'],
	},
};

const createMockMutationFn = () => ({
	unwrap: jest.fn().mockResolvedValue({ id: 1 }),
});

const mockAddData = jest.fn(() => createMockMutationFn()) as unknown as SharedDocumentFormContentProps<DeviClass>['addData'];
const mockUpdateData = jest.fn(() => createMockMutationFn()) as unknown as SharedDocumentFormContentProps<DeviClass>['updateData'];
const mockPatchStatut = jest.fn(() => createMockMutationFn()) as unknown as SharedDocumentFormContentProps<DeviClass>['patchStatut'];

const defaultProps = {
	token: 'mock-token',
	company_id: 1,
	isEditMode: false,
	config: mockDevisConfig,
	isDataLoading: false,
	isNumLoading: false,
	rawNumData: { numero_devis: '001/25' },
	addData: mockAddData,
	isAddLoading: false,
	updateData: mockUpdateData,
	isUpdateLoading: false,
	patchStatut: mockPatchStatut,
	isPatchLoading: false,
};

describe('CompanyDocumentFormContent', () => {
	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	// ── Loading / Error States ────────────────────────────────────
	describe('Loading States', () => {
		it('shows ApiProgress when data is loading', () => {
			render(<CompanyDocumentFormContent {...defaultProps} isDataLoading={true} />);
			expect(screen.getByTestId('api-progress')).toBeInTheDocument();
		});

		it('shows ApiProgress when numero is loading', () => {
			render(<CompanyDocumentFormContent {...defaultProps} isNumLoading={true} />);
			expect(screen.getByTestId('api-progress')).toBeInTheDocument();
		});
	});

	describe('Error States', () => {
		it('shows ApiAlert when data error exists', () => {
			render(
				<CompanyDocumentFormContent
					{...defaultProps}
					isEditMode={true}
					id={1}
					dataError={{ status: 500, data: { details: 'server error' } }}
				/>,
			);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});
	});

	// ── Add mode (form rendering) ─────────────────────────────────
	describe('Add mode', () => {
		it('renders the back button with config label', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByText('Liste des devis')).toBeInTheDocument();
		});

		it('renders document info section', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByText('Informations du document')).toBeInTheDocument();
		});

		it('renders numero and year inputs', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByTestId('text-input-numero_part')).toBeInTheDocument();
			expect(screen.getByTestId('text-input-year_part')).toBeInTheDocument();
		});

		it('renders date picker with config label', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByText('Date du devis')).toBeInTheDocument();
		});

		it('renders client section with autocomplete', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByText('Client')).toBeInTheDocument();
			expect(screen.getByTestId('autocomplete-client')).toBeInTheDocument();
		});

		it('renders payment section', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByText('Paiement & Conditions')).toBeInTheDocument();
			expect(screen.getByTestId('autocomplete-mode_paiement')).toBeInTheDocument();
		});

		it('renders extra field from config', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByTestId('text-input-numero_demande_prix_client')).toBeInTheDocument();
		});

		it('renders remarque section', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getAllByText('Remarque').length).toBeGreaterThanOrEqual(1);
			expect(screen.getByTestId('text-input-remarque')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByText('Ajouter des articles')).toBeInTheDocument();
		});

		it('does NOT render statut section in add mode', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.queryByText('Statut du devis')).not.toBeInTheDocument();
		});

		it('does NOT render lines grid in add mode', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.queryByTestId('lines-grid')).not.toBeInTheDocument();
		});

		it('does NOT render remise globale in add mode', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.queryByText('Remise globale')).not.toBeInTheDocument();
		});

		it('renders refresh button when refetchNum is provided', () => {
			render(<CompanyDocumentFormContent {...defaultProps} refetchNum={jest.fn()} />);
			expect(screen.getByLabelText('Réinitialiser le numéro')).toBeInTheDocument();
		});
	});

	// ── Edit mode ─────────────────────────────────────────────────
	describe('Edit mode', () => {
		const editProps = {
			...defaultProps,
			isEditMode: true,
			id: 1,
			rawData: {
				id: 1,
				numero_devis: '001/25',
				date_devis: '2025-01-01',
				client: 1,
				statut: 'En attente' as const,
				mode_paiement: null,
				remarque: null,
				lignes: [],
				remise_type: undefined,
				remise: undefined,
				devise: 'MAD',
			} as unknown as SharedDocumentFormContentProps<DeviClass>['rawData'],
		};

		it('renders submit button with update text', () => {
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByText('Mettre à jour')).toBeInTheDocument();
		});

		it('renders statut section in edit mode', () => {
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByText('Statut du devis')).toBeInTheDocument();
			expect(screen.getByTestId('dropdown-statut')).toBeInTheDocument();
		});

		it('renders lines grid in edit mode', () => {
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByTestId('lines-grid')).toBeInTheDocument();
			expect(screen.getByText('Lignes du devis')).toBeInTheDocument();
		});

		it('renders remise globale section in edit mode', () => {
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByText('Remise globale')).toBeInTheDocument();
			expect(screen.getByText('Appliquer une remise globale')).toBeInTheDocument();
			expect(screen.getByText('Supprimer la remise globale')).toBeInTheDocument();
		});

		it('renders totals card in edit mode', () => {
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByTestId('totals-card')).toBeInTheDocument();
		});

		it('does NOT render refresh button in edit mode', () => {
			render(<CompanyDocumentFormContent {...editProps} refetchNum={jest.fn()} />);
			expect(screen.queryByTitle('Réinitialiser le numéro')).not.toBeInTheDocument();
		});
	});

	// ── Devise section ────────────────────────────────────────────
	describe('Devise section', () => {
		it('does NOT render devise when company does not use foreign currency', () => {
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.queryByText('Devise')).not.toBeInTheDocument();
		});

		it('renders devise when company uses foreign currency', () => {
			const { useGetCompanyQuery } = jest.requireMock('@/store/services/company') as { useGetCompanyQuery: jest.Mock };
			useGetCompanyQuery.mockReturnValue({ data: { uses_foreign_currency: true } });
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByText('Devise')).toBeInTheDocument();
			expect(screen.getByTestId('dropdown-devise')).toBeInTheDocument();
		});
	});

	// ── Exported helper: generateRowId ────────────────────────────
	describe('generateRowId', () => {
		it('returns "na-<index>" for null/undefined', () => {
			expect(generateRowId(undefined, 0)).toBe('na-0');
			expect(generateRowId(null as unknown as undefined, 3)).toBe('na-3');
		});

		it('handles numeric articleRef', () => {
			expect(generateRowId(42, 1)).toBe('42-1');
		});

		it('handles string numeric articleRef', () => {
			expect(generateRowId('7', 2)).toBe('7-2');
		});

		it('handles string non-numeric articleRef', () => {
			expect(generateRowId('abc', 0)).toBe('abc-0');
		});

		it('handles object articleRef with id', () => {
			expect(generateRowId({ id: 99 }, 5)).toBe('99-5');
		});

		it('handles object articleRef without id', () => {
			expect(generateRowId({} as Partial<import('@/models/classes').ArticleClass>, 1)).toBe('na-1');
		});
	});

	// ── RTK hook calls ────────────────────────────────────────────
	describe('Hook calls', () => {
		it('calls useGetClientsListQuery', () => {
			const { useGetClientsListQuery } = jest.requireMock('@/store/services/client') as { useGetClientsListQuery: jest.Mock };
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(useGetClientsListQuery).toHaveBeenCalled();
		});

		it('calls useGetArticlesListQuery', () => {
			const { useGetArticlesListQuery } = jest.requireMock('@/store/services/article') as { useGetArticlesListQuery: jest.Mock };
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(useGetArticlesListQuery).toHaveBeenCalled();
		});

		it('calls useGetCompanyQuery', () => {
			const { useGetCompanyQuery } = jest.requireMock('@/store/services/company') as { useGetCompanyQuery: jest.Mock };
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(useGetCompanyQuery).toHaveBeenCalled();
		});

		it('calls useAddModePaiementMutation', () => {
			const { useAddModePaiementMutation } = jest.requireMock('@/store/services/parameter') as { useAddModePaiementMutation: jest.Mock };
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(useAddModePaiementMutation).toHaveBeenCalled();
		});
	});

	// ── Rich data rendering ──────────────────────────────────────
	describe('Rich data rendering', () => {
		it('renders with non-empty clients data', () => {
			const clientService = jest.requireMock('@/store/services/client') as {
				useGetClientsListQuery: jest.Mock;
			};
			clientService.useGetClientsListQuery.mockReturnValue({
				data: [
					{ id: 1, raison_sociale: 'Corp A', client_type: 'PM' },
					{ id: 2, nom: 'Dupont', prenom: 'Jean', client_type: 'PP' },
				],
				isLoading: false,
			});
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByTestId('autocomplete-client')).toBeInTheDocument();
		});

		it('renders with non-empty mode paiement data', () => {
			const selectors = jest.requireMock('@/store/selectors') as {
				getModePaiementState: jest.Mock;
			};
			const hooks = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
			hooks.useAppSelector.mockImplementation((selector: jest.Mock) => {
				if (selector === selectors.getModePaiementState) {
					return [{ id: 1, nom: 'Chèque' }, { id: 2, nom: 'Virement' }];
				}
				return [];
			});
			render(<CompanyDocumentFormContent {...defaultProps} />);
			expect(screen.getByTestId('autocomplete-mode_paiement')).toBeInTheDocument();
			hooks.useAppSelector.mockReturnValue([]);
		});

		it('renders with non-empty articles data in edit mode', () => {
			const articleService = jest.requireMock('@/store/services/article') as {
				useGetArticlesListQuery: jest.Mock;
			};
			articleService.useGetArticlesListQuery.mockReturnValue({
				data: [
					{ id: 10, reference: 'ART-1', designation: 'Article 1', prix_vente: 100, prix_achat: 50, tva: 20 },
				],
				isLoading: false,
			});
			const editProps = {
				...defaultProps,
				isEditMode: true,
				id: 1,
				rawData: {
					id: 1,
					numero_devis: '001/25',
					date_devis: '2025-01-01',
					client: 1,
					statut: 'En attente' as const,
					mode_paiement: null,
					remarque: null,
					lignes: [],
					remise_type: undefined,
					remise: undefined,
					devise: 'MAD',
				} as unknown as SharedDocumentFormContentProps<DeviClass>['rawData'],
			};
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByTestId('lines-grid')).toBeInTheDocument();
		});

		it('renders edit mode with formik lines data', () => {
			const formikMock = jest.requireMock('formik') as { useFormik: jest.Mock };
			formikMock.useFormik.mockReturnValue({
				values: {
					numero_part: '002',
					year_part: '25',
					client: 1,
					date_devis: '2025-02-01',
					numero_demande_prix_client: 'DP-001',
					mode_paiement: 1,
					remarque: 'Test remarque',
					remise_type: 'pourcentage',
					remise: 10,
					devise: 'MAD',
					lignes: [
						{ article: 10, prix_vente: 100, quantity: 2, remise_type: '', remise: 0 },
					],
					globalError: '',
				},
				errors: {},
				touched: {},
				handleSubmit: jest.fn(),
				handleBlur: jest.fn(() => jest.fn()),
				handleChange: jest.fn(() => jest.fn()),
				setFieldValue: jest.fn(),
				submitCount: 0,
				isValid: true,
			});

			const articleService = jest.requireMock('@/store/services/article') as {
				useGetArticlesListQuery: jest.Mock;
			};
			articleService.useGetArticlesListQuery.mockReturnValue({
				data: [
					{ id: 10, reference: 'ART-1', designation: 'Article 1', prix_vente: 100, prix_achat: 50, tva: 20 },
				],
				isLoading: false,
			});

			const editProps = {
				...defaultProps,
				isEditMode: true,
				id: 1,
				rawData: {
					id: 1,
					numero_devis: '002/25',
					date_devis: '2025-02-01',
					client: 1,
					statut: 'En attente' as const,
					mode_paiement: 1,
					remarque: 'Test remarque',
					lignes: [{ article: 10, prix_vente: 100, quantity: 2, remise_type: '', remise: 0 }],
					remise_type: 'pourcentage',
					remise: 10,
					devise: 'MAD',
				} as unknown as SharedDocumentFormContentProps<DeviClass>['rawData'],
			};
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByTestId('totals-card')).toBeInTheDocument();
			expect(screen.getByText('Remise globale')).toBeInTheDocument();

			// Reset formik mock
			formikMock.useFormik.mockReturnValue({
				values: {
					numero_part: '001', year_part: '25', client: null, date_devis: '2025-01-01',
					numero_demande_prix_client: null, mode_paiement: null, remarque: null,
					remise_type: undefined, remise: undefined, devise: 'MAD', lignes: [], globalError: '',
				},
				errors: {}, touched: {}, handleSubmit: jest.fn(), handleBlur: jest.fn(() => jest.fn()),
				handleChange: jest.fn(() => jest.fn()), setFieldValue: jest.fn(), submitCount: 0,
			});
		});

		it('renders with add error state', () => {
			render(
				<CompanyDocumentFormContent
					{...defaultProps}
					addError={{ status: 500, data: { details: 'Validation error' } }}
				/>,
			);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('renders edit mode with update error state', () => {
			const editProps = {
				...defaultProps,
				isEditMode: true,
				id: 1,
				rawData: {
					id: 1, numero_devis: '001/25', date_devis: '2025-01-01', client: 1,
					statut: 'En attente' as const, mode_paiement: null, remarque: null,
					lignes: [], remise_type: undefined, remise: undefined, devise: 'MAD',
				} as unknown as SharedDocumentFormContentProps<DeviClass>['rawData'],
				updateError: { status: 500, data: { details: 'Update failed' } },
			};
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('renders with Commercial role', () => {
			render(<CompanyDocumentFormContent {...defaultProps} role="Commercial" />);
			expect(screen.getByText('Informations du document')).toBeInTheDocument();
		});
	});

	// ── Bon de livraison config ───────────────────────────────────
	describe('Bon de livraison config', () => {
		const bdlConfig: DocumentFormConfig<BonDeLivraisonClass> = {
			...mockDevisConfig,
			documentType: 'bon-de-livraison',
			labels: {
				...mockDevisConfig.labels,
				documentTypeName: 'bon de livraison',
				listLabel: 'Liste des bons de livraison',
				dateLabel: 'Date du bon',
				statusLabel: 'Statut du bon',
				linesLabel: 'Lignes du bon',
			},
			fields: {
				numeroField: 'numero_bon_livraison',
				dateField: 'date_bon_livraison',
				extraField: 'numero_bon_commande_client',
				extraFieldLabel: 'N° bon de commande client',
			},
			validation: {
				editSchema: { parse: jest.fn() } as unknown as DocumentFormConfig<BonDeLivraisonClass>['validation']['editSchema'],
				addSchema: { parse: jest.fn() } as unknown as DocumentFormConfig<BonDeLivraisonClass>['validation']['addSchema'],
			},
		};

		it('renders livre par section for bon-de-livraison', () => {
			const editProps = {
				...defaultProps,
				config: bdlConfig,
				isEditMode: true,
				id: 1,
				rawData: {
					id: 1, numero_bon_livraison: 'BL-001', date_bon_livraison: '2025-01-01',
					client: 1, statut: 'En attente' as const, mode_paiement: null,
					remarque: null, lignes: [], remise_type: undefined, remise: undefined,
					devise: 'MAD', livre_par: null,
				} as unknown as SharedDocumentFormContentProps<DeviClass>['rawData'],
			};
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByTestId('autocomplete-livre_par')).toBeInTheDocument();
		});

		it('renders livre par with non-empty data', () => {
			const hooks = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
			const selectors = jest.requireMock('@/store/selectors') as {
				getLivreParState: jest.Mock;
			};
			hooks.useAppSelector.mockImplementation((selector: jest.Mock) => {
				if (selector === selectors.getLivreParState) {
					return [{ id: 1, nom: 'Livreur A' }];
				}
				return [];
			});

			const editProps = {
				...defaultProps,
				config: bdlConfig,
				isEditMode: true,
				id: 1,
				rawData: {
					id: 1, numero_bon_livraison: 'BL-002', date_bon_livraison: '2025-02-01',
					client: 1, statut: 'En attente' as const, mode_paiement: null,
					remarque: null, lignes: [], remise_type: undefined, remise: undefined,
					devise: 'MAD', livre_par: 1,
				} as unknown as SharedDocumentFormContentProps<DeviClass>['rawData'],
			};
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByTestId('autocomplete-livre_par')).toBeInTheDocument();
			hooks.useAppSelector.mockReturnValue([]);
		});

		it('renders add mode with bon-de-livraison numero', () => {
			render(
				<CompanyDocumentFormContent
					{...defaultProps}
					config={bdlConfig}
					rawNumData={{ numero_bon_livraison: 'BL-003/25' } as unknown as typeof defaultProps.rawNumData}
				/>,
			);
			expect(screen.getByText('Liste des bons de livraison')).toBeInTheDocument();
		});
	});

	// ── getNumeroFromData helper via facture config ───────────────
	describe('Facture config rendering', () => {
		const factureConfig: DocumentFormConfig<FactureClass> = {
			...mockDevisConfig,
			documentType: 'facture-client',
			labels: {
				...mockDevisConfig.labels,
				documentTypeName: 'facture',
				listLabel: 'Liste des factures',
				dateLabel: 'Date de la facture',
			},
			fields: {
				numeroField: 'numero_facture',
				dateField: 'date_facture',
				extraField: 'numero_bon_commande_client',
				extraFieldLabel: 'N° bon de commande client',
			},
			validation: {
				editSchema: { parse: jest.fn() } as unknown as DocumentFormConfig<FactureClass>['validation']['editSchema'],
				addSchema: { parse: jest.fn() } as unknown as DocumentFormConfig<FactureClass>['validation']['addSchema'],
			},
		};

		it('renders with facture numero data', () => {
			render(
				<CompanyDocumentFormContent
					{...defaultProps}
					config={factureConfig}
					rawNumData={{ numero_facture: 'FC-001/25' } as unknown as typeof defaultProps.rawNumData}
				/>,
			);
			expect(screen.getByText('Liste des factures')).toBeInTheDocument();
		});

		it('renders edit mode with facture data', () => {
			const editProps = {
				...defaultProps,
				config: factureConfig,
				isEditMode: true,
				id: 1,
				rawData: {
					id: 1, numero_facture: 'FC-001/25', date_facture: '2025-01-01',
					client: 1, statut: 'En attente' as const, mode_paiement: null,
					remarque: null, lignes: [], remise_type: undefined, remise: undefined,
					devise: 'MAD',
				} as unknown as SharedDocumentFormContentProps<DeviClass>['rawData'],
			};
			render(<CompanyDocumentFormContent {...editProps} />);
			expect(screen.getByTestId('dropdown-statut')).toBeInTheDocument();
		});
	});
});
