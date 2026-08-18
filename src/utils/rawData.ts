import type { AccountGenderCodeValueType, DropDownType } from '@/types/accountTypes';
import type { TranslationDictionary } from '@/types/languageTypes';
import type {
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

export const getTranslatedGenderItemsList = (t: TranslationDictionary): Array<AccountGenderCodeValueType> => [
	{ code: 'H', value: t.rawData.genders.male },
	{ code: 'F', value: t.rawData.genders.female },
];

export const nbrEmployeItemsList: Array<DropDownType> = [
	{ code: '1 à 5', value: '1 à 5' },
	{ code: '5 à 10', value: '5 à 10' },
	{ code: '10 à 50', value: '10 à 50' },
	{ code: '50 à 100', value: '50 à 100' },
	{ code: 'plus que 100', value: 'plus que 100' },
];

export const getTranslatedNbrEmployeItemsList = (t: TranslationDictionary): Array<DropDownType> => [
	{ code: '1 à 5', value: t.rawData.employeeRanges['1to5'] },
	{ code: '5 à 10', value: t.rawData.employeeRanges['5to10'] },
	{ code: '10 à 50', value: t.rawData.employeeRanges['10to50'] },
	{ code: '50 à 100', value: t.rawData.employeeRanges['50to100'] },
	{ code: 'plus que 100', value: t.rawData.employeeRanges.moreThan100 },
];

// '', 'Mme', 'Mlle', 'M.'
export const civiliteItemsList: Array<DropDownType> = [
	{ code: '', value: '' },
	{ code: 'M.', value: 'M.' },
	{ code: 'Mme', value: 'Mme' },
	{ code: 'Mlle', value: 'Mlle' },
];

export const getTranslatedCiviliteItemsList = (t: TranslationDictionary): Array<DropDownType> => [
	{ code: '', value: '' },
	{ code: 'M.', value: t.rawData.civilites.mr },
	{ code: 'Mme', value: t.rawData.civilites.mrs },
	{ code: 'Mlle', value: t.rawData.civilites.miss },
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

export const getTranslatedDevisFactureStatusItemsList = (t: TranslationDictionary): Array<DropDownType> => [
	{ code: '', value: '' },
	{ code: 'Brouillon', value: t.rawData.documentStatuses.draft },
	{ code: 'Envoyé', value: t.rawData.documentStatuses.sent },
	{ code: 'Accepté', value: t.rawData.documentStatuses.accepted },
	{ code: 'Refusé', value: t.rawData.documentStatuses.refused },
	{ code: 'Annulé', value: t.rawData.documentStatuses.cancelled },
	{ code: 'Expiré', value: t.rawData.documentStatuses.expired },
];

export const bonDeLivraisonStatusItemsList: Array<DropDownType> = [
	...devisFactureStatusItemsList,
	{ code: 'Facturé', value: 'Facturé' },
];

export const getTranslatedBonDeLivraisonStatusItemsList = (t: TranslationDictionary): Array<DropDownType> => [
	...getTranslatedDevisFactureStatusItemsList(t),
	{ code: 'Facturé', value: t.rawData.documentStatuses.invoiced },
];

// 'Pourcentage', 'Fixe'
export const remiseTypeItemsList: Array<DropDownType> = [
	{ code: '', value: '' },
	{ code: 'Pourcentage', value: 'Pourcentage' },
	{ code: 'Fixe', value: 'Fixe' },
];

export const getTranslatedRemiseTypeItemsList = (t: TranslationDictionary): Array<DropDownType> => [
	{ code: '', value: '' },
	{ code: 'Pourcentage', value: t.rawData.remiseTypes.percentage },
	{ code: 'Fixe', value: t.rawData.remiseTypes.fixed },
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
	'Documents originaux',
	'Transit',
	'Dédouanement',
	'Réception locale',
	'Livraison client',
	'Clôture',
];

export const logistiqueLegacyStatusStepIndex: Record<LogistiqueLegacyStatut, number> = {
	'Réception commande': 0,
	'Commande fournisseur': 0,
	Proforma: 1,
	"Titre d'Importation": 2,
	Validation: 2,
	'Paiement demandé': 2,
	'Paiement effectué': 2,
	'SWIFT / Draft LC': 2,
	'Envoi SWIFT / Draft LC': 2,
	Production: 3,
	Expédition: 4,
	'Documents originaux': 4,
	Transit: 5,
	Dédouanement: 5,
	'Réception locale': 6,
	'Livraison client': 7,
	Clôture: 8,
	Annulé: 0,
};

export const logistiquePaymentStatusItemsList: LogistiquePaymentStatus[] = [
	'Non demandé',
	'En attente',
	'Validé',
];

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
