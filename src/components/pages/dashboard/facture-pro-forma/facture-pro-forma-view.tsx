'use client';

import React from 'react';
import { FACTURE_PRO_FORMA_EDIT, FACTURE_PRO_FORMA_LIST } from '@/utils/routes';
import { useGetFactureProFormaQuery } from '@/store/services/factureProForma';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperView from '@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView';
import { CompanyDocumentData } from '@/types/companyDocumentsTypes';

type FactureProFormaData = CompanyDocumentData & {
	numero_facture?: string | number | null;
	date_facture?: string | null;
	numero_bon_commande_client?: string | number | null;
};

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const FactureProFormaViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const query = useGetFactureProFormaQuery({ id });

	return (
		<CompanyDocumentsWrapperView<FactureProFormaData>
			session={session}
			company_id={company_id}
			id={id}
			type="facture-pro-forma"
			title="Détails du facture pro-forma"
			backLabel="Liste des factures pro-forma"
			backTo={FACTURE_PRO_FORMA_LIST}
			editTo={FACTURE_PRO_FORMA_EDIT}
			documentNumberLabel="Numéro de facture"
			getDocumentNumber={(d) => d?.numero_facture}
			documentDateLabel="Date de facture"
			getDocumentDateRaw={(d) => d?.date_facture}
			statusTitle="Statut du facture pro-forma"
			linesTitle="Lignes de facture pro-forma"
			termsSecondLabel="Numéro de bon commande client"
			getTermsSecondValue={(d) => d?.numero_bon_commande_client}
			query={query}
		/>
	);
};

export default FactureProFormaViewClient;
