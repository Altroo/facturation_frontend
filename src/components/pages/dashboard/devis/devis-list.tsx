'use client';

import React, { useState } from 'react';
import type { TranslationDictionary } from '@/types/languageTypes';
import { useRouter } from 'next/navigation';
import { ReceiptLong as ReceiptLongIcon, ReceiptLongOutlined as ReceiptLongOutlinedIcon, Print as PrintIcon } from '@mui/icons-material';
import { GridFilterModel, GridLogicOperator } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useDeleteDeviMutation,
	useGetDevisListQuery,
	useConvertDeviToFactureProFormaMutation,
	useConvertDeviToFactureClientMutation,
	useBulkDeleteDevisMutation,
} from '@/store/services/devi';
import { DEVIS_EDIT, DEVIS_VIEW, DEVIS_ADD, FACTURE_PRO_FORMA_EDIT, FACTURE_CLIENT_EDIT, DEVIS_PDF } from '@/utils/routes';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import type { DeviClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import type { DocumentListConfig, PaginationModel } from '@/types/companyDocumentsTypes';
import { useGetModePaiementListQuery } from '@/store/services/parameter';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { useLanguage } from '@/utils/hooks';

export {
	getStatutColor,
	statutFilterOptions,
} from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';

const createDevisListConfig = (t: TranslationDictionary): DocumentListConfig<DeviClass> => ({
	documentType: 'devis',
	labels: {
		documentTypeName: 'devis',
		pageTitle: t.devis.listTitle,
		addButtonText: t.devis.newDevis,
		deleteSuccessMessage: t.devis.deleteSuccess,
		deleteErrorMessage: t.devis.deleteError,
		deleteConfirmTitle: t.devis.deleteModalTitle,
		deleteConfirmBody: t.devis.deleteModalBody,
	},
	routes: {
		addRoute: DEVIS_ADD,
		editRoute: DEVIS_EDIT,
		viewRoute: DEVIS_VIEW,
	},
	columns: {
		numeroField: 'numero_devis',
		numeroHeaderName: t.devis.colNumeroDevis,
		dateField: 'date_devis',
		dateHeaderName: t.devis.colDateDevis,
		extraField: 'numero_demande_prix_client',
		extraFieldHeaderName: t.devis.colNumeroDemandePrix,
	},
	convertActions: [
		{
			key: 'facture_pro_forma',
			label: t.devis.labelFactureProforma,
			icon: <ReceiptLongOutlinedIcon fontSize="small" color="success" />,
			modalTitle: t.devis.convertToProformaTitle,
			modalBody: t.devis.convertToProformaBody,
			disabled: (row) => !['Envoyé', 'Accepté'].includes(row.statut),
			redirectRoute: FACTURE_PRO_FORMA_EDIT,
		},
		{
			key: 'facture_client',
			label: t.devis.labelFactureClient,
			icon: <ReceiptLongIcon fontSize="small" color="success" />,
			modalTitle: t.devis.convertToFactureTitle,
			modalBody: t.devis.convertToFactureBody,
			disabled: (row) => !['Envoyé', 'Accepté'].includes(row.statut),
			redirectRoute: FACTURE_CLIENT_EDIT,
		},
	],
	printActions: [
		{
			key: 'avec_remise',
			label: t.common.pdfWithDiscount,
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#1976d2',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') =>
				DEVIS_PDF(id, companyId, 'avec_remise', language),
		},
		{
			key: 'sans_remise',
			label: t.common.pdfWithoutDiscount,
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#2e7d32',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') =>
				DEVIS_PDF(id, companyId, 'sans_remise', language),
		},
		{
			key: 'avec_unite',
			label: t.common.pdfWithUnit,
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#ed6c02',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') =>
				DEVIS_PDF(id, companyId, 'avec_unite', language),
		},
	],
});
interface FormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

const FormikContent: React.FC<FormikContentProps> = (props) => {
	const { session, company_id, role } = props;
	const router = useRouter();
	const { t } = useLanguage();
	const devisListConfig = React.useMemo(() => createDevisListConfig(t), [t]);
	const token = useInitAccessToken(session);

	const [paginationModel, setPaginationModel] = useState<PaginationModel>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});

	const { data: modePaiement } = useGetModePaiementListQuery({ company_id }, { skip: !token });

	const chipFilters: ChipFilterConfig[] = React.useMemo(
		() => [
			{ key: 'mode_paiement', label: t.devis.filterModePaiement, paramName: 'mode_paiement_ids', options: modePaiement ?? [] },
		],
		[modePaiement, t],
	);

	const mergedFilterParams = React.useMemo(
		() => ({ ...chipFilterParams, ...customFilterParams }),
		[chipFilterParams, customFilterParams],
	);

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
			...mergedFilterParams,
		},
		{ skip: !token },
	);

	const data = rawData as PaginationResponseType<DeviClass> | undefined;

	// Mutations
	const [deleteRecord] = useDeleteDeviMutation();
	const [bulkDeleteRecords] = useBulkDeleteDevisMutation();
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
		<>
			<CompanyDocumentsListContent<DeviClass>
				companyId={company_id}
				role={role}
				router={router}
				config={devisListConfig}
				queryResult={{ data, isLoading, refetch }}
				deleteMutation={{ deleteRecord }}
				bulkDeleteMutation={{ bulkDeleteRecords }}
				convertMutations={convertMutations}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				filterModel={filterModel}
				onFilterModelChange={setFilterModel}
				onCustomFilterParamsChange={setCustomFilterParams}
				chipFilterBar={<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} />}
				accessToken={token}
			/>
		</>
	);
};

const DevisListClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperList session={session} title={t.devis.listTitle}>
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default DevisListClient;
