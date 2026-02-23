'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Delete as DeleteIcon,
	PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { FACTURE_CLIENT_EDIT, FACTURE_CLIENT_LIST, FACTURE_CLIENT_PDF } from '@/utils/routes';
import { useGetFactureClientQuery, useDeleteFactureClientMutation } from '@/store/services/factureClient';
import { getAccessTokenFromSession } from '@/store/session';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';
import { fetchPdfBlob } from '@/utils/apiHelpers';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperView from '@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView';
import type { CompanyDocumentData } from '@/types/companyDocumentsTypes';

type FactureClientData = CompanyDocumentData & {
	numero_facture?: string | number | null;
	date_facture?: string | null;
	numero_bon_commande_client?: string | number | null;
};

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const FactureClientViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const query = useGetFactureClientQuery({ id });
	const router = useRouter();
	const token = getAccessTokenFromSession(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = useMemo(() => companies?.find((c) => c.id === company_id), [companies, company_id]);
	const [deleteRecord] = useDeleteFactureClientMutation();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const [pendingPdfType, setPendingPdfType] = useState<'avec_remise' | 'sans_remise' | 'avec_unite' | null>(null);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess('Facture client supprimée avec succès');
			router.push(FACTURE_CLIENT_LIST);
		} catch {
			onError('Erreur lors de la suppression de la facture client');
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowDeleteModal(false), icon: <ArrowBackIcon />, color: '#6B6B6B' },
		{ text: 'Supprimer', active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const openPdf = (type: 'avec_remise' | 'sans_remise' | 'avec_unite') => {
		setPendingPdfType(type);
		setShowLanguageModal(true);
	};

	const handleLanguageSelect = async (language: 'fr' | 'en') => {
		setShowLanguageModal(false);
		if (!token || !pendingPdfType) return;
		try {
			const url = FACTURE_CLIENT_PDF(id, company_id, pendingPdfType, language);
			const blob = await fetchPdfBlob(url, token);
			const blobUrl = window.URL.createObjectURL(blob);
			window.open(blobUrl, '_blank');
			setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
		} catch {
			onError("Erreur lors de l'ouverture du document.");
		} finally {
			setPendingPdfType(null);
		}
	};

	const isCaissier = company?.role === 'Caissier';
	const canPrint = isCaissier || company?.role === 'Comptable' || company?.role === 'Commercial';

	const headerActions = (
		<>
			{canPrint && (
				<>
					<Button variant="outlined" color="error" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => openPdf('avec_remise')}>
						PDF (remise)
					</Button>
					<Button variant="outlined" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => openPdf('sans_remise')}>
						PDF (sans remise)
					</Button>
					<Button variant="outlined" color="warning" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => openPdf('avec_unite')}>
						PDF (unité)
					</Button>
				</>
			)}
			{isCaissier && (
				<Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>
					Supprimer
				</Button>
			)}
		</>
	);

	return (
		<>
			<CompanyDocumentsWrapperView<FactureClientData>
				session={session}
				company_id={company_id}
				id={id}
				type="facture-client"
				title="Détails du facture client"
				backLabel="Liste des factures clients"
				backTo={FACTURE_CLIENT_LIST}
				editTo={FACTURE_CLIENT_EDIT}
				documentNumberLabel="Numéro de facture"
				getDocumentNumber={(d) => d?.numero_facture}
				documentDateLabel="Date de facture"
				getDocumentDateRaw={(d) => d?.date_facture}
				statusTitle="Statut du facture client"
				linesTitle="Lignes de facture client"
				termsSecondLabel="Numéro de bon commande client"
				getTermsSecondValue={(d) => d?.numero_bon_commande_client}
				query={query}
				headerActions={headerActions}
			/>
			{showLanguageModal && (
				<PdfLanguageModal
					onSelectLanguage={handleLanguageSelect}
					onClose={() => { setShowLanguageModal(false); setPendingPdfType(null); }}
				/>
			)}
			{showDeleteModal && (
				<ActionModals
					title="Supprimer cette facture client ?"
					body="Êtes-vous sûr de vouloir supprimer cette facture client ? Cette action est irréversible."
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</>
	);
};

export default FactureClientViewClient;
