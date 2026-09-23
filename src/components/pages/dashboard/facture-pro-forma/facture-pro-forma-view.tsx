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
	type DocumentPdfType,
	FACTURE_PRO_FORMA_EDIT,
	FACTURE_PRO_FORMA_LIST,
	FACTURE_PRO_FORMA_PDF,
} from '@/utils/routes';
import { useDeleteFactureProFormaMutation, useGetFactureProFormaQuery } from '@/store/services/factureProForma';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage } from '@/utils/helpers';
import { getUserCompaniesState } from '@/store/selectors';
import { fetchPdfBlob } from '@/utils/apiHelpers';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import CompanyDocumentsWrapperView from '@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView';
import type { FactureProFormaData, FactureProFormaViewProps as Props } from '@/types/companyDocumentsTypes';

const FactureProFormaViewClient: FC<Props> = ({ session, company_id, id }) => {
	const query = useGetFactureProFormaQuery({ id });
	const router = useRouter();
	const token = useInitAccessToken(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((c) => c.id === company_id);
	const [deleteRecord] = useDeleteFactureProFormaMutation();
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
					onSuccess(t.facturesProforma.deleteSuccess);
					router.push(FACTURE_PRO_FORMA_LIST);
				} catch (err) {
					onError(extractApiErrorMessage(err, t.facturesProforma.deleteError));
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
					const url = FACTURE_PRO_FORMA_PDF(id, company_id, pendingPdfType, language);
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
						PDF (remise)
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
			<CompanyDocumentsWrapperView<FactureProFormaData>
				session={session}
				company_id={company_id}
				id={id}
				type="facture-pro-forma"
				title={t.facturesProforma.detailsTitle}
				backLabel={t.facturesProforma.backToList}
				editTo={FACTURE_PRO_FORMA_EDIT}
				documentNumberLabel={t.facturesProforma.documentNumberLabel}
				getDocumentNumber={(d) => d?.numero_facture}
				documentDateLabel={t.facturesProforma.documentDateLabel}
				getDocumentDateRaw={(d) => d?.date_facture}
				statusTitle={t.facturesProforma.statusTitle}
				linesTitle={t.facturesProforma.linesTitle}
				termsSecondLabel={t.facturesProforma.termsSecondLabel}
				getTermsSecondValue={(d) => d?.numero_bon_commande_client}
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
					title={t.facturesProforma.deleteModalTitle}
					body={t.facturesProforma.deleteModalBody}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</>
	);
};

export default FactureProFormaViewClient;
