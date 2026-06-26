'use client';

import React, { useState } from 'react';
import type { TranslationDictionary } from '@/types/languageTypes';
import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { Cancel as CancelIcon, Percent as PercentIcon, ReceiptLong as ReceiptLongIcon } from '@mui/icons-material';
import { GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useBulkDeleteFactureAvoirMutation,
	useDeleteFactureAvoirMutation,
	useGetFactureAvoirListQuery,
} from '@/store/services/factureAvoir';
import { useGetCompanyQuery } from '@/store/services/company';
import {
	FACTURE_AVOIR_ADD,
	FACTURE_AVOIR_EDIT,
	FACTURE_AVOIR_PDF,
	FACTURE_AVOIR_VIEW,
	FACTURE_CLIENT_VIEW,
} from '@/utils/routes';
import type { SessionProps } from '@/types/_initTypes';
import type { FactureAvoirClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import type { DocumentListConfig, FactureAvoirListResponseType, PaginationModel } from '@/types/companyDocumentsTypes';
import { formatNumberWithSpaces } from '@/utils/helpers';
import CurrencyToggle from '@/components/shared/currencyToggle/currencyToggle';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import { useLanguage } from '@/utils/hooks';

const createFactureAvoirListConfig = (t: TranslationDictionary): DocumentListConfig<FactureAvoirClass> => ({
	documentType: 'facture-avoir',
	labels: {
		documentTypeName: "facture d'avoir",
		pageTitle: t.facturesAvoir.listTitle,
		addButtonText: t.facturesAvoir.newFactureAvoir,
		deleteSuccessMessage: t.facturesAvoir.deleteSuccess,
		deleteErrorMessage: t.facturesAvoir.deleteError,
		deleteConfirmTitle: t.facturesAvoir.deleteModalTitle,
		deleteConfirmBody: t.facturesAvoir.deleteModalBody,
	},
	routes: {
		addRoute: FACTURE_AVOIR_ADD,
		editRoute: FACTURE_AVOIR_EDIT,
		viewRoute: FACTURE_AVOIR_VIEW,
	},
	columns: {
		numeroField: 'numero_avoir',
		numeroHeaderName: t.facturesAvoir.colNumeroAvoir,
		dateField: 'date_avoir',
		dateHeaderName: t.facturesAvoir.colDateAvoir,
		extraField: 'motif_avoir_label',
		extraFieldHeaderName: t.facturesAvoir.colMotif,
	},
	allowDelete: true,
	canEditRow: (row) => row.statut === 'Brouillon',
	getExtraColumns: ({ router, companyId }) => [
		{
			field: 'facture_origine_numero',
			headerName: t.facturesAvoir.colFactureOrigine,
			flex: 1.2,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<FactureAvoirClass>) => {
				if (!params.row.facture_origine || !params.value) {
					return <Typography variant="body2">{t.facturesAvoir.freeOriginLabel}</Typography>;
				}
				return (
					<DarkTooltip title={String(params.value)}>
						<Typography variant="body2" noWrap>
							<TextButton
								buttonText={String(params.value)}
								onClick={() => router.push(FACTURE_CLIENT_VIEW(params.row.facture_origine as number, companyId))}
								cssClass={Styles.textButton}
							/>
						</Typography>
					</DarkTooltip>
				);
			},
		},
	],
	printActions: [
		{
			key: 'avec_remise',
			label: t.common.pdfWithDiscount,
			icon: <ReceiptLongIcon fontSize="small" />,
			iconColor: '#1976d2',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') =>
				FACTURE_AVOIR_PDF(id, companyId, 'avec_remise', language),
		},
		{
			key: 'sans_remise',
			label: t.common.pdfWithoutDiscount,
			icon: <ReceiptLongIcon fontSize="small" />,
			iconColor: '#2e7d32',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') =>
				FACTURE_AVOIR_PDF(id, companyId, 'sans_remise', language),
		},
		{
			key: 'avec_unite_sans_remise',
			label: t.common.pdfWithUnitWithoutDiscount,
			icon: <ReceiptLongIcon fontSize="small" />,
			iconColor: '#7b1fa2',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') =>
				FACTURE_AVOIR_PDF(id, companyId, 'avec_unite_sans_remise', language),
		},
		{
			key: 'avec_unite_avec_remise',
			label: t.common.pdfWithUnitWithDiscount,
			icon: <ReceiptLongIcon fontSize="small" />,
			iconColor: '#ed6c02',
			urlGenerator: (id: number, companyId: number, language: 'fr' | 'en') =>
				FACTURE_AVOIR_PDF(id, companyId, 'avec_unite_avec_remise', language),
		},
	],
	canPrintRow: (row) => row.statut !== 'Brouillon',
});

