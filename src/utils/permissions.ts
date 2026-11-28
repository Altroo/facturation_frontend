import type { CompaniesUserCompaniesType } from '@/types/companyTypes';

export const canAddPayment = (company?: Pick<CompaniesUserCompaniesType, 'role' | 'can_add_payment'>): boolean =>
	company?.role === 'Caissier' ||
	company?.role === 'Commercial' ||
	(company?.role === 'Comptable' && company.can_add_payment === true);
