'use client';

import { runWithCleanup } from '@/utils/runWithCleanup';
import { useState, type FC, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Inventory2 as Inventory2Icon,
	LocalShipping as LocalShippingIcon,
	LocationOn as LocationOnIcon,
	Notes as NotesIcon,
	Numbers as NumbersIcon,
	ReceiptLong as ReceiptLongIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import FormattedNumberInput from '@/components/formikElements/formattedNumberInput/formattedNumberInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import StockFormWrapper from '@/components/pages/dashboard/stock/stock-form-wrapper';
import StockDisabledState from '@/components/pages/dashboard/stock/stock-disabled-state';
import { useGetCompanyQuery } from '@/store/services/company';
import { useGetLogistiqueListQuery, useGetLogistiqueQuery } from '@/store/services/logistique';
import { useGetEmplacementListQuery } from '@/store/services/parameter';
import { useCreateStockReceiptMutation, useValidateStockReceiptMutation } from '@/store/services/stock';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { DropDownType } from '@/types/accountTypes';
import type { ApiErrorResponseType, ResponseDataInterface } from '@/types/_initTypes';
import type { LogistiqueListResponse } from '@/types/logistiqueTypes';
import type { StockReceiptFormValues } from '@/types/stockTypes';
import { formatNumberWithSpaces, getLabelForKey, parseNumber, setFormikAutoErrors } from '@/utils/helpers';
import { stockReceiptSchema } from '@/utils/formValidationSchemas';
import { useToast } from '@/utils/hooks';
import { STOCK_RECEIPT_VIEW } from '@/utils/routes';
import { textInputTheme } from '@/utils/themes';
import type { StockReceiptFormContentProps, StockReceiptFormProps } from '@/types/stockTypes';

const inputTheme = textInputTheme();

const StockReceiptFormContent: FC<StockReceiptFormContentProps> = ({ token, company_id }) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [isPending, setIsPending] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const {
		data: company,
		isLoading: companyLoading,
		error: companyError,
	} = useGetCompanyQuery({ id: company_id }, { skip: !token });
	const {
		data: ordersRaw,
		isLoading: ordersLoading,
		error: ordersError,
	} = useGetLogistiqueListQuery(
		{ company_id, with_pagination: true, page: 1, pageSize: 100 },
		{ skip: !token || company?.stock_management_enabled !== true },
	);
	const {
		data: emplacements = [],
		isLoading: emplacementsLoading,
		error: emplacementsError,
	} = useGetEmplacementListQuery({ company_id }, { skip: !token || company?.stock_management_enabled !== true });
	const [createReceipt, { isLoading: createLoading, error: createError }] = useCreateStockReceiptMutation();
	const [validateReceipt, { isLoading: validateLoading, error: validateError }] = useValidateStockReceiptMutation();

	const eligibleOrders = (() => {
		const orders = (ordersRaw as LogistiqueListResponse | undefined)?.results ?? [];
		return orders.filter(
			(order) =>
				order.statut_commande_lancement === 'Terminée' &&
				order.statut_global !== 'Annulé' &&
				!['Réception locale', 'Livraison client', 'Clôture', 'Annulé'].includes(order.statut),
		);
	})();
	const orderItems = eligibleOrders.map((order) => ({
		value: String(order.id),
		code: `${order.numero_commande} — ${order.fournisseur}`,
	})) as DropDownType[];
	const emplacementItems = emplacements.map((location) => ({
		value: String(location.id),
		code: location.nom,
	})) as DropDownType[];

	const formik = useFormik<StockReceiptFormValues>({
		initialValues: {
			logistics_order: null,
			logistics_line: null,
			emplacement: null,
			quantity: '',
			reference: '',
			note: '',
			globalError: '',
		},
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(stockReceiptSchema),
		onSubmit: async (values, { setFieldError }) => {
			const selectedLine = incomingLines.find((line) => line.id === values.logistics_line);
			if (!selectedLine) return;
			setHasAttemptedSubmit(true);
			setIsPending(true);
			let createdId: number | null = null;
			await runWithCleanup(
				async () => {
					try {
						const receipt = await createReceipt({
							company_id,
							logistics_order: Number(values.logistics_order),
							reference: values.reference,
							note: values.note,
							lines: [
								{
									logistics_line: selectedLine.id,
									article: selectedLine.article,
									emplacement: Number(values.emplacement),
									quantity: Number(values.quantity),
								},
							],
						}).unwrap();
						createdId = receipt.id;
						await validateReceipt({ company_id, id: receipt.id }).unwrap();
						onSuccess('Réception validée et ajoutée au stock.');
						router.replace(STOCK_RECEIPT_VIEW(receipt.id, company_id));
					} catch (error) {
						if (createdId !== null) {
							onError('La réception a été conservée en brouillon et peut être validée depuis la liste.');
							router.replace(STOCK_RECEIPT_VIEW(createdId, company_id));
							return;
						}
						onError('Impossible de créer la réception.');
						setFormikAutoErrors({ e: error, setFieldError });
					}
				},
				() => {
					setIsPending(false);
				},
			);
		},
	});

	const {
		data: selectedOrder,
		isLoading: selectedOrderLoading,
		error: selectedOrderError,
	} = useGetLogistiqueQuery(
		{ id: formik.values.logistics_order ?? 0 },
		{ skip: !token || !formik.values.logistics_order },
	);
	const { incomingLines, lineItems } = (() => {
		const lines = (selectedOrder?.lignes ?? []).filter(
			(line) => line.incoming_active && Number(line.remaining_quantity) > 0,
		);
		return {
			incomingLines: lines,
			lineItems: lines.map((line) => ({
				value: String(line.id),
				code: `${line.article_reference} — ${line.designation} — restant ${formatNumberWithSpaces(line.remaining_quantity, 3)}`,
			})),
		};
	})();
	const selectedLine = incomingLines.find((line) => line.id === formik.values.logistics_line);
	const selectedOrderItem = orderItems.find((item) => item.value === String(formik.values.logistics_order)) ?? null;
	const selectedLineItem = lineItems.find((item) => item.value === String(formik.values.logistics_line)) ?? null;
	const selectedEmplacement = emplacementItems.find((item) => item.value === String(formik.values.emplacement)) ?? null;
	const fieldLabels = {
		logistics_order: 'Dossier logistique',
		logistics_line: 'Article entrant',
		emplacement: 'Emplacement',
		quantity: 'Quantité reçue',
		reference: 'Référence',
		note: 'Note',
	};
	const validationErrors = (() => {
		if (!hasAttemptedSubmit) return {};
		return Object.fromEntries(
			Object.entries(formik.errors).filter(([key, value]) => key !== 'globalError' && typeof value === 'string'),
		) as Record<string, string>;
	})();
	const error = companyError || ordersError || emplacementsError || selectedOrderError || createError || validateError;
	const axiosError = error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;
	const isLoading =
		companyLoading || ordersLoading || emplacementsLoading || createLoading || validateLoading || isPending;
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ pt: 2, justifyContent: 'space-between' }}>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => router.back()}
					sx={{
						whiteSpace: 'nowrap',
						px: { xs: 1.5, sm: 2, md: 3 },
						py: { xs: 0.8, sm: 1, md: 1 },
						fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
					}}
				>
					Retour aux réceptions
				</Button>
			</Stack>
			{Object.keys(validationErrors).length > 0 && (
				<Alert severity="error" icon={<WarningIcon />}>
					<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
						Erreurs de validation
					</Typography>
					<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
						{Object.entries(validationErrors).map(([key, message]) => (
							<li key={key}>
								<Typography variant="body2">
									{getLabelForKey(fieldLabels, key)} : {message}
								</Typography>
							</li>
						))}
					</ul>
				</Alert>
			)}
			{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
			{company && !company.stock_management_enabled ? (
				<StockDisabledState />
			) : isLoading ? (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			) : shouldShowError ? (
				<ApiAlert errorDetails={axiosError?.data.details} />
			) : (
				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<LocalShippingIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										Dossier logistique
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomAutoCompleteSelect
										id="logistics_order"
										label="Dossier logistique"
										items={orderItems}
										value={selectedOrderItem}
										onChange={(_, value) => {
											void formik.setFieldValue('logistics_order', value ? Number(value.value) : null);
											void formik.setFieldValue('logistics_line', null);
											void formik.setFieldValue('emplacement', null);
											void formik.setFieldValue('quantity', '');
										}}
										onBlur={formik.handleBlur('logistics_order')}
										error={formik.touched.logistics_order && Boolean(formik.errors.logistics_order)}
										helperText={formik.touched.logistics_order ? formik.errors.logistics_order : ''}
										noOptionsText="Aucun dossier prêt à réceptionner"
										fullWidth
										size="small"
										theme={theme}
										startIcon={<LocalShippingIcon fontSize="small" />}
										required
									/>
									<CustomAutoCompleteSelect
										id="logistics_line"
										label="Article entrant"
										items={lineItems}
										value={selectedLineItem}
										onChange={(_, value) => {
											const lineId = value ? Number(value.value) : null;
											const line = incomingLines.find((item) => item.id === lineId);
											void formik.setFieldValue('logistics_line', lineId);
											void formik.setFieldValue('emplacement', line?.expected_emplacement ?? null);
										}}
										onBlur={formik.handleBlur('logistics_line')}
										error={formik.touched.logistics_line && Boolean(formik.errors.logistics_line)}
										helperText={
											selectedOrderLoading
												? 'Chargement des articles entrants…'
												: formik.touched.logistics_line
													? formik.errors.logistics_line
													: ''
										}
										noOptionsText="Aucun article entrant"
										fullWidth
										size="small"
										theme={theme}
										startIcon={<Inventory2Icon fontSize="small" />}
										disabled={!formik.values.logistics_order || selectedOrderLoading}
										required
									/>
								</Stack>
							</CardContent>
						</Card>
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<ReceiptLongIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										Détails de la réception
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomAutoCompleteSelect
										id="emplacement"
										label="Emplacement"
										items={emplacementItems}
										value={selectedEmplacement}
										onChange={(_, value) =>
											void formik.setFieldValue('emplacement', value ? Number(value.value) : null)
										}
										onBlur={formik.handleBlur('emplacement')}
										error={formik.touched.emplacement && Boolean(formik.errors.emplacement)}
										helperText={formik.touched.emplacement ? formik.errors.emplacement : ''}
										noOptionsText="Aucun emplacement"
										fullWidth
										size="small"
										theme={theme}
										startIcon={<LocationOnIcon fontSize="small" />}
										required
									/>
									<FormattedNumberInput
										id="quantity"
										type="text"
										label="Quantité reçue"
										value={formik.values.quantity}
										onChange={(event) => {
											const parsed = parseNumber(event.target.value);
											void formik.setFieldValue('quantity', parsed === null ? event.target.value : parsed);
										}}
										onBlur={formik.handleBlur('quantity')}
										error={formik.touched.quantity && Boolean(formik.errors.quantity)}
										helperText={
											formik.touched.quantity && formik.errors.quantity
												? formik.errors.quantity
												: selectedLine
													? `Maximum : ${formatNumberWithSpaces(selectedLine.remaining_quantity, 3)}`
													: ''
										}
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<NumbersIcon fontSize="small" />}
										decimals={3}
										disabled={!selectedLine}
										slotProps={{
											htmlInput: { min: 0, max: selectedLine ? Number(selectedLine.remaining_quantity) : undefined },
										}}
										required
									/>
									<CustomTextInput
										id="reference"
										type="text"
										label="Référence"
										value={formik.values.reference}
										onChange={formik.handleChange('reference')}
										onBlur={formik.handleBlur('reference')}
										error={formik.touched.reference && Boolean(formik.errors.reference)}
										helperText={formik.touched.reference ? formik.errors.reference : ''}
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<ReceiptLongIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="note"
										type="textarea"
										label="Note"
										value={formik.values.note}
										onChange={formik.handleChange('note')}
										onBlur={formik.handleBlur('note')}
										error={formik.touched.note && Boolean(formik.errors.note)}
										helperText={formik.touched.note ? formik.errors.note : ''}
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<NotesIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText="Enregistrer et valider"
								active={!isPending}
								type="submit"
								loading={isPending}
								startIcon={<AddIcon />}
								onClick={(event: MouseEvent<HTMLButtonElement>) => {
									setHasAttemptedSubmit(true);
									if (!formik.isValid) {
										event.preventDefault();
										formik.handleSubmit();
										onError('Veuillez corriger les erreurs du formulaire.');
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}
								}}
								cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
							/>
						</Box>
					</Stack>
				</form>
			)}
		</Stack>
	);
};

const StockReceiptForm: FC<StockReceiptFormProps> = ({ session, company_id }) => (
	<StockFormWrapper
		session={session}
		company_id={company_id}
		title="Nouvelle réception de stock"
		allowedRoles={['Logistique']}
	>
		{(token) => <StockReceiptFormContent token={token} company_id={company_id} />}
	</StockFormWrapper>
);

export default StockReceiptForm;