interface FormikContentProps extends SessionProps {
	company_id: number;
	role: string;
}

const FormikContent: React.FC<FormikContentProps> = ({ session, company_id, role }) => {
	const router = useRouter();
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const factureAvoirListConfig = React.useMemo(() => createFactureAvoirListConfig(t), [t]);
	const { data: companyData } = useGetCompanyQuery({ id: company_id }, { skip: !token });
	const usesForeignCurrency = companyData?.uses_foreign_currency === true;
	const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [selectedDevise, setSelectedDevise] = useState<'MAD' | 'EUR' | 'USD'>('MAD');
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});

	React.useEffect(() => {
		if (!usesForeignCurrency) setSelectedDevise('MAD');
	}, [usesForeignCurrency]);

	const { data: rawData, isLoading, refetch } = useGetFactureAvoirListQuery(
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
	const data = rawData as FactureAvoirListResponseType | undefined;
	const [deleteRecord] = useDeleteFactureAvoirMutation();
	const [bulkDeleteRecords] = useBulkDeleteFactureAvoirMutation();

	const currencyStats = data?.stats_by_currency?.[selectedDevise];
	const totalAvoirs = currencyStats?.total_avoirs
		? `${formatNumberWithSpaces(currencyStats.total_avoirs, 2)} ${selectedDevise}`
		: `0,00 ${selectedDevise}`;
	const totalTva = currencyStats?.total_tva
		? `${formatNumberWithSpaces(currencyStats.total_tva, 2)} ${selectedDevise}`
		: `0,00 ${selectedDevise}`;

	return (
		<>
			<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, mt: { xs: 1, sm: 2, md: 3 } }}>
				<CurrencyToggle
					selectedDevise={selectedDevise}
					onDeviseChange={setSelectedDevise}
					usesForeignCurrency={usesForeignCurrency}
				/>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
					<Card elevation={2} sx={{ flex: 1, borderRadius: 2 }}>
						<CardContent>
							<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
								<CancelIcon color="error" />
								<Box>
									<Typography variant="body2" sx={{ color: 'text.secondary' }}>
										{t.facturesAvoir.statsAvoirs}
									</Typography>
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{totalAvoirs}
									</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
					<Card elevation={2} sx={{ flex: 1, borderRadius: 2 }}>
						<CardContent>
							<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
								<PercentIcon color="warning" />
								<Box>
									<Typography variant="body2" sx={{ color: 'text.secondary' }}>
										{t.facturesAvoir.statsTva}
									</Typography>
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{totalTva}
									</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Stack>
			</Box>
			<CompanyDocumentsListContent<FactureAvoirClass>
				companyId={company_id}
				role={role}
				router={router}
				config={factureAvoirListConfig}
				queryResult={{ data: data as FactureAvoirListResponseType | undefined, isLoading, refetch }}
				deleteMutation={{ deleteRecord }}
				bulkDeleteMutation={{ bulkDeleteRecords }}
				paginationModel={paginationModel}
				setPaginationModel={setPaginationModel}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				filterModel={filterModel}
				onFilterModelChange={setFilterModel}
				onCustomFilterParamsChange={setCustomFilterParams}
				accessToken={token}
			/>
		</>
	);
};

type Props = SessionProps;

const FactureAvoirListClient: React.FC<Props> = ({ session }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperList session={session} title={t.facturesAvoir.listTitle}>
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default FactureAvoirListClient;
