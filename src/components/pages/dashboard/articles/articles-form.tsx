'use client';

import React, { useMemo, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	IconButton,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Business as BusinessIcon,
	CreditCard as CreditCardIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Fingerprint as FingerprintIcon,
	LocationOn as LocationOnIcon,
	Notes as NotesIcon,
	PhotoCamera as PhotoCameraIcon,
	Receipt as ReceiptIcon,
	Refresh as RefreshIcon,
	Sell as SellIcon,
	ShoppingCart as ShoppingCartIcon,
	Star as StarIcon,
	Straighten as StraightenIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import FormattedNumberInput from '@/components/formikElements/formattedNumberInput/formattedNumberInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { ARTICLES_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import type { DropDownType } from '@/types/accountTypes';
import { useLanguage, useToast } from '@/utils/hooks';
import {
	useAddArticleMutation,
	useEditArticleMutation,
	useGetArticleQuery,
	useGetCodeReferenceQuery,
} from '@/store/services/article';

import { getLabelForKey, parseNumber, setFormikAutoErrors } from '@/utils/helpers';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import type { ArticleSchemaType, TypeArticleType } from '@/types/articleTypes';
import {
	useAddCategorieMutation,
	useAddEmplacementMutation,
	useAddMarqueMutation,
	useAddUniteMutation,
	useGetCategorieListQuery,
	useGetEmplacementListQuery,
	useGetMarqueListQuery,
	useGetUniteListQuery,
} from '@/store/services/parameter';
import { articleSchema } from '@/utils/formValidationSchemas';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ClientArticleWrapperForm from '@/components/pages/dashboard/shared/client-article-form/clientArticleWrapperForm';
import { useGetCompanyQuery } from '@/store/services/company';

const inputTheme = textInputTheme();

type FormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, company_id, id } = props;
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetArticleQuery({ id: id! }, { skip: !token || !isEditMode });
	const {
		data: generatedCodeData,
		isLoading: isCodeLoading,
		refetch: refetchCodeReference,
	} = useGetCodeReferenceQuery(
		{ company_id },
		{
			skip: !token || isEditMode,
		},
	);
	const { data: companyData, isFetching: isCompanyFetching } = useGetCompanyQuery({ id: company_id }, { skip: !token });
	const usesForeignCurrency = !isCompanyFetching && companyData?.uses_foreign_currency === true;
	// Mutations
	const [addArticle, { isLoading: isAddLoading, error: addError }] = useAddArticleMutation();
	const [updateArticle, { isLoading: isUpdateLoading, error: updateError }] = useEditArticleMutation();
	// Categories
	const { data: categoriesData } = useGetCategorieListQuery({ company_id }, { skip: !token });
	const [addCategory] = useAddCategorieMutation();
	// Emplacements
	const { data: emplacementsData } = useGetEmplacementListQuery({ company_id }, { skip: !token });
	const [addEmplacement] = useAddEmplacementMutation();
	// Unites
	const { data: unitesData } = useGetUniteListQuery({ company_id }, { skip: !token });
	const [addUnite] = useAddUniteMutation();
	// Marques
	const { data: marquesData } = useGetMarqueListQuery({ company_id }, { skip: !token });
	const [addMarque] = useAddMarqueMutation();
	// Catégorie
	const [openCategorieModal, setOpenCategorieModal] = useState(false);
	// Emplacement
	const [openEmplacementModal, setOpenEmplacementModal] = useState(false);
	// Unité
	const [openUniteModal, setOpenUniteModal] = useState(false);
	// Marque
	const [openMarqueModal, setOpenMarqueModal] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

	// Compute initial code_reference: use server-generated when adding, else from clientData
	const initialCodeReference = isEditMode ? (rawData?.reference ?? '') : (generatedCodeData?.reference ?? '');

	// Formik
	const formik = useFormik<ArticleSchemaType>({
		initialValues: {
			type_article: (rawData?.type_article as TypeArticleType) ?? 'Produit',
			reference: initialCodeReference,
			company: company_id,
			emplacement: rawData?.emplacement ?? null,
			marque: rawData?.marque ?? null,
			categorie: rawData?.categorie ?? null,
			unite: rawData?.unite ?? null,
			designation: rawData?.designation ?? '',
			prix_achat: rawData?.prix_achat ?? 0,
			devise_prix_achat: rawData?.devise_prix_achat ?? 'MAD',
			prix_vente: rawData?.prix_vente ?? 0,
			devise_prix_vente: rawData?.devise_prix_vente ?? 'MAD',
			photo: rawData?.photo ?? '',
			photo_cropped: rawData?.photo ?? '',
			// default 20 unless backend gives another value
			tva: rawData?.tva ?? 20,
			remarque: rawData?.remarque ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(articleSchema),
		onSubmit: async (data, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...payload } = data;
			try {
				if (isEditMode) {
					await updateArticle({ data: payload, id: id! }).unwrap();
					onSuccess(t.articles.updateSuccess);
				} else {
					await addArticle({ data: payload }).unwrap();
					onSuccess(t.articles.addSuccess);
				}
				if (!isEditMode) {
					router.replace(ARTICLES_LIST);
				}
			} catch (e) {
				if (!isEditMode) {
					onError(t.articles.addError);
				} else {
					onError(t.articles.updateError);
				}
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	// Error handling
	const error = isEditMode ? dataError || updateError : addError;
	const axiosError = error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;

	// Stable categoryItems
	const categorieItems: DropDownType[] = useMemo(
		() =>
			(categoriesData ?? []).map((c) => ({
				value: String(c.id),
				code: c.nom,
			})),
		[categoriesData],
	);

	// Derive selectedCategorie without local state or effects
	const selectedCategorie = useMemo<DropDownType | null>(() => {
		const v = formik.values.categorie;
		if (!v || categorieItems.length === 0) return null;
		return categorieItems.find((c) => c.value === String(v)) ?? null;
	}, [formik.values.categorie, categorieItems]);

	// Emplacements
	const emplacementItems: DropDownType[] = useMemo(
		() =>
			(emplacementsData ?? []).map((e) => ({
				value: String(e.id),
				code: e.nom,
			})),
		[emplacementsData],
	);

	const selectedEmplacement = useMemo<DropDownType | null>(() => {
		const v = formik.values.emplacement;
		if (!v || emplacementItems.length === 0) return null;
		return emplacementItems.find((e) => e.value === String(v)) ?? null;
	}, [formik.values.emplacement, emplacementItems]);

	// Unités
	const uniteItems: DropDownType[] = useMemo(
		() =>
			(unitesData ?? []).map((u) => ({
				value: String(u.id),
				code: u.nom,
			})),
		[unitesData],
	);

	const selectedUnite = useMemo<DropDownType | null>(() => {
		const v = formik.values.unite;
		if (!v || uniteItems.length === 0) return null;
		return uniteItems.find((u) => u.value === String(v)) ?? null;
	}, [formik.values.unite, uniteItems]);

	// Marques
	const marqueItems: DropDownType[] = useMemo(
		() =>
			(marquesData ?? []).map((m) => ({
				value: String(m.id),
				code: m.nom,
			})),
		[marquesData],
	);

	const selectedMarque = useMemo<DropDownType | null>(() => {
		const v = formik.values.marque;
		if (!v || marqueItems.length === 0) return null;
		return marqueItems.find((m) => m.value === String(v)) ?? null;
	}, [formik.values.marque, marqueItems]);

	// Collect validation errors from Formik
	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			reference: t.articles.colReference,
			designation: t.articles.colDesignation,
			prix_achat: t.articles.colPrixAchat,
			prix_vente: t.articles.colPrixVente,
			tva: t.articles.fieldTva,
			categorie: t.articles.filterCategorie,
			emplacement: t.articles.filterEmplacement,
			unite: t.articles.filterUnite,
			marque: t.articles.filterMarque,
			remarque: t.articles.fieldRemarque,
			photo: t.articles.fieldPhoto,
			photo_cropped: t.articles.fieldPhotoCropped,
			globalError: t.articles.fieldPhotoCropped,
		}),
		[t],
	);

	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) {
			Object.entries(formik.errors).forEach(([key, value]) => {
				if (key !== 'globalError' && typeof value === 'string') {
					errors[key] = value;
				}
			});
		}
		return errors;
	}, [formik.errors, hasAttemptedSubmit]);

	const hasValidationErrors = Object.keys(validationErrors).length > 0;

	const isLoading =
		isAddLoading || isUpdateLoading || isPending || (isEditMode && isDataLoading) || (!isEditMode && isCodeLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack
				direction={isMobile ? 'column' : 'row'}
				spacing={2}
				sx={{
					pt: 2,
					justifyContent: 'space-between',
				}}
			>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => router.push(ARTICLES_LIST)}
					sx={{
						whiteSpace: 'nowrap',
						px: { xs: 1.5, sm: 2, md: 3 },
						py: { xs: 0.8, sm: 1, md: 1 },
						fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
					}}
				>
					{t.articles.backToList}
				</Button>
			</Stack>
			{hasValidationErrors && (
				<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
					<Typography
						variant="subtitle2"
						sx={{
							fontWeight: 600,
						}}
					>
						{t.common.validationErrors}
					</Typography>
					<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
						{Object.entries(validationErrors).map(([key, error]) => (
							<li key={key}>
								<Typography variant="body2">
									{getLabelForKey(fieldLabels, key)} : {error}
								</Typography>
							</li>
						))}
					</ul>
				</Alert>
			)}
			{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
			{isLoading ? (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			) : shouldShowError ? (
				<ApiAlert errorDetails={axiosError?.data.details} />
			) : (
				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						{/* Profile Picture Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack
									direction="row"
									spacing={2}
									sx={{
										alignItems: 'center',
										mb: 2,
									}}
								>
									<PhotoCameraIcon color="primary" />
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
										}}
									>
										{t.articles.photoSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Box sx={{ display: 'flex', justifyContent: 'center' }}>
									<CustomSquareImageUploading
										image={formik.values.photo}
										croppedImage={formik.values.photo_cropped}
										onChange={(img) => formik.setFieldValue('photo', img)}
										onCrop={(cropped) => formik.setFieldValue('photo_cropped', cropped)}
									/>
								</Box>
							</CardContent>
						</Card>
						{/* Identité de l'article */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack
									direction="row"
									spacing={2}
									sx={{
										alignItems: 'center',
										mb: 2,
									}}
								>
									<DescriptionIcon color="primary" />
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
										}}
									>
										{t.articles.identitySection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<ToggleButtonGroup
									value={formik.values.type_article}
									exclusive
									onChange={(_, val) => {
										if (val) {
											formik.setFieldValue('type_article', val);
											formik.setErrors({});
										}
									}}
									sx={{ mb: 2 }}
								>
									<ToggleButton value="Produit">{t.articles.typeProduit}</ToggleButton>
									<ToggleButton value="Service">{t.articles.typeService}</ToggleButton>
								</ToggleButtonGroup>
								<Stack spacing={2.5}>
									<Stack
										direction="row"
										spacing={1}
										sx={{
											alignItems: 'flex-start',
										}}
									>
										<CustomTextInput
											id="reference"
											type="text"
											label={`${t.articles.colReference} *`}
											value={formik.values.reference}
											onChange={formik.handleChange('reference')}
											onBlur={formik.handleBlur('reference')}
											error={formik.touched.reference && Boolean(formik.errors.reference)}
											helperText={formik.touched.reference ? formik.errors.reference : ''}
											fullWidth
											size="small"
											theme={inputTheme}
											startIcon={<FingerprintIcon fontSize="small" />}
										/>
										{!isEditMode && (
											<Tooltip title={t.articles.resetReference}>
												<IconButton
													size="large"
													color="primary"
													onClick={async () => {
														const result = (await refetchCodeReference()) as { data?: { reference: string } };
														if (result?.data?.reference) {
															await formik.setFieldValue('reference', result.data.reference);
														}
													}}
													sx={{ mt: 1 }}
												>
													<RefreshIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										)}
									</Stack>
									<CustomTextInput
										id="designation"
										type="text"
										label={`${t.articles.colDesignation} *`}
										value={formik.values.designation ?? ''}
										onChange={formik.handleChange('designation')}
										onBlur={formik.handleBlur('designation')}
										error={formik.touched.designation && Boolean(formik.errors.designation)}
										helperText={formik.touched.designation ? formik.errors.designation : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<DescriptionIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>
						{/* {t.articles.pricesSection} */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack
									direction="row"
									spacing={2}
									sx={{
										alignItems: 'center',
										mb: 2,
									}}
								>
									<CreditCardIcon color="primary" />
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
										}}
									>
										{t.articles.pricesSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<Stack
										direction="row"
										spacing={1}
										sx={{
											alignItems: 'flex-start',
										}}
									>
										<FormattedNumberInput
											id="prix_achat"
											type="text"
											label={t.articles.colPrixAchat}
											value={formik.values.prix_achat ?? ''}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												const raw = (e.target as HTMLInputElement).value;
												const parsed = parseNumber(raw);
												if (parsed !== null && parsed < 0) return;
												formik.setFieldValue('prix_achat', parsed === null ? raw : parsed);
											}}
											onBlur={formik.handleBlur('prix_achat')}
											error={formik.touched.prix_achat && Boolean(formik.errors.prix_achat)}
											helperText={formik.touched.prix_achat ? formik.errors.prix_achat : ''}
											fullWidth={true}
											size="small"
											theme={inputTheme}
											startIcon={<ShoppingCartIcon fontSize="small" />}
											decimals={2}
										/>
										<CustomDropDownSelect
											id="devise_prix_achat"
											size="small"
											label={t.common.devise}
											items={['MAD', 'EUR', 'USD']}
											value={formik.values.devise_prix_achat ?? 'MAD'}
											onChange={(e) => formik.setFieldValue('devise_prix_achat', e.target.value)}
											theme={customDropdownTheme()}
										/>
									</Stack>
									<Stack
										direction="row"
										spacing={1}
										sx={{
											alignItems: 'flex-start',
										}}
									>
										<FormattedNumberInput
											id="prix_vente"
											type="text"
											label={`${t.articles.colPrixVente} *`}
											value={formik.values.prix_vente ?? ''}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												const raw = (e.target as HTMLInputElement).value;
												const parsed = parseNumber(raw);
												if (parsed !== null && parsed < 0) return;
												formik.setFieldValue('prix_vente', parsed === null ? raw : parsed);
											}}
											onBlur={formik.handleBlur('prix_vente')}
											error={formik.touched.prix_vente && Boolean(formik.errors.prix_vente)}
											helperText={formik.touched.prix_vente ? formik.errors.prix_vente : ''}
											fullWidth={true}
											size="small"
											theme={inputTheme}
											startIcon={<SellIcon fontSize="small" />}
											decimals={2}
										/>
										{usesForeignCurrency && (
											<CustomDropDownSelect
												id="devise_prix_vente"
												size="small"
												label={t.common.devise}
												items={['MAD', 'EUR', 'USD']}
												value={formik.values.devise_prix_vente ?? 'MAD'}
												onChange={(e) => formik.setFieldValue('devise_prix_vente', e.target.value)}
												theme={customDropdownTheme()}
											/>
										)}
									</Stack>
									<CustomTextInput
										id="tva"
										type="text"
										label={t.articles.fieldTva}
										value={String(formik.values.tva) ?? ''}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											const raw = (e.target as HTMLInputElement).value;
											const parsed = parseNumber(raw);
											if (parsed !== null && parsed < 0) return;
											formik.setFieldValue('tva', parsed === null ? raw : parsed);
										}}
										onBlur={formik.handleBlur('tva')}
										error={formik.touched.tva && Boolean(formik.errors.tva)}
										helperText={formik.touched.tva ? formik.errors.tva : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<ReceiptIcon fontSize="small" />}
										slotProps={{
											input: {
												inputProps: { min: 0 },
											},
										}}
									/>
								</Stack>
							</CardContent>
						</Card>
						{/* Classification */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack
									direction="row"
									spacing={2}
									sx={{
										alignItems: 'center',
										mb: 2,
									}}
								>
									<BusinessIcon color="primary" />
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
										}}
									>
										{t.articles.classificationSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomAutoCompleteSelect
										id="categorie"
										size="small"
										noOptionsText={t.articles.noCategorie}
										label={t.articles.filterCategorie}
										items={categorieItems}
										theme={theme}
										value={selectedCategorie}
										fullWidth
										onChange={(_, newVal) => {
											formik.setFieldValue('categorie', newVal ? Number(newVal.value) : null);
										}}
										onBlur={formik.handleBlur('categorie')}
										error={formik.touched.categorie && Boolean(formik.errors.categorie)}
										helperText={formik.touched.categorie ? formik.errors.categorie : ''}
										startIcon={<BusinessIcon fontSize="small" />}
										endIcon={
											<Button
												size="small"
												variant="outlined"
												onClick={() => setOpenCategorieModal(true)}
												sx={{ ml: 1 }}
											>
												{t.common.add}
											</Button>
										}
									/>
									<CustomAutoCompleteSelect
										id="emplacement"
										size="small"
										noOptionsText={t.articles.noEmplacement}
										label={t.articles.filterEmplacement}
										items={emplacementItems}
										theme={theme}
										value={selectedEmplacement}
										fullWidth
										onChange={(_, newVal) => {
											formik.setFieldValue('emplacement', newVal ? Number(newVal.value) : null);
										}}
										onBlur={formik.handleBlur('emplacement')}
										error={formik.touched.emplacement && Boolean(formik.errors.emplacement)}
										helperText={formik.touched.emplacement ? formik.errors.emplacement : ''}
										startIcon={<LocationOnIcon fontSize="small" />}
										endIcon={
											<Button
												size="small"
												variant="outlined"
												onClick={() => setOpenEmplacementModal(true)}
												sx={{ ml: 1 }}
											>
												{t.common.add}
											</Button>
										}
									/>
									<CustomAutoCompleteSelect
										id="unite"
										size="small"
										noOptionsText={t.articles.noUnite}
										label={t.articles.filterUnite}
										items={uniteItems}
										theme={theme}
										value={selectedUnite}
										fullWidth
										onChange={(_, newVal) => {
											formik.setFieldValue('unite', newVal ? Number(newVal.value) : null);
										}}
										onBlur={formik.handleBlur('unite')}
										error={formik.touched.unite && Boolean(formik.errors.unite)}
										helperText={formik.touched.unite ? formik.errors.unite : ''}
										startIcon={<StraightenIcon fontSize="small" />}
										endIcon={
											<Button size="small" variant="outlined" onClick={() => setOpenUniteModal(true)} sx={{ ml: 1 }}>
												{t.common.add}
											</Button>
										}
									/>
									<CustomAutoCompleteSelect
										id="marque"
										size="small"
										noOptionsText={t.articles.noMarque}
										label={t.articles.filterMarque}
										items={marqueItems}
										theme={theme}
										value={selectedMarque}
										fullWidth
										onChange={(_, newVal) => {
											formik.setFieldValue('marque', newVal ? Number(newVal.value) : null);
										}}
										onBlur={formik.handleBlur('marque')}
										error={formik.touched.marque && Boolean(formik.errors.marque)}
										helperText={formik.touched.marque ? formik.errors.marque : ''}
										startIcon={<StarIcon fontSize="small" />}
										endIcon={
											<Button size="small" variant="outlined" onClick={() => setOpenMarqueModal(true)} sx={{ ml: 1 }}>
												{t.common.add}
											</Button>
										}
									/>
								</Stack>
							</CardContent>
						</Card>
						{/* Remarque */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack
									direction="row"
									spacing={2}
									sx={{
										alignItems: 'center',
										mb: 2,
									}}
								>
									<NotesIcon color="primary" />
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
										}}
									>
										{t.articles.remarkSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="remarque"
										type="text"
										label={t.articles.fieldRemarque}
										value={formik.values.remarque ?? ''}
										onChange={formik.handleChange('remarque')}
										onBlur={formik.handleBlur('remarque')}
										error={formik.touched.remarque && Boolean(formik.errors.remarque)}
										helperText={formik.touched.remarque ? formik.errors.remarque : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<NotesIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>
						{/* Submit Button */}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? t.common.update : t.articles.addTitle}
								active={!isPending}
								type="submit"
								loading={isPending}
								startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									setHasAttemptedSubmit(true);
									if (!formik.isValid) {
										e.preventDefault();
										formik.handleSubmit();
										onError(t.common.correctErrors);
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}
								}}
								cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
							/>
						</Box>
					</Stack>
				</form>
			)}
			{/* Add City Modal */}
			<AddEntityModal
				open={openCategorieModal}
				setOpen={setOpenCategorieModal}
				label={t.articles.fieldCategorie.toLowerCase()}
				icon={<BusinessIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={(args) => addCategory({ data: { ...args.data, company: company_id } })}
				onSuccess={(newId) => {
					formik.setFieldValue('categorie', newId);
				}}
			/>
			<AddEntityModal
				open={openEmplacementModal}
				setOpen={setOpenEmplacementModal}
				label={t.articles.fieldEmplacement.toLowerCase()}
				icon={<LocationOnIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={(args) => addEmplacement({ data: { ...args.data, company: company_id } })}
				onSuccess={(newId) => {
					formik.setFieldValue('emplacement', newId);
				}}
			/>
			<AddEntityModal
				open={openUniteModal}
				setOpen={setOpenUniteModal}
				label={t.articles.fieldUnite.toLowerCase()}
				icon={<StraightenIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={(args) => addUnite({ data: { ...args.data, company: company_id } })}
				onSuccess={(newId) => {
					formik.setFieldValue('unite', newId);
				}}
			/>
			<AddEntityModal
				open={openMarqueModal}
				setOpen={setOpenMarqueModal}
				label={t.articles.fieldMarque.toLowerCase()}
				icon={<StarIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={(args) => addMarque({ data: { ...args.data, company: company_id } })}
				onSuccess={(newId) => {
					formik.setFieldValue('marque', newId);
				}}
			/>
		</Stack>
	);
};

interface Props extends SessionProps {
	company_id: number;
	id?: number;
}

const ArticlesForm: React.FC<Props> = (props) => (
	<ClientArticleWrapperForm {...props} entityName="article" FormikComponent={FormikContent} />
);

export default ArticlesForm;
