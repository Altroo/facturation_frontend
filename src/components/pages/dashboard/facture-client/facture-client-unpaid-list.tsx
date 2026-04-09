'use client';

import React, { useState } from 'react';
import type { TranslationDictionary } from '@/types/languageTypes';
import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import CurrencyToggle from '@/components/shared/currencyToggle/currencyToggle';
import {
	AttachMoney as AttachMoneyIcon,
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import { GridFilterModel } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useConvertFactureClientToBonDeLivraisonMutation,
	useDeleteFactureClientMutation,
	useGetFactureClientUnpaidListQuery,
} from '@/store/services/factureClient';
import { useGetCompanyQuery } from '@/store/services/company';
import { BON_DE_LIVRAISON_EDIT, FACTURE_CLIENT_ADD, FACTURE_CLIENT_EDIT, FACTURE_CLIENT_VIEW } from '@/utils/routes';
import type { SessionProps } from '@/types/_initTypes';
import type { DocumentListConfig, FactureClientListResponseType, PaginationModel } from '@/types/companyDocumentsTypes';
import type { FactureClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import { formatNumberWithSpaces } from '@/utils/helpers';
import { useLanguage } from '@/utils/hooks';

const createFactureClientUnpaidListConfig = (t: TranslationDictionary): DocumentListConfig<FactureClass> => ({
	documentType: 'facture-client',
	labels: {
		documentTypeName: 'facture client',
		pageTitle: t.facturesClient.unpaidListTitle,
		addButtonText: t.facturesClient.newFacture,
		deleteSuccessMessage: t.facturesClient.deleteSuccess,
		deleteErrorMessage: t.facturesClient.deleteError,
		deleteConfirmTitle: t.facturesClient.deleteModalTitle,
		deleteConfirmBody: t.facturesClient.deleteModalBody,
	},
	routes: {
		addRoute: FACTURE_CLIENT_ADD,
		editRoute: FACTURE_CLIENT_EDIT,
		viewRoute: FACTURE_CLIENT_VIEW,
	},
	columns: {
		numeroField: 'numero_facture',
		numeroHeaderName: t.facturesClient.colNumeroFacture,
		dateField: 'date_facture',
		dateHeaderName: t.facturesClient.colDateFacture,
		extraField: 'numero_bon_commande_client',
		extraFieldHeaderName: t.facturesClient.colNumeroBonCommande,
	},
	convertActions: [
		{
			key: 'bon_de_livraison',
			label: t.facturesClient.labelBonLivraison,
			icon: <ReceiptLongIcon fontSize="small" color="success" />,
			modalTitle: t.facturesClient.convertToBLTitle,
			modalBody: t.facturesClient.convertToBLBody,
			disabled: false,
			redirectRoute: BON_DE_LIVRAISON_EDIT,
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
	const factureClientUnpaidListConfig = React.useMemo(() => createFactureClientUnpaidListConfig(t), [t]);
	const token = useInitAccessToken(session);

	const { data: companyData } = useGetCompanyQuery({ id: company_id }, { skip: !token });
	const usesForeignCurrency = companyData?.uses_foreign_currency === true;

	const [paginationModel, setPaginationModel] = useState<PaginationModel>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
	const [selectedDevise, setSelectedDevise] = useState<'MAD' | 'EUR' | 'USD'>('MAD');
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});

	// Reset to MAD when company changes or doesn't use foreign currency
	React.useEffect(() => {
		if (!usesForeignCurrency) {
			setSelectedDevise('MAD');
		}
	}, [company_id, usesForeignCurrency]);

	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetFactureClientUnpaidListQuery(
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

	const data = rawData as FactureClientListResponseType | undefined;

	const [deleteRecord] = useDeleteFactureClientMutation();

	const [convertToBonDeLivraison, { isLoading: isConvertToBonDeLivraisonLoading }] =
		useConvertFactureClientToBonDeLivraisonMutation();

	// Convert mutations map
	const convertMutations = {
		bon_de_livraison: {
			convertMutation: convertToBonDeLivraison,
			isLoading: isConvertToBonDeLivraisonLoading,
		},
	};

	// Get stats for selected currency
	const currencyStats = data?.stats_by_currency?.[selectedDevise];
	const chiffreAffaireTotal = currencyStats?.chiffre_affaire_total
		? `${formatNumberWithSpaces(currencyStats.chiffre_affaire_total, 2)} ${selectedDevise}`
		: `0,00 ${selectedDevise}`;
	const totalReglements = currencyStats?.total_reglements
		? `${formatNumberWithSpaces(currencyStats.total_reglements, 2)} ${selectedDevise}`
		: `0,00 ${selectedDevise}`;
	const totalImpayes = currencyStats?.total_impayes
		? `${formatNumberWithSpaces(currencyStats.total_impayes, 2)} ${selectedDevise}`
		: `0,00 ${selectedDevise}`;

	return (
		<>
			{/* Stats Cards */}
			<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, mt: { xs: 1, sm: 2, md: 3 } }}>
				<CurrencyToggle
					selectedDevise={selectedDevise}
					onDeviseChange={setSelectedDevise}
					usesForeignCurrency={usesForeignCurrency}
				/>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
					<Card elevation={2} sx={{ flex: 1, borderRadius: 2 }}>
						<CardContent>
							<Stack
								direction="row"
								spacing={2}
								sx={{
									alignItems: 'center',
								}}
							>
								<AttachMoneyIcon color="primary" />
								<Box>
									<Typography
										variant="body2"
										sx={{
											color: 'text.secondary',
										}}
									>
										{t.facturesClient.statsCA}
									</Typography>
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
										}}
									>
										{chiffreAffaireTotal}
									</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
					<Card elevation={2} sx={{ flex: 1, borderRadius: 2 }}>
						<CardContent>
							<Stack
								direction="row"
								spacing={2}
								sx={{
									alignItems: 'center',
								}}
							>
								<CheckCircleIcon color="success" />
								<Box>
									<Typography
										variant="body2"
										sx={{
											color: 'text.secondary',
										}}
									>
										{t.facturesClient.statsReglements}
									</Typography>
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
											color: 'success.main',
										}}
									>
										{totalReglements}
									</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
					<Card elevation={2} sx={{ flex: 1, borderRadius: 2 }}>
						<CardContent>
							<Stack
								direction="row"
								spacing={2}
								sx={{
									alignItems: 'center',
								}}
							>
								<CancelIcon color="error" />
								<Box>
									<Typography
										variant="body2"
										sx={{
											color: 'text.secondary',
										}}
									>
										{t.facturesClient.statsImpayes}
									</Typography>
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
											color: 'error.main',
										}}
									>
										{totalImpayes}
									</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Stack>
				<Divider sx={{ mb: 2 }} />
			</Box>
			<CompanyDocumentsListContent<FactureClass>
				companyId={company_id}
				role={role}
				router={router}
				config={factureClientUnpaidListConfig}
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
				accessToken={token}
			/>
		</>
	);
};

const FactureClientUnpaidListClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperList session={session} title={t.facturesClient.unpaidListTitle}>
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default FactureClientUnpaidListClient;
