'use client';

import { runWithCleanup } from '@/utils/runWithCleanup';
import { type FC, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Delete as DeleteIcon,
	PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import {
	BON_DE_LIVRAISON_EDIT,
	BON_DE_LIVRAISON_LIST,
	BON_DE_LIVRAISON_PDF,
	type DocumentPdfType,
} from '@/utils/routes';
import { useDeleteBonDeLivraisonMutation, useGetBonDeLivraisonQuery } from '@/store/services/bonDeLivraison';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage } from '@/utils/helpers';
import { getUserCompaniesState } from '@/store/selectors';
import { fetchPdfBlob } from '@/utils/apiHelpers';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import CompanyDocumentsWrapperView from '@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView';
import type { BonDeLivraisonData, BonDeLivraisonViewProps as Props } from '@/types/companyDocumentsTypes';

const BonDeLivraisonViewClient: FC<Props> = ({ session, company_id, id }) => {
	const query = useGetBonDeLivraisonQuery({ id });
	const router = useRouter();
	const token = useInitAccessToken(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((c) => c.id === company_id);
	const [deleteRecord] = useDeleteBonDeLivraisonMutation();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const [pendingPdfType, setPendingPdfType] = useState<DocumentPdfType | null>(null);

	const handleDelete = async () => {
		await runWithCleanup(
			async () => {
				try {
					await deleteRecord({ id }).unwrap();
					onSuccess(t.bonsLivraison.deleteSuccess);
					router.push(BON_DE_LIVRAISON_LIST);
				} catch (err) {
					onError(extractApiErrorMessage(err, t.bonsLivraison.deleteError));
				}
			},
			() => {
				setShowDeleteModal(false);
			},
		);
	};

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <ArrowBackIcon />,
			color: '#6B6B6B',
		},
		{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const openPdf = (type: DocumentPdfType) => {
		setPendingPdfType(type);
		setShowLanguageModal(true);
	};

	const handleLanguageSelect = async (language: 'fr' | 'en') => {
		setShowLanguageModal(false);
		if (!token || !pendingPdfType) return;
		await runWithCleanup(
			async () => {
				try {
					const url = BON_DE_LIVRAISON_PDF(id, company_id, pendingPdfType, language);
					const blob = await fetchPdfBlob(url, token);
					const blobUrl = window.URL.createObjectURL(blob);
					window.open(blobUrl, '_blank');
					setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
				} catch {
					onError(t.errors.documentOpenError);
				}
			},
			() => {
				setPendingPdfType(null);
			},
		);
	};

	const isCaissier = company?.role === 'Caissier';
	const canPrint =
		Boolean(query.data) && (isCaissier || company?.role === 'Comptable' || company?.role === 'Commercial');

	const headerActions = (
		<>
			{canPrint && (
				<>
					<Button
						variant="outlined"
						color="error"
						size="small"
						startIcon={<PictureAsPdfIcon />}
						onClick={() => openPdf('avec_remise')}
					>
						{t.common.pdfWithDiscount}
					</Button>
					<Button
						variant="outlined"
						size="small"
						startIcon={<PictureAsPdfIcon />}
						onClick={() => openPdf('sans_remise')}
					>
						{t.common.pdfWithoutDiscount}
					</Button>
					<Button
						variant="outlined"
						color="warning"
						size="small"
						startIcon={<PictureAsPdfIcon />}
						onClick={() => openPdf('avec_unite_sans_remise')}
					>
						{t.common.pdfWithUnitWithoutDiscount}
					</Button>
					<Button
						variant="outlined"
						color="warning"
						size="small"
						startIcon={<PictureAsPdfIcon />}
						onClick={() => openPdf('avec_unite_avec_remise')}
					>
						{t.common.pdfWithUnitWithDiscount}
					</Button>
				</>
			)}
			{isCaissier && (
				<Button
					variant="outlined"
					color="error"
					size="small"
					startIcon={<DeleteIcon />}
					onClick={() => setShowDeleteModal(true)}
				>
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
					onClose={() => {
						setShowLanguageModal(false);
						setPendingPdfType(null);
					}}
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
