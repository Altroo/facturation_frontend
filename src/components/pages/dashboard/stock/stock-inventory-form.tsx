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
	FactCheck as FactCheckIcon,
	Inventory2 as Inventory2Icon,
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
import { useGetArticlesListQuery } from '@/store/services/article';
import { useGetCompanyQuery } from '@/store/services/company';
import { useGetEmplacementListQuery } from '@/store/services/parameter';
import { useCreateInventoryMutation, useValidateInventoryMutation } from '@/store/services/stock';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ArticleClass } from '@/models/classes';
import type { DropDownType } from '@/types/accountTypes';
import type { ApiErrorResponseType, ResponseDataInterface } from '@/types/_initTypes';
import type { StockInventoryFormValues } from '@/types/stockTypes';
import { getLabelForKey, parseNumber, setFormikAutoErrors } from '@/utils/helpers';
import { stockInventorySchema } from '@/utils/formValidationSchemas';
import { useToast } from '@/utils/hooks';
import { STOCK_INVENTORY_VIEW } from '@/utils/routes';
import { textInputTheme } from '@/utils/themes';
import type { StockInventoryFormContentProps, StockInventoryFormProps } from '@/types/stockTypes';

const inputTheme = textInputTheme();

const StockInventoryFormContent: FC<StockInventoryFormContentProps> = ({ token, company_id }) => {
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
	const [createInventory, { isLoading: createLoading, error: createError }] = useCreateInventoryMutation();
	const [validateInventory, { isLoading: validateLoading, error: validateError }] = useValidateInventoryMutation();

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

	const formik = useFormik<StockInventoryFormValues>({
		initialValues: {
			article: null,
			emplacement: null,
			counted_quantity: '',
			reference: '',
			note: '',
			globalError: '',
		},
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(stockInventorySchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			let createdId: number | null = null;
			await runWithCleanup(
				async () => {
					try {
						const inventory = await createInventory({
							company_id,
							emplacement: Number(values.emplacement),
							reference: values.reference,
							note: values.note,
							lines: [{ article: Number(values.article), counted_quantity: Number(values.counted_quantity) }],
						}).unwrap();
						createdId = inventory.id;
						await validateInventory({ company_id, id: inventory.id }).unwrap();
						onSuccess('Inventaire validé et stock ajusté.');
						router.replace(STOCK_INVENTORY_VIEW(inventory.id, company_id));
					} catch (error) {
						if (createdId !== null) {
							onError("L'inventaire a été conservé en brouillon et peut être validé depuis la liste.");
							router.replace(STOCK_INVENTORY_VIEW(createdId, company_id));
							return;
						}
						onError("Impossible de créer l'inventaire.");
						setFormikAutoErrors({ e: error, setFieldError });
					}
				},
				() => {
					setIsPending(false);
				},
			);
		},
	});

	const selectedArticle = articleItems.find((item) => item.value === String(formik.values.article)) ?? null;
	const selectedEmplacement = emplacementItems.find((item) => item.value === String(formik.values.emplacement)) ?? null;
	const fieldLabels = {
		article: 'Article',
		emplacement: 'Emplacement',
		counted_quantity: 'Quantité comptée',
		reference: 'Référence',
		note: 'Note',
	};
	const validationErrors = (() => {
		if (!hasAttemptedSubmit) return {};
		return Object.fromEntries(
			Object.entries(formik.errors).filter(([key, value]) => key !== 'globalError' && typeof value === 'string'),
		) as Record<string, string>;
	})();
	const error = companyError || articlesError || emplacementsError || createError || validateError;
	const axiosError = error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;
	const isLoading =
		companyLoading || articlesLoading || emplacementsLoading || createLoading || validateLoading || isPending;
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
					Retour aux inventaires
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
									<FactCheckIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										Périmètre de l’inventaire
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
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
								</Stack>
							</CardContent>
						</Card>
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<ReceiptLongIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										Comptage physique
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<FormattedNumberInput
										id="counted_quantity"
										type="text"
										label="Quantité comptée"
										value={formik.values.counted_quantity}
										onChange={(event) => {
											const parsed = parseNumber(event.target.value);
											if (parsed !== null && parsed < 0) return;
											void formik.setFieldValue('counted_quantity', parsed === null ? event.target.value : parsed);
										}}
										onBlur={formik.handleBlur('counted_quantity')}
										error={formik.touched.counted_quantity && Boolean(formik.errors.counted_quantity)}
										helperText={formik.touched.counted_quantity ? formik.errors.counted_quantity : ''}
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<NumbersIcon fontSize="small" />}
										decimals={3}
										slotProps={{ htmlInput: { min: 0 } }}
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

const StockInventoryForm: FC<StockInventoryFormProps> = ({ session, company_id }) => (
	<StockFormWrapper session={session} company_id={company_id} title="Nouvel inventaire" allowedRoles={['Caissier']}>
		{(token) => <StockInventoryFormContent token={token} company_id={company_id} />}
	</StockFormWrapper>
);

export default StockInventoryForm;
