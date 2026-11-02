'use client';

import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import FormattedNumberInput from '@/components/formikElements/formattedNumberInput/formattedNumberInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { LogistiqueDocumentsFormCard } from '@/components/pages/dashboard/logistique/logistique-documents-card';
import type {
	LogistiqueHistoricalLaunchStatusDialogProps,
	LogistiqueHistoricalPaymentExecutionDialogProps,
	LogistiqueHistoricalPaymentRejectionDialogProps,
	LogistiqueHistoricalPaymentValidationDialogProps,
	LogistiqueHistoricalProformaRequestDialogProps,
	LogistiqueHistoricalProformaReviewDialogProps,
	LogistiqueHistoricalRequestPaymentDialogProps,
	LogistiqueLaunchStatus,
	LogistiquePaymentMethod,
	LogistiqueProformaStatus,
} from '@/types/logistiqueTypes';
import { formatLocalDate, formatLogistiqueMoney as formatMoney, formatNumberWithSpaces } from '@/utils/helpers';
import {
	acceptedDocumentTypes,
	logistiqueCurrencyItemsList,
	logistiqueLaunchStatusItemsList,
	logistiquePaymentMethodItemsList,
	logistiqueProformaDecisionItems,
} from '@/utils/rawData';
import { textInputTheme } from '@/utils/themes';
import {
	Add as AddIcon,
	CalendarToday as CalendarTodayIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Info as InfoIcon,
	Notes as NotesIcon,
	Payment as PaymentIcon,
	Public as PublicIcon,
	ReceiptLong as ReceiptLongIcon,
	RequestQuote as RequestQuoteIcon,
	UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import {
	Alert,
	Box,
	Card,
	CardContent,
	Checkbox,
	FormControlLabel,
	InputAdornment,
	Stack,
	Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
const inputTheme = textInputTheme();
export function LogistiqueHistoricalLaunchStatusDialog({
	t,
	setShowLaunchStatusModal,
	handleLaunchStatusChange,
	isChangingLaunchStatus,
	launchStatusDraft,
	setLaunchStatusDraft,
}: LogistiqueHistoricalLaunchStatusDialogProps) {
	return (
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
					placeholder={t.logistique.placeholders.statut_commande_lancement}
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
	);
}

export function LogistiqueHistoricalProformaRequestDialog({
	t,
	setShowProformaRequestModal,
	nextProformaFollowUp,
	handleRecordProformaRequest,
	isRecordingProformaRequest,
	setNextProformaFollowUp,
}: LogistiqueHistoricalProformaRequestDialogProps) {
	return (
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
	);
}

export function LogistiqueHistoricalProformaReviewDialog({
	t,
	setShowProformaReviewModal,
	handleSupplierProformaReview,
	hasRequiredProformaData,
	isProformaDecisionValid,
	isReviewingSupplierProforma,
	targetQuantity,
	order,
	targetPriceLines,
	supplierProformaData,
	setSupplierProformaData,
	proformaDecision,
	setProformaDecision,
	hasProformaVariance,
	supplierProformaFile,
	setSupplierProformaFile,
}: LogistiqueHistoricalProformaReviewDialogProps) {
	return (
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
								<Typography sx={{ fontWeight: 700 }}>{formatMoney(order?.cout_achat, order?.devise)}</Typography>
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
					placeholder={t.logistique.placeholders.numero_proforma_fournisseur}
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
					placeholder={t.logistique.placeholders.montant_proforma_fournisseur}
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
					placeholder={t.logistique.placeholders.devise_proforma_fournisseur}
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
					placeholder={t.logistique.placeholders.incoterm_proforma}
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
					placeholder={t.logistique.placeholders.delai_proforma_jours}
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
					placeholder={t.logistique.placeholders.conditions_paiement_proforma}
					id="conditions_paiement_proforma"
					type="textarea"
					minRows={3}
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
					placeholder={t.logistique.placeholders.decision_proforma}
					id="decision_proforma"
					label={t.logistique.fieldProformaDecision}
					items={logistiqueProformaDecisionItems}
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
								size="small"
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
								size="small"
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
					<FormControlLabel
						control={
							<Checkbox
								size="small"
								checked={supplierProformaData.ecart_autre_proforma}
								onChange={(event) =>
									setSupplierProformaData((prev) => ({
										...prev,
										ecart_autre_proforma: event.target.checked,
									}))
								}
							/>
						}
						label={`${t.logistique.fieldOtherVariance} *`}
					/>
				</Stack>
				<Box sx={{ gridColumn: { sm: '1 / -1' } }}>
					<CustomTextInput
						placeholder={t.logistique.placeholders.notes_ecarts_proforma}
						id="notes_ecarts_proforma"
						disabled={!hasProformaVariance}
						type="textarea"
						minRows={3}
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
						onSelectedFieldChangeAction={() => undefined}
						onFileChangeAction={(_field, file) => setSupplierProformaFile(file)}
						onClearFileAction={() => setSupplierProformaFile(null)}
						isLoading={isReviewingSupplierProforma}
						accept={acceptedDocumentTypes}
					/>
				</Box>
			</Box>
		</ActionModals>
	);
}

export function LogistiqueHistoricalRequestPaymentDialog({
	t,
	setShowRequestPaymentModal,
	hasCompleteImportTitle,
	hasCompletePaymentSchedule,
	handleRequestPayment,
	paymentSchedule,
	setPaymentSchedule,
	scheduledPercentage,
}: LogistiqueHistoricalRequestPaymentDialogProps) {
	return (
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
					<Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' }, gap: 1.5 }}>
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
							placeholder={t.logistique.placeholders.pourcentage}
							id={`pourcentage_${index}`}
							startIcon={<PaymentIcon fontSize="small" />}
							type="text"
							label={t.logistique.fieldPlannedAmount}
							value={item.pourcentage}
							onChange={(event) =>
								setPaymentSchedule((previous) =>
									previous.map((row, rowIndex) =>
										rowIndex === index ? { ...row, pourcentage: event.target.value } : row,
									),
								)
							}
							fullWidth
							size="small"
							theme={inputTheme}
							required
						/>
						<PrimaryLoadingButton
							buttonText={t.common.delete}
							size="small"
							loading={false}
							active={!(paymentSchedule.length === 1)}
							inverted
							iconOnly
							startIcon={<DeleteIcon />}
							color="error"
							aria-label={t.common.delete}
							onClick={() => setPaymentSchedule((previous) => previous.filter((_, rowIndex) => rowIndex !== index))}
						/>
					</Box>
				))}
				<PrimaryLoadingButton
					buttonText={t.logistique.addInstallment}
					size="small"
					loading={false}
					active
					inverted
					startIcon={<AddIcon />}
					onClick={() => setPaymentSchedule((previous) => [...previous, { date_echeance: '', pourcentage: '' }])}
				/>
				<Alert severity={hasCompletePaymentSchedule ? 'success' : 'warning'}>
					{t.logistique.scheduleTotal(formatNumberWithSpaces(scheduledPercentage, 2))}
				</Alert>
			</Stack>
		</ActionModals>
	);
}

