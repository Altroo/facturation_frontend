'use client';

import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import DashboardStatCard from '@/components/shared/dashboardStatCard/dashboardStatCard';
import NoPermission from '@/components/shared/noPermission/noPermission';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getInitStateToken, getUserCompaniesState } from '@/store/selectors';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import {
	useAddLogistiqueProcessNoteMutation,
	useConfirmLogistiquePaymentReceiptMutation,
	useDeleteLogistiqueMutation,
	useGetLogistiqueQuery,
	usePatchLogistiqueLaunchStatusMutation,
	usePatchLogistiqueStatutMutation,
	usePatchLogistiqueWorkflowStatusMutation,
	usePurchaseActionMutation,
	useRecordLogistiquePaymentExecutionMutation,
	useRecordLogistiqueProformaRequestMutation,
	useRejectLogistiquePaymentMutation,
	useRequestLogistiquePaymentMutation,
	useRetryLogistiquePaymentEmailMutation,
	useReviewLogistiqueSupplierProformaMutation,
	useSetLogistiqueProofEmailStatusMutation,
	useStartLogistiquePaymentMutation,
	useValidateLogistiquePaymentMutation,
} from '@/store/services/logistique';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface } from '@/types/_initTypes';
import type {
	LogistiqueDocumentField,
	LogistiqueLaunchStatus,
	LogistiquePaymentInstallment,
	LogistiquePaymentMethod,
	LogistiqueProformaStatus,
	LogistiqueStatut,
	LogistiqueViewProps as Props,
} from '@/types/logistiqueTypes';
import { extractApiErrorMessage, formatNumberWithSpaces, listReturnUrl, runWithCleanup } from '@/utils/helpers';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import {
	getTranslatedLogistiqueMacroSteps,
	logistiqueLegacyStatusStepIndex,
	logistiqueManagerRoles,
} from '@/utils/rawData';
import { LOGISTIQUE_EDIT, LOGISTIQUE_LIST, STOCK_RECEIPTS } from '@/utils/routes';
import {
	ArrowBack as ArrowBackIcon,
	Business as BusinessIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	History as HistoryIcon,
	Inventory as InventoryIcon,
	LocalShipping as LocalShippingIcon,
	Payment as PaymentIcon,
	ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS, frFR } from '@mui/x-date-pickers/locales';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fr } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FC, useRef, useState } from 'react';
import SupplierPurchaseSteps from './supplier-purchase-steps';
import { useLogistiqueEmailPolling } from './use-logistique-email-polling';

import {
	formatLogistiqueDate as formatDateOnly,
	formatLogistiqueMoney as formatMoney,
	getLogistiqueProformaReviewAction as getProformaReviewAction,
} from '@/utils/helpers';
import { LogistiqueHistoricalDetails } from './logistique-historical-details';
import {
	LogistiqueHistoricalLaunchStatusDialog,
	LogistiqueHistoricalPaymentExecutionDialog,
	LogistiqueHistoricalPaymentRejectionDialog,
	LogistiqueHistoricalPaymentValidationDialog,
	LogistiqueHistoricalProformaRequestDialog,
	LogistiqueHistoricalProformaReviewDialog,
	LogistiqueHistoricalRequestPaymentDialog,
} from './logistique-historical-dialogs';

