'use client';

import { LogistiqueHistoricalPayment } from './logistique-historical-payment';

import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { LogistiqueDocumentsViewCard } from '@/components/pages/dashboard/logistique/logistique-documents-card';
import type { LogistiqueHistoricalDetailsProps } from '@/types/logistiqueTypes';
import {
	formatDate,
	formatLogistiqueDate as formatDateOnly,
	formatLogistiqueMoney as formatMoney,
	formatNumberWithSpaces,
} from '@/utils/helpers';
import { acceptedDocumentTypes, documentFields } from '@/utils/rawData';
import { ARTICLES_VIEW } from '@/utils/routes';
import { textInputTheme } from '@/utils/themes';
import {
	AssignmentTurnedIn as AssignmentTurnedInIcon,
	Business as BusinessIcon,
	CalendarToday as CalendarTodayIcon,
	CheckCircle as CheckCircleIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	ExpandMore as ExpandMoreIcon,
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
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Chip,
	Divider,
	Link as MuiLink,
	Stack,
	Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import NextLink from 'next/link';
import { DetailCard, DetailSection, InfoRow } from './logistique-detail-card';
const inputTheme = textInputTheme();
export function LogistiqueHistoricalDetails({
	workflowSteps,
	selectedStep,
	t,
	order,
	sourceOrderDates,
	canManage,
	isOrderCancelled,
	setLaunchStatusDraft,
	setShowLaunchStatusModal,
	isRecordingProformaRequest,
	setShowProformaRequestModal,
	targetQuantity,
	targetPriceLines,
	isReviewingSupplierProforma,
	openSupplierProformaReview,
	documentLabels,
	isOrderResponsible,
	isRetryingPaymentEmail,
	handleRetryPaymentEmail,
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
	company_id,
	events,
	processRemark,
	setProcessRemark,
	processFile,
	processFileInputRef,
	setProcessFile,
	isAddingProcessNote,
	handleAddProcessNote,
}: LogistiqueHistoricalDetailsProps) {
	return (
		<DetailCard title={workflowSteps[selectedStep]} icon={<DescriptionIcon color="primary" />}>
			<Stack spacing={3}>
				{selectedStep >= 3 && selectedStep <= 6 && (
					<Stack spacing={2}>
						<InfoRow icon={<InfoIcon />} label={t.logistique.fieldStepStatus} value={order?.statut} />
						{selectedStep === 3 && (
							<InfoRow
								icon={<CalendarTodayIcon />}
								label={t.logistique.fieldDatePrevue}
								value={formatDateOnly(order?.date_prevue)}
							/>
						)}
						{selectedStep === 4 && (
							<>
								<InfoRow icon={<LocalShippingIcon />} label={t.logistique.fieldTransport} value={order?.transport} />
								<InfoRow
									icon={<DescriptionIcon />}
									label={t.logistique.fieldOriginalDocumentsStatus}
									value={order?.documents_originaux_requis ? order.statut_documents_originaux : 'Non requis'}
								/>
							</>
						)}
						{selectedStep === 5 && (
							<>
								<InfoRow icon={<PublicIcon />} label={t.logistique.fieldOrigine} value={order?.origine_marchandise} />
								<InfoRow
									icon={<DescriptionIcon />}
									label={t.logistique.fieldNature}
									value={order?.nature_marchandise}
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
							</>
						)}
						{selectedStep === 6 && (
							<InfoRow
								icon={<CalendarTodayIcon />}
								label={t.logistique.fieldDateReelle}
								value={formatDateOnly(order?.date_reelle)}
							/>
						)}
					</Stack>
				)}

				{selectedStep === 0 && (
					<>
						<Stack spacing={2.5}>
							<Alert variant="outlined" severity={order?.is_launch_step_complete ? 'success' : 'info'}>
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
									<InfoRow icon={<CalendarTodayIcon />} label={t.logistique.fieldOrderDate} value={sourceOrderDates} />
									<InfoRow icon={<BusinessIcon />} label={t.logistique.colClients} value={order?.clients_display} />
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
										size="small"
										loading={false}
										active
										inverted
										type="button"
										startIcon={<EditIcon />}
										onClick={() => {
											setLaunchStatusDraft(order?.statut_commande_lancement ?? 'À lancer');
											setShowLaunchStatusModal(true);
										}}
									/>
									<PrimaryLoadingButton
										buttonText={t.logistique.recordProformaRequest}
										size="small"
										loading={isRecordingProformaRequest}
										active={!isRecordingProformaRequest}
										inverted
										type="button"
										startIcon={<RequestQuoteIcon />}
										onClick={() => setShowProformaRequestModal(true)}
									/>
								</Stack>
							)}
						</Stack>
					</>
				)}

				{selectedStep === 1 && (
					<>
						<Stack spacing={2.5}>
							<Alert
								variant="outlined"
								severity={
									!order?.is_launch_step_complete ? 'info' : order?.is_proforma_step_complete ? 'success' : 'warning'
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
										value={order?.ecart_quantite_proforma ? t.logistique.varianceDetected : t.logistique.noVariance}
									/>
									<InfoRow
										icon={<WarningIcon />}
										label={t.logistique.fieldOtherVariance}
										value={order?.ecart_autre_proforma ? t.logistique.varianceDetected : t.logistique.noVariance}
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
											size="small"
											loading={isReviewingSupplierProforma}
											active={!isReviewingSupplierProforma}
											inverted
											type="button"
											startIcon={<DescriptionIcon />}
											onClick={openSupplierProformaReview}
										/>
									</Box>
								)}
						</Stack>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, lg: 6 }}>
								<InfoRow icon={<PublicIcon />} label={t.logistique.fieldOrigine} value={order?.origine_marchandise} />
								<InfoRow icon={<ScaleIcon />} label={t.logistique.fieldPoidsNet} value={order?.poids_net} />
							</Grid>
							<Grid size={{ xs: 12, lg: 6 }}>
								<InfoRow
									icon={<DescriptionIcon />}
									label={t.logistique.fieldNature}
									value={order?.nature_marchandise}
								/>
								<InfoRow icon={<ScaleIcon />} label={t.logistique.fieldPoidsBrut} value={order?.poids_brut} />
							</Grid>
						</Grid>
					</>
				)}

				{order?.alerts?.length ? (
					<DetailSection title={t.logistique.alertsSection} icon={<WarningIcon color="warning" />}>
						<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
							{order.alerts.map((alert) => (
								<Chip key={alert} icon={<WarningIcon />} label={alert} color="warning" variant="outlined" />
							))}
						</Stack>
					</DetailSection>
				) : null}

				{selectedStep === 0 && (
					<InfoRow icon={<DescriptionIcon />} label={t.logistique.fieldDescription} value={order?.description} />
				)}

				{selectedStep === 2 && (
					<DetailSection title={t.logistique.importSection} icon={<DescriptionIcon color="primary" />}>
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
					</DetailSection>
				)}

				{[1, 2, 4, 7].includes(selectedStep) && (
					<LogistiqueDocumentsViewCard
						items={documentFields
							.filter(
								(field) =>
									({
										proforma_fournisseur_file: 1,
										titre_importation_file: 2,
										swift_file: 2,
										documents_originaux_file: 4,
										justificatifs_file: 7,
									})[field] === selectedStep,
							)
							.map((field) => ({
								field,
								label: documentLabels[field],
								currentUrl: order?.[field] ?? null,
							}))}
					/>
				)}

				{selectedStep === 2 && (
					<LogistiqueHistoricalPayment
						t={t}
						order={order}
						isOrderResponsible={isOrderResponsible}
						isRetryingPaymentEmail={isRetryingPaymentEmail}
						handleRetryPaymentEmail={handleRetryPaymentEmail}
						isOrderCancelled={isOrderCancelled}
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
					/>
				)}

				{selectedStep === 2 && (
					<DetailSection title={t.logistique.traceabilitySection} icon={<HistoryIcon color="primary" />}>
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
					</DetailSection>
				)}

				{selectedStep === 7 && (
					<DetailSection title={t.logistique.costsSection} icon={<LocalShippingIcon color="primary" />}>
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
					</DetailSection>
				)}

				{(selectedStep === 0 || selectedStep === 1) && (
					<DetailSection title={t.logistique.linesSection} icon={<ReceiptLongIcon color="primary" />}>
						<Stack divider={<Divider flexItem />} spacing={2}>
							{order?.lignes?.length ? (
								order.lignes.map((line) => (
									<Stack key={line.id} divider={<Divider flexItem />} spacing={0}>
										<InfoRow
											icon={<InventoryIcon />}
											label={t.logistique.linesSection}
											value={
												<Stack spacing={0.25}>
													<MuiLink
														component={NextLink}
														href={ARTICLES_VIEW(line.article, company_id)}
														underline="hover"
														sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}
													>
														{line.article_reference}
														<OpenInNewIcon sx={{ fontSize: 16 }} />
													</MuiLink>
													<Typography variant="body2">{line.designation}</Typography>
												</Stack>
											}
										/>
										<InfoRow icon={<BusinessIcon />} label={t.logistique.colClients} value={line.client_name} />
										<InfoRow
											icon={<InventoryIcon />}
											label={t.documentForm.colQuantite}
											value={formatNumberWithSpaces(line.quantity, 3)}
										/>
										<InfoRow
											icon={<PaymentIcon />}
											label={t.totalsCard.totalPrixAchat}
											value={formatMoney(line.total_achat, line.devise_prix_achat)}
										/>
										{line.incoming_active && (
											<InfoRow
												icon={<LocalShippingIcon />}
												label={t.logistique.incomingStock}
												value={`${t.logistique.receivedQuantity} : ${formatNumberWithSpaces(line.received_quantity, 3)} — ${t.logistique.remainingQuantity} : ${formatNumberWithSpaces(line.remaining_quantity, 3)} — ${line.expected_emplacement_name || t.logistique.locationToDefine}`}
											/>
										)}
										{line.project_reference && (
											<InfoRow
												icon={<AssignmentTurnedInIcon />}
												label={t.logistique.colProjects}
												value={line.project_reference}
											/>
										)}
									</Stack>
								))
							) : (
								<Typography variant="body2" color="text.secondary">
									{t.common.noData}
								</Typography>
							)}
						</Stack>
					</DetailSection>
				)}

				<Accordion disableGutters elevation={0}>
					<AccordionSummary expandIcon={<ExpandMoreIcon />}>
						<Typography sx={{ fontWeight: 600 }}>{t.logistique.historySection}</Typography>
					</AccordionSummary>
					<AccordionDetails>
						{' '}
						<Stack spacing={0}>
							{events.length ? (
								events.map((event, index) => (
									<Box
										key={event.id}
										sx={{
											display: 'grid',
											gridTemplateColumns: '32px minmax(0, 1fr)',
											columnGap: 2,
											pb: index === events.length - 1 ? 0 : 2.5,
										}}
									>
										<Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', pt: 0.75 }}>
											<Box
												sx={{
													width: 12,
													height: 12,
													borderRadius: '50%',
													bgcolor: 'primary.main',
													border: '3px solid',
													borderColor: 'background.paper',
													boxShadow: '0 0 0 2px',
													color: 'primary.light',
													zIndex: 1,
												}}
											/>
											{index < events.length - 1 && (
												<Box
													sx={{
														position: 'absolute',
														top: 16,
														bottom: -20,
														width: 2,
														bgcolor: 'divider',
													}}
												/>
											)}
										</Box>
										<Stack spacing={0.75} sx={{ minWidth: 0 }}>
											<Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 0.5 }}>
												<Typography sx={{ fontWeight: 700 }}>{event.action}</Typography>
												<Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
													{formatDate(event.date_created)}
												</Typography>
											</Stack>
											<Typography variant="body2" color="text.secondary">
												{event.user_name || '-'}
											</Typography>
											{(event.old_value || event.new_value) && (
												<Chip
													label={`${event.old_value || '-'} → ${event.new_value || '-'}`}
													size="small"
													variant="outlined"
													sx={{ alignSelf: 'flex-start', maxWidth: '100%' }}
												/>
											)}
											{event.note && <Typography variant="body2">{event.note}</Typography>}
										</Stack>
									</Box>
								))
							) : (
								<Typography variant="body2" color="text.secondary">
									{t.common.noData}
								</Typography>
							)}
						</Stack>
					</AccordionDetails>
				</Accordion>

				<Accordion disableGutters elevation={0}>
					<AccordionSummary expandIcon={<ExpandMoreIcon />}>
						<Typography sx={{ fontWeight: 600 }}>Remarques du processus</Typography>
					</AccordionSummary>
					<AccordionDetails>
						{' '}
						<Stack spacing={2}>
							{(canManage || isOrderResponsible || canProcessAssignedPayment) && !isOrderCancelled && (
								<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 1.5 }}>
									<CustomTextInput
										placeholder={t.logistique.placeholders.process_remark}
										id="process_remark"
										type="textarea"
										minRows={3}
										label="Remarque"
										value={processRemark}
										onChange={(event) => setProcessRemark(event.target.value)}
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<NotesIcon fontSize="small" />}
									/>
									<Stack spacing={1} sx={{ minWidth: 210 }}>
										<>
											<PrimaryLoadingButton
												buttonText={processFile?.name || 'Joindre un fichier'}
												size="small"
												loading={false}
												active
												inverted
												startIcon={<UploadFileIcon />}
												onClick={() => processFileInputRef.current?.click()}
											/>
											<input
												ref={processFileInputRef}
												type="file"
												hidden
												accept={acceptedDocumentTypes}
												onChange={(event) => setProcessFile(event.target.files?.[0] ?? null)}
											/>
										</>
										<PrimaryLoadingButton
											buttonText="Ajouter"
											size="small"
											loading={false}
											active={!!processRemark.trim() && !isAddingProcessNote}
											onClick={handleAddProcessNote}
										/>
									</Stack>
								</Box>
							)}
							<Divider />
							{order?.process_notes?.length ? (
								order.process_notes.map((note) => (
									<Stack key={note.id} spacing={0.5} sx={{ py: 1 }}>
										<Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
											<Chip label={note.statut} size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
											<Typography variant="caption" color="text.secondary">
												{note.user_name || '-'} · {formatDate(note.date_created)}
											</Typography>
										</Stack>
										<Typography>{note.remarque}</Typography>
										{note.fichier && (
											<MuiLink href={note.fichier} target="_blank" rel="noopener noreferrer">
												Ouvrir la pièce jointe
											</MuiLink>
										)}
									</Stack>
								))
							) : (
								<Typography variant="body2" color="text.secondary">
									Aucune remarque.
								</Typography>
							)}
						</Stack>
					</AccordionDetails>
				</Accordion>
			</Stack>
		</DetailCard>
	);
}
