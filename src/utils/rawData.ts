import type { AccountGenderCodeValueType, DropDownType, PasswordResetCodeField } from '@/types/accountTypes';
import type { TranslationDictionary } from '@/types/languageTypes';
import type { CompanyLike } from '@/types/companyDocumentsTypes';
import type {
	LogistiqueDocumentField,
	LogistiqueFormValues,
	LogistiqueImportTitleStatus,
	LogistiqueLaunchStatus,
	LogistiqueLegacyStatut,
	LogistiquePaymentMethod,
	LogistiquePaymentStatus,
	LogistiqueProformaStatus,
	LogistiqueStatut,
} from '@/types/logistiqueTypes';

export const genderItemsList: Array<AccountGenderCodeValueType> = [
	{
		code: 'H',
		value: 'Homme',
	},
	{
		code: 'F',
		value: 'Femme',
	},
];

export const nbrEmployeItemsList: Array<DropDownType> = [
	{ code: '1 à 5', value: '1 à 5' },
	{ code: '5 à 10', value: '5 à 10' },
	{ code: '10 à 50', value: '10 à 50' },
	{ code: '50 à 100', value: '50 à 100' },
	{ code: 'plus que 100', value: 'plus que 100' },
];

export const nbrEmployeFilterOptions = [
	{ value: '1 à 5', label: '1 à 5', color: 'default' as const },
	{ value: '5 à 10', label: '5 à 10', color: 'default' as const },
	{ value: '10 à 50', label: '10 à 50', color: 'default' as const },
	{ value: '50 à 100', label: '50 à 100', color: 'default' as const },
	{ value: 'plus que 100', label: 'plus que 100', color: 'default' as const },
];

export const reglementStatusFilterOptions = [
	{ value: 'Valide', label: 'Valide', color: 'success' as const },
	{ value: 'Annulé', label: 'Annulé', color: 'error' as const },
];

// '', 'Mme', 'Mlle', 'M.'
export const civiliteItemsList: Array<DropDownType> = [
	{ code: '', value: '' },
	{ code: 'M.', value: 'M.' },
	{ code: 'Mme', value: 'Mme' },
	{ code: 'Mlle', value: 'Mlle' },
];

// 'Brouillon', 'Envoyé', 'Accepté', 'Refusé', 'Annulé', 'Expiré'
export const devisFactureStatusItemsList: Array<DropDownType> = [
	{ code: '', value: '' },
	{ code: 'Brouillon', value: 'Brouillon' },
	{ code: 'Envoyé', value: 'Envoyé' },
	{ code: 'Accepté', value: 'Accepté' },
	{ code: 'Refusé', value: 'Refusé' },
	{ code: 'Annulé', value: 'Annulé' },
	{ code: 'Expiré', value: 'Expiré' },
];

export const bonDeLivraisonStatusItemsList: Array<DropDownType> = [
	...devisFactureStatusItemsList,
	{ code: 'Facturé', value: 'Facturé' },
];

// 'Pourcentage', 'Fixe'
export const remiseTypeItemsList: Array<DropDownType> = [
	{ code: '', value: '' },
	{ code: 'Pourcentage', value: 'Pourcentage' },
	{ code: 'Fixe', value: 'Fixe' },
];

export const logistiqueGlobalStatusItemsList: LogistiqueStatut[] = [
	'Brouillon',
	'À lancer',
	'En cours',
	'En attente externe',
	'Bloqué',
	'En retard',
	'À clôturer',
	'Clôturé',
	'Annulé',
	'Rouvert',
];

export const logistiqueLegacyWorkflowStatusItemsList: LogistiqueLegacyStatut[] = [
	'Réception commande',
	'Commande fournisseur',
	'Proforma',
	"Titre d'Importation",
	'Validation',
	'Paiement demandé',
	'Paiement effectué',
	'SWIFT / Draft LC',
	'Envoi SWIFT / Draft LC',
	'Production',
	'Expédition',
	'Transit',
	'Dédouanement',
	'Réception locale',
	'Livraison client',
	'Clôture',
];

const logistiqueLegacyStatusStepEntries = [
	['Réception commande', 0],
	['Commande fournisseur', 0],
	['Proforma', 1],
	["Titre d'Importation", 2],
	['Validation', 2],
	['Paiement demandé', 2],
	['Paiement effectué', 2],
	['SWIFT / Draft LC', 2],
	['Envoi SWIFT / Draft LC', 2],
	['Production', 3],
	['Expédition', 4],
	['Transit', 5],
	['Dédouanement', 5],
	['Réception locale', 6],
	['Livraison client', 7],
	['Clôture', 8],
	['Annulé', 0],
] satisfies Array<[LogistiqueLegacyStatut, number]>;

