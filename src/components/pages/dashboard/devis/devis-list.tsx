'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReceiptLong as ReceiptLongIcon, ReceiptLongOutlined as ReceiptLongOutlinedIcon } from '@mui/icons-material';
import { GridFilterModel } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import {
	useDeleteDeviMutation,
	useGetDevisListQuery,
	useConvertDeviToFactureProFormaMutation,
	useConvertDeviToFactureClientMutation,
} from '@/store/services/devi';
import { DEVIS_EDIT, DEVIS_VIEW, DEVIS_ADD, FACTURE_PRO_FORMA_EDIT, FACTURE_CLIENT_EDIT } from '@/utils/routes';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import type { DeviClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import type { DocumentListConfig, PaginationModel } from '@/types/companyDocumentsTypes';

export {
	getStatutColor,
	statutFilterOptions,
} from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';

const devisListConfig: DocumentListConfig<DeviClass> = {
	documentType: 'devis',
	labels: {
		documentTypeName: 'devi',
		pageTitle: 'Liste des Devis',
		addButtonText: 'Nouveau devi',
		deleteSuccessMessage: 'Devi supprimé avec succès',
		deleteErrorMessage: 'Erreur lors de la suppression du devi',
		deleteConfirmTitle: 'Supprimer ce devi ?',
		deleteConfirmBody: 'Êtes‑vous sûr de vouloir supprimer ce devi ?',
	},
	routes: {
		addRoute: DEVIS_ADD,
		editRoute: DEVIS_EDIT,
		viewRoute: DEVIS_VIEW,
	},
	columns: {
		numeroField: 'numero_devis',
		numeroHeaderName: 'Numéro devi',
		dateField: 'date_devis',
		dateHeaderName: 'Date devi',
		extraField: 'numero_demande_prix_client',
		extraFieldHeaderName: 'N° Dde de prix',
	},
	convertActions: [
		{
			key: 'facture_pro_forma',
			label: 'Facture pro-forma',
			icon: <ReceiptLongOutlinedIcon fontSize="small" color="success" />,
			modalTitle: 'Convertir en facture pro-forma ?',
			modalBody: 'Êtes-vous sûr de vouloir convertir ce devi en facture pro-forma ?',
			disabled: false,
			redirectRoute: FACTURE_PRO_FORMA_EDIT,
		},
		{
			key: 'facture_client',
			label: 'Facture client',
			icon: <ReceiptLongIcon fontSize="small" color="success" />,
			modalTitle: 'Convertir en facture client ?',
			modalBody: 'Êtes-vous sûr de vouloir convertir ce devi en facture client ?',
			disabled: false,
			redirectRoute: FACTURE_CLIENT_EDIT,
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
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

	// Extract date filter parameters from filter model
	const getDateFilterParams = () => {
		const params: Record<string, string> = {};
		filterModel.items.forEach(item => {
			if (item.field === 'date_devis' && item.value) {
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

	// Query hook
	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetDevisListQuery(
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

	const data = rawData as PaginationResponseType<DeviClass> | undefined;

	// Mutations
	const [deleteRecord] = useDeleteDeviMutation();
	const [convertToFactureProforma, { isLoading: isConvertToFactureProFormaLoading }] =
		useConvertDeviToFactureProFormaMutation();
	const [convertToFactureClient, { isLoading: isConvertToFactureClientLoading }] =
		useConvertDeviToFactureClientMutation();

	// Convert mutations map
	const convertMutations = {
		facture_pro_forma: {
			convertMutation: convertToFactureProforma,
			isLoading: isConvertToFactureProFormaLoading,
		},
		facture_client: {
			convertMutation: convertToFactureClient,
			isLoading: isConvertToFactureClientLoading,
		},
	};

	return (
		<CompanyDocumentsListContent<DeviClass>
			companyId={company_id}
			role={role}
			router={router}
			config={devisListConfig}
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

const DevisListClient: React.FC<SessionProps> = ({ session }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title="Liste des Devis">
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default DevisListClient;
