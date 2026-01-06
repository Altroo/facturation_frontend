'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Stack, Typography, Divider } from '@mui/material';
import {
	ReceiptLong as ReceiptLongIcon,
	AttachMoney as AttachMoneyIcon,
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
	Print as PrintIcon,
} from '@mui/icons-material';
import { GridFilterModel } from '@mui/x-data-grid';
import { getAccessTokenFromSession } from '@/store/session';
import {
	useConvertFactureClientToBonDeLivraisonMutation,
	useDeleteFactureClientMutation,
	useGetFactureClientListQuery,
} from '@/store/services/factureClient';
import {
	BON_DE_LIVRAISON_EDIT,
	FACTURE_CLIENT_ADD,
	FACTURE_CLIENT_EDIT,
	FACTURE_CLIENT_VIEW,
	FACTURE_CLIENT_PDF,
} from '@/utils/routes';
import type { SessionProps } from '@/types/_initTypes';
import type { FactureClass } from '@/models/classes';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import CompanyDocumentsListContent from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsListContent';
import type { DocumentListConfig, PaginationModel, FactureClientListResponseType } from '@/types/companyDocumentsTypes';
import { formatPrice } from '@/utils/helpers';

const factureClientListConfig: DocumentListConfig<FactureClass> = {
	documentType: 'facture-client',
	labels: {
		documentTypeName: 'facture client',
		pageTitle: 'Liste des Factures Clients',
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
	printActions: [
		{
			key: 'avec_remise',
			label: 'Afficher Facture client avec remise',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#1976d2',
			urlGenerator: (id: number, companyId: number) => FACTURE_CLIENT_PDF(id, companyId, 'avec_remise'),
		},
		{
			key: 'sans_remise',
			label: 'Afficher Facture client sans remise',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#2e7d32',
			urlGenerator: (id: number, companyId: number) => FACTURE_CLIENT_PDF(id, companyId, 'sans_remise'),
		},
		{
			key: 'avec_unite',
			label: 'Afficher Facture client avec unité',
			icon: <PrintIcon fontSize="small" />,
			iconColor: '#ed6c02',
			urlGenerator: (id: number, companyId: number) => FACTURE_CLIENT_PDF(id, companyId, 'avec_unite'),
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

	// Extract date filter parameters from filter model
	const getDateFilterParams = () => {
		const params: Record<string, string> = {};
		filterModel.items.forEach((item) => {
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
	} = useGetFactureClientListQuery(
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

	// Convert mutations map - empty for now since bon de livraison is not implemented
	const [convertToBonDeLivraison, { isLoading: isConvertToBonDeLivraisonLoading }] =
		useConvertFactureClientToBonDeLivraisonMutation();

	// Convert mutations map
	const convertMutations = {
		bon_de_livraison: {
			convertMutation: convertToBonDeLivraison,
			isLoading: isConvertToBonDeLivraisonLoading,
		},
	};

	// Format aggregated stats
	const chiffreAffaireTotal = data?.chiffre_affaire_total ? formatPrice(data.chiffre_affaire_total) : '0,00 DH';
	const totalReglements = data?.total_reglements ? formatPrice(data.total_reglements) : '0,00 DH';
	const totalImpayes = data?.total_impayes ? formatPrice(data.total_impayes) : '0,00 DH';

	return (
		<>
			{/* Stats Cards */}
			<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, mt: { xs: 1, sm: 2, md: 3 } }}>
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
				config={factureClientListConfig}
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

const FactureClientListClient: React.FC<SessionProps> = ({ session }) => {
	return (
		<CompanyDocumentsWrapperList session={session} title="Liste des Factures Clients">
			{({ company_id, role }) => <FormikContent session={session} company_id={company_id} role={role} />}
		</CompanyDocumentsWrapperList>
	);
};

export default FactureClientListClient;
