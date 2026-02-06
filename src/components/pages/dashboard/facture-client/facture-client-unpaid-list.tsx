'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Stack, Typography, Divider } from '@mui/material';
import CurrencyToggle from '@/components/shared/currencyToggle/currencyToggle';
import {
	ReceiptLong as ReceiptLongIcon,
	AttachMoney as AttachMoneyIcon,
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
} from '@mui/icons-material';
import { GridFilterModel } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import {
	useConvertFactureClientToBonDeLivraisonMutation,
	useDeleteFactureClientMutation,
	useGetFactureClientUnpaidListQuery,
} from '@/store/services/factureClient';
import { useGetCompanyQuery } from '@/store/services/company';
import { BON_DE_LIVRAISON_EDIT, FACTURE_CLIENT_ADD, FACTURE_CLIENT_EDIT, FACTURE_CLIENT_VIEW } from '@/utils/routes';
import type { SessionProps } from '@/types/_initTypes';
import type { FactureClientListResponseType } from '@/types/companyDocumentsTypes';
import type { FactureClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import type { DocumentListConfig, PaginationModel } from '@/types/companyDocumentsTypes';
import { formatNumberWithSpaces } from '@/utils/helpers';

const factureClientUnpaidListConfig: DocumentListConfig<FactureClass> = {
	documentType: 'facture-client',
	labels: {
		documentTypeName: 'facture client',
		pageTitle: 'Factures Impayées',
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

	const { data: companyData } = useGetCompanyQuery({ id: company_id }, { skip: !token });
	const usesForeignCurrency = companyData?.uses_foreign_currency === true;

	const [paginationModel, setPaginationModel] = useState<PaginationModel>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
	const [selectedDevise, setSelectedDevise] = useState<'MAD' | 'EUR' | 'USD'>('MAD');

	// Reset to MAD when company changes or doesn't use foreign currency
	React.useEffect(() => {
		if (!usesForeignCurrency) {
			setSelectedDevise('MAD');
		}
	}, [company_id, usesForeignCurrency]);

	// Extract date filter parameters from filter model
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
	} = useGetFactureClientUnpaidListQuery(
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
	const chiffreAffaireTotal = currencyStats?.chiffre_affaire_total ? `${formatNumberWithSpaces(currencyStats.chiffre_affaire_total, 2)} ${selectedDevise}` : `0,00 ${selectedDevise}`;
	const totalReglements = currencyStats?.total_reglements ? `${formatNumberWithSpaces(currencyStats.total_reglements, 2)} ${selectedDevise}` : `0,00 ${selectedDevise}`;
	const totalImpayes = currencyStats?.total_impayes ? `${formatNumberWithSpaces(currencyStats.total_impayes, 2)} ${selectedDevise}` : `0,00 ${selectedDevise}`;

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
							<Stack direction="row" spacing={2} alignItems="center">
								<AttachMoneyIcon color="primary" />
								<Box>
									<Typography variant="body2" color="text.secondary">
										Chiffre d&#39;affaire total
									</Typography>
									<Typography variant="h6" fontWeight={700}>
										{chiffreAffaireTotal}
									</Typography>

								</Box>
							</Stack>
						</CardContent>
					</Card>
					<Card elevation={2} sx={{ flex: 1, borderRadius: 2 }}>
						<CardContent>
							<Stack direction="row" spacing={2} alignItems="center">
								<CheckCircleIcon color="success" />
								<Box>
									<Typography variant="body2" color="text.secondary">
										Total règlements
									</Typography>
									<Typography variant="h6" fontWeight={700} color="success.main">
										{totalReglements}
									</Typography>

								</Box>
							</Stack>
						</CardContent>
					</Card>
					<Card elevation={2} sx={{ flex: 1, borderRadius: 2 }}>
						<CardContent>
							<Stack direction="row" spacing={2} alignItems="center">
								<CancelIcon color="error" />
								<Box>
									<Typography variant="body2" color="text.secondary">
										Total impayés
									</Typography>
									<Typography variant="h6" fontWeight={700} color="error.main">
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
			/>
		</>
	);
};

const FactureClientUnpaidListClient: React.FC<SessionProps> = ({ session }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title="Factures Impayées">
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default FactureClientUnpaidListClient;
