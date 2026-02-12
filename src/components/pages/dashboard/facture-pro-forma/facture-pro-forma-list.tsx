'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReceiptLong as ReceiptLongIcon, Print as PrintIcon } from '@mui/icons-material';
import { GridFilterModel, GridLogicOperator } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import {
	useDeleteFactureProFormaMutation,
	useGetFactureProFormaListQuery,
	useConvertFactureProFormaToFactureMutation,
} from '@/store/services/factureProForma';
import {
	FACTURE_CLIENT_EDIT,
	FACTURE_PRO_FORMA_ADD,
	FACTURE_PRO_FORMA_EDIT,
	FACTURE_PRO_FORMA_VIEW,
	FACTURE_PRO_FORMA_PDF,
} from '@/utils/routes';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import type { FactureClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import type { DocumentListConfig, PaginationModel } from '@/types/companyDocumentsTypes';
import { useAppSelector } from '@/utils/hooks';
import { getModePaiementState } from '@/store/selectors';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';

const factureProFormaListConfig: DocumentListConfig<FactureClass> = {
	documentType: 'facture-pro-forma',
	labels: {
		documentTypeName: 'facture pro-forma',
		pageTitle: 'Liste des Factures Proforma',
		addButtonText: 'Nouvelle facture proforma',
		deleteSuccessMessage: 'Facture pro-forma supprimé avec succès',
		deleteErrorMessage: 'Erreur lors de la suppression du facture pro-forma',
		deleteConfirmTitle: 'Supprimer cette facture pro-forma ?',
		deleteConfirmBody: 'Êtes‑vous sûr de vouloir supprimer cette facture pro-forma ?',
	},
	routes: {
		addRoute: FACTURE_PRO_FORMA_ADD,
		editRoute: FACTURE_PRO_FORMA_EDIT,
		viewRoute: FACTURE_PRO_FORMA_VIEW,
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
			key: 'facture_client',
			label: 'Facture',
			icon: <ReceiptLongIcon fontSize="small" color="success" />,
			modalTitle: 'Convertir en facture client ?',
			modalBody: 'Êtes-vous sûr de vouloir convertir cette facture pro forma en facture client ?',
			disabled: (row) => !['Envoyé', 'Accepté'].includes(row.statut),
			redirectRoute: FACTURE_CLIENT_EDIT,
		},
	],
	printActions: [
		{
			key: 'avec_remise',
			label: 'Afficher Facture pro forma avec remise',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#1976d2',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') => FACTURE_PRO_FORMA_PDF(id, companyId, 'avec_remise', language),
		},
		{
			key: 'sans_remise',
			label: 'Afficher Facture pro forma sans remise',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#2e7d32',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') => FACTURE_PRO_FORMA_PDF(id, companyId, 'sans_remise', language),
		},
		{
			key: 'avec_unite',
			label: 'Afficher Facture pro forma avec unité',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#ed6c02',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') => FACTURE_PRO_FORMA_PDF(id, companyId, 'avec_unite', language),
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
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});

	const modePaiement = useAppSelector(getModePaiementState);

	const chipFilters: ChipFilterConfig[] = React.useMemo(
		() => [
			{ key: 'mode_paiement', label: 'Mode de paiement', paramName: 'mode_paiement_ids', options: modePaiement },
		],
		[modePaiement],
	);

	const mergedFilterParams = React.useMemo(
		() => ({ ...chipFilterParams, ...customFilterParams }),
		[chipFilterParams, customFilterParams],
	);

	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetFactureProFormaListQuery(
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

	const data = rawData as PaginationResponseType<FactureClass> | undefined;

	// Mutations
	const [deleteRecord] = useDeleteFactureProFormaMutation();
	const [convertToFactureClient, { isLoading: isConvertToFactureClientLoading }] =
		useConvertFactureProFormaToFactureMutation();

	// Convert mutations map
	const convertMutations = {
		facture_client: {
			convertMutation: convertToFactureClient,
			isLoading: isConvertToFactureClientLoading,
		},
	};

	return (
		<>
			<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} />
			<CompanyDocumentsListContent<FactureClass>
				companyId={company_id}
				role={role}
				router={router}
				config={factureProFormaListConfig}
				queryResult={{ data, isLoading, refetch }}
				deleteMutation={{ deleteRecord }}
				convertMutations={convertMutations}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				filterModel={filterModel}
				onFilterModelChange={setFilterModel}
				onCustomFilterParamsChange={setCustomFilterParams}
			/>
		</>
	);
};

const FactureProFormaListClient: React.FC<SessionProps> = ({ session }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title="Liste des Factures Proforma">
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default FactureProFormaListClient;
