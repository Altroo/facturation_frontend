'use client';

import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import type { LogistiqueHistoricalPaymentProps } from '@/types/logistiqueTypes';
import {
	logistiqueEmailDeliveryColor as emailDeliveryColor,
	formatLogistiqueDate as formatDateOnly,
	formatLogistiqueMoney as formatMoney,
	formatNumberWithSpaces,
} from '@/utils/helpers';
import {
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	Info as InfoIcon,
	Inventory as InventoryIcon,
	Payment as PaymentIcon,
	Person as PersonIcon,
	UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import {
	Alert,
	Box,
	Card,
	CardContent,
	Checkbox,
	Chip,
	FormControlLabel,
	Link as MuiLink,
	Stack,
	Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DetailSection, InfoRow } from './logistique-detail-card';
export function LogistiqueHistoricalPayment({
	t,
	order,
	isOrderResponsible,
	isRetryingPaymentEmail,
	handleRetryPaymentEmail,
	isOrderCancelled,
	openPaymentRequest,
	hasCompleteImportTitle,
	canProcessAssignedPayment,
	handleStartPayment,
	openPaymentExecution,
	openPaymentValidation,
	isUpdatingProofEmail,
	handleProofEmailStatus,
	handleConfirmReceipt,
	setShowRejectModal,
	canStartSupplierPreparation,
	isChangingWorkflowStatus,
	handleStartSupplierPreparation,
}: LogistiqueHistoricalPaymentProps) {
	return (
		<DetailSection title={t.logistique.paymentSection} icon={<PaymentIcon color="primary" />}>
			<Stack spacing={2.5}>
				{!order?.is_proforma_step_complete && (
					<Alert variant="outlined" severity="info">
						{t.logistique.paymentStepLocked}
					</Alert>
				)}
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, lg: 6 }}>
						<InfoRow icon={<InfoIcon />} label={t.logistique.fieldStatutTI} value={order?.statut_titre_importation} />
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
						<InfoRow icon={<PaymentIcon />} label={t.logistique.fieldMethodePaiement} value={order?.methode_paiement} />
						{order?.methode_paiement === 'LC' && (
							<InfoRow
								icon={<PaymentIcon />}
								label={t.logistique.fieldAdvancePercentage}
								value={
									order.avance_pourcentage === null || order.avance_pourcentage === ''
										? '-'
										: `${formatNumberWithSpaces(order.avance_pourcentage, 2)} %`
								}
							/>
						)}
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
						variant="outlined"
						severity={order.demande_paiement_email_statut === 'Historique non vérifié' ? 'warning' : 'error'}
						action={
							isOrderResponsible && order.statut_paiement === 'En attente' ? (
								<PrimaryLoadingButton
									buttonText={t.logistique.retryPaymentEmail}
									size="small"
									loading={false}
									active={!isRetryingPaymentEmail}
									inverted
									color="inherit"
									onClick={handleRetryPaymentEmail}
								/>
							) : undefined
						}
					>
						{order.demande_paiement_email_statut === 'Historique non vérifié'
							? t.logistique.emailDeliveryUnverified
							: t.logistique.emailDeliveryError}
						{order.demande_paiement_email_erreur ? `: ${order.demande_paiement_email_erreur}` : ''}
					</Alert>
				)}
				{isOrderResponsible &&
					!isOrderCancelled &&
					order?.is_proforma_step_complete &&
					order?.statut_paiement === 'Non demandé' && (
						<Box sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>
							<PrimaryLoadingButton
								buttonText={t.logistique.requestPayment}
								size="small"
								loading={false}
								active
								inverted
								type="button"
								startIcon={<PaymentIcon />}
								onClick={openPaymentRequest}
							/>
						</Box>
					)}
				{isOrderResponsible && order?.statut_paiement === 'Non demandé' && !hasCompleteImportTitle && (
					<Alert variant="outlined" severity="warning">
						{t.logistique.incompleteImportTitle}
					</Alert>
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
												{formatNumberWithSpaces(installment.pourcentage, 2)} % ·{' '}
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
												variant="outlined"
												severity={installment.preuve_email_statut === 'Historique non vérifié' ? 'warning' : 'error'}
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
											{canProcessAssignedPayment && installment.statut_traitement === 'Paiement à traiter' && (
												<PrimaryLoadingButton
													buttonText={t.logistique.startPayment}
													size="small"
													loading={false}
													active
													inverted
													startIcon={<PaymentIcon />}
													onClick={() => handleStartPayment(installment)}
												/>
											)}
											{canProcessAssignedPayment && installment.statut_traitement === 'Paiement en cours' && (
												<PrimaryLoadingButton
													buttonText={t.logistique.recordPaymentExecution}
													size="small"
													loading={false}
													active
													inverted
													startIcon={<EditIcon />}
													onClick={() => openPaymentExecution(installment)}
												/>
											)}
											{canProcessAssignedPayment &&
												installment.statut_traitement === 'Paiement effectué – Justificatif à joindre' && (
													<PrimaryLoadingButton
														buttonText={t.logistique.validatePayment}
														size="small"
														loading={false}
														active
														inverted
														startIcon={<UploadFileIcon />}
														onClick={() => openPaymentValidation(installment)}
													/>
												)}
											{isOrderResponsible && installment.paiement_valide_le && (
												<FormControlLabel
													control={
														<Checkbox
															size="small"
															checked={installment.preuve_email_statut === 'Envoyé'}
															disabled={isUpdatingProofEmail}
															onChange={(event) => handleProofEmailStatus(installment, event.target.checked)}
														/>
													}
													label={t.logistique.sendPaymentProof}
												/>
											)}
											{isOrderResponsible &&
												installment.preuve_email_statut === 'Envoyé' &&
												installment.preuve_envoyee_fournisseur_le &&
												!installment.reception_confirmee_le && (
													<PrimaryLoadingButton
														buttonText={t.logistique.confirmSupplierReceipt}
														size="small"
														loading={false}
														active
														inverted
														startIcon={<CheckCircleIcon />}
														onClick={() => handleConfirmReceipt(installment)}
													/>
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
					<PrimaryLoadingButton
						buttonText={t.logistique.blockPayment}
						size="small"
						loading={false}
						active
						inverted
						color="error"
						startIcon={<CloseIcon />}
						onClick={() => setShowRejectModal(true)}
					/>
				)}
				{canStartSupplierPreparation && (
					<PrimaryLoadingButton
						buttonText={t.logistique.startSupplierPreparation}
						size="small"
						loading={false}
						active={!isChangingWorkflowStatus}
						inverted
						startIcon={<InventoryIcon />}
						onClick={handleStartSupplierPreparation}
					/>
				)}
			</Stack>
		</DetailSection>
	);
}
