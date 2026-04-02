'use client';

import React, { useState } from 'react';
import type { TranslationDictionary } from '@/types/languageTypes';
import { useRouter } from 'next/navigation';
import { ReceiptLong as ReceiptLongIcon, Print as PrintIcon } from '@mui/icons-material';
import { GridFilterModel, GridLogicOperator } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useDeleteFactureProFormaMutation,
	useGetFactureProFormaListQuery,
	useConvertFactureProFormaToFactureMutation,
	useBulkDeleteFactureProFormaMutation,
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
import { useGetModePaiementListQuery } from '@/store/services/parameter';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { useLanguage } from '@/utils/hooks';

const createFactureProFormaListConfig = (t: TranslationDictionary): DocumentListConfig<FactureClass> => ({
	documentType: 'facture-pro-forma',
	labels: {
		documentTypeName: 'facture pro-forma',
		pageTitle: t.facturesProforma.listTitle,
		addButtonText: t.facturesProforma.newFacture,
		deleteSuccessMessage: t.facturesProforma.deleteSuccess,
		deleteErrorMessage: t.facturesProforma.deleteError,
		deleteConfirmTitle: t.facturesProforma.deleteModalTitle,
		deleteConfirmBody: t.facturesProforma.deleteModalBody,
	},
	routes: {
		addRoute: FACTURE_PRO_FORMA_ADD,
		editRoute: FACTURE_PRO_FORMA_EDIT,
		viewRoute: FACTURE_PRO_FORMA_VIEW,
	},
	columns: {
		numeroField: 'numero_facture',
		numeroHeaderName: t.facturesProforma.colNumeroFacture,
		dateField: 'date_facture',
		dateHeaderName: t.facturesProforma.colDateFacture,
		extraField: 'numero_bon_commande_client',
		extraFieldHeaderName: t.facturesProforma.colNumeroBonCommande,
	},
	convertActions: [
		{
			key: 'facture_client',
			label: t.facturesProforma.labelFactureClient,
			icon: <ReceiptLongIcon fontSize="small" color="success" />,
			modalTitle: t.facturesProforma.convertToFactureTitle,
			modalBody: t.facturesProforma.convertToFactureBody,
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
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') => FACTURE_PRO_FORMA_PDF(id, companyId, 'avec_remise', language),
		},
		{
			key: 'sans_remise',
			label: t.common.pdfWithoutDiscount,
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#2e7d32',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') => FACTURE_PRO_FORMA_PDF(id, companyId, 'sans_remise', language),
		},
		{
			key: 'avec_unite',
			label: t.common.pdfWithUnit,
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#ed6c02',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') => FACTURE_PRO_FORMA_PDF(id, companyId, 'avec_unite', language),
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
	const factureProFormaListConfig = React.useMemo(() => createFactureProFormaListConfig(t), [t]);
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

	const chipFilters: ChipFilterConfig[] = React.useMemo(
		() => [
			{ key: 'mode_paiement', label: t.facturesProforma.filterModePaiement, paramName: 'mode_paiement_ids', options: modePaiement ?? [] },
		],
		[modePaiement, t],
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
	const [bulkDeleteRecords] = useBulkDeleteFactureProFormaMutation();
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
			<CompanyDocumentsListContent<FactureClass>
				companyId={company_id}
				role={role}
				router={router}
				config={factureProFormaListConfig}
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

const FactureProFormaListClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperList session={session} title={t.facturesProforma.listTitle}>
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default FactureProFormaListClient;
