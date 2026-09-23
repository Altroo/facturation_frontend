'use client';

import { runWithCleanup } from '@/utils/runWithCleanup';
import { type FC, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	CheckCircle as CheckCircleIcon,
	Delete as DeleteIcon,
	PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { type DocumentPdfType, FACTURE_CLIENT_EDIT, FACTURE_CLIENT_LIST, FACTURE_CLIENT_PDF } from '@/utils/routes';
import {
	useDeleteFactureClientMutation,
	useGetFactureClientQuery,
	usePatchStatutMutation,
} from '@/store/services/factureClient';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage } from '@/utils/helpers';
import { getUserCompaniesState } from '@/store/selectors';
import { fetchPdfBlob } from '@/utils/apiHelpers';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import CompanyDocumentsWrapperView from '@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView';
import type { FactureClientData, FactureClientViewProps as Props } from '@/types/companyDocumentsTypes';
import InvoicePaymentsSection from './invoice-payments-section';

const FactureClientViewClient: FC<Props> = ({ session, company_id, id }) => {
	const query = useGetFactureClientQuery({ id });
	const router = useRouter();
	const token = useInitAccessToken(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((c) => c.id === company_id);
	const [deleteRecord] = useDeleteFactureClientMutation();
	const [patchStatut, { isLoading: isValidationLoading }] = usePatchStatutMutation();
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
					onSuccess(t.facturesClient.deleteSuccess);
					router.push(FACTURE_CLIENT_LIST);
				} catch (err) {
					onError(extractApiErrorMessage(err, t.facturesClient.deleteError));
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
					const url = FACTURE_CLIENT_PDF(id, company_id, pendingPdfType, language);
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

	const handleValidate = async () => {
		try {
			await patchStatut({ id, data: { statut: 'Accepté' } }).unwrap();
			onSuccess(t.facturesClient.validateSuccess);
			query.refetch();
		} catch (err) {
			onError(extractApiErrorMessage(err, t.facturesClient.validateError));
		}
	};

	const isCaissier = company?.role === 'Caissier';
	const canPrint = isCaissier || company?.role === 'Comptable' || company?.role === 'Commercial';
	const isAccepted = query.data?.statut === 'Accepté';
	const isDraft = query.data?.statut === 'Brouillon';
	const canOpenPdf = canPrint && (isDraft || isAccepted);
	const canValidate = company?.can_validate_factures === true && company?.can_change_document_status === true;
	const canManagePayments = Boolean((isCaissier || company?.role === 'Commercial') && isAccepted);

	const headerActions = (
		<>
			{canValidate && !isAccepted && (
				<Button
					variant="contained"
					color="success"
					size="small"
					startIcon={<CheckCircleIcon />}
					onClick={handleValidate}
					disabled={isValidationLoading}
				>
					{t.facturesClient.validateInvoice}
				</Button>
			)}
			{canPrint && !canOpenPdf && (
				<Button variant="outlined" size="small" startIcon={<PictureAsPdfIcon />} disabled>
					{t.facturesClient.printRequiresValidation}
				</Button>
			)}
			{canOpenPdf && (
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
			<CompanyDocumentsWrapperView<FactureClientData>
				session={session}
				company_id={company_id}
				id={id}
				type="facture-client"
				title={t.facturesClient.detailsTitle}
				backLabel={t.facturesClient.backToList}
				editTo={FACTURE_CLIENT_EDIT}
				documentNumberLabel={t.facturesClient.documentNumberLabel}
				getDocumentNumber={(d) => d?.numero_facture}
				documentDateLabel={t.facturesClient.documentDateLabel}
				getDocumentDateRaw={(d) => d?.date_facture}
				statusTitle={t.facturesClient.statusTitle}
				linesTitle={t.facturesClient.linesTitle}
				termsSecondLabel={t.facturesClient.termsSecondLabel}
				getTermsSecondValue={(d) => d?.numero_bon_commande_client}
				query={query}
				headerActions={headerActions}
				extraSections={
					<InvoicePaymentsSection
						companyId={company_id}
						factureClientId={id}
						token={token}
						canManagePayments={canManagePayments}
					/>
				}
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
					title={t.facturesClient.deleteModalTitle}
					body={t.facturesClient.deleteModalBody}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</>
	);
};

export default FactureClientViewClient;