const LogistiqueViewClient: FC<Props> = ({ session, company_id, id }) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const query = useSearchParams();
	const [purchase, { isLoading: correctionBusy }] = usePurchaseActionMutation();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const companiesState = useAppSelector(getUserCompaniesState);
	const currentUserId = useAppSelector(getInitStateToken).user.pk;
	const { data: companiesData, isLoading: isCompaniesLoading } = useGetUserCompaniesQuery(undefined, { skip: !token });
	const companies = companiesData ?? companiesState;
	const company = companies?.find((item) => item.id === company_id);
	const role = company?.role ?? '';
	const canRead = Boolean(company);
	const hasManagerRole = logistiqueManagerRoles.has(role);
	const isAccountingUser = role === 'Comptable';
	const canChangeGlobalStatus = company?.can_change_document_status === true;
	const canDelete = role === 'Caissier';

	const { data: order, isLoading, error, refetch } = useGetLogistiqueQuery({ id }, { skip: !token });
	useLogistiqueEmailPolling(order, Boolean(token), refetch);
	const axiosError = error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;
	const [deleteLogistique] = useDeleteLogistiqueMutation();
	const [patchGlobalStatus, { isLoading: isChangingGlobalStatus }] = usePatchLogistiqueStatutMutation();
	const [patchWorkflowStatus, { isLoading: isChangingWorkflowStatus }] = usePatchLogistiqueWorkflowStatusMutation();
	const [patchLaunchStatus, { isLoading: isChangingLaunchStatus }] = usePatchLogistiqueLaunchStatusMutation();
	const [recordProformaRequest, { isLoading: isRecordingProformaRequest }] =
		useRecordLogistiqueProformaRequestMutation();
	const [reviewSupplierProforma, { isLoading: isReviewingSupplierProforma }] =
		useReviewLogistiqueSupplierProformaMutation();
	const [requestPayment] = useRequestLogistiquePaymentMutation();
	const [retryPaymentEmail, { isLoading: isRetryingPaymentEmail }] = useRetryLogistiquePaymentEmailMutation();
	const [startPayment] = useStartLogistiquePaymentMutation();
	const [recordPaymentExecution] = useRecordLogistiquePaymentExecutionMutation();
	const [validatePayment] = useValidateLogistiquePaymentMutation();
	const [rejectPayment] = useRejectLogistiquePaymentMutation();
	const [setProofEmailStatus, { isLoading: isUpdatingProofEmail }] = useSetLogistiqueProofEmailStatusMutation();
	const [addProcessNote, { isLoading: isAddingProcessNote }] = useAddLogistiqueProcessNoteMutation();
	const [confirmPaymentReceipt] = useConfirmLogistiquePaymentReceiptMutation();
	const { t, language } = useLanguage();
	const { onSuccess, onError } = useToast();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [pendingGlobalStatus, setPendingGlobalStatus] = useState<Extract<
		LogistiqueStatut,
		'Annulé' | 'Rouvert'
	> | null>(null);
	const [showRequestPaymentModal, setShowRequestPaymentModal] = useState(false);
	const [showValidateModal, setShowValidateModal] = useState(false);
	const [showExecutionModal, setShowExecutionModal] = useState(false);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [showProformaRequestModal, setShowProformaRequestModal] = useState(false);
	const [showLaunchStatusModal, setShowLaunchStatusModal] = useState(false);
	const [launchStatusDraft, setLaunchStatusDraft] = useState<LogistiqueLaunchStatus>('À lancer');
	const [showProformaReviewModal, setShowProformaReviewModal] = useState(false);
	const [nextProformaFollowUp, setNextProformaFollowUp] = useState('');
	const [supplierProformaFile, setSupplierProformaFile] = useState<File | null>(null);
	const [proformaDecision, setProformaDecision] =
		useState<Exclude<LogistiqueProformaStatus, 'En attente'>>('En contrôle');
	const [supplierProformaData, setSupplierProformaData] = useState({
		numero_proforma_fournisseur: '',
		date_proforma_fournisseur: '',
		montant_proforma_fournisseur: '',
		devise_proforma_fournisseur: 'EUR',
		incoterm: '',
		conditions_paiement: '',
		delai_proforma_jours: '',
		ecart_prix_proforma: false,
		ecart_quantite_proforma: false,
		ecart_autre_proforma: false,
		notes_ecarts_proforma: '',
	});
	const [swiftProofFile, setSwiftProofFile] = useState<File | null>(null);
	const [selectedInstallment, setSelectedInstallment] = useState<LogistiquePaymentInstallment | null>(null);
	const [paymentSchedule, setPaymentSchedule] = useState([{ date_echeance: '', pourcentage: '100' }]);
	const [paymentData, setPaymentData] = useState({
		date_paiement: '',
		montant_paiement: '',
		devise_paiement: 'MAD',
		banque_paiement: '',
		reference_paiement: '',
		methode_paiement: '' as LogistiquePaymentMethod,
		commentaire_paiement: '',
	});
	const [rejectNote, setRejectNote] = useState('');
	const [processRemark, setProcessRemark] = useState('');
	const processFileInputRef = useRef<HTMLInputElement>(null);
	const swiftProofInputRef = useRef<HTMLInputElement>(null);
	const [processFile, setProcessFile] = useState<File | null>(null);
	const documentLabels = {
		titre_importation_file: t.logistique.fieldTitreImportationFile,
		proforma_fournisseur_file: t.logistique.fieldProformaFournisseurFile,
		justificatifs_file: t.logistique.fieldJustificatifsFile,
		swift_file: t.logistique.fieldSwiftFile,
		documents_originaux_file: t.logistique.fieldDocumentsOriginauxFile,
	} as Record<LogistiqueDocumentField, string>;
	const workflowSteps = getTranslatedLogistiqueMacroSteps(t);
	const [chosenStep, setChosenStep] = useState<number | null>(null);
	const calculatedWorkflowIndex =
		order?.workflow?.etapes?.findIndex((step) => step.key === order.workflow?.etape_courante) ??
		(!order?.is_launch_step_complete
			? 0
			: !order.is_proforma_step_complete
				? 1
				: (logistiqueLegacyStatusStepIndex[order.statut] ?? 2));
	const activeWorkflowIndex = Math.min(calculatedWorkflowIndex, workflowSteps.length - 1);
	const queryIndex = order?.workflow?.etapes?.findIndex((step) => step.key === query.get('etape')) ?? -1;
	const requestedStep = chosenStep ?? (queryIndex >= 0 ? queryIndex : activeWorkflowIndex);
	const selectedStep = requestedStep <= activeWorkflowIndex ? requestedStep : activeWorkflowIndex;
	const stepKey =
		order?.workflow?.etapes?.[selectedStep]?.key ??
		['dossier', 'proforma', 'paiement', 'production', 'expedition', 'transit', 'reception', 'couts'][selectedStep];
	const viewingCurrentStep = selectedStep === activeWorkflowIndex;
	const canManage = hasManagerRole && viewingCurrentStep;
	const isOrderCancelled = order?.statut_global === 'Annulé';
	const canStartSupplierPreparation = Boolean(
		canManage &&
		order &&
		!isOrderCancelled &&
		order.statut === 'Envoi SWIFT / Draft LC' &&
		order.statut_paiement === 'Validé' &&
		order.statut_banque_paiement === 'Confirmé' &&
		Number(order.solde_restant) === 0,
	);
	const isOrderResponsible = viewingCurrentStep && Boolean(currentUserId && order?.responsable === currentUserId);
	const canProcessAssignedPayment = Boolean(
		viewingCurrentStep && isAccountingUser && currentUserId && order?.paiement_assigne_a === currentUserId,
	);
	const hasCompleteImportTitle = Boolean(
		order?.numero_domiciliation?.trim() &&
		order?.banque?.trim() &&
		Number(order?.montant_titre_importation) > 0 &&
		order?.devise_titre_importation &&
		order?.date_titre_importation &&
		order?.methode_paiement &&
		order?.titre_importation_file,
	);
	const scheduledPercentage = paymentSchedule.reduce((total, item) => total + Number(item.pourcentage || 0), 0);
	const hasCompletePaymentSchedule = Boolean(
		paymentSchedule.length &&
		paymentSchedule.every((item) => item.date_echeance && Number(item.pourcentage) > 0) &&
		Math.abs(scheduledPercentage - 100) < 0.005,
	);
	const hasCompletePaymentData = Boolean(
		selectedInstallment &&
		paymentData.date_paiement &&
		Number(paymentData.montant_paiement) > 0 &&
		paymentData.devise_paiement &&
		paymentData.banque_paiement.trim() &&
		paymentData.methode_paiement,
	);
	const targetQuantity = order?.lignes?.reduce((total, line) => total + Number(line.quantity || 0), 0) ?? 0;
	const sourceOrderDates =
		(order?.proformas_detail ?? [])
			.map((proforma) => formatDateOnly(proforma.date_facture))
			.filter((date) => date !== '-')
			.join(', ') || '-';
	const targetPriceLines =
		order?.lignes?.map((line) => (
			<Typography key={line.id} variant="body2" sx={{ overflowWrap: 'anywhere' }}>
				{line.article_reference || line.designation || `#${line.article}`}: {formatNumberWithSpaces(line.quantity, 3)} ×{' '}
				{formatMoney(line.prix_achat, line.devise_prix_achat)} = {formatMoney(line.total_achat, line.devise_prix_achat)}
			</Typography>
		)) ?? [];
	const hasRequiredProformaData = Boolean(
		supplierProformaData.numero_proforma_fournisseur.trim() &&
		supplierProformaData.date_proforma_fournisseur &&
		Number(supplierProformaData.montant_proforma_fournisseur) > 0 &&
		supplierProformaData.devise_proforma_fournisseur &&
		supplierProformaData.incoterm.trim() &&
		supplierProformaData.conditions_paiement.trim() &&
		supplierProformaData.delai_proforma_jours !== '' &&
		(supplierProformaFile || order?.proforma_fournisseur_file),
	);
	const hasProformaVariance =
		supplierProformaData.ecart_prix_proforma ||
		supplierProformaData.ecart_quantite_proforma ||
		supplierProformaData.ecart_autre_proforma;
	const isProformaDecisionValid =
		(proformaDecision === 'Correction demandée' &&
			hasProformaVariance &&
			Boolean(supplierProformaData.notes_ecarts_proforma.trim())) ||
		(proformaDecision === 'Validée' && !hasProformaVariance) ||
		(proformaDecision === 'Refusée' && Boolean(supplierProformaData.notes_ecarts_proforma.trim())) ||
		proformaDecision === 'En contrôle';

	const openSupplierProformaReview = () => {
		if (!order) return;
		const hasSavedSupplierProforma = Boolean(
			order.numero_proforma_fournisseur ||
			order.date_proforma_fournisseur ||
			Number(order.montant_proforma_fournisseur) > 0,
		);
		setSupplierProformaData({
			numero_proforma_fournisseur: order.numero_proforma_fournisseur ?? '',
			date_proforma_fournisseur: order.date_proforma_fournisseur ?? '',
			montant_proforma_fournisseur:
				Number(order.montant_proforma_fournisseur) > 0 ? String(order.montant_proforma_fournisseur) : '',
			devise_proforma_fournisseur: hasSavedSupplierProforma
				? order.devise_proforma_fournisseur || order.devise || 'MAD'
				: 'EUR',
			incoterm: order.incoterm ?? '',
			conditions_paiement: order.conditions_paiement ?? '',
			delai_proforma_jours: order.delai_proforma_jours === null ? '' : String(order.delai_proforma_jours),
			ecart_prix_proforma: order.ecart_prix_proforma,
			ecart_quantite_proforma: order.ecart_quantite_proforma,
			ecart_autre_proforma: order.ecart_autre_proforma,
			notes_ecarts_proforma: order.notes_ecarts_proforma ?? '',
		});
		setProformaDecision(
			order.statut_proforma_conformite === 'En attente' ? 'En contrôle' : order.statut_proforma_conformite,
		);
		setSupplierProformaFile(null);
		setShowProformaReviewModal(true);
	};

	const handleDelete = async () => {
		await runWithCleanup(
			async () => {
				try {
					await deleteLogistique({ id }).unwrap();
					onSuccess(t.logistique.deleteSuccess);
					router.push(listReturnUrl(LOGISTIQUE_LIST));
				} catch (err) {
					onError(extractApiErrorMessage(err, t.logistique.deleteError));
				}
			},
			() => {
				setShowDeleteModal(false);
			},
		);
	};

	const handleGlobalStatusChange = async () => {
		if (!pendingGlobalStatus) return;
		try {
			await patchGlobalStatus({ id, data: { statut: pendingGlobalStatus } }).unwrap();
			onSuccess(t.logistique.statusUpdateSuccess);
			setPendingGlobalStatus(null);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.statusUpdateError));
		}
	};

	const handleRequestPayment = async () => {
		if (!hasCompleteImportTitle || !hasCompletePaymentSchedule) return;
		try {
			await requestPayment({ id, echeancier: paymentSchedule }).unwrap();
			onSuccess(t.logistique.requestPaymentSuccess);
			setShowRequestPaymentModal(false);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.requestPaymentError));
		}
	};

	const handleStartSupplierPreparation = async () => {
		try {
			await patchWorkflowStatus({ id, data: { statut: 'Production' } }).unwrap();
			onSuccess(t.logistique.supplierPreparationSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.statusUpdateError));
		}
	};

	const handleRetryPaymentEmail = async () => {
		try {
			await retryPaymentEmail({ id }).unwrap();
			onSuccess(t.logistique.retryPaymentEmailSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.retryPaymentEmailError));
		}
	};

	const openPaymentRequest = () => {
		setPaymentSchedule([
			{
				date_echeance: '',
				pourcentage: '100',
			},
		]);
		setShowRequestPaymentModal(true);
	};

	const handleRecordProformaRequest = async () => {
		if (!nextProformaFollowUp) return;
		try {
			await recordProformaRequest({ id, prochaine_relance_proforma: nextProformaFollowUp }).unwrap();
			onSuccess(t.logistique.proformaRequestSuccess);
			setShowProformaRequestModal(false);
			setNextProformaFollowUp('');
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.proformaRequestError));
		}
	};

	const handleLaunchStatusChange = async () => {
		try {
			await patchLaunchStatus({ id, data: { statut: launchStatusDraft } }).unwrap();
			onSuccess(t.logistique.launchStatusUpdateSuccess);
			setShowLaunchStatusModal(false);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.launchStatusUpdateError));
		}
	};

	const handleSupplierProformaReview = async () => {
		if (!hasRequiredProformaData || !isProformaDecisionValid) return;
		const data = new FormData();
		Object.entries(supplierProformaData).forEach(([field, value]) => {
			data.append(field, typeof value === 'boolean' ? String(value) : value);
		});
		if (supplierProformaFile) {
			data.append('proforma_fournisseur_file', supplierProformaFile);
		}
		try {
			await reviewSupplierProforma({
				id,
				action: getProformaReviewAction(proformaDecision),
				data,
			}).unwrap();
			onSuccess(t.logistique.proformaReviewSuccess);
			setShowProformaReviewModal(false);
			setSupplierProformaFile(null);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.proformaReviewError));
		}
	};

	const handleStartPayment = async (installment: LogistiquePaymentInstallment) => {
		try {
			await startPayment({ id, echeance_id: installment.id }).unwrap();
			onSuccess(t.logistique.startPaymentSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.startPaymentError));
		}
	};

	const openPaymentExecution = (installment: LogistiquePaymentInstallment) => {
		setSelectedInstallment(installment);
		setPaymentData({
			date_paiement: '',
			montant_paiement: String(installment.montant_prevu),
			devise_paiement: installment.devise,
			banque_paiement: order?.banque_paiement || order?.banque || '',
			reference_paiement: '',
			methode_paiement: order?.methode_paiement ?? '',
			commentaire_paiement: '',
		});
		setShowExecutionModal(true);
	};

	const handleRecordPaymentExecution = async () => {
		if (!hasCompletePaymentData || !selectedInstallment) return;
		try {
			await recordPaymentExecution({
				id,
				data: {
					echeance_id: selectedInstallment.id,
					date_paiement: paymentData.date_paiement,
					montant_paye: paymentData.montant_paiement,
					devise_paiement: paymentData.devise_paiement,
					banque_paiement: paymentData.banque_paiement,
					reference_paiement: paymentData.reference_paiement,
					methode_paiement: paymentData.methode_paiement,
					commentaire_paiement: paymentData.commentaire_paiement,
				},
			}).unwrap();
			onSuccess(t.logistique.executionSuccess);
			setShowExecutionModal(false);
			setSelectedInstallment(null);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.executionError));
		}
	};

	const openPaymentValidation = (installment: LogistiquePaymentInstallment) => {
		setSelectedInstallment(installment);
		setSwiftProofFile(null);
		setShowValidateModal(true);
	};

	const handleValidatePayment = async () => {
		if (!selectedInstallment || !swiftProofFile) return;
		try {
			const data = new FormData();
			data.append('echeance_id', String(selectedInstallment.id));
			data.append('swift_file', swiftProofFile);
			await validatePayment({ id, data }).unwrap();
			onSuccess(t.logistique.validateSuccess);
			setShowValidateModal(false);
			setSelectedInstallment(null);
			setSwiftProofFile(null);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.validateError));
		}
	};

	const handleRejectPayment = async () => {
		try {
			await rejectPayment({ id, data: { note: rejectNote } }).unwrap();
			onSuccess(t.logistique.rejectSuccess);
			setShowRejectModal(false);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.rejectError));
		}
	};

	const handleProofEmailStatus = async (installment: LogistiquePaymentInstallment, emailSent: boolean) => {
		try {
			await setProofEmailStatus({ id, echeance_id: installment.id, email_envoye: emailSent }).unwrap();
			onSuccess(t.logistique.swiftSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.swiftError));
		}
	};

	const handleAddProcessNote = async () => {
		if (!processRemark.trim()) return;
		const data = new FormData();
		data.append('remarque', processRemark.trim());
		if (processFile) data.append('fichier', processFile);
		try {
			await addProcessNote({ id, data }).unwrap();
			setProcessRemark('');
			setProcessFile(null);
			onSuccess('Remarque ajoutée.');
		} catch (err) {
			onError(extractApiErrorMessage(err, "Erreur lors de l'ajout de la remarque."));
		}
	};

	const handleConfirmReceipt = async (installment: LogistiquePaymentInstallment) => {
		try {
			await confirmPaymentReceipt({ id, echeance_id: installment.id }).unwrap();
			onSuccess(t.logistique.confirmReceiptSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.confirmReceiptError));
		}
	};
	const events = order?.events ?? [];

	return (
		<LocalizationProvider
			dateAdapter={AdapterDateFns}
			adapterLocale={fr}
			localeText={(language === 'en' ? enUS : frFR).components.MuiLocalizationProvider.defaultProps.localeText}
		>
			<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '32px' }}>
				<NavigationBar title={t.logistique.detailsTitle}>
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack
							direction={isMobile ? 'column' : 'row'}
							spacing={2}
							sx={{ justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center' }}
						>
							<Button
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(listReturnUrl(`${LOGISTIQUE_LIST}?company_id=${company_id}`))}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								{t.logistique.backToList}
							</Button>
							{!isLoading && !error && canRead && (
								<Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
									{viewingCurrentStep &&
										selectedStep === 6 &&
										role === 'Logistique' &&
										company?.stock_management_enabled === true &&
										order?.statut_commande_lancement === 'Terminée' &&
										order.statut_global !== 'Annulé' &&
										!['Réception locale', 'Livraison client', 'Clôture', 'Annulé'].includes(order.statut) && (
											<PrimaryLoadingButton
												buttonText="Réceptionner le stock"
												size="small"
												loading={false}
												active
												inverted
												startIcon={<InventoryIcon />}
												onClick={() => router.push(`${STOCK_RECEIPTS}?company_id=${company_id}`)}
											/>
										)}
									{(canManage || (isOrderResponsible && order?.statut_paiement === 'Non demandé')) &&
										!isOrderCancelled && (
											<PrimaryLoadingButton
												buttonText={t.common.edit}
												size="small"
												loading={false}
												active
												inverted
												startIcon={<EditIcon />}
												onClick={() => router.push(`${LOGISTIQUE_EDIT(id, company_id)}&etape=${stepKey}`)}
											/>
										)}
									{canChangeGlobalStatus && order && !isOrderCancelled && (
										<PrimaryLoadingButton
											buttonText={t.logistique.cancelOrder}
											size="small"
											loading={false}
											active
											inverted
											color="error"
											startIcon={<CloseIcon />}
											onClick={() => setPendingGlobalStatus('Annulé')}
										/>
									)}
									{canChangeGlobalStatus && order && isOrderCancelled && (
										<PrimaryLoadingButton
											buttonText={t.logistique.reopenOrder}
											size="small"
											loading={false}
											active
											inverted
											color="warning"
											startIcon={<HistoryIcon />}
											onClick={() => setPendingGlobalStatus('Rouvert')}
										/>
									)}
									{canDelete && (
										<PrimaryLoadingButton
											buttonText={t.common.delete}
											size="small"
											loading={false}
											active
											inverted
											color="error"
											startIcon={<DeleteIcon />}
											onClick={() => setShowDeleteModal(true)}
										/>
									)}
								</Stack>
							)}
						</Stack>

						{isCompaniesLoading || isLoading ? (
							<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
						) : !canRead ? (
							<NoPermission />
						) : (axiosError?.status as number) > 400 ? (
							<ApiAlert errorDetails={axiosError?.data.details} />
						) : (
							<Stack spacing={3}>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: isMobile ? '1fr' : { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
										gap: 2,
									}}
								>
									<DashboardStatCard
										icon={<ReceiptLongIcon />}
										label={t.logistique.colNumero}
										value={order?.numero_commande ?? '-'}
										color="#1565C0"
									/>
									<DashboardStatCard
										icon={<BusinessIcon />}
										label={t.logistique.colFournisseur}
										value={order?.fournisseur || '-'}
										color="#6A1B9A"
									/>
									<DashboardStatCard
										icon={<PaymentIcon />}
										label={t.logistique.colPaiement}
										value={order?.statut_paiement ?? '-'}
										color={order?.statut_paiement === 'Validé' ? '#2E7D32' : '#ED6C02'}
										valueColor={order?.statut_paiement === 'Validé' ? 'success.main' : 'text.primary'}
									/>
									<DashboardStatCard
										icon={<LocalShippingIcon />}
										label={t.logistique.colCoutTotal}
										value={formatMoney(order?.cout_total, order?.devise)}
										color="#00897B"
										valueColor="primary.main"
									/>
								</Box>

								<Alert severity="info">
									Ce dossier conserve le suivi utilisé lors de sa création. Ses opérations déjà enregistrées restent
									consultables.
								</Alert>

								{order && (
									<SupplierPurchaseSteps
										order={
											order.workflow?.etapes?.length
												? order
												: {
														...order,
														workflow: {
															etape_courante: [
																'dossier',
																'proforma',
																'paiement',
																'production',
																'expedition',
																'transit',
																'reception',
																'couts',
															][activeWorkflowIndex],
															etapes: workflowSteps.map((label, index) => ({
																key: [
																	'dossier',
																	'proforma',
																	'paiement',
																	'production',
																	'expedition',
																	'transit',
																	'reception',
																	'couts',
																][index],
																label,
																completed: index < activeWorkflowIndex,
																accessible: index <= activeWorkflowIndex,
															})),
														},
													}
										}
										selected={stepKey}
										userId={currentUserId}
										canManage={hasManagerRole && !isOrderCancelled}
										canReview={company?.role === 'Caissier'}
										busy={correctionBusy}
										onSelect={(key) =>
											setChosenStep(
												[
													'dossier',
													'proforma',
													'paiement',
													'production',
													'expedition',
													'transit',
													'reception',
													'couts',
												].indexOf(key),
											)
										}
										onAction={async (data) => {
											try {
												await purchase({ id, data }).unwrap();
												onSuccess('Demande enregistrée.');
												return true;
											} catch (error) {
												onError(extractApiErrorMessage(error, 'Impossible de traiter la demande.'));
												return false;
											}
										}}
										onEdit={(step, approval) =>
											router.push(
												`${LOGISTIQUE_EDIT(id, company_id)}&etape=${step}&${approval ? `correction_id=${approval}` : 'proposer=1'}`,
											)
										}
									/>
								)}

								<LogistiqueHistoricalDetails
									workflowSteps={workflowSteps}
									selectedStep={selectedStep}
									t={t}
									order={order}
									sourceOrderDates={sourceOrderDates}
									canManage={canManage}
									isOrderCancelled={isOrderCancelled}
									setLaunchStatusDraft={setLaunchStatusDraft}
									setShowLaunchStatusModal={setShowLaunchStatusModal}
									isRecordingProformaRequest={isRecordingProformaRequest}
									setShowProformaRequestModal={setShowProformaRequestModal}
									targetQuantity={targetQuantity}
									targetPriceLines={targetPriceLines}
									isReviewingSupplierProforma={isReviewingSupplierProforma}
									openSupplierProformaReview={openSupplierProformaReview}
									documentLabels={documentLabels}
									isOrderResponsible={isOrderResponsible}
									isRetryingPaymentEmail={isRetryingPaymentEmail}
									handleRetryPaymentEmail={handleRetryPaymentEmail}
									openPaymentRequest={openPaymentRequest}
									hasCompleteImportTitle={hasCompleteImportTitle}
									canProcessAssignedPayment={canProcessAssignedPayment}
									handleStartPayment={handleStartPayment}
									openPaymentExecution={openPaymentExecution}
									openPaymentValidation={openPaymentValidation}
									isUpdatingProofEmail={isUpdatingProofEmail}
									handleProofEmailStatus={handleProofEmailStatus}
									handleConfirmReceipt={handleConfirmReceipt}
									setShowRejectModal={setShowRejectModal}
									canStartSupplierPreparation={canStartSupplierPreparation}
									isChangingWorkflowStatus={isChangingWorkflowStatus}
									handleStartSupplierPreparation={handleStartSupplierPreparation}
									company_id={company_id}
									events={events}
									processRemark={processRemark}
									setProcessRemark={setProcessRemark}
									processFile={processFile}
									processFileInputRef={processFileInputRef}
									setProcessFile={setProcessFile}
									isAddingProcessNote={isAddingProcessNote}
									handleAddProcessNote={handleAddProcessNote}
								/>
							</Stack>
						)}
					</Stack>

					{showDeleteModal && (
						<ActionModals
							title={t.logistique.deleteModalTitle}
							titleIcon={<DeleteIcon />}
							titleIconColor="#D32F2F"
							body={t.logistique.deleteModalBody}
							actions={[
								{
									text: t.common.cancel,
									active: false,
									onClick: () => setShowDeleteModal(false),
									icon: <CloseIcon />,
									color: '#6B6B6B',
								},
								{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
							]}
						/>
					)}
					{pendingGlobalStatus && (
						<ActionModals
							title={
								pendingGlobalStatus === 'Annulé'
									? t.logistique.cancelOrderModalTitle
									: t.logistique.reopenOrderModalTitle
							}
							titleIcon={pendingGlobalStatus === 'Annulé' ? <CloseIcon /> : <HistoryIcon />}
							titleIconColor={pendingGlobalStatus === 'Annulé' ? '#D32F2F' : '#ED6C02'}
							body={
								pendingGlobalStatus === 'Annulé' ? t.logistique.cancelOrderModalBody : t.logistique.reopenOrderModalBody
							}
							actions={[
								{
									text: t.common.cancel,
									active: false,
									onClick: () => setPendingGlobalStatus(null),
									icon: <CloseIcon />,
									color: '#6B6B6B',
								},
								{
									text: pendingGlobalStatus === 'Annulé' ? t.logistique.cancelOrder : t.logistique.reopenOrder,
									active: true,
									onClick: handleGlobalStatusChange,
									icon: pendingGlobalStatus === 'Annulé' ? <CloseIcon /> : <HistoryIcon />,
									color: pendingGlobalStatus === 'Annulé' ? '#D32F2F' : '#ED6C02',
									disabled: isChangingGlobalStatus,
								},
							]}
						/>
					)}
					{showLaunchStatusModal && (
						<LogistiqueHistoricalLaunchStatusDialog
							t={t}
							setShowLaunchStatusModal={setShowLaunchStatusModal}
							handleLaunchStatusChange={handleLaunchStatusChange}
							isChangingLaunchStatus={isChangingLaunchStatus}
							launchStatusDraft={launchStatusDraft}
							setLaunchStatusDraft={setLaunchStatusDraft}
						/>
					)}
					{showProformaRequestModal && (
						<LogistiqueHistoricalProformaRequestDialog
							t={t}
							setShowProformaRequestModal={setShowProformaRequestModal}
							nextProformaFollowUp={nextProformaFollowUp}
							handleRecordProformaRequest={handleRecordProformaRequest}
							isRecordingProformaRequest={isRecordingProformaRequest}
							setNextProformaFollowUp={setNextProformaFollowUp}
						/>
					)}
					{showProformaReviewModal && (
						<LogistiqueHistoricalProformaReviewDialog
							t={t}
							setShowProformaReviewModal={setShowProformaReviewModal}
							handleSupplierProformaReview={handleSupplierProformaReview}
							hasRequiredProformaData={hasRequiredProformaData}
							isProformaDecisionValid={isProformaDecisionValid}
							isReviewingSupplierProforma={isReviewingSupplierProforma}
							targetQuantity={targetQuantity}
							order={order}
							targetPriceLines={targetPriceLines}
							supplierProformaData={supplierProformaData}
							setSupplierProformaData={setSupplierProformaData}
							proformaDecision={proformaDecision}
							setProformaDecision={setProformaDecision}
							hasProformaVariance={hasProformaVariance}
							supplierProformaFile={supplierProformaFile}
							setSupplierProformaFile={setSupplierProformaFile}
						/>
					)}
					{showRequestPaymentModal && (
						<LogistiqueHistoricalRequestPaymentDialog
							t={t}
							setShowRequestPaymentModal={setShowRequestPaymentModal}
							hasCompleteImportTitle={hasCompleteImportTitle}
							hasCompletePaymentSchedule={hasCompletePaymentSchedule}
							handleRequestPayment={handleRequestPayment}
							paymentSchedule={paymentSchedule}
							setPaymentSchedule={setPaymentSchedule}
							scheduledPercentage={scheduledPercentage}
						/>
					)}
					{showExecutionModal && (
						<LogistiqueHistoricalPaymentExecutionDialog
							t={t}
							setShowExecutionModal={setShowExecutionModal}
							setSelectedInstallment={setSelectedInstallment}
							hasCompletePaymentData={hasCompletePaymentData}
							handleRecordPaymentExecution={handleRecordPaymentExecution}
							paymentData={paymentData}
							setPaymentData={setPaymentData}
						/>
					)}
					{showValidateModal && (
						<LogistiqueHistoricalPaymentValidationDialog
							t={t}
							setShowValidateModal={setShowValidateModal}
							setSelectedInstallment={setSelectedInstallment}
							setSwiftProofFile={setSwiftProofFile}
							swiftProofFile={swiftProofFile}
							handleValidatePayment={handleValidatePayment}
							swiftProofInputRef={swiftProofInputRef}
						/>
					)}
					{showRejectModal && (
						<LogistiqueHistoricalPaymentRejectionDialog
							t={t}
							setShowRejectModal={setShowRejectModal}
							handleRejectPayment={handleRejectPayment}
							rejectNote={rejectNote}
							setRejectNote={setRejectNote}
						/>
					)}
				</NavigationBar>
			</Stack>
		</LocalizationProvider>
	);
};

export default LogistiqueViewClient;
