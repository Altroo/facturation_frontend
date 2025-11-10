import { TokenType } from '@/types/_initTypes';
import { CompanyClass } from '@/models/Classes';

export type NbrEmployeType = '' | '1 à 5' | '5 à 10' | '10 à 50' | '50 à 100' | 'plus que 100';
export type CiviliteType = '' | 'Mme' | 'Mlle' | 'M.';

export type managedByType = Array<{
	id: number;
	first_name: string | null;
	last_name: string | null;
	role: string | null;
}>;

export type ManagedByWriteOnlyType = Array<{
	pk: number;
	role: string | null;
}>;

export interface EditCompanyResponse extends TokenType {
	data: Partial<CompanyClass>;
}
