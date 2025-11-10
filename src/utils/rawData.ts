import { AccountGenderCodeValueType, DropDownType } from '@/types/accountTypes';

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

// '', 'Mme', 'Mlle', 'M.'
export const civiliteItemsList: Array<DropDownType> = [
	{ code: '', value: '' },
	{ code: 'M.', value: 'M.' },
	{ code: 'Mme', value: 'Mme' },
	{ code: 'Mlle', value: 'Mlle' },
];
