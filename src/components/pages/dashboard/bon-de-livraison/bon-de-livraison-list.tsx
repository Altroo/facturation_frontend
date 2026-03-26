'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Print as PrintIcon } from '@mui/icons-material';
import { GridFilterModel, GridLogicOperator } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteBonDeLivraisonMutation, useGetBonDeLivraisonListQuery, useBulkDeleteBonDeLivraisonMutation } from '@/store/services/bonDeLivraison';
import { useGetModePaiementListQuery, useGetLivreParListQuery } from '@/store/services/parameter';
import { BON_DE_LIVRAISON_ADD, BON_DE_LIVRAISON_EDIT, BON_DE_LIVRAISON_VIEW, BON_DE_LIVRAISON_PDF } from '@/utils/routes';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import type { BonDeLivraisonClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import type { DocumentListConfig, PaginationModel } from '@/types/companyDocumentsTypes';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';

const bonDeLivraisonListConfig: DocumentListConfig<BonDeLivraisonClass> = {
	documentType: 'bon-de-livraison',
	labels: {
		documentTypeName: 'bon de livraison',
		pageTitle: 'Liste des Bons de Livraison',
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
	printActions: [
		{
			key: 'normal',
			label: 'Afficher le bon de livraison',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#1976d2',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') => BON_DE_LIVRAISON_PDF(id, companyId, 'normal', language),
		},
		{
			key: 'quantity_only',
			label: 'Afficher le bon de livraison (quantité seulement)',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#2e7d32',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') => BON_DE_LIVRAISON_PDF(id, companyId, 'quantity_only', language),
		},
		{
			key: 'avec_unite',
			label: 'Afficher le bon de livraison avec unité',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#ed6c02',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') => BON_DE_LIVRAISON_PDF(id, companyId, 'avec_unite', language),
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
	const token = useInitAccessToken(session);

	const [paginationModel, setPaginationModel] = useState<PaginationModel>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});

	const { data: modePaiement } = useGetModePaiementListQuery({ company_id }, { skip: !token });
	const { data: livrePar } = useGetLivreParListQuery({ company_id }, { skip: !token });

	const chipFilters: ChipFilterConfig[] = React.useMemo(
		() => [
			{ key: 'mode_paiement', label: 'Mode de paiement', paramName: 'mode_paiement_ids', options: modePaiement ?? [] },
			{ key: 'livre_par', label: 'Livré par', paramName: 'livre_par_ids', options: livrePar ?? [] },
		],
		[modePaiement, livrePar],
	);

	const mergedFilterParams = React.useMemo(
		() => ({ ...chipFilterParams, ...customFilterParams }),
		[chipFilterParams, customFilterParams],
	);

	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetBonDeLivraisonListQuery(
		{
			company_id,
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			...mergedFilterParams,
		},
		{ skip: !token },
	);

	const data = rawData as PaginationResponseType<BonDeLivraisonClass> | undefined;

	const [deleteRecord] = useDeleteBonDeLivraisonMutation();
	const [bulkDeleteRecords] = useBulkDeleteBonDeLivraisonMutation();

	return (
		<>
			<CompanyDocumentsListContent<BonDeLivraisonClass>
				companyId={company_id}
				role={role}
				router={router}
				config={bonDeLivraisonListConfig}
				queryResult={{ data, isLoading, refetch }}
				deleteMutation={{ deleteRecord }}
				bulkDeleteMutation={{ bulkDeleteRecords }}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				filterModel={filterModel}
				onFilterModelChange={setFilterModel}
				onCustomFilterParamsChange={setCustomFilterParams}
				chipFilterBar={<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} />}
			/>
		</>
	);
};

const BonDeLivraisonListClient: React.FC<SessionProps> = ({ session }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title="Liste des Bons de Livraison">
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default BonDeLivraisonListClient;
