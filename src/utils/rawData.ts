import type { AccountGenderCodeValueType, DropDownType } from '@/types/accountTypes';
import type { TranslationDictionary } from '@/types/languageTypes';

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
