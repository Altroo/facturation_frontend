'use client';

import React, { useState } from 'react';
import type { TranslationDictionary } from '@/types/languageTypes';
import { useRouter } from 'next/navigation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteBonDeLivraisonMutation, useGetBonDeLivraisonUninvoicedListQuery } from '@/store/services/bonDeLivraison';
import { BON_DE_LIVRAISON_ADD, BON_DE_LIVRAISON_EDIT, BON_DE_LIVRAISON_VIEW } from '@/utils/routes';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import type { BonDeLivraisonClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import type { DocumentListConfig, PaginationModel } from '@/types/companyDocumentsTypes';
import { useLanguage } from '@/utils/hooks';

const createBonDeLivraisonUninvoicedListConfig = (t: TranslationDictionary): DocumentListConfig<BonDeLivraisonClass> => ({
	documentType: 'bon-de-livraison',
	labels: {
		documentTypeName: t.bonsLivraison.documentTypeName,
		pageTitle: t.bonsLivraison.uninvoicedTitle,
		addButtonText: t.bonsLivraison.newBL,
		deleteSuccessMessage: t.bonsLivraison.deleteSuccess,
		deleteErrorMessage: t.bonsLivraison.deleteError,
		deleteConfirmTitle: t.bonsLivraison.deleteModalTitle,
		deleteConfirmBody: t.bonsLivraison.deleteModalBody,
	},
	routes: {
		addRoute: BON_DE_LIVRAISON_ADD,
		editRoute: BON_DE_LIVRAISON_EDIT,
		viewRoute: BON_DE_LIVRAISON_VIEW,
	},
	columns: {
		numeroField: 'numero_bon_livraison',
		numeroHeaderName: t.bonsLivraison.colNumeroBL,
		dateField: 'date_bon_livraison',
		dateHeaderName: t.bonsLivraison.colDateBL,
		extraField: 'numero_bon_commande_client',
		extraFieldHeaderName: t.bonsLivraison.colNumeroBonCommande,
	},
});
interface FormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

const FormikContent: React.FC<FormikContentProps> = (props) => {
	const { session, company_id, role } = props;
	const router = useRouter();
	const { t } = useLanguage();
	const bonDeLivraisonUninvoicedListConfig = React.useMemo(() => createBonDeLivraisonUninvoicedListConfig(t), [t]);
	const token = useInitAccessToken(session);

	const [paginationModel, setPaginationModel] = useState<PaginationModel>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});

	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetBonDeLivraisonUninvoicedListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			...customFilterParams,
		},
		{ skip: !token },
	);

	const data = rawData as PaginationResponseType<BonDeLivraisonClass> | undefined;

	const [deleteRecord] = useDeleteBonDeLivraisonMutation();

	return (
		<CompanyDocumentsListContent<BonDeLivraisonClass>
			companyId={company_id}
			role={role}
			router={router}
			config={bonDeLivraisonUninvoicedListConfig}
			queryResult={{ data, isLoading, refetch }}
			deleteMutation={{ deleteRecord }}
			paginationModel={paginationModel}
			setPaginationModel={setPaginationModel}
			searchTerm={searchTerm}
			setSearchTerm={setSearchTerm}
			onCustomFilterParamsChange={setCustomFilterParams}
			accessToken={token}
		/>
	);
};

const BonDeLivraisonUninvoicedListClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperList session={session} title={t.bonsLivraison.uninvoicedTitle}>
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default BonDeLivraisonUninvoicedListClient;
