import { AccountGenderCodeValueType } from '@/types/account/accountTypes';
import type { NbrEmployeType, CiviliteType } from '@/types/company/companyTypes';

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

export const nbrEmployeItemsList: Array<NbrEmployeType> = ['1 à 5', '5 à 10', '10 à 50', '50 à 100', 'plus que 100'];

export const civiliteItemsList: Array<CiviliteType> = ['', 'Mme', 'Mlle', 'M.'];
