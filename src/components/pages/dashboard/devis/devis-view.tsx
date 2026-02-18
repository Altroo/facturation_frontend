'use client';

import React from 'react';
import { DEVIS_EDIT, DEVIS_LIST } from '@/utils/routes';
import { useGetDeviQuery } from '@/store/services/devi';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperView from '@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView';
import type { CompanyDocumentData } from '@/types/companyDocumentsTypes';

type DevisData = CompanyDocumentData & {
	numero_devis?: string | number | null;
	date_devis?: string | null;
	numero_demande_prix_client?: string | number | null;
};

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const DevisViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const query = useGetDeviQuery({ id });

	return (
		<CompanyDocumentsWrapperView<DevisData>
			session={session}
			company_id={company_id}
			id={id}
			type="devis"
			title="Détails du devis"
			backLabel="Liste des devis"
			backTo={DEVIS_LIST}
			editTo={DEVIS_EDIT}
			documentNumberLabel="Numéro du devis"
			getDocumentNumber={(d) => d?.numero_devis}
			documentDateLabel="Date du devis"
			getDocumentDateRaw={(d) => d?.date_devis}
			statusTitle="Statut du devis"
			linesTitle="Lignes du devis"
			termsSecondLabel="Numéro demande prix client"
			getTermsSecondValue={(d) => d?.numero_demande_prix_client}
			query={query}
		/>
	);
};

export default DevisViewClient;
