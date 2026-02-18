'use client';

import React from 'react';
import { FACTURE_CLIENT_EDIT, FACTURE_CLIENT_LIST } from '@/utils/routes';
import { useGetFactureClientQuery } from '@/store/services/factureClient';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperView from '@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView';
import type { CompanyDocumentData } from '@/types/companyDocumentsTypes';

type FactureClientData = CompanyDocumentData & {
	numero_facture?: string | number | null;
	date_facture?: string | null;
	numero_bon_commande_client?: string | number | null;
};

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const FactureClientViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const query = useGetFactureClientQuery({ id });

	return (
		<CompanyDocumentsWrapperView<FactureClientData>
			session={session}
			company_id={company_id}
			id={id}
			type="facture-client"
			title="Détails du facture client"
			backLabel="Liste des factures clients"
			backTo={FACTURE_CLIENT_LIST}
			editTo={FACTURE_CLIENT_EDIT}
			documentNumberLabel="Numéro de facture"
			getDocumentNumber={(d) => d?.numero_facture}
			documentDateLabel="Date de facture"
			getDocumentDateRaw={(d) => d?.date_facture}
			statusTitle="Statut du facture client"
			linesTitle="Lignes de facture client"
			termsSecondLabel="Numéro de bon commande client"
			getTermsSecondValue={(d) => d?.numero_bon_commande_client}
			query={query}
		/>
	);
};

export default FactureClientViewClient;
