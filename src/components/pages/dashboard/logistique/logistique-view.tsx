'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	Chip,
	Divider,
	Alert,
	FormControlLabel,
	InputAdornment,
	Link as MuiLink,
	Stack,
	Step,
	StepLabel,
	Stepper,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import {
	ArrowBack as ArrowBackIcon,
	Add as AddIcon,
	AssignmentTurnedIn as AssignmentTurnedInIcon,
	Business as BusinessIcon,
	CalendarToday as CalendarTodayIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	History as HistoryIcon,
	Info as InfoIcon,
	Inventory as InventoryIcon,
	LocalShipping as LocalShippingIcon,
	Notes as NotesIcon,
	OpenInNew as OpenInNewIcon,
	Payment as PaymentIcon,
	Person as PersonIcon,
	Public as PublicIcon,
	ReceiptLong as ReceiptLongIcon,
	RequestQuote as RequestQuoteIcon,
	Scale as ScaleIcon,
	Send as SendIcon,
	UploadFile as UploadFileIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NoPermission from '@/components/shared/noPermission/noPermission';
import {
	LogistiqueDocumentsFormCard,
	LogistiqueDocumentsViewCard,
} from '@/components/pages/dashboard/logistique/logistique-documents-card';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import FormattedNumberInput from '@/components/formikElements/formattedNumberInput/formattedNumberInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getInitStateToken, getUserCompaniesState } from '@/store/selectors';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage, formatDate, formatLocalDate, formatNumberWithSpaces } from '@/utils/helpers';
import {
	getTranslatedLogistiqueMacroSteps,
	logistiqueCurrencyItemsList,
	logistiqueLaunchStatusItemsList,
	logistiqueLegacyStatusStepIndex,
	logistiquePaymentMethodItemsList,
	logistiqueProformaStatusItemsList,
} from '@/utils/rawData';
import { textInputTheme } from '@/utils/themes';
import {
	useDeleteLogistiqueMutation,
	useConfirmLogistiquePaymentReceiptMutation,
	useGetLogistiqueQuery,
	usePatchLogistiqueLaunchStatusMutation,
	usePatchLogistiqueStatutMutation,
	useRejectLogistiquePaymentMutation,
	useRecordLogistiqueProformaRequestMutation,
	useRecordLogistiquePaymentExecutionMutation,
	useRequestLogistiquePaymentMutation,
	useRetryLogistiquePaymentEmailMutation,
	useReviewLogistiqueSupplierProformaMutation,
	useSendLogistiqueSwiftMutation,
	useStartLogistiquePaymentMutation,
	useValidateLogistiquePaymentMutation,
} from '@/store/services/logistique';
import { ARTICLES_VIEW, FACTURE_PRO_FORMA_VIEW, LOGISTIQUE_EDIT, LOGISTIQUE_LIST } from '@/utils/routes';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type {
	LogistiqueDocumentField,
	LogistiqueEmailDeliveryStatus,
	LogistiqueLaunchStatus,
	LogistiquePaymentMethod,
	LogistiquePaymentInstallment,
	LogistiquePaymentStatus,
	LogistiqueProformaStatus,
	LogistiqueStatut,
	LogistiqueSupplierProformaReviewAction,
} from '@/types/logistiqueTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import { useLogistiqueEmailPolling } from './use-logistique-email-polling';

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

type InfoRowProps = {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
};

type DetailCardProps = {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
};

const inputTheme = textInputTheme();
const managerRoles = new Set(['Caissier', 'Commercial', 'Logistique']);
const documentFields: LogistiqueDocumentField[] = [
	'titre_importation_file',
	'proforma_fournisseur_file',
	'justificatifs_file',
	'swift_file',
	'documents_originaux_file',
];
const acceptedDocumentTypes = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
const proformaDecisionItems = logistiqueProformaStatusItemsList.filter(
	(status): status is Exclude<LogistiqueProformaStatus, 'En attente'> => status !== 'En attente',
);
const proformaActionByStatus: Record<
	Exclude<LogistiqueProformaStatus, 'En attente'>,
	LogistiqueSupplierProformaReviewAction
> = {
	'En contrôle': 'control',
	'Correction demandée': 'request_correction',
	Validée: 'validate',
	Refusée: 'reject',
};

const paymentColor = (status: LogistiquePaymentStatus) => {
	if (status === 'Validé') return 'success' as const;
	if (status === 'En attente') return 'warning' as const;
	return 'default' as const;
};

const emailDeliveryColor = (status: LogistiqueEmailDeliveryStatus) => {
	if (status === 'Envoyé') return 'success' as const;
	if (status === 'Échec') return 'error' as const;
	if (status === 'En attente' || status === 'Envoi en cours') return 'warning' as const;
	return 'default' as const;
};

const formatMoney = (value: string | number | null | undefined, devise = 'MAD') =>
	`${formatNumberWithSpaces(value ?? 0, 2)} ${devise}`;

const formatDateOnly = (value: string | null | undefined) => {
	if (!value) return '-';
	const [datePart] = value.split('T');
	const [year, month, day] = datePart.split('-').map(Number);
	if (!year || !month || !day) return formatDate(value);
	return new Intl.DateTimeFormat('fr-FR', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
	}).format(new Date(year, month - 1, day));
};

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const displayValue =
		isValidElement(value) || (value !== null && value !== undefined && value.toString().length > 0) ? value : '-';

	return (
		<Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', py: 1.5, flexWrap: 'nowrap', minWidth: 0 }}>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', width: 40, flexShrink: 0 }}>{icon}</Box>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={{ xs: 0.5, sm: 2 }}
				sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, flex: 1, minWidth: 0 }}
			>
				<Typography
					sx={{
						fontWeight: 600,
						color: 'text.secondary',
						width: { xs: '100%', sm: 220 },
						flexShrink: 0,
						wordBreak: 'break-word',
					}}
				>
					{label}
				</Typography>
				<Box sx={{ width: { xs: '100%', sm: 'auto' }, flex: { xs: 'none', sm: 1 }, minWidth: 0 }}>
					{isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary', overflowWrap: 'break-word', wordBreak: 'normal' }}>
							{displayValue}
						</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

const DetailCard: React.FC<DetailCardProps> = ({ title, icon, children }) => (
	<Card elevation={2} sx={{ borderRadius: 2 }}>
		<CardContent sx={{ p: 3 }}>
			<Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
				{icon}
				<Typography variant="h6" sx={{ fontWeight: 700 }}>
					{title}
				</Typography>
			</Stack>
			<Divider sx={{ my: 2 }} />
			{children}
		</CardContent>
	</Card>
);

const LogistiqueViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const isCompactWorkflow = useMediaQuery(theme.breakpoints.down('md'));
	const companiesState = useAppSelector(getUserCompaniesState);
	const currentUserId = useAppSelector(getInitStateToken).user.pk;
	const { data: companiesData, isLoading: isCompaniesLoading } = useGetUserCompaniesQuery(undefined, { skip: !token });
	const companies = companiesData ?? companiesState;
	const company = useMemo(() => companies?.find((item) => item.id === company_id), [companies, company_id]);
	const role = company?.role ?? '';
	const canRead = Boolean(company);
	const canManage = managerRoles.has(role);
	const isAccountingUser = role === 'Comptable';
	const canChangeGlobalStatus = company?.can_change_document_status === true;
	const canDelete = role === 'Caissier';

	const { data: order, isLoading, error, refetch } = useGetLogistiqueQuery({ id }, { skip: !token });
	useLogistiqueEmailPolling(order, Boolean(token), refetch);
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const [deleteLogistique] = useDeleteLogistiqueMutation();
	const [patchGlobalStatus, { isLoading: isChangingGlobalStatus }] = usePatchLogistiqueStatutMutation();
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
	const [sendSwift, { isLoading: isSendingProofEmail }] = useSendLogistiqueSwiftMutation();
	const [confirmPaymentReceipt] = useConfirmLogistiquePaymentReceiptMutation();
	const { t } = useLanguage();
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
		devise_proforma_fournisseur: 'MAD',
		incoterm: '',
		conditions_paiement: '',
		delai_proforma_jours: '',
		ecart_prix_proforma: false,
		ecart_quantite_proforma: false,
		notes_ecarts_proforma: '',
	});
	const [swiftProofFile, setSwiftProofFile] = useState<File | null>(null);
	const [selectedInstallment, setSelectedInstallment] = useState<LogistiquePaymentInstallment | null>(null);
	const [paymentSchedule, setPaymentSchedule] = useState([{ date_echeance: '', montant_prevu: '', devise: 'MAD' }]);
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
	const documentLabels = useMemo<Record<LogistiqueDocumentField, string>>(
		() => ({
			titre_importation_file: t.logistique.fieldTitreImportationFile,
			proforma_fournisseur_file: t.logistique.fieldProformaFournisseurFile,
			justificatifs_file: t.logistique.fieldJustificatifsFile,
			swift_file: t.logistique.fieldSwiftFile,
			documents_originaux_file: t.logistique.fieldDocumentsOriginauxFile,
		}),
		[t],
	);
	const workflowSteps = useMemo(() => getTranslatedLogistiqueMacroSteps(t), [t]);
	const activeWorkflowIndex = !order?.is_launch_step_complete
		? 0
		: !order.is_proforma_step_complete
			? 1
			: (logistiqueLegacyStatusStepIndex[order.statut] ?? 2);
	const isOrderCancelled = order?.statut_global === 'Annulé';
	const isOrderResponsible = Boolean(currentUserId && order?.responsable === currentUserId);
	const canProcessAssignedPayment = Boolean(
		isAccountingUser && currentUserId && order?.paiement_assigne_a === currentUserId,
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
	const scheduledAmount = paymentSchedule.reduce((total, item) => total + Number(item.montant_prevu || 0), 0);
	const hasCompletePaymentSchedule = Boolean(
		paymentSchedule.length &&
		paymentSchedule.every(
			(item) => item.date_echeance && Number(item.montant_prevu) > 0 && item.devise === order?.devise_titre_importation,
		) &&
		Math.abs(scheduledAmount - Number(order?.montant_titre_importation || 0)) < 0.005,
	);
	const hasCompletePaymentData = Boolean(
		selectedInstallment &&
		paymentData.date_paiement &&
		Number(paymentData.montant_paiement) > 0 &&
		paymentData.devise_paiement &&
		paymentData.banque_paiement.trim() &&
		paymentData.reference_paiement.trim() &&
		paymentData.methode_paiement,
	);
	const targetQuantity = useMemo(
		() => order?.lignes?.reduce((total, line) => total + Number(line.quantity || 0), 0) ?? 0,
		[order?.lignes],
	);
	const sourceOrderDates = useMemo(
		() =>
			(order?.proformas_detail ?? [])
				.map((proforma) => formatDateOnly(proforma.date_facture))
				.filter((date) => date !== '-')
				.join(', ') || '-',
		[order?.proformas_detail],
	);
	const targetPriceLines = useMemo(
		() =>
			order?.lignes?.map((line) => (
				<Typography key={line.id} variant="body2" sx={{ overflowWrap: 'anywhere' }}>
					{line.article_reference || line.designation || `#${line.article}`}: {formatNumberWithSpaces(line.quantity, 3)}{' '}
					× {formatMoney(line.prix_achat, line.devise_prix_achat)} ={' '}
					{formatMoney(line.total_achat, line.devise_prix_achat)}
				</Typography>
			)) ?? [],
		[order?.lignes],
	);
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
	const hasProformaVariance = supplierProformaData.ecart_prix_proforma || supplierProformaData.ecart_quantite_proforma;
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
				: order.devise || 'MAD',
			incoterm: order.incoterm ?? '',
			conditions_paiement: order.conditions_paiement ?? '',
			delai_proforma_jours: order.delai_proforma_jours === null ? '' : String(order.delai_proforma_jours),
			ecart_prix_proforma: order.ecart_prix_proforma,
			ecart_quantite_proforma: order.ecart_quantite_proforma,
			notes_ecarts_proforma: order.notes_ecarts_proforma ?? '',
		});
		setProformaDecision(
			order.statut_proforma_conformite === 'En attente' ? 'En contrôle' : order.statut_proforma_conformite,
		);
		setSupplierProformaFile(null);
		setShowProformaReviewModal(true);
	};

	const handleDelete = async () => {
		try {
			await deleteLogistique({ id }).unwrap();
			onSuccess(t.logistique.deleteSuccess);
			router.push(LOGISTIQUE_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.deleteError));
		} finally {
			setShowDeleteModal(false);
		}
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
				montant_prevu: Number(order?.montant_titre_importation) > 0 ? String(order?.montant_titre_importation) : '',
				devise: order?.devise_titre_importation || order?.devise || 'MAD',
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
				action: proformaActionByStatus[proformaDecision],
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

	const handleSendSwift = async (installment: LogistiquePaymentInstallment) => {
		try {
			await sendSwift({ id, echeance_id: installment.id }).unwrap();
			onSuccess(t.logistique.swiftSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.swiftError));
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

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
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
								onClick={() => router.push(LOGISTIQUE_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								{t.logistique.backToList}
							</Button>
							{!isLoading && !error && canRead && (
								<Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
									{(canManage || (isOrderResponsible && order?.statut_paiement === 'Non demandé')) &&
										!isOrderCancelled && (
											<Button
												variant="outlined"
												size="small"
												startIcon={<EditIcon />}
												onClick={() => router.push(LOGISTIQUE_EDIT(id, company_id))}
											>
												{t.common.edit}
											</Button>
										)}
									{canChangeGlobalStatus && order && !isOrderCancelled && (
										<Button
											variant="outlined"
											color="error"
											size="small"
											startIcon={<CloseIcon />}
											onClick={() => setPendingGlobalStatus('Annulé')}
										>
											{t.logistique.cancelOrder}
										</Button>
									)}
									{canChangeGlobalStatus && order && isOrderCancelled && (
										<Button
											variant="outlined"
											color="warning"
											size="small"
											startIcon={<HistoryIcon />}
											onClick={() => setPendingGlobalStatus('Rouvert')}
										>
											{t.logistique.reopenOrder}
										</Button>
									)}
									{canDelete && (
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
								<Card elevation={3} sx={{ borderRadius: 2, bgcolor: 'primary.50' }}>
									<CardContent sx={{ p: 3 }}>
										<Grid
											container
											spacing={2.5}
											sx={{ alignItems: 'stretch', justifyContent: isMobile ? 'center' : 'space-between' }}
										>
											<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
												<Box
													sx={{
														textAlign: 'center',
														px: 2,
														py: 1.5,
														minHeight: 96,
														display: 'flex',
														flexDirection: 'column',
														justifyContent: 'center',
													}}
												>
													<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
														{t.logistique.colNumero.toUpperCase()}
													</Typography>
													<Typography variant="h6" sx={{ fontWeight: 800, overflowWrap: 'anywhere', lineHeight: 1.25 }}>
														{order?.numero_commande ?? '-'}
													</Typography>
												</Box>
											</Grid>
											<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
												<Box
													sx={{
														textAlign: 'center',
														px: 2,
														py: 1.5,
														minHeight: 96,
														display: 'flex',
														flexDirection: 'column',
														justifyContent: 'center',
													}}
												>
													<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
														{t.logistique.colFournisseur.toUpperCase()}
													</Typography>
													<Typography variant="h6" sx={{ fontWeight: 800, overflowWrap: 'anywhere', lineHeight: 1.25 }}>
														{order?.fournisseur || '-'}
													</Typography>
												</Box>
											</Grid>
											<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
												<Box
													sx={{
														textAlign: 'center',
														px: 2,
														py: 1.5,
														minHeight: 96,
														display: 'flex',
														flexDirection: 'column',
														justifyContent: 'center',
														alignItems: 'center',
													}}
												>
													<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
														{t.logistique.colPaiement.toUpperCase()}
													</Typography>
													{order?.statut_paiement ? (
														<Chip
															label={order.statut_paiement}
															color={paymentColor(order.statut_paiement)}
															variant="outlined"
															sx={{ maxWidth: '100%' }}
														/>
													) : (
														<Typography>-</Typography>
													)}
												</Box>
											</Grid>
											<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
												<Box
													sx={{
														textAlign: 'center',
														px: 2,
														py: 1.5,
														minHeight: 96,
														display: 'flex',
														flexDirection: 'column',
														justifyContent: 'center',
													}}
												>
													<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
														{t.logistique.colCoutTotal.toUpperCase()}
													</Typography>
													<Typography
														variant="h5"
														color="primary"
														sx={{ fontWeight: 900, overflowWrap: 'anywhere', lineHeight: 1.2 }}
													>
														{formatMoney(order?.cout_total, order?.devise)}
													</Typography>
												</Box>
											</Grid>
										</Grid>
									</CardContent>
								</Card>

								<DetailCard title={t.logistique.fieldGlobalStatus} icon={<InfoIcon color="primary" />}>
									<Stack spacing={3}>
										<Box sx={{ minWidth: 0, pb: 1 }}>
											<Stepper
												activeStep={activeWorkflowIndex}
												alternativeLabel={!isCompactWorkflow}
												orientation={isCompactWorkflow ? 'vertical' : 'horizontal'}
												sx={{ minWidth: 0 }}
											>
												{workflowSteps.map((step, index) => (
													<Step key={step} completed={index < activeWorkflowIndex}>
														<StepLabel>{step}</StepLabel>
													</Step>
												))}
											</Stepper>
										</Box>
										<Chip
											label={order?.statut_global ?? '-'}
											size="medium"
											color="info"
											variant="outlined"
											sx={{
												fontSize: '1rem',
												py: 2,
												justifySelf: { xs: 'stretch', md: 'start' },
												maxWidth: '100%',
												'& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
											}}
										/>
									</Stack>
								</DetailCard>

								<DetailCard title={t.logistique.commandLaunchSection} icon={<RequestQuoteIcon color="primary" />}>
									<Stack spacing={2.5}>
										<Alert severity={order?.is_launch_step_complete ? 'success' : 'info'}>
											{order?.is_launch_step_complete
												? t.logistique.commandLaunchMilestone
												: t.logistique.commandLaunchObjective}
										</Alert>
										<Grid container spacing={2}>
											<Grid size={{ xs: 12, lg: 6 }}>
												<InfoRow
													icon={<InfoIcon />}
													label={t.logistique.fieldStepStatus}
													value={order?.statut_commande_lancement}
												/>
												<InfoRow
													icon={<ReceiptLongIcon />}
													label={t.logistique.fieldClientOrder}
													value={order?.projects_display}
												/>
												<InfoRow
													icon={<CalendarTodayIcon />}
													label={t.logistique.fieldOrderDate}
													value={sourceOrderDates}
												/>
												<InfoRow
													icon={<BusinessIcon />}
													label={t.logistique.colClients}
													value={order?.clients_display}
												/>
												<InfoRow
													icon={<AssignmentTurnedInIcon />}
													label={t.logistique.colFournisseur}
													value={order?.fournisseur}
												/>
												<InfoRow
													icon={<EmailIcon />}
													label={t.logistique.fieldSupplierEmail}
													value={order?.fournisseur_email}
												/>
												<InfoRow
													icon={<InventoryIcon />}
													label={t.logistique.fieldArticlesCount}
													value={order?.lignes_count}
												/>
											</Grid>
											<Grid size={{ xs: 12, lg: 6 }}>
												<InfoRow
													icon={<PersonIcon />}
													label={t.logistique.fieldResponsable}
													value={order?.responsable_name}
												/>
												<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldDevise} value={order?.devise} />
												<InfoRow
													icon={<CalendarTodayIcon />}
													label={t.logistique.fieldTargetDate}
													value={formatDateOnly(order?.date_prevue)}
												/>
												<InfoRow
													icon={<SendIcon />}
													label={t.logistique.fieldProformaRequestedAt}
													value={formatDate(order?.proforma_demandee_le ?? null)}
												/>
												<InfoRow
													icon={<PersonIcon />}
													label={t.logistique.fieldProformaRequestedBy}
													value={order?.proforma_demandee_par_name}
												/>
												<InfoRow
													icon={<CalendarTodayIcon />}
													label={t.logistique.fieldNextProformaFollowUp}
													value={formatDateOnly(order?.prochaine_relance_proforma)}
												/>
											</Grid>
										</Grid>
										{canManage && !isOrderCancelled && !order?.is_launch_step_complete && (
											<Stack
												direction={{ xs: 'column', sm: 'row' }}
												sx={{
													gap: 1.5,
													alignItems: { sm: 'center' },
													'& > button': { margin: '0 !important' },
												}}
											>
												<PrimaryLoadingButton
													buttonText={t.logistique.updateLaunchStatus}
													active
													loading={false}
													type="button"
													startIcon={<EditIcon />}
													onClick={() => {
														setLaunchStatusDraft(order?.statut_commande_lancement ?? 'À lancer');
														setShowLaunchStatusModal(true);
													}}
													cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
													inverted
												/>
												<PrimaryLoadingButton
													buttonText={t.logistique.recordProformaRequest}
													active={!isRecordingProformaRequest}
													loading={isRecordingProformaRequest}
													type="button"
													startIcon={<RequestQuoteIcon />}
													onClick={() => setShowProformaRequestModal(true)}
													cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
												/>
											</Stack>
										)}
									</Stack>
								</DetailCard>

								<DetailCard title={t.logistique.proformaComplianceSection} icon={<DescriptionIcon color="primary" />}>
									<Stack spacing={2.5}>
										<Alert
											severity={
												!order?.is_launch_step_complete
													? 'info'
													: order?.is_proforma_step_complete
														? 'success'
														: 'warning'
											}
										>
											{!order?.is_launch_step_complete
												? t.logistique.proformaComplianceLocked
												: order?.is_proforma_step_complete
													? t.logistique.proformaComplianceMilestone
													: t.logistique.proformaComplianceObjective}
										</Alert>
										<Grid container spacing={2}>
											<Grid size={{ xs: 12, lg: 6 }}>
												<InfoRow
													icon={<InfoIcon />}
													label={t.logistique.fieldStepStatus}
													value={
														<Chip
															label={order?.statut_proforma_conformite ?? '-'}
															color={order?.is_proforma_step_complete ? 'success' : 'warning'}
															variant="outlined"
														/>
													}
												/>
												<InfoRow
													icon={<ReceiptLongIcon />}
													label={t.logistique.fieldSupplierProformaNumber}
													value={order?.numero_proforma_fournisseur}
												/>
												<InfoRow
													icon={<CalendarTodayIcon />}
													label={t.logistique.fieldSupplierProformaDate}
													value={formatDateOnly(order?.date_proforma_fournisseur)}
												/>
												<InfoRow
													icon={<PaymentIcon />}
													label={t.logistique.fieldSupplierProformaAmount}
													value={formatMoney(order?.montant_proforma_fournisseur, order?.devise_proforma_fournisseur)}
												/>
												<InfoRow icon={<PublicIcon />} label={t.logistique.fieldIncoterm} value={order?.incoterm} />
												<InfoRow
													icon={<CalendarTodayIcon />}
													label={t.logistique.fieldSupplierLeadTime}
													value={order?.delai_proforma_jours}
												/>
											</Grid>
											<Grid size={{ xs: 12, lg: 6 }}>
												<InfoRow
													icon={<PaymentIcon />}
													label={t.logistique.fieldConditionsPaiement}
													value={order?.conditions_paiement}
												/>
												<InfoRow
													icon={<InventoryIcon />}
													label={t.logistique.fieldTargetQuantity}
													value={formatNumberWithSpaces(targetQuantity, 3)}
												/>
												<InfoRow
													icon={<PaymentIcon />}
													label={t.logistique.fieldTargetPurchaseTotal}
													value={formatMoney(order?.cout_achat, order?.devise)}
												/>
												<InfoRow
													icon={<ReceiptLongIcon />}
													label={t.logistique.fieldTargetUnitPrices}
													value={targetPriceLines.length ? <Stack spacing={0.5}>{targetPriceLines}</Stack> : '-'}
												/>
												<InfoRow
													icon={<WarningIcon />}
													label={t.logistique.fieldPriceVariance}
													value={order?.ecart_prix_proforma ? t.logistique.varianceDetected : t.logistique.noVariance}
												/>
												<InfoRow
													icon={<WarningIcon />}
													label={t.logistique.fieldQuantityVariance}
													value={
														order?.ecart_quantite_proforma ? t.logistique.varianceDetected : t.logistique.noVariance
													}
												/>
												<InfoRow
													icon={<NotesIcon />}
													label={t.logistique.fieldVarianceNotes}
													value={order?.notes_ecarts_proforma}
												/>
												<InfoRow
													icon={<PersonIcon />}
													label={t.logistique.fieldProformaControlledBy}
													value={order?.proforma_controlee_par_name}
												/>
												<InfoRow
													icon={<CheckCircleIcon />}
													label={t.logistique.fieldProformaValidatedAt}
													value={formatDate(order?.proforma_validee_le ?? null)}
												/>
											</Grid>
										</Grid>
										{canManage &&
											!isOrderCancelled &&
											order?.is_launch_step_complete &&
											!order?.is_proforma_step_complete && (
												<Box sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>
													<PrimaryLoadingButton
														buttonText={t.logistique.reviewSupplierProforma}
														active={!isReviewingSupplierProforma}
														loading={isReviewingSupplierProforma}
														type="button"
														startIcon={<DescriptionIcon />}
														onClick={openSupplierProformaReview}
														cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
													/>
												</Box>
											)}
									</Stack>
								</DetailCard>

								<DetailCard title={t.logistique.alertsSection} icon={<WarningIcon color="warning" />}>
									{order?.alerts?.length ? (
										<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
											{order.alerts.map((alert) => (
												<Chip key={alert} icon={<WarningIcon />} label={alert} color="warning" variant="outlined" />
											))}
										</Stack>
									) : (
										<Alert severity="success">{t.logistique.noAlerts}</Alert>
									)}
								</DetailCard>

								<DetailCard title={t.logistique.generalSection} icon={<BusinessIcon color="primary" />}>
									<Grid container spacing={2}>
										<Grid size={{ xs: 12, lg: 6 }}>
											<InfoRow
												icon={<ReceiptLongIcon />}
												label={t.logistique.colNumero}
												value={order?.numero_commande}
											/>
											<InfoRow
												icon={<AssignmentTurnedInIcon />}
												label={t.logistique.colFournisseur}
												value={order?.fournisseur}
											/>
											<InfoRow
												icon={<EmailIcon />}
												label={t.logistique.fieldSupplierEmail}
												value={order?.fournisseur_email}
											/>
											<InfoRow
												icon={<PersonIcon />}
												label={t.logistique.fieldResponsable}
												value={order?.responsable_name}
											/>
											<InfoRow
												icon={<InventoryIcon />}
												label={t.logistique.colProjects}
												value={order?.projects_display}
											/>
											<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldDevise} value={order?.devise} />
											<InfoRow
												icon={<LocalShippingIcon />}
												label={t.logistique.fieldTransport}
												value={order?.transport}
											/>
											<InfoRow icon={<PublicIcon />} label={t.logistique.fieldIncoterm} value={order?.incoterm} />
										</Grid>
										<Grid size={{ xs: 12, lg: 6 }}>
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.logistique.fieldDatePrevue}
												value={formatDateOnly(order?.date_prevue)}
											/>
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.logistique.fieldDateReelle}
												value={formatDateOnly(order?.date_reelle)}
											/>
											<InfoRow
												icon={<PublicIcon />}
												label={t.logistique.fieldOrigine}
												value={order?.origine_marchandise}
											/>
											<InfoRow
												icon={<DescriptionIcon />}
												label={t.logistique.fieldNature}
												value={order?.nature_marchandise}
											/>
											<InfoRow icon={<ScaleIcon />} label={t.logistique.fieldPoidsNet} value={order?.poids_net} />
											<InfoRow icon={<ScaleIcon />} label={t.logistique.fieldPoidsBrut} value={order?.poids_brut} />
											<InfoRow icon={<ScaleIcon />} label={t.logistique.fieldVolume} value={order?.volume} />
										</Grid>
									</Grid>
								</DetailCard>

								<DetailCard title={t.logistique.importSection} icon={<DescriptionIcon color="primary" />}>
									<Grid container spacing={2}>
										<Grid size={{ xs: 12, lg: 6 }}>
											<InfoRow
												icon={<DescriptionIcon />}
												label={t.logistique.fieldNumeroDomiciliation}
												value={order?.numero_domiciliation}
											/>
											<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldBanque} value={order?.banque} />
											<InfoRow
												icon={<PaymentIcon />}
												label={t.logistique.fieldMontantTI}
												value={formatMoney(order?.montant_titre_importation, order?.devise_titre_importation)}
											/>
										</Grid>
										<Grid size={{ xs: 12, lg: 6 }}>
											<InfoRow
												icon={<InfoIcon />}
												label={t.logistique.fieldStatutTI}
												value={order?.statut_titre_importation}
											/>
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.logistique.fieldDateTI}
												value={formatDateOnly(order?.date_titre_importation)}
											/>
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.logistique.fieldDateValidationTI}
												value={formatDateOnly(order?.date_validation_titre_importation)}
											/>
										</Grid>
									</Grid>
								</DetailCard>

								<LogistiqueDocumentsViewCard
									items={documentFields.map((field) => ({
										field,
										label: documentLabels[field],
										currentUrl: order?.[field] ?? null,
									}))}
								/>

								<DetailCard title={t.logistique.paymentSection} icon={<PaymentIcon color="primary" />}>
									<Stack spacing={2.5}>
										{!order?.is_proforma_step_complete && (
											<Alert severity="info">{t.logistique.paymentStepLocked}</Alert>
										)}
										<Grid container spacing={2}>
											<Grid size={{ xs: 12, lg: 6 }}>
												<InfoRow
													icon={<InfoIcon />}
													label={t.logistique.fieldStatutTI}
													value={order?.statut_titre_importation}
												/>
												<InfoRow
													icon={<PaymentIcon />}
													label={t.logistique.fieldPaymentStepStatus}
													value={order?.statut_banque_paiement}
												/>
												<InfoRow
													icon={<PaymentIcon />}
													label={t.logistique.fieldAccountingStatus}
													value={order?.statut_traitement_paiement}
												/>
												<InfoRow
													icon={<EmailIcon />}
													label={t.logistique.paymentEmailStatus}
													value={
														order?.demande_paiement_email_statut ? (
															<Chip
																label={order.demande_paiement_email_statut}
																color={emailDeliveryColor(order.demande_paiement_email_statut)}
																size="small"
																variant="outlined"
															/>
														) : null
													}
												/>
											</Grid>
											<Grid size={{ xs: 12, lg: 6 }}>
												<InfoRow
													icon={<PersonIcon />}
													label={t.logistique.fieldAssignedAccountant}
													value={order?.paiement_assigne_a_name}
												/>
												<InfoRow
													icon={<PaymentIcon />}
													label={t.logistique.fieldMethodePaiement}
													value={order?.methode_paiement}
												/>
												<InfoRow
													icon={<PaymentIcon />}
													label={t.logistique.fieldRemainingBalance}
													value={formatMoney(order?.solde_restant, order?.devise_titre_importation)}
												/>
												<InfoRow
													icon={<EmailIcon />}
													label={t.logistique.paymentEmailRecipients}
													value={order?.demande_paiement_email_destinataires?.join(', ')}
												/>
											</Grid>
										</Grid>
										{order?.demande_paiement_email_relance_disponible && (
											<Alert
												severity={
													order.demande_paiement_email_statut === 'Historique non vérifié' ? 'warning' : 'error'
												}
												action={
													isOrderResponsible && order.statut_paiement === 'En attente' ? (
														<Button color="inherit" disabled={isRetryingPaymentEmail} onClick={handleRetryPaymentEmail}>
															{t.logistique.retryPaymentEmail}
														</Button>
													) : undefined
												}
											>
												{order.demande_paiement_email_statut === 'Historique non vérifié'
													? t.logistique.emailDeliveryUnverified
													: t.logistique.emailDeliveryError}
												{order.demande_paiement_email_erreur ? `: ${order.demande_paiement_email_erreur}` : ''}
											</Alert>
										)}
										{isOrderResponsible && !order?.fournisseur_email && (
											<Alert severity="warning">{t.logistique.supplierEmailRequired}</Alert>
										)}

										{isOrderResponsible &&
											!isOrderCancelled &&
											order?.is_proforma_step_complete &&
											order?.statut_paiement === 'Non demandé' && (
												<Box sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>
													<PrimaryLoadingButton
														buttonText={t.logistique.requestPayment}
														active={hasCompleteImportTitle}
														loading={false}
														type="button"
														startIcon={<PaymentIcon />}
														onClick={openPaymentRequest}
														cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
													/>
												</Box>
											)}
										{isOrderResponsible && order?.statut_paiement === 'Non demandé' && !hasCompleteImportTitle && (
											<Alert severity="warning">{t.logistique.incompleteImportTitle}</Alert>
										)}

										<Stack spacing={1.5}>
											<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
												{t.logistique.paymentSchedule}
											</Typography>
											{order?.echeancier_paiement?.length ? (
												order.echeancier_paiement.map((installment) => (
													<Card key={installment.id} variant="outlined" sx={{ borderRadius: 2 }}>
														<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
															<Stack spacing={1.5}>
																<Stack
																	direction={{ xs: 'column', sm: 'row' }}
																	sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1 }}
																>
																	<Typography sx={{ fontWeight: 700 }}>
																		{formatDateOnly(installment.date_echeance)} ·{' '}
																		{formatMoney(installment.montant_prevu, installment.devise)}
																	</Typography>
																	<Chip label={installment.statut_traitement} size="small" variant="outlined" />
																</Stack>
																{installment.preuve_email_statut !== 'Non demandé' && (
																	<Chip
																		icon={<EmailIcon />}
																		label={`${t.logistique.sendPaymentProof}: ${installment.preuve_email_statut}`}
																		color={emailDeliveryColor(installment.preuve_email_statut)}
																		size="small"
																		variant="outlined"
																		sx={{ alignSelf: 'flex-start' }}
																	/>
																)}
																{installment.preuve_email_relance_disponible && (
																	<Alert
																		severity={
																			installment.preuve_email_statut === 'Historique non vérifié' ? 'warning' : 'error'
																		}
																	>
																		{installment.preuve_email_statut === 'Historique non vérifié'
																			? t.logistique.emailDeliveryUnverified
																			: t.logistique.emailDeliveryError}
																		{installment.preuve_email_erreur ? `: ${installment.preuve_email_erreur}` : ''}
																	</Alert>
																)}
																{installment.execution_enregistree_le && (
																	<Typography variant="body2" color="text.secondary">
																		{t.logistique.executedPaymentSummary(
																			formatMoney(installment.montant_paye, installment.devise),
																			formatDateOnly(installment.date_paiement),
																		)}
																	</Typography>
																)}
																{installment.justificatif_file && (
																	<MuiLink
																		href={installment.justificatif_file}
																		target="_blank"
																		rel="noopener noreferrer"
																		sx={{ alignSelf: 'flex-start' }}
																	>
																		{t.logistique.openPaymentProof}
																	</MuiLink>
																)}
																<Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, flexWrap: 'wrap' }}>
																	{canProcessAssignedPayment &&
																		installment.statut_traitement === 'Paiement à traiter' && (
																			<Button
																				variant="outlined"
																				startIcon={<PaymentIcon />}
																				onClick={() => handleStartPayment(installment)}
																			>
																				{t.logistique.startPayment}
																			</Button>
																		)}
																	{canProcessAssignedPayment &&
																		installment.statut_traitement === 'Paiement en cours' && (
																			<Button
																				variant="outlined"
																				startIcon={<EditIcon />}
																				onClick={() => openPaymentExecution(installment)}
																			>
																				{t.logistique.recordPaymentExecution}
																			</Button>
																		)}
																	{canProcessAssignedPayment &&
																		installment.statut_traitement === 'Paiement effectué – Justificatif à joindre' && (
																			<Button
																				variant="outlined"
																				startIcon={<UploadFileIcon />}
																				onClick={() => openPaymentValidation(installment)}
																			>
																				{t.logistique.validatePayment}
																			</Button>
																		)}
																	{isOrderResponsible &&
																		installment.paiement_valide_le &&
																		installment.preuve_email_statut !== 'Envoyé' &&
																		(!['En attente', 'Envoi en cours'].includes(installment.preuve_email_statut) ||
																			installment.preuve_email_relance_disponible) && (
																			<Button
																				variant="outlined"
																				startIcon={<SendIcon />}
																				disabled={!order?.fournisseur_email || isSendingProofEmail}
																				onClick={() => handleSendSwift(installment)}
																			>
																				{t.logistique.sendPaymentProof}
																			</Button>
																		)}
																	{isOrderResponsible &&
																		installment.preuve_email_statut === 'Envoyé' &&
																		installment.preuve_envoyee_fournisseur_le &&
																		!installment.reception_confirmee_le && (
																			<Button
																				variant="outlined"
																				startIcon={<CheckCircleIcon />}
																				onClick={() => handleConfirmReceipt(installment)}
																			>
																				{t.logistique.confirmSupplierReceipt}
																			</Button>
																		)}
																</Stack>
															</Stack>
														</CardContent>
													</Card>
												))
											) : (
												<Typography variant="body2" color="text.secondary">
													{t.logistique.noPaymentSchedule}
												</Typography>
											)}
										</Stack>
										{canProcessAssignedPayment && order?.statut_paiement === 'En attente' && (
											<Button
												color="error"
												variant="outlined"
												startIcon={<CloseIcon />}
												onClick={() => setShowRejectModal(true)}
												sx={{ alignSelf: 'flex-start' }}
											>
												{t.logistique.blockPayment}
											</Button>
										)}
									</Stack>
								</DetailCard>

								<DetailCard title={t.logistique.traceabilitySection} icon={<HistoryIcon color="primary" />}>
									<Grid container spacing={2}>
										<Grid size={{ xs: 12, lg: 6 }}>
											<InfoRow
												icon={<SendIcon />}
												label={t.logistique.requestPayment}
												value={formatDate(order?.demande_paiement_envoyee_le ?? null)}
											/>
											<InfoRow
												icon={<PersonIcon />}
												label={t.logistique.paymentRequestSentBy}
												value={order?.demande_paiement_envoyee_par_name}
											/>
										</Grid>
										<Grid size={{ xs: 12, lg: 6 }}>
											<InfoRow
												icon={<CheckCircleIcon />}
												label={t.logistique.validatePayment}
												value={formatDate(order?.paiement_valide_le ?? null)}
											/>
											<InfoRow
												icon={<PersonIcon />}
												label={t.logistique.paymentValidatedBy}
												value={order?.paiement_valide_par_name}
											/>
											<InfoRow
												icon={<UploadFileIcon />}
												label={t.logistique.swiftUploadedAt}
												value={formatDate(order?.date_upload_swift ?? null)}
											/>
											<InfoRow
												icon={<SendIcon />}
												label={t.logistique.swiftSentAt}
												value={formatDate(order?.swift_envoye_fournisseur_le ?? null)}
											/>
										</Grid>
									</Grid>
								</DetailCard>

								<DetailCard title={t.logistique.costsSection} icon={<LocalShippingIcon color="primary" />}>
									<Grid container spacing={2}>
										<Grid size={{ xs: 12, lg: 6 }}>
											<InfoRow
												icon={<PaymentIcon />}
												label={t.articles.colPrixAchat}
												value={formatMoney(order?.cout_achat, order?.devise)}
											/>
											<InfoRow
												icon={<LocalShippingIcon />}
												label={t.logistique.fieldCoutTransport}
												value={formatMoney(order?.cout_transport, order?.devise)}
											/>
											<InfoRow
												icon={<LocalShippingIcon />}
												label={t.logistique.fieldFraisTransit}
												value={formatMoney(order?.frais_transit, order?.devise)}
											/>
											<InfoRow
												icon={<LocalShippingIcon />}
												label={t.logistique.fieldFraisDouane}
												value={formatMoney(order?.frais_douane, order?.devise)}
											/>
										</Grid>
										<Grid size={{ xs: 12, lg: 6 }}>
											<InfoRow
												icon={<PaymentIcon />}
												label={t.logistique.fieldTva}
												value={formatMoney(order?.tva, order?.devise)}
											/>
											<InfoRow
												icon={<LocalShippingIcon />}
												label={t.logistique.fieldLivraisonLocale}
												value={formatMoney(order?.livraison_locale, order?.devise)}
											/>
											<InfoRow
												icon={<PaymentIcon />}
												label={t.logistique.fieldAutresFrais}
												value={formatMoney(order?.autres_frais, order?.devise)}
											/>
											<InfoRow
												icon={<PaymentIcon />}
												label={t.logistique.colCoutTotal}
												value={formatMoney(order?.cout_total, order?.devise)}
											/>
										</Grid>
									</Grid>
								</DetailCard>

								<DetailCard title={t.logistique.sourceSection} icon={<RequestQuoteIcon color="primary" />}>
									<Stack divider={<Divider flexItem />} spacing={0}>
										{order?.proformas_detail?.length ? (
											order.proformas_detail.map((proforma) => (
												<Box key={proforma.id} sx={{ py: 1.5 }}>
													<MuiLink
														component={NextLink}
														href={FACTURE_PRO_FORMA_VIEW(proforma.id, company_id)}
														underline="hover"
														sx={{
															display: 'inline-flex',
															alignItems: 'center',
															gap: 0.5,
															fontWeight: 700,
															overflowWrap: 'anywhere',
														}}
													>
														{proforma.numero_facture}
														<OpenInNewIcon sx={{ fontSize: 16 }} />
													</MuiLink>
													<Typography variant="body2" color="text.secondary">
														{proforma.client_name || '-'} - {formatDateOnly(proforma.date_facture)} -{' '}
														{formatMoney(proforma.total_ttc_apres_remise, proforma.devise)}
													</Typography>
													{proforma.project_reference && (
														<Typography variant="body2" color="text.secondary">
															{t.logistique.colProjects}: {proforma.project_reference}
														</Typography>
													)}
												</Box>
											))
										) : (
											<Typography variant="body2" color="text.secondary">
												{t.common.noData}
											</Typography>
										)}
									</Stack>
								</DetailCard>

								<DetailCard title={t.logistique.linesSection} icon={<ReceiptLongIcon color="primary" />}>
									<Stack divider={<Divider flexItem />} spacing={0}>
										{order?.lignes?.length ? (
											order.lignes.map((line) => (
												<Box key={line.id} sx={{ py: 1.5 }}>
													<Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
														<MuiLink
															component={NextLink}
															href={ARTICLES_VIEW(line.article, company_id)}
															underline="hover"
															sx={{
																display: 'inline-flex',
																alignItems: 'center',
																gap: 0.5,
																fontWeight: 700,
																overflowWrap: 'anywhere',
															}}
														>
															{line.article_reference}
															<OpenInNewIcon sx={{ fontSize: 16 }} />
														</MuiLink>
														{' - '}
														{line.designation}
													</Typography>
													<Typography variant="body2" color="text.secondary">
														{line.client_name || '-'} - {t.documentForm.colQuantite}:{' '}
														{formatNumberWithSpaces(line.quantity, 3)} -{' '}
														{formatMoney(line.total_achat, line.devise_prix_achat)}
													</Typography>
													{line.project_reference && (
														<Typography variant="body2" color="text.secondary">
															{t.logistique.colProjects}: {line.project_reference}
														</Typography>
													)}
												</Box>
											))
										) : (
											<Typography variant="body2" color="text.secondary">
												{t.common.noData}
											</Typography>
										)}
									</Stack>
								</DetailCard>

								<DetailCard title={t.logistique.historySection} icon={<HistoryIcon color="primary" />}>
									<Stack divider={<Divider flexItem />} spacing={0}>
										{order?.events?.length ? (
											order.events.map((event) => (
												<Box key={event.id} sx={{ py: 1.5 }}>
													<Typography sx={{ fontWeight: 700 }}>{event.action}</Typography>
													<Typography variant="body2" color="text.secondary">
														{formatDate(event.date_created)} - {event.user_name || '-'}
														{event.old_value || event.new_value
															? ` (${event.old_value || '-'} -> ${event.new_value || '-'})`
															: ''}
													</Typography>
													{event.note && <Typography variant="body2">{event.note}</Typography>}
												</Box>
											))
										) : (
											<Typography variant="body2" color="text.secondary">
												{t.common.noData}
											</Typography>
										)}
									</Stack>
								</DetailCard>
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
						<ActionModals
							title={t.logistique.launchStatusModalTitle}
							titleIcon={<EditIcon />}
							titleIconColor="#1976D2"
							body={t.logistique.launchStatusModalBody}
							onClose={() => setShowLaunchStatusModal(false)}
							actions={[
								{
									text: t.common.cancel,
									active: false,
									onClick: () => setShowLaunchStatusModal(false),
									icon: <CloseIcon />,
									color: '#6B6B6B',
								},
								{
									text: t.common.save,
									active: true,
									onClick: handleLaunchStatusChange,
									icon: <CheckCircleIcon />,
									color: '#1976D2',
									disabled: isChangingLaunchStatus,
								},
							]}
						>
							<Box sx={{ mt: 2 }}>
								<CustomDropDownSelect
									id="statut_commande_lancement"
									label={t.logistique.fieldStepStatus}
									items={logistiqueLaunchStatusItemsList}
									value={launchStatusDraft}
									onChange={(event) => setLaunchStatusDraft(event.target.value as LogistiqueLaunchStatus)}
									size="small"
									theme={inputTheme}
									startIcon={<InfoIcon fontSize="small" />}
									required
								/>
							</Box>
						</ActionModals>
					)}
					{showProformaRequestModal && (
						<ActionModals
							title={t.logistique.proformaRequestModalTitle}
							titleIcon={<RequestQuoteIcon />}
							titleIconColor="#1976D2"
							body={t.logistique.proformaRequestModalBody}
							actions={[
								{
									text: t.common.cancel,
									active: false,
									onClick: () => setShowProformaRequestModal(false),
									icon: <CloseIcon />,
									color: '#6B6B6B',
								},
								{
									text: t.logistique.recordProformaRequest,
									active: Boolean(nextProformaFollowUp),
									onClick: handleRecordProformaRequest,
									icon: <RequestQuoteIcon />,
									color: '#1976D2',
									disabled: !nextProformaFollowUp || isRecordingProformaRequest,
								},
							]}
						>
							<DatePicker
								label={t.logistique.fieldNextProformaFollowUp}
								value={nextProformaFollowUp ? new Date(nextProformaFollowUp) : null}
								onChange={(date) => setNextProformaFollowUp(date ? formatLocalDate(date) : '')}
								format="dd/MM/yyyy"
								disablePast
								slotProps={{
									textField: {
										size: 'small',
										fullWidth: true,
										required: true,
										sx: { mt: 2 },
										slotProps: {
											input: {
												startAdornment: (
													<InputAdornment position="start">
														<CalendarTodayIcon fontSize="small" color="action" />
													</InputAdornment>
												),
											},
										},
									},
								}}
							/>
						</ActionModals>
					)}
					{showProformaReviewModal && (
						<ActionModals
							title={t.logistique.proformaReviewModalTitle}
							titleIcon={<DescriptionIcon />}
							titleIconColor="#1976D2"
							body={t.logistique.proformaReviewModalBody}
							maxWidth="md"
							fullWidth
							onClose={() => setShowProformaReviewModal(false)}
							actions={[
								{
									text: t.common.cancel,
									active: false,
									onClick: () => setShowProformaReviewModal(false),
									icon: <CloseIcon />,
									color: '#6B6B6B',
								},
								{
									text: t.logistique.saveProformaReview,
									active: true,
									onClick: handleSupplierProformaReview,
									icon: <CheckCircleIcon />,
									color: '#1976D2',
									disabled: !hasRequiredProformaData || !isProformaDecisionValid || isReviewingSupplierProforma,
								},
							]}
						>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
								<Card variant="outlined" sx={{ gridColumn: { sm: '1 / -1' }, bgcolor: 'action.hover' }}>
									<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
										<Grid container spacing={2}>
											<Grid size={{ xs: 12, sm: 4 }}>
												<Typography variant="caption" color="text.secondary">
													{t.logistique.fieldTargetQuantity}
												</Typography>
												<Typography sx={{ fontWeight: 700 }}>{formatNumberWithSpaces(targetQuantity, 3)}</Typography>
											</Grid>
											<Grid size={{ xs: 12, sm: 4 }}>
												<Typography variant="caption" color="text.secondary">
													{t.logistique.fieldTargetPurchaseTotal}
												</Typography>
												<Typography sx={{ fontWeight: 700 }}>
													{formatMoney(order?.cout_achat, order?.devise)}
												</Typography>
											</Grid>
											<Grid size={{ xs: 12, sm: 4 }}>
												<Typography variant="caption" color="text.secondary">
													{t.logistique.fieldTargetUnitPrices}
												</Typography>
												<Stack spacing={0.25} sx={{ mt: 0.5 }}>
													{targetPriceLines.length ? targetPriceLines : <Typography variant="body2">-</Typography>}
												</Stack>
											</Grid>
										</Grid>
									</CardContent>
								</Card>
								<CustomTextInput
									id="numero_proforma_fournisseur"
									type="text"
									label={t.logistique.fieldSupplierProformaNumber}
									value={supplierProformaData.numero_proforma_fournisseur}
									onChange={(event) =>
										setSupplierProformaData((prev) => ({
											...prev,
											numero_proforma_fournisseur: event.target.value,
										}))
									}
									fullWidth
									size="small"
									theme={inputTheme}
									startIcon={<ReceiptLongIcon fontSize="small" />}
									required
								/>
								<DatePicker
									label={t.logistique.fieldSupplierProformaDate}
									value={
										supplierProformaData.date_proforma_fournisseur
											? new Date(supplierProformaData.date_proforma_fournisseur)
											: null
									}
									onChange={(date) =>
										setSupplierProformaData((prev) => ({
											...prev,
											date_proforma_fournisseur: date ? formatLocalDate(date) : '',
										}))
									}
									format="dd/MM/yyyy"
									slotProps={{
										textField: {
											size: 'small',
											fullWidth: true,
											required: true,
											slotProps: {
												input: {
													startAdornment: (
														<InputAdornment position="start">
															<CalendarTodayIcon fontSize="small" color="action" />
														</InputAdornment>
													),
												},
											},
										},
									}}
								/>
								<FormattedNumberInput
									id="montant_proforma_fournisseur"
									type="text"
									label={t.logistique.fieldSupplierProformaAmount}
									value={supplierProformaData.montant_proforma_fournisseur}
									onChange={(event) =>
										setSupplierProformaData((prev) => ({
											...prev,
											montant_proforma_fournisseur: event.target.value,
										}))
									}
									fullWidth
									size="small"
									theme={inputTheme}
									startIcon={<PaymentIcon fontSize="small" />}
									required
								/>
								<CustomDropDownSelect
									id="devise_proforma_fournisseur"
									label={t.logistique.fieldSupplierProformaCurrency}
									items={logistiqueCurrencyItemsList}
									value={supplierProformaData.devise_proforma_fournisseur}
									onChange={(event) =>
										setSupplierProformaData((prev) => ({
											...prev,
											devise_proforma_fournisseur: event.target.value,
										}))
									}
									size="small"
									theme={inputTheme}
									startIcon={<PaymentIcon fontSize="small" />}
									required
								/>
								<CustomTextInput
									id="incoterm_proforma"
									type="text"
									label={t.logistique.fieldIncoterm}
									value={supplierProformaData.incoterm}
									onChange={(event) => setSupplierProformaData((prev) => ({ ...prev, incoterm: event.target.value }))}
									fullWidth
									size="small"
									theme={inputTheme}
									startIcon={<PublicIcon fontSize="small" />}
									required
								/>
								<FormattedNumberInput
									id="delai_proforma_jours"
									type="text"
									decimals={0}
									label={t.logistique.fieldSupplierLeadTime}
									value={supplierProformaData.delai_proforma_jours}
									onChange={(event) =>
										setSupplierProformaData((prev) => ({ ...prev, delai_proforma_jours: event.target.value }))
									}
									fullWidth
									size="small"
									theme={inputTheme}
									startIcon={<CalendarTodayIcon fontSize="small" />}
									required
								/>
								<CustomTextInput
									id="conditions_paiement_proforma"
									type="textarea"
									label={t.logistique.fieldConditionsPaiement}
									value={supplierProformaData.conditions_paiement}
									onChange={(event) =>
										setSupplierProformaData((prev) => ({ ...prev, conditions_paiement: event.target.value }))
									}
									fullWidth
									size="small"
									theme={inputTheme}
									startIcon={<PaymentIcon fontSize="small" />}
									required
								/>
								<CustomDropDownSelect
									id="decision_proforma"
									label={t.logistique.fieldProformaDecision}
									items={proformaDecisionItems}
									value={proformaDecision}
									onChange={(event) =>
										setProformaDecision(event.target.value as Exclude<LogistiqueProformaStatus, 'En attente'>)
									}
									size="small"
									theme={inputTheme}
									startIcon={<CheckCircleIcon fontSize="small" />}
									required
								/>
								<Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gridColumn: { sm: '1 / -1' }, gap: 2 }}>
									<FormControlLabel
										control={
											<Checkbox
												checked={supplierProformaData.ecart_prix_proforma}
												onChange={(event) =>
													setSupplierProformaData((prev) => ({
														...prev,
														ecart_prix_proforma: event.target.checked,
													}))
												}
											/>
										}
										label={t.logistique.fieldPriceVariance}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={supplierProformaData.ecart_quantite_proforma}
												onChange={(event) =>
													setSupplierProformaData((prev) => ({
														...prev,
														ecart_quantite_proforma: event.target.checked,
													}))
												}
											/>
										}
										label={t.logistique.fieldQuantityVariance}
									/>
								</Stack>
								<Box sx={{ gridColumn: { sm: '1 / -1' } }}>
									<CustomTextInput
										id="notes_ecarts_proforma"
										type="textarea"
										label={t.logistique.fieldVarianceNotes}
										value={supplierProformaData.notes_ecarts_proforma}
										onChange={(event) =>
											setSupplierProformaData((prev) => ({ ...prev, notes_ecarts_proforma: event.target.value }))
										}
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<NotesIcon fontSize="small" />}
									/>
								</Box>
								<Box sx={{ gridColumn: { sm: '1 / -1' } }}>
									<LogistiqueDocumentsFormCard
										items={[
											{
												field: 'proforma_fournisseur_file',
												label: t.logistique.fieldProformaFournisseurFile,
												file: supplierProformaFile,
												currentUrl: order?.proforma_fournisseur_file,
											},
										]}
										selectedField="proforma_fournisseur_file"
										onSelectedFieldChange={() => undefined}
										onFileChange={(_field, file) => setSupplierProformaFile(file)}
										onClearFile={() => setSupplierProformaFile(null)}
										isLoading={isReviewingSupplierProforma}
										accept={acceptedDocumentTypes}
									/>
								</Box>
							</Box>
						</ActionModals>
					)}
					{showRequestPaymentModal && (
						<ActionModals
							title={t.logistique.requestPaymentModalTitle}
							titleIcon={<PaymentIcon />}
							titleIconColor="#2E7D32"
							body={t.logistique.requestPaymentModalBody}
							actions={[
								{
									text: t.common.cancel,
									active: false,
									onClick: () => setShowRequestPaymentModal(false),
									icon: <CloseIcon />,
									color: '#6B6B6B',
								},
								{
									text: t.logistique.requestPayment,
									active: hasCompleteImportTitle && hasCompletePaymentSchedule,
									onClick: handleRequestPayment,
									icon: <PaymentIcon />,
									color: '#2E7D32',
									disabled: !hasCompleteImportTitle || !hasCompletePaymentSchedule,
								},
							]}
						>
							<Stack spacing={2} sx={{ mt: 2 }}>
								{!hasCompleteImportTitle && <Alert severity="warning">{t.logistique.incompleteImportTitle}</Alert>}
								<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
									{t.logistique.paymentSchedule}
								</Typography>
								{paymentSchedule.map((item, index) => (
									<Box
										key={index}
										sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 140px auto' }, gap: 1.5 }}
									>
										<DatePicker
											label={t.logistique.fieldDueDate}
											value={item.date_echeance ? new Date(`${item.date_echeance}T00:00:00`) : null}
											onChange={(date) =>
												setPaymentSchedule((previous) =>
													previous.map((row, rowIndex) =>
														rowIndex === index ? { ...row, date_echeance: date ? formatLocalDate(date) : '' } : row,
													),
												)
											}
											format="dd/MM/yyyy"
											slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
										/>
										<FormattedNumberInput
											id={`montant_prevu_${index}`}
											type="text"
											label={t.logistique.fieldPlannedAmount}
											value={item.montant_prevu}
											onChange={(event) =>
												setPaymentSchedule((previous) =>
													previous.map((row, rowIndex) =>
														rowIndex === index ? { ...row, montant_prevu: event.target.value } : row,
													),
												)
											}
											fullWidth
											size="small"
											theme={inputTheme}
											required
										/>
										<CustomDropDownSelect
											id={`devise_echeance_${index}`}
											label={t.logistique.fieldDevisePaiement}
											items={logistiqueCurrencyItemsList}
											value={item.devise}
											onChange={(event) =>
												setPaymentSchedule((previous) =>
													previous.map((row, rowIndex) =>
														rowIndex === index ? { ...row, devise: event.target.value } : row,
													),
												)
											}
											size="small"
											theme={inputTheme}
										/>
										<Button
											color="error"
											variant="outlined"
											onClick={() =>
												setPaymentSchedule((previous) => previous.filter((_, rowIndex) => rowIndex !== index))
											}
											disabled={paymentSchedule.length === 1}
										>
											<DeleteIcon />
										</Button>
									</Box>
								))}
								<Button
									variant="outlined"
									startIcon={<AddIcon />}
									onClick={() =>
										setPaymentSchedule((previous) => [
											...previous,
											{ date_echeance: '', montant_prevu: '', devise: order?.devise_titre_importation || 'MAD' },
										])
									}
									sx={{ alignSelf: 'flex-start' }}
								>
									{t.logistique.addInstallment}
								</Button>
								<Alert severity={hasCompletePaymentSchedule ? 'success' : 'warning'}>
									{t.logistique.scheduleTotal(formatMoney(scheduledAmount, order?.devise_titre_importation))}
								</Alert>
							</Stack>
						</ActionModals>
					)}
					{showExecutionModal && (
						<ActionModals
							title={t.logistique.executionModalTitle}
							titleIcon={<PaymentIcon />}
							titleIconColor="#2E7D32"
							body={t.logistique.executionModalBody}
							actions={[
								{
									text: t.common.cancel,
									active: false,
									onClick: () => {
										setShowExecutionModal(false);
										setSelectedInstallment(null);
									},
									icon: <CloseIcon />,
									color: '#6B6B6B',
								},
								{
									text: t.logistique.recordPaymentExecution,
									active: hasCompletePaymentData,
									onClick: handleRecordPaymentExecution,
									icon: <CheckCircleIcon />,
									color: '#2E7D32',
									disabled: !hasCompletePaymentData,
								},
							]}
						>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
								<DatePicker
									label={t.logistique.fieldDatePaiement}
									value={paymentData.date_paiement ? new Date(paymentData.date_paiement) : null}
									onChange={(date) =>
										setPaymentData((prev) => ({
											...prev,
											date_paiement: date ? formatLocalDate(date) : '',
										}))
									}
									format="dd/MM/yyyy"
									slotProps={{
										textField: {
											size: 'small',
											fullWidth: true,
											required: true,
											slotProps: {
												input: {
													startAdornment: (
														<InputAdornment position="start">
															<CalendarTodayIcon fontSize="small" color="action" />
														</InputAdornment>
													),
												},
											},
										},
									}}
								/>
								<FormattedNumberInput
									id="montant_paiement"
									type="text"
									label={t.logistique.fieldMontantPaiement}
									value={paymentData.montant_paiement}
									onChange={(event) => setPaymentData((prev) => ({ ...prev, montant_paiement: event.target.value }))}
									fullWidth
									size="small"
									theme={inputTheme}
									startIcon={<PaymentIcon fontSize="small" />}
									required
								/>
								<CustomDropDownSelect
									id="devise_paiement"
									label={t.logistique.fieldDevisePaiement}
									items={logistiqueCurrencyItemsList}
									value={paymentData.devise_paiement}
									onChange={(event) => setPaymentData((prev) => ({ ...prev, devise_paiement: event.target.value }))}
									size="small"
									theme={inputTheme}
									startIcon={<PaymentIcon fontSize="small" />}
									required
								/>
								<CustomTextInput
									id="banque_paiement"
									type="text"
									label={t.logistique.fieldBanquePaiement}
									value={paymentData.banque_paiement}
									onChange={(event) => setPaymentData((prev) => ({ ...prev, banque_paiement: event.target.value }))}
									fullWidth
									size="small"
									theme={inputTheme}
									startIcon={<PaymentIcon fontSize="small" />}
									required
								/>
								<CustomTextInput
									id="reference_paiement"
									type="text"
									label={t.logistique.fieldReferencePaiement}
									value={paymentData.reference_paiement}
									onChange={(event) => setPaymentData((prev) => ({ ...prev, reference_paiement: event.target.value }))}
									fullWidth
									size="small"
									theme={inputTheme}
									startIcon={<ReceiptLongIcon fontSize="small" />}
									required
								/>
								<CustomDropDownSelect
									id="methode_paiement"
									label={t.logistique.fieldMethodePaiement}
									items={logistiquePaymentMethodItemsList}
									value={paymentData.methode_paiement}
									onChange={(event) =>
										setPaymentData((prev) => ({
											...prev,
											methode_paiement: event.target.value as LogistiquePaymentMethod,
										}))
									}
									size="small"
									theme={inputTheme}
									startIcon={<PaymentIcon fontSize="small" />}
									required
								/>
								<Box sx={{ gridColumn: { sm: '1 / -1' } }}>
									<CustomTextInput
										id="commentaire_paiement"
										type="textarea"
										label={t.logistique.fieldCommentairePaiement}
										value={paymentData.commentaire_paiement}
										onChange={(event) =>
											setPaymentData((prev) => ({ ...prev, commentaire_paiement: event.target.value }))
										}
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<NotesIcon fontSize="small" />}
									/>
								</Box>
							</Box>
						</ActionModals>
					)}
					{showValidateModal && (
						<ActionModals
							title={t.logistique.paymentModalTitle}
							titleIcon={<UploadFileIcon />}
							titleIconColor="#2E7D32"
							body={t.logistique.paymentModalBody}
							actions={[
								{
									text: t.common.cancel,
									active: false,
									onClick: () => {
										setShowValidateModal(false);
										setSelectedInstallment(null);
										setSwiftProofFile(null);
									},
									icon: <CloseIcon />,
									color: '#6B6B6B',
								},
								{
									text: t.logistique.validatePayment,
									active: Boolean(swiftProofFile),
									onClick: handleValidatePayment,
									icon: <CheckCircleIcon />,
									color: '#2E7D32',
									disabled: !swiftProofFile,
								},
							]}
						>
							<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mt: 2 }}>
								<input
									id="swift-proof-file"
									type="file"
									accept={acceptedDocumentTypes}
									hidden
									onChange={(event) => setSwiftProofFile(event.target.files?.[0] ?? null)}
								/>
								<Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
									<Button
										component="label"
										htmlFor="swift-proof-file"
										variant="outlined"
										size="small"
										startIcon={<UploadFileIcon />}
									>
										{swiftProofFile ? t.logistique.replaceDocument : t.logistique.uploadDocument}
									</Button>
									<Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
										{swiftProofFile
											? `${t.logistique.selectedFile}: ${swiftProofFile.name}`
											: t.logistique.fieldBankProof}
									</Typography>
								</Stack>
							</Box>
						</ActionModals>
					)}
					{showRejectModal && (
						<ActionModals
							title={t.logistique.rejectModalTitle}
							titleIcon={<CloseIcon />}
							titleIconColor="#D32F2F"
							body={t.logistique.rejectModalBody}
							actions={[
								{
									text: t.common.cancel,
									active: false,
									onClick: () => setShowRejectModal(false),
									icon: <CloseIcon />,
									color: '#6B6B6B',
								},
								{
									text: t.logistique.rejectPayment,
									active: true,
									onClick: handleRejectPayment,
									icon: <CloseIcon />,
									color: '#D32F2F',
								},
							]}
						>
							<CustomTextInput
								id="reject_note"
								type="textarea"
								label={t.reglements.fieldObservations}
								value={rejectNote}
								onChange={(event) => setRejectNote(event.target.value)}
								fullWidth
								size="small"
								theme={inputTheme}
								startIcon={<NotesIcon fontSize="small" />}
							/>
						</ActionModals>
					)}
				</NavigationBar>
			</Stack>
		</LocalizationProvider>
	);
};

export default LogistiqueViewClient;
