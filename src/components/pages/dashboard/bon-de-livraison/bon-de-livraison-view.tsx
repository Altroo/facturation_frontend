'use client';

import React from 'react';
import { BON_DE_LIVRAISON_EDIT, BON_DE_LIVRAISON_LIST } from '@/utils/routes';
import { useGetBonDeLivraisonQuery } from '@/store/services/bonDeLivraison';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperView from '@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView';
import type { CompanyDocumentData } from '@/types/companyDocumentsTypes';

type BonDeLivraisonData = CompanyDocumentData & {
	numero_bon_livraison?: string | number | null;
	date_bon_livraison?: string | null;
	numero_bon_commande_client?: string | number | null;
};

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const BonDeLivraisonViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const query = useGetBonDeLivraisonQuery({ id });

	return (
		<CompanyDocumentsWrapperView<BonDeLivraisonData>
			session={session}
			company_id={company_id}
			id={id}
			type="bon-de-livraison"
			title="Détails du bon de livraison"
			backLabel="Liste des bon de livraison"
			backTo={BON_DE_LIVRAISON_LIST}
			editTo={BON_DE_LIVRAISON_EDIT}
			documentNumberLabel="Numéro du bon de livraison"
			getDocumentNumber={(b) => b?.numero_bon_livraison}
			documentDateLabel="Date du bon de livraison"
			getDocumentDateRaw={(b) => b?.date_bon_livraison}
			statusTitle="Statut du bon de livraison"
			linesTitle="Lignes du bon de livraison"
			termsSecondLabel="Numéro du bon de commande client"
			getTermsSecondValue={(b) => b?.numero_bon_commande_client}
			query={query}
		/>
	);
};

export default BonDeLivraisonViewClient;
