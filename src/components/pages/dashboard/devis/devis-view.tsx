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
import { useAppSelector, useToast } from '@/utils/hooks';
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
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const [pendingPdfType, setPendingPdfType] = useState<'avec_remise' | 'sans_remise' | 'avec_unite' | null>(null);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess('Devis supprimé avec succès');
			router.push(DEVIS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression du devis'));
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
			const url = DEVIS_PDF(id, company_id, pendingPdfType, language);
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
			<CompanyDocumentsWrapperView<DevisData>
				session={session}
				company_id={company_id}
				id={id}
				type="devis"
				title="Détails du devis"
				backLabel="Liste des devis"
				backTo={DEVIS_LIST}
				editTo={DEVIS_EDIT}
				documentNumberLabel="Numéro du devis"
				getDocumentNumber={(d) => d?.numero_devis}
				documentDateLabel="Date du devis"
				getDocumentDateRaw={(d) => d?.date_devis}
				statusTitle="Statut du devis"
				linesTitle="Lignes du devis"
				termsSecondLabel="Numéro demande prix client"
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
					title="Supprimer ce devis ?"
					body="Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible."
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</>
	);
};

export default DevisViewClient;
