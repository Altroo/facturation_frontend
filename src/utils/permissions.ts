import type { CompaniesUserCompaniesType } from '@/types/companyTypes';
import type { FactureClass } from '@/models/classes';

export const canAddPayment = (company?: Pick<CompaniesUserCompaniesType, 'role' | 'can_add_payment'>): boolean =>
	company?.role === 'Caissier' ||
	company?.role === 'Commercial' ||
	(company?.role === 'Comptable' && company.can_add_payment === true);

export const isInvoicePayable = (invoice?: Pick<FactureClass, 'statut' | 'reste_a_payer'>): boolean =>
	(invoice?.statut === 'Envoyé' || invoice?.statut === 'Accepté') && Number(invoice.reste_a_payer) > 0;
