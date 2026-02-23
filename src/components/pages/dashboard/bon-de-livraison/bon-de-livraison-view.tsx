'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Delete as DeleteIcon,
	PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { BON_DE_LIVRAISON_EDIT, BON_DE_LIVRAISON_LIST, BON_DE_LIVRAISON_PDF } from '@/utils/routes';
import { useGetBonDeLivraisonQuery, useDeleteBonDeLivraisonMutation } from '@/store/services/bonDeLivraison';
import { getAccessTokenFromSession } from '@/store/session';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';
import { fetchPdfBlob } from '@/utils/apiHelpers';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperView from '@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView';
import type { CompanyDocumentData } from '@/types/companyDocumentsTypes';

type BonDeLivraisonData = CompanyDocumentData & {
	numero_bon_livraison?: string | number | null;
	date_bon_livraison?: string | null;
	numero_bon_commande_client?: string | number | null;
};

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const BonDeLivraisonViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const query = useGetBonDeLivraisonQuery({ id });
	const router = useRouter();
	const token = getAccessTokenFromSession(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = useMemo(() => companies?.find((c) => c.id === company_id), [companies, company_id]);
	const [deleteRecord] = useDeleteBonDeLivraisonMutation();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const [pendingPdfType, setPendingPdfType] = useState<'normal' | 'quantity_only' | 'avec_unite' | null>(null);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess('Bon de livraison supprimé avec succès');
			router.push(BON_DE_LIVRAISON_LIST);
		} catch {
			onError('Erreur lors de la suppression du bon de livraison');
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowDeleteModal(false), icon: <ArrowBackIcon />, color: '#6B6B6B' },
		{ text: 'Supprimer', active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const openPdf = (type: 'normal' | 'quantity_only' | 'avec_unite') => {
		setPendingPdfType(type);
		setShowLanguageModal(true);
	};

	const handleLanguageSelect = async (language: 'fr' | 'en') => {
		setShowLanguageModal(false);
		if (!token || !pendingPdfType) return;
		try {
			const url = BON_DE_LIVRAISON_PDF(id, company_id, pendingPdfType, language);
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
					<Button variant="outlined" color="error" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => openPdf('normal')}>
						PDF (normal)
					</Button>
					<Button variant="outlined" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => openPdf('quantity_only')}>
						PDF (qua. only)
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
			<CompanyDocumentsWrapperView<BonDeLivraisonData>
				session={session}
				company_id={company_id}
				id={id}
				type="bon-de-livraison"
				title="Détails du bon de livraison"
				backLabel="Liste des bon de livraison"
				backTo={BON_DE_LIVRAISON_LIST}
				editTo={BON_DE_LIVRAISON_EDIT}
				documentNumberLabel="Numéro du bon de livraison"
				getDocumentNumber={(b) => b?.numero_bon_livraison}
				documentDateLabel="Date du bon de livraison"
				getDocumentDateRaw={(b) => b?.date_bon_livraison}
				statusTitle="Statut du bon de livraison"
				linesTitle="Lignes du bon de livraison"
				termsSecondLabel="Numéro du bon de commande client"
				getTermsSecondValue={(b) => b?.numero_bon_commande_client}
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
					title="Supprimer ce bon de livraison ?"
					body="Êtes-vous sûr de vouloir supprimer ce bon de livraison ? Cette action est irréversible."
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</>
	);
};

export default BonDeLivraisonViewClient;
