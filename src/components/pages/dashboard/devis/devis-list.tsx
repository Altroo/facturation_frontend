'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReceiptLong as ReceiptLongIcon, ReceiptLongOutlined as ReceiptLongOutlinedIcon, Print as PrintIcon } from '@mui/icons-material';
import { GridFilterModel } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import {
	useDeleteDeviMutation,
	useGetDevisListQuery,
	useConvertDeviToFactureProFormaMutation,
	useConvertDeviToFactureClientMutation,
} from '@/store/services/devi';
import { DEVIS_EDIT, DEVIS_VIEW, DEVIS_ADD, FACTURE_PRO_FORMA_EDIT, FACTURE_CLIENT_EDIT, DEVIS_PDF } from '@/utils/routes';
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
		documentTypeName: 'devis',
		pageTitle: 'Liste des Devis',
		addButtonText: 'Nouveau devis',
		deleteSuccessMessage: 'Devis supprimé avec succès',
		deleteErrorMessage: 'Erreur lors de la suppression du devis',
		deleteConfirmTitle: 'Supprimer ce devis ?',
		deleteConfirmBody: 'Êtes‑vous sûr de vouloir supprimer ce devis ?',
	},
	routes: {
		addRoute: DEVIS_ADD,
		editRoute: DEVIS_EDIT,
		viewRoute: DEVIS_VIEW,
	},
	columns: {
		numeroField: 'numero_devis',
		numeroHeaderName: 'Numéro devis',
		dateField: 'date_devis',
		dateHeaderName: 'Date devis',
		extraField: 'numero_demande_prix_client',
		extraFieldHeaderName: 'N° demande de prix',
	},
	convertActions: [
		{
			key: 'facture_pro_forma',
			label: 'Facture pro-forma',
			icon: <ReceiptLongOutlinedIcon fontSize="small" color="success" />,
			modalTitle: 'Convertir en facture pro-forma ?',
			modalBody: 'Êtes-vous sûr de vouloir convertir ce devis en facture pro-forma ?',
			disabled: (row) => !['Envoyé', 'Accepté'].includes(row.statut),
			redirectRoute: FACTURE_PRO_FORMA_EDIT,
		},
		{
			key: 'facture_client',
			label: 'Facture client',
			icon: <ReceiptLongIcon fontSize="small" color="success" />,
			modalTitle: 'Convertir en facture client ?',
			modalBody: 'Êtes-vous sûr de vouloir convertir ce devis en facture client ?',
			disabled: (row) => !['Envoyé', 'Accepté'].includes(row.statut),
			redirectRoute: FACTURE_CLIENT_EDIT,
		},
	],
	printActions: [
		{
			key: 'avec_remise',
			label: 'Afficher Devis avec remise',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#1976d2',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') =>
				DEVIS_PDF(id, companyId, 'avec_remise', language),
		},
		{
			key: 'sans_remise',
			label: 'Afficher Devis sans remise',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#2e7d32',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') =>
				DEVIS_PDF(id, companyId, 'sans_remise', language),
		},
		{
			key: 'avec_unite',
			label: 'Afficher Devis avec unité',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#ed6c02',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') =>
				DEVIS_PDF(id, companyId, 'avec_unite', language),
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
