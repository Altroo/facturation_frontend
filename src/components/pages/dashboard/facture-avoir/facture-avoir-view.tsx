'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Link as MuiLink } from '@mui/material';
import {
	Description as DescriptionIcon,
	PictureAsPdf as PictureAsPdfIcon,
	ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import { FACTURE_AVOIR_EDIT, FACTURE_AVOIR_LIST, FACTURE_AVOIR_PDF, FACTURE_CLIENT_VIEW, type DocumentPdfType } from '@/utils/routes';
import { useGetFactureAvoirQuery } from '@/store/services/factureAvoir';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';
import { fetchPdfBlob } from '@/utils/apiHelpers';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperView from '@/components/pages/dashboard/shared/company-documents-view/companyDocumentsWrapperView';
import type { CompanyDocumentData } from '@/types/companyDocumentsTypes';

type FactureAvoirData = CompanyDocumentData & {
	numero_avoir?: string | number | null;
	date_avoir?: string | null;
	facture_origine?: number | null;
	facture_origine_numero?: string | null;
	facture_origine_date?: string | null;
	motif_avoir_label?: string | null;
	numero_bon_commande_client?: string | number | null;
};

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const FactureAvoirViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const query = useGetFactureAvoirQuery({ id });
	const token = useInitAccessToken(session);
	const router = useRouter();
	const companies = useAppSelector(getUserCompaniesState);
	const company = useMemo(() => companies?.find((c) => c.id === company_id), [companies, company_id]);
	const { onError } = useToast();
	const { t } = useLanguage();
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const [pendingPdfType, setPendingPdfType] = useState<DocumentPdfType | null>(null);

	const canPrint =
		Boolean(query.data) &&
		query.data?.statut !== 'Brouillon' &&
		(company?.role === 'Caissier' || company?.role === 'Comptable' || company?.role === 'Commercial');

	const openPdf = (type: DocumentPdfType) => {
		setPendingPdfType(type);
		setShowLanguageModal(true);
	};

	const handleLanguageSelect = async (language: 'fr' | 'en') => {
		setShowLanguageModal(false);
		if (!token || !pendingPdfType) return;
		try {
			const url = FACTURE_AVOIR_PDF(id, company_id, pendingPdfType, language);
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
					<Button variant="outlined" color="warning" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => openPdf('avec_unite_sans_remise')}>
						{t.common.pdfWithUnitWithoutDiscount}
					</Button>
					<Button variant="outlined" color="warning" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => openPdf('avec_unite_avec_remise')}>
						{t.common.pdfWithUnitWithDiscount}
					</Button>
				</>
			)}
		</>
	);

	return (
		<>
			<CompanyDocumentsWrapperView<FactureAvoirData>
				session={session}
				company_id={company_id}
				id={id}
				type="facture-avoir"
				title={t.facturesAvoir.detailsTitle}
				backLabel={t.facturesAvoir.backToList}
				backTo={FACTURE_AVOIR_LIST}
				editTo={FACTURE_AVOIR_EDIT}
				documentNumberLabel={t.facturesAvoir.documentNumberLabel}
				getDocumentNumber={(d) => d?.numero_avoir}
				documentDateLabel={t.facturesAvoir.documentDateLabel}
				getDocumentDateRaw={(d) => d?.date_avoir}
				statusTitle={t.facturesAvoir.statusTitle}
				linesTitle={t.facturesAvoir.linesTitle}
				termsSecondLabel={t.facturesAvoir.termsSecondLabel}
				getTermsSecondValue={(d) => d?.numero_bon_commande_client}
				query={query}
				headerActions={headerActions}
				canEdit={query.data?.statut === 'Brouillon'}
				extraDocumentRows={[
					{
						icon: <ReceiptLongIcon />,
						label: t.facturesAvoir.originLabel,
						getValue: (d) =>
							d?.facture_origine && d?.facture_origine_numero ? (
								<MuiLink
									component="button"
									type="button"
									onClick={() => router.push(FACTURE_CLIENT_VIEW(d.facture_origine as number, company_id))}
								>
									{d.facture_origine_numero}
								</MuiLink>
							) : (
								t.facturesAvoir.freeOriginLabel
							),
					},
					{
						icon: <DescriptionIcon />,
						label: t.facturesAvoir.motifLabel,
						getValue: (d) => d?.motif_avoir_label,
					},
				]}
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
		</>
	);
};

export default FactureAvoirViewClient;
