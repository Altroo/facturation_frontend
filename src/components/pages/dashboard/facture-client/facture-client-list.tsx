'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReceiptLong as ReceiptLongIcon } from '@mui/icons-material';
import { getAccessTokenFromSession } from '@/store/session';
import {
	useConvertFactureClientToBonDeLivraisonMutation,
	useDeleteFactureClientMutation,
	useGetFactureClientListQuery,
} from '@/store/services/factureClient';
import { BON_DE_LIVRAISON_EDIT, FACTURE_CLIENT_ADD, FACTURE_CLIENT_EDIT, FACTURE_CLIENT_VIEW } from '@/utils/routes';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import type { FactureClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import type { DocumentListConfig, PaginationModel } from '@/types/companyDocumentsTypes';

const factureClientListConfig: DocumentListConfig<FactureClass> = {
	documentType: 'facture-client',
	labels: {
		documentTypeName: 'facture client',
		pageTitle: 'Liste des Factures Clients',
		addButtonText: 'Nouvelle facture client',
		deleteSuccessMessage: 'Facture client supprimé avec succès',
		deleteErrorMessage: 'Erreur lors de la suppression du facture client',
		deleteConfirmTitle: 'Supprimer cette facture client ?',
		deleteConfirmBody: 'Êtes‑vous sûr de vouloir supprimer cette facture client ?',
	},
	routes: {
		addRoute: FACTURE_CLIENT_ADD,
		editRoute: FACTURE_CLIENT_EDIT,
		viewRoute: FACTURE_CLIENT_VIEW,
	},
	columns: {
		numeroField: 'numero_facture',
		numeroHeaderName: 'Numéro facture',
		dateField: 'date_facture',
		dateHeaderName: 'Date facture',
		extraField: 'numero_bon_commande_client',
		extraFieldHeaderName: 'N° bon commande client',
	},
	convertActions: [
		{
			key: 'bon_de_livraison',
			label: 'Bon de livraison',
			icon: <ReceiptLongIcon fontSize="small" color="success" />,
			modalTitle: 'Convertir en bon de livraison ?',
			modalBody: 'Êtes-vous sûr de vouloir convertir cette facture client en bon de livraison ?',
			disabled: false,
			redirectRoute: BON_DE_LIVRAISON_EDIT,
		},
	],
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
	} = useGetFactureClientListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
		},
		{ skip: !token },
	);

	const data = rawData as PaginationResponseType<FactureClass> | undefined;

	const [deleteRecord] = useDeleteFactureClientMutation();

	// Convert mutations map - empty for now since bon de livraison is not implemented
	const [convertToBonDeLivraison, { isLoading: isConvertToBonDeLivraisonLoading }] =
		useConvertFactureClientToBonDeLivraisonMutation();

	// Convert mutations map
	const convertMutations = {
		bon_de_livraison: {
			convertMutation: convertToBonDeLivraison,
			isLoading: isConvertToBonDeLivraisonLoading,
		},
	};

	return (
		<CompanyDocumentsListContent<FactureClass>
			companyId={company_id}
			role={role}
			router={router}
			config={factureClientListConfig}
			queryResult={{ data, isLoading, refetch }}
			deleteMutation={{ deleteRecord }}
			convertMutations={convertMutations}
			paginationModel={paginationModel}
			setPaginationModel={setPaginationModel}
			searchTerm={searchTerm}
			setSearchTerm={setSearchTerm}
		/>
	);
};

const FactureClientListClient: React.FC<SessionProps> = ({ session }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title="Liste des Factures Clients">
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default FactureClientListClient;
