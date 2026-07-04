'use client';

import React, { isValidElement, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Alert,
	Stack,
	Step,
	StepLabel,
	Stepper,
	TextField,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
	ArrowBack as ArrowBackIcon,
	AttachFile as AttachFileIcon,
	AssignmentTurnedIn as AssignmentTurnedInIcon,
	Business as BusinessIcon,
	CalendarToday as CalendarTodayIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
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
import NoPermission from '@/components/shared/noPermission/noPermission';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import FormattedNumberInput from '@/components/formikElements/formattedNumberInput/formattedNumberInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getUserCompaniesState } from '@/store/selectors';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage, formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { textInputTheme } from '@/utils/themes';
import {
	useDeleteLogistiqueMutation,
	useGetLogistiqueQuery,
	usePatchLogistiqueStatutMutation,
	useRejectLogistiquePaymentMutation,
	useRequestLogistiquePaymentMutation,
	useSendLogistiqueSwiftMutation,
	useValidateLogistiquePaymentMutation,
} from '@/store/services/logistique';
import { LOGISTIQUE_EDIT, LOGISTIQUE_LIST } from '@/utils/routes';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { LogistiqueDocumentField, LogistiquePaymentMethod, LogistiquePaymentStatus, LogistiqueStatut } from '@/types/logistiqueTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

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
const accountingRoles = new Set(['Caissier', 'Comptable']);
const paymentMethodOptions: LogistiquePaymentMethod[] = ['', 'LC', 'Virement', 'Remise documentaire'];
const statusOptions: LogistiqueStatut[] = [
	'Réception commande',
	'Commande fournisseur',
	'Proforma',
	"Titre d'Importation",
	'Validation',
	'Paiement demandé',
	'Paiement effectué',
	'SWIFT / Draft LC',
	'Envoi SWIFT / Draft LC',
	'Production',
	'Expédition',
	'Documents originaux',
	'Transit',
	'Dédouanement',
	'Réception locale',
	'Livraison client',
	'Clôture',
	'Annulé',
];
const workflowStatuses = statusOptions.filter((status) => status !== 'Annulé');
const documentFields: LogistiqueDocumentField[] = [
	'titre_importation_file',
	'proforma_fournisseur_file',
	'justificatifs_file',
	'swift_file',
	'documents_originaux_file',
];
const acceptedDocumentTypes = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';

const paymentColor = (status: LogistiquePaymentStatus) => {
	if (status === 'Validé') return 'success' as const;
	if (status === 'Rejeté') return 'error' as const;
	if (status === 'En attente') return 'warning' as const;
	return 'default' as const;
};

const formatMoney = (value: string | number | null | undefined, devise = 'MAD') =>
	`${formatNumberWithSpaces(value ?? 0, 2)} ${devise}`;

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue =
		isValidElement(value) || (value !== null && value !== undefined && value.toString().length > 0) ? value : '-';

	return (
		<Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', py: 1.5, flexWrap: 'wrap' }}>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack direction="row" spacing={isMobile ? 0 : 2} sx={{ alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
				<Typography sx={{ fontWeight: 600, color: 'text.secondary', minWidth: { xs: '100%', sm: 220 }, wordBreak: 'break-word' }}>
					{label}
				</Typography>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					{isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}>{displayValue}</Typography>
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

type DocumentRowProps = {
	label: string;
	url?: string | null;
	openLabel: string;
};

const DocumentRow: React.FC<DocumentRowProps> = ({ label, url, openLabel }) => (
	<Stack
		direction={{ xs: 'column', sm: 'row' }}
		spacing={1.5}
		sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', py: 1.5 }}
	>
		<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
			<AttachFileIcon color={url ? 'primary' : 'disabled'} fontSize="small" />
			<Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{label}</Typography>
		</Stack>
		{url ? (
			<Button
				component="a"
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				size="small"
				variant="outlined"
				startIcon={<OpenInNewIcon />}
			>
				{openLabel}
			</Button>
		) : (
			<Chip label="-" size="small" variant="outlined" />
		)}
	</Stack>
);

const LogistiqueViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const companiesState = useAppSelector(getUserCompaniesState);
	const { data: companiesData, isLoading: isCompaniesLoading } = useGetUserCompaniesQuery(undefined, { skip: !token });
	const companies = companiesData ?? companiesState;
	const company = useMemo(() => companies?.find((item) => item.id === company_id), [companies, company_id]);
	const role = company?.role ?? '';
	const canRead = Boolean(company);
	const canManage = managerRoles.has(role);
	const canValidatePayment = accountingRoles.has(role);
	const canDelete = role === 'Caissier';

	const { data: order, isLoading, error } = useGetLogistiqueQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const [deleteLogistique] = useDeleteLogistiqueMutation();
	const [patchStatus] = usePatchLogistiqueStatutMutation();
	const [requestPayment] = useRequestLogistiquePaymentMutation();
	const [validatePayment] = useValidateLogistiquePaymentMutation();
	const [rejectPayment] = useRejectLogistiquePaymentMutation();
	const [sendSwift] = useSendLogistiqueSwiftMutation();
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showValidateModal, setShowValidateModal] = useState(false);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState<LogistiqueStatut>('Réception commande');
	const [swiftProofFile, setSwiftProofFile] = useState<File | null>(null);
	const [paymentData, setPaymentData] = useState({
		date_paiement: '',
		montant_paiement: '',
		reference_paiement: '',
		methode_paiement: '' as LogistiquePaymentMethod,
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
	const activeWorkflowIndex = Math.max(
		0,
		workflowStatuses.indexOf((order?.statut ?? 'Réception commande') as (typeof workflowStatuses)[number]),
	);

	useEffect(() => {
		if (order?.statut) {
			setSelectedStatus(order.statut);
		}
	}, [order?.statut]);

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

	const handleRequestPayment = async () => {
		try {
			await requestPayment({ id }).unwrap();
			onSuccess(t.logistique.requestPaymentSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.requestPaymentError));
		}
	};

	const handleStatusUpdate = async () => {
		try {
			await patchStatus({ id, data: { statut: selectedStatus } }).unwrap();
			onSuccess(t.logistique.updateSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.updateError));
		}
	};

	const handleValidatePayment = async () => {
		try {
			let data: typeof paymentData | FormData = paymentData;
			if (swiftProofFile) {
				const formData = new FormData();
				Object.entries(paymentData).forEach(([key, value]) => {
					if (value) {
						formData.append(key, value);
					}
				});
				formData.append('swift_file', swiftProofFile);
				data = formData;
			}
			await validatePayment({ id, data }).unwrap();
			onSuccess(t.logistique.validateSuccess);
			setShowValidateModal(false);
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

	const handleSendSwift = async () => {
		try {
			await sendSwift({ id }).unwrap();
			onSuccess(t.logistique.swiftSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.logistique.swiftError));
		}
	};

	return (
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
								{canManage && (
									<Button
										variant="outlined"
										size="small"
										startIcon={<EditIcon />}
										onClick={() => router.push(LOGISTIQUE_EDIT(id, company_id))}
									>
										{t.common.edit}
									</Button>
								)}
								{canManage && order?.statut_paiement === 'Non demandé' && (
									<Button variant="outlined" size="small" startIcon={<PaymentIcon />} onClick={handleRequestPayment}>
										{t.logistique.requestPayment}
									</Button>
								)}
								{canValidatePayment && order?.statut_paiement === 'En attente' && (
									<>
										<Button variant="outlined" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={() => setShowValidateModal(true)}>
											{t.logistique.validatePayment}
										</Button>
										<Button variant="outlined" color="error" size="small" startIcon={<CloseIcon />} onClick={() => setShowRejectModal(true)}>
											{t.logistique.rejectPayment}
										</Button>
									</>
								)}
								{canManage && order?.statut_paiement === 'Validé' && (
									<Button variant="outlined" size="small" startIcon={<SendIcon />} onClick={handleSendSwift}>
										{t.logistique.sendSwift}
									</Button>
								)}
								{canDelete && (
									<Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>
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
									<Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between' }}>
										<Grid size={{ xs: 12, sm: 6, md: 3 }}>
											<Box sx={{ textAlign: 'center', px: 1 }}>
												<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
													{t.logistique.colNumero.toUpperCase()}
												</Typography>
												<Typography variant="h6" sx={{ fontWeight: 800 }}>
													{order?.numero_commande ?? '-'}
												</Typography>
											</Box>
										</Grid>
										<Grid size={{ xs: 12, sm: 6, md: 3 }}>
											<Box sx={{ textAlign: 'center', px: 1 }}>
												<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
													{t.logistique.fieldFournisseur.toUpperCase()}
												</Typography>
												<Typography variant="h6" sx={{ fontWeight: 800 }}>
													{order?.fournisseur || '-'}
												</Typography>
											</Box>
										</Grid>
										<Grid size={{ xs: 12, sm: 6, md: 3 }}>
											<Box sx={{ textAlign: 'center', px: 1 }}>
												<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
													{t.logistique.colPaiement.toUpperCase()}
												</Typography>
												{order?.statut_paiement ? (
													<Chip label={order.statut_paiement} color={paymentColor(order.statut_paiement)} variant="outlined" />
												) : (
													<Typography>-</Typography>
												)}
											</Box>
										</Grid>
										<Grid size={{ xs: 12, sm: 6, md: 3 }}>
											<Box sx={{ textAlign: 'center', px: 1 }}>
												<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
													{t.logistique.colCoutTotal.toUpperCase()}
												</Typography>
												<Typography variant="h5" color="primary" sx={{ fontWeight: 900 }}>
													{formatMoney(order?.cout_total, order?.devise)}
												</Typography>
											</Box>
										</Grid>
									</Grid>
								</CardContent>
							</Card>

							<DetailCard title={t.logistique.fieldStatut} icon={<InfoIcon color="primary" />}>
								<Stack spacing={3}>
									<Box sx={{ overflowX: 'auto', pb: 1 }}>
										<Stepper
											activeStep={activeWorkflowIndex}
											alternativeLabel={!isMobile}
											orientation={isMobile ? 'vertical' : 'horizontal'}
											sx={{ minWidth: isMobile ? 'auto' : 1800 }}
										>
											{workflowStatuses.map((status) => (
												<Step key={status} completed={workflowStatuses.indexOf(status) < activeWorkflowIndex}>
													<StepLabel>{status}</StepLabel>
												</Step>
											))}
										</Stepper>
									</Box>
									<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
										<Chip label={order?.statut ?? '-'} size="medium" color="info" variant="outlined" sx={{ fontSize: '1rem', py: 2 }} />
										{canManage && (
											<>
												<CustomDropDownSelect
													id="statut"
													label={t.logistique.fieldStatut}
													items={statusOptions}
													value={selectedStatus}
													onChange={(event) => setSelectedStatus(event.target.value as LogistiqueStatut)}
													size="small"
													theme={inputTheme}
													startIcon={<InfoIcon fontSize="small" />}
												/>
												<Button variant="contained" size="small" startIcon={<AssignmentTurnedInIcon />} onClick={handleStatusUpdate}>
													{t.common.update}
												</Button>
											</>
										)}
									</Stack>
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
									<Grid size={{ xs: 12, md: 6 }}>
										<InfoRow icon={<ReceiptLongIcon />} label={t.logistique.colNumero} value={order?.numero_commande} />
										<InfoRow icon={<BusinessIcon />} label={t.logistique.fieldFournisseur} value={order?.fournisseur} />
										<InfoRow icon={<AssignmentTurnedInIcon />} label={t.logistique.colMarque} value={order?.marque_name} />
										<InfoRow icon={<PersonIcon />} label={t.logistique.fieldResponsable} value={order?.responsable_name} />
										<InfoRow icon={<InventoryIcon />} label={t.logistique.colProjects} value={order?.projects_display} />
										<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldDevise} value={order?.devise} />
										<InfoRow icon={<LocalShippingIcon />} label={t.logistique.fieldTransport} value={order?.transport} />
										<InfoRow icon={<PublicIcon />} label={t.logistique.fieldIncoterm} value={order?.incoterm} />
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<InfoRow icon={<CalendarTodayIcon />} label={t.logistique.fieldDatePrevue} value={formatDate(order?.date_prevue ?? null)} />
										<InfoRow icon={<CalendarTodayIcon />} label={t.logistique.fieldDateReelle} value={formatDate(order?.date_reelle ?? null)} />
										<InfoRow icon={<PublicIcon />} label={t.logistique.fieldOrigine} value={order?.origine_marchandise} />
										<InfoRow icon={<DescriptionIcon />} label={t.logistique.fieldNature} value={order?.nature_marchandise} />
										<InfoRow icon={<ScaleIcon />} label={t.logistique.fieldPoidsNet} value={order?.poids_net} />
										<InfoRow icon={<ScaleIcon />} label={t.logistique.fieldPoidsBrut} value={order?.poids_brut} />
										<InfoRow icon={<ScaleIcon />} label={t.logistique.fieldVolume} value={order?.volume} />
									</Grid>
								</Grid>
							</DetailCard>

							<DetailCard title={t.logistique.importSection} icon={<DescriptionIcon color="primary" />}>
								<Grid container spacing={2}>
									<Grid size={{ xs: 12, md: 6 }}>
										<InfoRow icon={<DescriptionIcon />} label={t.logistique.fieldNumeroDomiciliation} value={order?.numero_domiciliation} />
										<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldBanque} value={order?.banque} />
										<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldMontantTI} value={formatMoney(order?.montant_titre_importation, order?.devise_titre_importation)} />
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<InfoRow icon={<InfoIcon />} label={t.logistique.fieldStatutTI} value={order?.statut_titre_importation} />
										<InfoRow icon={<CalendarTodayIcon />} label={t.logistique.fieldDateTI} value={formatDate(order?.date_titre_importation ?? null)} />
										<InfoRow icon={<CalendarTodayIcon />} label={t.logistique.fieldDateValidationTI} value={formatDate(order?.date_validation_titre_importation ?? null)} />
									</Grid>
								</Grid>
							</DetailCard>

							<DetailCard title={t.logistique.documentsSection} icon={<AttachFileIcon color="primary" />}>
								<Stack divider={<Divider flexItem />} spacing={0}>
									{documentFields.map((field) => (
										<DocumentRow
											key={field}
											label={documentLabels[field]}
											url={order?.[field] ?? null}
											openLabel={t.logistique.openDocument}
										/>
									))}
								</Stack>
							</DetailCard>

							<DetailCard title={t.logistique.paymentSection} icon={<PaymentIcon color="primary" />}>
								<Grid container spacing={2}>
									<Grid size={{ xs: 12, md: 6 }}>
										<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldMethodePaiement} value={order?.methode_paiement} />
										<InfoRow icon={<CalendarTodayIcon />} label={t.logistique.fieldDatePaiement} value={formatDate(order?.date_paiement ?? null)} />
										<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldMontantPaiement} value={formatMoney(order?.montant_paiement, order?.devise)} />
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<InfoRow icon={<ReceiptLongIcon />} label={t.logistique.fieldReferencePaiement} value={order?.reference_paiement} />
										<InfoRow icon={<SendIcon />} label={t.logistique.requestPayment} value={formatDate(order?.demande_paiement_envoyee_le ?? null)} />
										<InfoRow icon={<CheckCircleIcon />} label={t.logistique.validatePayment} value={formatDate(order?.paiement_valide_le ?? null)} />
									</Grid>
								</Grid>
							</DetailCard>

							<DetailCard title={t.logistique.traceabilitySection} icon={<HistoryIcon color="primary" />}>
								<Grid container spacing={2}>
									<Grid size={{ xs: 12, md: 6 }}>
										<InfoRow icon={<SendIcon />} label={t.logistique.requestPayment} value={formatDate(order?.demande_paiement_envoyee_le ?? null)} />
										<InfoRow icon={<PersonIcon />} label={t.logistique.paymentRequestSentBy} value={order?.demande_paiement_envoyee_par_name} />
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<InfoRow icon={<CheckCircleIcon />} label={t.logistique.validatePayment} value={formatDate(order?.paiement_valide_le ?? null)} />
										<InfoRow icon={<PersonIcon />} label={t.logistique.paymentValidatedBy} value={order?.paiement_valide_par_name} />
										<InfoRow icon={<UploadFileIcon />} label={t.logistique.swiftUploadedAt} value={formatDate(order?.date_upload_swift ?? null)} />
										<InfoRow icon={<SendIcon />} label={t.logistique.swiftSentAt} value={formatDate(order?.swift_envoye_fournisseur_le ?? null)} />
									</Grid>
								</Grid>
							</DetailCard>

							<DetailCard title={t.logistique.costsSection} icon={<LocalShippingIcon color="primary" />}>
								<Grid container spacing={2}>
									<Grid size={{ xs: 12, md: 6 }}>
										<InfoRow icon={<PaymentIcon />} label={t.articles.colPrixAchat} value={formatMoney(order?.cout_achat, order?.devise)} />
										<InfoRow icon={<LocalShippingIcon />} label={t.logistique.fieldCoutTransport} value={formatMoney(order?.cout_transport, order?.devise)} />
										<InfoRow icon={<LocalShippingIcon />} label={t.logistique.fieldFraisTransit} value={formatMoney(order?.frais_transit, order?.devise)} />
										<InfoRow icon={<LocalShippingIcon />} label={t.logistique.fieldFraisDouane} value={formatMoney(order?.frais_douane, order?.devise)} />
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldTva} value={formatMoney(order?.tva, order?.devise)} />
										<InfoRow icon={<LocalShippingIcon />} label={t.logistique.fieldLivraisonLocale} value={formatMoney(order?.livraison_locale, order?.devise)} />
										<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldAutresFrais} value={formatMoney(order?.autres_frais, order?.devise)} />
										<InfoRow icon={<PaymentIcon />} label={t.logistique.colCoutTotal} value={formatMoney(order?.cout_total, order?.devise)} />
									</Grid>
								</Grid>
							</DetailCard>

							<DetailCard title={t.logistique.sourceSection} icon={<RequestQuoteIcon color="primary" />}>
								<Stack divider={<Divider flexItem />} spacing={0}>
									{order?.proformas_detail?.length ? (
										order.proformas_detail.map((proforma) => (
											<Box key={proforma.id} sx={{ py: 1.5 }}>
												<Typography sx={{ fontWeight: 700 }}>{proforma.numero_facture}</Typography>
												<Typography variant="body2" color="text.secondary">
													{proforma.client_name || '-'} - {formatDate(proforma.date_facture)} - {formatMoney(proforma.total_ttc_apres_remise, proforma.devise)}
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
												<Typography sx={{ fontWeight: 700 }}>
													{line.article_reference} - {line.designation}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													{line.client_name || '-'} - {t.documentForm.colQuantite}: {formatNumberWithSpaces(line.quantity, 3)} - {formatMoney(line.total_achat, line.devise_prix_achat)}
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
													{event.old_value || event.new_value ? ` (${event.old_value || '-'} -> ${event.new_value || '-'})` : ''}
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
							{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
							{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
						]}
					/>
				)}
				{showValidateModal && (
					<ActionModals
						title={t.logistique.paymentModalTitle}
						titleIcon={<PaymentIcon />}
						titleIconColor="#2E7D32"
						body={t.logistique.paymentModalBody}
						actions={[
							{ text: t.common.cancel, active: false, onClick: () => { setShowValidateModal(false); setSwiftProofFile(null); }, icon: <CloseIcon />, color: '#6B6B6B' },
							{ text: t.logistique.validatePayment, active: true, onClick: handleValidatePayment, icon: <CheckCircleIcon />, color: '#2E7D32' },
						]}
					>
						<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
							<TextField
								label={t.logistique.fieldDatePaiement}
								type="date"
								value={paymentData.date_paiement}
								onChange={(event) => setPaymentData((prev) => ({ ...prev, date_paiement: event.target.value }))}
								slotProps={{ inputLabel: { shrink: true } }}
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
							/>
							<CustomDropDownSelect
								id="methode_paiement"
								label={t.logistique.fieldMethodePaiement}
								items={paymentMethodOptions}
								value={paymentData.methode_paiement}
								onChange={(event) => setPaymentData((prev) => ({ ...prev, methode_paiement: event.target.value as LogistiquePaymentMethod }))}
								size="small"
								theme={inputTheme}
								startIcon={<PaymentIcon fontSize="small" />}
							/>
							<Box
								sx={{
									border: '1px solid',
									borderColor: 'divider',
									borderRadius: 2,
									p: 2,
									gridColumn: { sm: '1 / -1' },
								}}
							>
								<input
									id="swift-proof-file"
									type="file"
									accept={acceptedDocumentTypes}
									hidden
									onChange={(event) => setSwiftProofFile(event.target.files?.[0] ?? null)}
								/>
								<Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
									<Button component="label" htmlFor="swift-proof-file" variant="outlined" size="small" startIcon={<UploadFileIcon />}>
										{swiftProofFile ? t.logistique.replaceDocument : t.logistique.uploadDocument}
									</Button>
									<Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
										{swiftProofFile ? `${t.logistique.selectedFile}: ${swiftProofFile.name}` : t.logistique.fieldSwiftFile}
									</Typography>
								</Stack>
							</Box>
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
							{ text: t.common.cancel, active: false, onClick: () => setShowRejectModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
							{ text: t.logistique.rejectPayment, active: true, onClick: handleRejectPayment, icon: <CloseIcon />, color: '#D32F2F' },
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
	);
};

export default LogistiqueViewClient;
