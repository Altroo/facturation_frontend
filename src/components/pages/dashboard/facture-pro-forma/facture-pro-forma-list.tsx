'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReceiptLong as ReceiptLongIcon, Print as PrintIcon } from '@mui/icons-material';
import { GridFilterModel } from '@mui/x-data-grid';
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
			disabled: false,
			redirectRoute: FACTURE_CLIENT_EDIT,
		},
	],
	printActions: [
		{
			key: 'avec_remise',
			label: 'Afficher Facture pro forma avec remise',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#1976d2',
			urlGenerator: (id: number, companyId: number) => FACTURE_PRO_FORMA_PDF(id, companyId, 'avec_remise'),
		},
		{
			key: 'sans_remise',
			label: 'Afficher Facture pro forma sans remise',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#2e7d32',
			urlGenerator: (id: number, companyId: number) => FACTURE_PRO_FORMA_PDF(id, companyId, 'sans_remise'),
		},
		{
			key: 'avec_unite',
			label: 'Afficher Facture pro forma avec unité',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#ed6c02',
			urlGenerator: (id: number, companyId: number) => FACTURE_PRO_FORMA_PDF(id, companyId, 'avec_unite'),
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
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

	const getDateFilterParams = () => {
		const params: Record<string, string> = {};
		filterModel.items.forEach(item => {
			if (item.field === 'date_facture' && item.value) {
				const { from, to } = item.value as { from?: string; to?: string };
				if (from) {
					params.date_after = from;
				}
				if (to) {
					params.date_before = to;
				}
			}
		});
		return params;
	};

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
			...getDateFilterParams(),
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
		/>
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
