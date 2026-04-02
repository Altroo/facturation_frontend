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
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAppSelector, useToast, useLanguage } from '@/utils/hooks';
import { extractApiErrorMessage } from '@/utils/helpers';
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
	const token = useInitAccessToken(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = useMemo(() => companies?.find((c) => c.id === company_id), [companies, company_id]);
	const [deleteRecord] = useDeleteBonDeLivraisonMutation();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const [pendingPdfType, setPendingPdfType] = useState<'normal' | 'quantity_only' | 'avec_unite' | null>(null);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess(t.bonsLivraison.deleteSuccess);
			router.push(BON_DE_LIVRAISON_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.bonsLivraison.deleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <ArrowBackIcon />, color: '#6B6B6B' },
		{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
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
			onError(t.errors.documentOpenError);
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
						{t.common.pdfUnit}
					</Button>
				</>
			)}
			{isCaissier && (
				<Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>
					{t.common.delete}
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
				title={t.bonsLivraison.detailsTitle}
				backLabel={t.bonsLivraison.backToList}
				backTo={BON_DE_LIVRAISON_LIST}
				editTo={BON_DE_LIVRAISON_EDIT}
				documentNumberLabel={t.bonsLivraison.documentNumberLabel}
				getDocumentNumber={(b) => b?.numero_bon_livraison}
				documentDateLabel={t.bonsLivraison.documentDateLabel}
				getDocumentDateRaw={(b) => b?.date_bon_livraison}
				statusTitle={t.bonsLivraison.statusTitle}
				linesTitle={t.bonsLivraison.linesTitle}
				termsSecondLabel={t.bonsLivraison.termsSecondLabel}
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
					title={t.bonsLivraison.deleteModalTitle}
					body={t.bonsLivraison.deleteModalBody}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</>
	);
};

export default BonDeLivraisonViewClient;