export function LogistiqueHistoricalPaymentExecutionDialog({
	t,
	setShowExecutionModal,
	setSelectedInstallment,
	hasCompletePaymentData,
	handleRecordPaymentExecution,
	paymentData,
	setPaymentData,
}: LogistiqueHistoricalPaymentExecutionDialogProps) {
	return (
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
					placeholder={t.logistique.placeholders.montant_paiement}
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
					placeholder={t.logistique.placeholders.devise_paiement}
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
					placeholder={t.logistique.placeholders.banque_paiement}
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
					placeholder={t.logistique.placeholders.reference_paiement}
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
					placeholder={t.logistique.placeholders.methode_paiement}
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
						placeholder={t.logistique.placeholders.commentaire_paiement}
						id="commentaire_paiement"
						type="textarea"
						minRows={3}
						label={t.logistique.fieldCommentairePaiement}
						value={paymentData.commentaire_paiement}
						onChange={(event) => setPaymentData((prev) => ({ ...prev, commentaire_paiement: event.target.value }))}
						fullWidth
						size="small"
						theme={inputTheme}
						startIcon={<NotesIcon fontSize="small" />}
					/>
				</Box>
			</Box>
		</ActionModals>
	);
}

export function LogistiqueHistoricalPaymentValidationDialog({
	t,
	setShowValidateModal,
	setSelectedInstallment,
	setSwiftProofFile,
	swiftProofFile,
	handleValidatePayment,
	swiftProofInputRef,
}: LogistiqueHistoricalPaymentValidationDialogProps) {
	return (
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
					ref={swiftProofInputRef}
					type="file"
					accept={acceptedDocumentTypes}
					hidden
					onChange={(event) => setSwiftProofFile(event.target.files?.[0] ?? null)}
				/>
				<Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
					<PrimaryLoadingButton
						buttonText={swiftProofFile ? t.logistique.replaceDocument : t.logistique.uploadDocument}
						size="small"
						loading={false}
						active
						inverted
						startIcon={<UploadFileIcon />}
						onClick={() => swiftProofInputRef.current?.click()}
					/>
					<Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
						{swiftProofFile ? `${t.logistique.selectedFile}: ${swiftProofFile.name}` : t.logistique.fieldBankProof}
					</Typography>
				</Stack>
			</Box>
		</ActionModals>
	);
}

export function LogistiqueHistoricalPaymentRejectionDialog({
	t,
	setShowRejectModal,
	handleRejectPayment,
	rejectNote,
	setRejectNote,
}: LogistiqueHistoricalPaymentRejectionDialogProps) {
	return (
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
				placeholder={t.logistique.placeholders.reject_note}
				id="reject_note"
				type="textarea"
				minRows={3}
				label={t.reglements.fieldObservations}
				value={rejectNote}
				onChange={(event) => setRejectNote(event.target.value)}
				fullWidth
				size="small"
				theme={inputTheme}
				startIcon={<NotesIcon fontSize="small" />}
			/>
		</ActionModals>
	);
}
