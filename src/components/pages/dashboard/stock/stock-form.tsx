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
	LocationOn as LocationOnIcon,
	Notes as NotesIcon,
	SwapVert as SwapVertIcon,
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
import { useGetArticlesListQuery } from '@/store/services/article';
import { useGetCompanyQuery } from '@/store/services/company';
import { useGetEmplacementListQuery } from '@/store/services/parameter';
import { useCreateStockAdjustmentMutation, useGetStockBalanceQuery } from '@/store/services/stock';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ArticleClass } from '@/models/classes';
import type { DropDownType } from '@/types/accountTypes';
import type { ApiErrorResponseType, ResponseDataInterface } from '@/types/_initTypes';
import type { StockAdjustmentFormValues } from '@/types/stockTypes';
import { getLabelForKey, parseNumber, setFormikAutoErrors } from '@/utils/helpers';
import { stockAdjustmentSchema } from '@/utils/formValidationSchemas';
import { useToast } from '@/utils/hooks';
import { STOCK_LIST } from '@/utils/routes';
import { stockAdjustmentMovementItems } from '@/utils/rawData';
import { textInputTheme } from '@/utils/themes';
import type { StockFormContentProps, StockFormProps } from '@/types/stockTypes';

const inputTheme = textInputTheme();

const StockFormContent: FC<StockFormContentProps> = ({ token, company_id, balance_id }) => {
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
		data: selectedBalance,
		isLoading: balanceLoading,
		error: balanceError,
	} = useGetStockBalanceQuery({ company_id, id: balance_id ?? 0 }, { skip: !token || !balance_id });
	const {
		data: articlesRaw,
		isLoading: articlesLoading,
		error: articlesError,
	} = useGetArticlesListQuery(
		{ company_id, with_pagination: false, archived: false },
		{ skip: !token || company?.stock_management_enabled !== true },
	);
	const {
		data: emplacements = [],
		isLoading: emplacementsLoading,
		error: emplacementsError,
	} = useGetEmplacementListQuery({ company_id }, { skip: !token || company?.stock_management_enabled !== true });
	const [createAdjustment, { isLoading: adjustmentLoading, error: adjustmentError }] =
		useCreateStockAdjustmentMutation();

	const articles = ((Array.isArray(articlesRaw) ? articlesRaw : articlesRaw?.results) ?? []).filter(
		(item: Partial<ArticleClass>) => item.type_article === 'Produit',
	);
	const articleItems = articles.map((article: Partial<ArticleClass>) => ({
		value: String(article.id),
		code: `${article.reference} — ${article.designation}`,
	})) as DropDownType[];
	const emplacementItems = emplacements.map((location) => ({
		value: String(location.id),
		code: location.nom,
	})) as DropDownType[];

	const formik = useFormik<StockAdjustmentFormValues>({
		initialValues: {
			movement_type: 'adjustment',
			article: selectedBalance?.article ?? null,
			emplacement: selectedBalance?.emplacement ?? null,
			quantity: '',
			reason: '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(stockAdjustmentSchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			await runWithCleanup(
				async () => {
					try {
						await createAdjustment({
							company_id,
							article: Number(values.article),
							emplacement: Number(values.emplacement),
							quantity: Number(values.quantity),
							movement_type: values.movement_type,
							reason: values.reason,
						}).unwrap();
						onSuccess('Mouvement de stock enregistré.');
						router.replace(`${STOCK_LIST}?company_id=${company_id}`);
					} catch (error) {
						onError("Impossible d'enregistrer le mouvement.");
						setFormikAutoErrors({ e: error, setFieldError });
					}
				},
				() => {
					setIsPending(false);
				},
			);
		},
	});

	const selectedMovementType =
		stockAdjustmentMovementItems.find((item) => item.value === formik.values.movement_type) ??
		stockAdjustmentMovementItems[0];
	const selectedArticle = articleItems.find((item) => item.value === String(formik.values.article)) ?? null;
	const selectedEmplacement = emplacementItems.find((item) => item.value === String(formik.values.emplacement)) ?? null;
	const fieldLabels = {
		movement_type: 'Type de mouvement',
		article: 'Article',
		emplacement: 'Emplacement',
		quantity: 'Quantité signée',
		reason: 'Motif',
	};
	const validationErrors = (() => {
		if (!hasAttemptedSubmit) return {};
		return Object.fromEntries(
			Object.entries(formik.errors).filter(([key, value]) => key !== 'globalError' && typeof value === 'string'),
		) as Record<string, string>;
	})();
	const error = companyError || balanceError || articlesError || emplacementsError || adjustmentError;
	const axiosError = error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;
	const isLoading =
		companyLoading || balanceLoading || articlesLoading || emplacementsLoading || adjustmentLoading || isPending;
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
					Retour à l’état du stock
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
									<Inventory2Icon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										Mouvement de stock
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomAutoCompleteSelect
										id="movement_type"
										label="Type de mouvement"
										items={stockAdjustmentMovementItems}
										value={selectedMovementType}
										onChange={(_, value) => void formik.setFieldValue('movement_type', value?.value ?? '')}
										onBlur={formik.handleBlur('movement_type')}
										error={formik.touched.movement_type && Boolean(formik.errors.movement_type)}
										helperText={formik.touched.movement_type ? formik.errors.movement_type : ''}
										noOptionsText="Aucun type de mouvement"
										fullWidth
										size="small"
										theme={theme}
										startIcon={<SwapVertIcon fontSize="small" />}
										required
									/>
									<CustomAutoCompleteSelect
										id="article"
										label="Article"
										items={articleItems}
										value={selectedArticle}
										onChange={(_, value) => {
											const articleId = value ? Number(value.value) : null;
											const article = articles.find((item: Partial<ArticleClass>) => item.id === articleId);
											void formik.setValues((values) => ({
												...values,
												article: articleId,
												emplacement: article?.emplacement ?? null,
											}));
										}}
										onBlur={formik.handleBlur('article')}
										error={formik.touched.article && Boolean(formik.errors.article)}
										helperText={formik.touched.article ? formik.errors.article : ''}
										noOptionsText="Aucun article"
										fullWidth
										size="small"
										theme={theme}
										startIcon={<Inventory2Icon fontSize="small" />}
										required
									/>
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
										label="Quantité signée"
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
												: 'Utilisez une valeur négative pour retirer du stock.'
										}
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<AddIcon fontSize="small" />}
										decimals={3}
										required
									/>
									<CustomTextInput
										id="reason"
										type="textarea"
										label="Motif"
										value={formik.values.reason}
										onChange={formik.handleChange('reason')}
										onBlur={formik.handleBlur('reason')}
										error={formik.touched.reason && Boolean(formik.errors.reason)}
										helperText={formik.touched.reason ? formik.errors.reason : ''}
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<NotesIcon fontSize="small" />}
										required
									/>
								</Stack>
							</CardContent>
						</Card>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText="Enregistrer le mouvement"
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

const StockForm: FC<StockFormProps> = ({ session, company_id, balance_id }) => (
	<StockFormWrapper session={session} company_id={company_id} title="Ajustement de stock" allowedRoles={['Caissier']}>
		{(token) => <StockFormContent token={token} company_id={company_id} balance_id={balance_id} />}
	</StockFormWrapper>
);

export default StockForm;
