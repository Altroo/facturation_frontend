'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Delete as DeleteIcon,
	PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { DEVIS_EDIT, DEVIS_LIST, DEVIS_PDF } from '@/utils/routes';
import { useGetDeviQuery, useDeleteDeviMutation } from '@/store/services/devi';
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

type DevisData = CompanyDocumentData & {
	numero_devis?: string | number | null;
	date_devis?: string | null;
	numero_demande_prix_client?: string | number | null;
};

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const DevisViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const query = useGetDeviQuery({ id });
	const router = useRouter();
	const token = useInitAccessToken(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = useMemo(() => companies?.find((c) => c.id === company_id), [companies, company_id]);
	const [deleteRecord] = useDeleteDeviMutation();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const [pendingPdfType, setPendingPdfType] = useState<'avec_remise' | 'sans_remise' | 'avec_unite' | null>(null);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess(t.devis.deleteSuccess);
			router.push(DEVIS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.devis.deleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <ArrowBackIcon />, color: '#6B6B6B' },
		{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const openPdf = (type: 'avec_remise' | 'sans_remise' | 'avec_unite') => {
		setPendingPdfType(type);
		setShowLanguageModal(true);
	};

	const handleLanguageSelect = async (language: 'fr' | 'en') => {
		setShowLanguageModal(false);
		if (!token || !pendingPdfType) return;
		try {
			const url = DEVIS_PDF(id, company_id, pendingPdfType, language);
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
					<Button variant="outlined" color="error" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => openPdf('avec_remise')}>
						PDF (remise)
					</Button>
					<Button variant="outlined" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => openPdf('sans_remise')}>
						{t.common.pdfWithoutDiscount}
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
			<CompanyDocumentsWrapperView<DevisData>
				session={session}
				company_id={company_id}
				id={id}
				type="devis"
				title={t.devis.detailsTitle}
				backLabel={t.devis.backToList}
				backTo={DEVIS_LIST}
				editTo={DEVIS_EDIT}
				documentNumberLabel={t.devis.documentNumberLabel}
				getDocumentNumber={(d) => d?.numero_devis}
				documentDateLabel={t.devis.documentDateLabel}
				getDocumentDateRaw={(d) => d?.date_devis}
				statusTitle={t.devis.statusTitle}
				linesTitle={t.devis.linesTitle}
				termsSecondLabel={t.devis.fieldNumeroDemandePrix}
				getTermsSecondValue={(d) => d?.numero_demande_prix_client}
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
					title={t.devis.deleteModalTitle}
					body={t.devis.deleteModalBody}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</>
	);
};

export default DevisViewClient;