export const logistiqueLegacyStatusStepIndex = Object.fromEntries(logistiqueLegacyStatusStepEntries) as Record<
	LogistiqueLegacyStatut,
	number
>;

export const logistiquePaymentStatusItemsList: LogistiquePaymentStatus[] = ['Non demandé', 'En attente', 'Validé'];

export const logistiqueLaunchStatusItemsList: LogistiqueLaunchStatus[] = [
	'À lancer',
	'En cours',
	'En attente proforma',
	'Bloquée',
	'Terminée',
];

export const logistiqueProformaStatusItemsList: LogistiqueProformaStatus[] = [
	'En attente',
	'En contrôle',
	'Correction demandée',
	'Validée',
	'Refusée',
];

export const logistiqueImportTitleStatusItemsList: LogistiqueImportTitleStatus[] = [
	'À préparer',
	"Titre d'import validé – En attente de paiement",
];

export const logistiquePaymentMethodItemsList: LogistiquePaymentMethod[] = [
	'',
	'LC',
	'Virement',
	'Remise documentaire',
];

export const logistiqueCurrencyItemsList = ['MAD', 'EUR', 'USD'];

export const logistiqueManagerRoles = new Set(['Caissier', 'Commercial', 'Logistique']);

export const documentFields: LogistiqueDocumentField[] = [
	'titre_importation_file',
	'proforma_fournisseur_file',
	'justificatifs_file',
	'swift_file',
	'documents_originaux_file',
];

export const acceptedDocumentTypes = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';

export const importTitleFields: Array<keyof LogistiqueFormValues> = [
	'numero_domiciliation',
	'banque',
	'montant_titre_importation',
	'devise_titre_importation',
	'date_titre_importation',
	'methode_paiement',
	'avance_pourcentage',
	'titre_importation_file',
];

export const logistiqueProformaDecisionItems = logistiqueProformaStatusItemsList.filter(
	(status): status is Exclude<LogistiqueProformaStatus, 'En attente'> => status !== 'En attente',
);

export const logistiqueEmptyValues: LogistiqueFormValues = {
	proformas: [],
	fournisseur: '',
	devise: 'MAD',
	incoterm: '',
	transport: '',
	conditions_paiement: '',
	description: '',
	marques: [],
	responsable: '',
	date_prevue: '',
	date_reelle: '',
	statut: 'Réception commande',
	poids_net: '0',
	poids_brut: '0',
	volume: '0',
	origine_marchandise: '',
	nature_marchandise: '',
	numero_domiciliation: '',
	banque: '',
	montant_titre_importation: '0',
	devise_titre_importation: 'MAD',
	date_titre_importation: '',
	date_validation_titre_importation: '',
	statut_titre_importation: 'À préparer',
	methode_paiement: '',
	avance_pourcentage: '',
	date_paiement: '',
	montant_paiement: '0',
	devise_paiement: 'MAD',
	banque_paiement: '',
	reference_paiement: '',
	commentaire_paiement: '',
	cout_transport: '0',
	frais_transit: '0',
	frais_douane: '0',
	tva: '0',
	livraison_locale: '0',
	autres_frais: '0',
	titre_importation_file: null,
	proforma_fournisseur_file: null,
	justificatifs_file: null,
	swift_file: null,
	documents_originaux_file: null,
	documents_originaux_requis: false,
	statut_documents_originaux: '',
};

export const stockAdjustmentMovementItems: DropDownType[] = [
	{ value: 'adjustment', code: 'Ajustement' },
	{ value: 'opening', code: 'Stock initial' },
];

export const stockMovementOptions = [
	{ id: 'opening', nom: 'Stock initial', value: 'opening', label: 'Stock initial' },
	{ id: 'adjustment', nom: 'Ajustement', value: 'adjustment', label: 'Ajustement' },
	{ id: 'receipt', nom: 'Réception', value: 'receipt', label: 'Réception' },
	{ id: 'delivery', nom: 'Livraison', value: 'delivery', label: 'Livraison' },
	{ id: 'inventory', nom: 'Inventaire', value: 'inventory', label: 'Inventaire' },
	{ id: 'reversal', nom: 'Annulation', value: 'reversal', label: 'Annulation' },
];

export const stockMovementViewOptions = [
	{ value: 'opening', label: 'Stock initial' },
	{ value: 'adjustment', label: 'Ajustement' },
	{ value: 'receipt', label: 'Réception' },
	{ value: 'delivery', label: 'Livraison' },
	{ value: 'inventory', label: 'Inventaire' },
	{ value: 'reversal', label: 'Annulation' },
];

