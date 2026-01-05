'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessTokenFromSession } from '@/store/session';
import { useDeleteBonDeLivraisonMutation, useGetBonDeLivraisonUninvoicedListQuery } from '@/store/services/bonDeLivraison';
import { BON_DE_LIVRAISON_ADD, BON_DE_LIVRAISON_EDIT, BON_DE_LIVRAISON_VIEW } from '@/utils/routes';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import { BonDeLivraisonClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import type { DocumentListConfig, PaginationModel } from '@/types/companyDocumentsTypes';

const bonDeLivraisonUninvoicedListConfig: DocumentListConfig<BonDeLivraisonClass> = {
	documentType: 'bon-de-livraison',
	labels: {
		documentTypeName: 'bon de livraison',
		pageTitle: 'BLs Non Facturés',
		addButtonText: 'Nouveau bon de livraison',
		deleteSuccessMessage: 'Bon de livraison supprimé avec succès',
		deleteErrorMessage: 'Erreur lors de la suppression du bon de livraison',
		deleteConfirmTitle: 'Supprimer ce bon de livraison ?',
		deleteConfirmBody: 'Êtes‑vous sûr de vouloir supprimer ce bon de livraison ?',
	},
	routes: {
		addRoute: BON_DE_LIVRAISON_ADD,
		editRoute: BON_DE_LIVRAISON_EDIT,
		viewRoute: BON_DE_LIVRAISON_VIEW,
	},
	columns: {
		numeroField: 'numero_bon_livraison',
		numeroHeaderName: 'Numéro bon livraison',
		dateField: 'date_bon_livraison',
		dateHeaderName: 'Date bon livraison',
		extraField: 'numero_bon_commande_client',
		extraFieldHeaderName: 'N° bon commande client',
	},
};

interface FormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

const FormikContent: React.FC<FormikContentProps> = (props) => {
	const { session, company_id, role } = props;
	const router = useRouter();
	const token = getAccessTokenFromSession(session);

	const [paginationModel, setPaginationModel] = useState<PaginationModel>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');

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
		/>
	);
};

const BonDeLivraisonUninvoicedListClient: React.FC<SessionProps> = ({ session }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title="BLs Non Facturés">
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default BonDeLivraisonUninvoicedListClient;