export const stockInventoryStatusOptions = [
	{ id: 'draft', nom: 'Brouillon', value: 'draft', label: 'Brouillon' },
	{ id: 'validated', nom: 'Validé', value: 'validated', label: 'Validé' },
	{ id: 'cancelled', nom: 'Annulé', value: 'cancelled', label: 'Annulé' },
];

export const stockStateOptions = [
	{ id: 'disponible', nom: 'Disponible' },
	{ id: 'minimum', nom: 'Stock minimum' },
	{ id: 'a_approvisionner', nom: 'À approvisionner' },
];

export const stockReceiptStatusOptions = [
	{ id: 'draft', nom: 'Brouillon', value: 'draft', label: 'Brouillon' },
	{ id: 'validated', nom: 'Validée', value: 'validated', label: 'Validée' },
	{ id: 'cancelled', nom: 'Annulée', value: 'cancelled', label: 'Annulée' },
];

export const passwordResetCodeFields: PasswordResetCodeField[] = ['one', 'two', 'three', 'four', 'five', 'six'];

export const globalErrorKeys = new Set(['detail', 'error', 'globalError', 'message', 'non_field_errors']);

export const valueLessFilterOperators = new Set(['isEmpty', 'isNotEmpty']);

export const dataGridPageSizes = new Set([5, 10, 25, 50, 100]);

export const dashboardChartColors = {
	primary: 'rgba(25, 118, 210, 0.8)',
	primaryLight: 'rgba(25, 118, 210, 0.2)',
	secondary: 'rgba(156, 39, 176, 0.8)',
	secondaryLight: 'rgba(156, 39, 176, 0.2)',
	success: 'rgba(46, 125, 50, 0.8)',
	successLight: 'rgba(46, 125, 50, 0.2)',
	warning: 'rgba(237, 108, 2, 0.8)',
	warningLight: 'rgba(237, 108, 2, 0.2)',
	error: 'rgba(211, 47, 47, 0.8)',
	errorLight: 'rgba(211, 47, 47, 0.2)',
	info: 'rgba(2, 136, 209, 0.8)',
	infoLight: 'rgba(2, 136, 209, 0.2)',
};

export const dashboardPieColors = [
	'rgba(25, 118, 210, 0.8)',
	'rgba(46, 125, 50, 0.8)',
	'rgba(237, 108, 2, 0.8)',
	'rgba(156, 39, 176, 0.8)',
	'rgba(211, 47, 47, 0.8)',
	'rgba(0, 188, 212, 0.8)',
	'rgba(255, 193, 7, 0.8)',
	'rgba(121, 85, 72, 0.8)',
];

export const logistiqueChartColors = {
	primary: 'rgba(25, 118, 210, 0.82)',
	primarySoft: 'rgba(25, 118, 210, 0.14)',
	success: 'rgba(46, 125, 50, 0.82)',
	successSoft: 'rgba(46, 125, 50, 0.14)',
	warning: 'rgba(237, 108, 2, 0.82)',
	warningSoft: 'rgba(237, 108, 2, 0.16)',
	error: 'rgba(211, 47, 47, 0.82)',
	info: 'rgba(2, 136, 209, 0.82)',
	secondary: 'rgba(106, 27, 154, 0.82)',
	neutral: 'rgba(69, 90, 100, 0.82)',
	brown: 'rgba(93, 64, 55, 0.82)',
};

export const logistiquePieColors = [
	logistiqueChartColors.primary,
	logistiqueChartColors.success,
	logistiqueChartColors.warning,
	logistiqueChartColors.error,
	logistiqueChartColors.info,
	logistiqueChartColors.secondary,
	logistiqueChartColors.neutral,
	logistiqueChartColors.brown,
];

export const emptyCompanies: CompanyLike[] = [];

export const pmRequired = ['raison_sociale', 'ville', 'ICE', 'delai_de_paiement'] as const;
export const ppRequired = ['nom', 'prenom', 'adresse', 'ville', 'delai_de_paiement'] as const;

export const publicPaths = [
	'/login',
	'/reset-password',
	'/reset-password/enter-code',
	'/reset-password/set-password',
	'/reset-password/set-password-complete',
	'/sso/start',
	'/sso/callback',
];

export const getTranslatedLogistiqueMacroSteps = (t: TranslationDictionary): string[] => [
	t.logistique.macroStepCommandLaunch,
	t.logistique.macroStepProforma,
	t.logistique.macroStepPayment,
	t.logistique.macroStepSupplierPreparation,
	t.logistique.macroStepShipping,
	t.logistique.macroStepCustoms,
	t.logistique.macroStepDelivery,
	t.logistique.macroStepClosing,
];
