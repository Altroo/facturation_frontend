'use client';

import React, { useMemo, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import {
	Box,
	Button,
	Stack,
	Typography,
	Card,
	CardContent,
	Divider,
	useTheme,
	useMediaQuery,
	ToggleButtonGroup,
	ToggleButton,
	Alert,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	PhotoCamera as PhotoCameraIcon,
	Business as BusinessIcon,
	Description as DescriptionIcon,
	CreditCard as CreditCardIcon,
	Fingerprint as FingerprintIcon,
	ShoppingCart as ShoppingCartIcon,
	Sell as SellIcon,
	Receipt as ReceiptIcon,
	Notes as NotesIcon,
	LocationOn as LocationOnIcon,
	Star as StarIcon,
	Straighten as StraightenIcon,
	Add as AddIcon,
	Edit as EditIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { ARTICLES_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import type { DropDownType } from '@/types/accountTypes';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getCategoriesState, getEmplacementsState, getUnitesState, getMarquesState } from '@/store/selectors';
import {
	useAddArticleMutation,
	useEditArticleMutation,
	useGetArticleQuery,
	useGetCodeReferenceQuery,
} from '@/store/services/article';

import { getLabelForKey, setFormikAutoErrors, parseNumber } from '@/utils/helpers';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import type { TypeArticleType, ArticleSchemaType } from '@/types/articleTypes';
import {
	useAddCategorieMutation,
	useAddEmplacementMutation,
	useAddMarqueMutation,
	useAddUniteMutation,
} from '@/store/services/parameter';
import type { CategorieClass, MarqueClass, UniteClass, EmplacementClass } from '@/models/classes';
import { articleSchema } from '@/utils/formValidationSchemas';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ClientArticleWrapperForm from '@/components/pages/dashboard/shared/client-article-form/clientArticleWrapperForm';

const inputTheme = textInputTheme();

type FormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, company_id, id } = props;
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetArticleQuery({ id: id! }, { skip: !token || !isEditMode });
	const { data: generatedCodeData, isLoading: isCodeLoading } = useGetCodeReferenceQuery(undefined, {
		skip: !token || isEditMode,
	});
	// Mutations
	const [addArticle, { isLoading: isAddLoading, error: addError }] = useAddArticleMutation();
	const [updateArticle, { isLoading: isUpdateLoading, error: updateError }] = useEditArticleMutation();
	// Categories
	const rawCategories = useAppSelector(getCategoriesState);
	const normalizedCategories: Array<CategorieClass> = Array.isArray(rawCategories)
		? rawCategories
		: Object.values(rawCategories ?? {});
	const [addCategory, { isLoading: isAddCategoryLoading }] = useAddCategorieMutation();
	// Emplacements
	const rawEmplacements = useAppSelector(getEmplacementsState);
	const normalizedEmplacements: Array<EmplacementClass> = Array.isArray(rawEmplacements)
		? rawEmplacements
		: Object.values(rawEmplacements ?? {});
	const [addEmplacement, { isLoading: isAddEmplacementLoading }] = useAddEmplacementMutation();
	// Unites
	const rawUnites = useAppSelector(getUnitesState);
	const normalizedUnites: Array<UniteClass> = Array.isArray(rawUnites) ? rawUnites : Object.values(rawUnites ?? {});
	const [addUnite, { isLoading: isAddUniteLoading }] = useAddUniteMutation();
	// Marques
	const rawMarques = useAppSelector(getMarquesState);
	const normalizedMarques: Array<MarqueClass> = Array.isArray(rawMarques)
		? rawMarques
		: Object.values(rawMarques ?? {});
	const [addMarque, { isLoading: isAddMarqueLoading }] = useAddMarqueMutation();
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
			prix_vente: rawData?.prix_vente ?? 0,
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
					onSuccess("L'article a été mis à jour avec succès.");
				} else {
					await addArticle({ data: payload }).unwrap();
					onSuccess("L'article a été ajouté avec succès.");
				}
				if (!isEditMode) {
					router.replace(ARTICLES_LIST);
				}
			} catch (e) {
				if (!isEditMode) {
					onError("Une erreur est survenue lors de l'ajout de l'article.");
				} else {
					onError("Une erreur est survenue lors de la mise à jour de l'article.");
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
			normalizedCategories.map((c) => ({
				value: String(c.id),
				code: c.nom,
			})),
		[normalizedCategories],
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
			normalizedEmplacements.map((e) => ({
				value: String(e.id),
				code: e.nom,
			})),
		[normalizedEmplacements],
	);

	const selectedEmplacement = useMemo<DropDownType | null>(() => {
		const v = formik.values.emplacement;
		if (!v || emplacementItems.length === 0) return null;
		return emplacementItems.find((e) => e.value === String(v)) ?? null;
	}, [formik.values.emplacement, emplacementItems]);

	// Unités
	const uniteItems: DropDownType[] = useMemo(
		() =>
			normalizedUnites.map((u) => ({
				value: String(u.id),
				code: u.nom,
			})),
		[normalizedUnites],
	);

	const selectedUnite = useMemo<DropDownType | null>(() => {
		const v = formik.values.unite;
		if (!v || uniteItems.length === 0) return null;
		return uniteItems.find((u) => u.value === String(v)) ?? null;
	}, [formik.values.unite, uniteItems]);

	// Marques
	const marqueItems: DropDownType[] = useMemo(
		() =>
			normalizedMarques.map((m) => ({
				value: String(m.id),
				code: m.nom,
			})),
		[normalizedMarques],
	);

	const selectedMarque = useMemo<DropDownType | null>(() => {
		const v = formik.values.marque;
		if (!v || marqueItems.length === 0) return null;
		return marqueItems.find((m) => m.value === String(v)) ?? null;
	}, [formik.values.marque, marqueItems]);

	// Collect validation errors from Formik
	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			reference: 'Référence',
			designation: 'Désignation',
			prix_achat: "Prix d'achat",
			prix_vente: 'Prix de vente',
			tva: 'TVA',
			categorie: 'Catégorie',
			emplacement: 'Emplacement',
			unite: 'Unité',
			marque: 'Marque',
			remarque: 'Remarque',
			photo: 'Photo',
			photo_cropped: 'Photo recadrée',
			globalError: 'Erreur globale',
		}),
		[],
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
		isAddLoading ||
		isUpdateLoading ||
		isPending ||
		isAddCategoryLoading ||
		isAddEmplacementLoading ||
		isAddUniteLoading ||
		isAddMarqueLoading ||
		(isEditMode && isDataLoading) ||
		(!isEditMode && isCodeLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction={isMobile ? 'column' : 'row'} pt={2} justifyContent="space-between" spacing={2}>
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
					Liste des articles
				</Button>
			</Stack>
			{hasValidationErrors && (
				<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
					<Typography variant="subtitle2" fontWeight={600}>
						Erreurs de validation détectées:
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
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<PhotoCameraIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Photo d&#39;article
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
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<DescriptionIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Identité de l&#39;article
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
									<ToggleButton value="Produit">Produit</ToggleButton>
									<ToggleButton value="Service">Service</ToggleButton>
								</ToggleButtonGroup>
								<Stack spacing={2.5}>
									<CustomTextInput
										id="reference"
										type="text"
										label="Référence *"
										value={formik.values.reference}
										onChange={formik.handleChange('reference')}
										onBlur={formik.handleBlur('reference')}
										error={formik.touched.reference && Boolean(formik.errors.reference)}
										helperText={formik.touched.reference ? formik.errors.reference : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<FingerprintIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="designation"
										type="text"
										label="Désignation *"
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
						{/* Prix et TVA */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<CreditCardIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Prix et TVA
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="prix_achat"
										type="text"
										label="Prix d'achat"
										value={String(formik.values.prix_achat) ?? ''}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											const raw = (e.target as HTMLInputElement).value;
											const parsed = parseNumber(raw);
											if (parsed !== null && parsed < 0) return;
											formik.setFieldValue('prix_achat', parsed === null ? raw : parsed);
										}}
										onBlur={formik.handleBlur('prix_achat')}
										error={formik.touched.prix_achat && Boolean(formik.errors.prix_achat)}
										helperText={formik.touched.prix_achat ? formik.errors.prix_achat : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<ShoppingCartIcon fontSize="small" />}
										slotProps={{
											input: {
												inputProps: { min: 0 },
											},
										}}
									/>
									<CustomTextInput
										id="prix_vente"
										type="text"
										label="Prix de vente"
										value={String(formik.values.prix_vente) ?? ''}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											const raw = (e.target as HTMLInputElement).value;
											const parsed = parseNumber(raw);
											if (parsed !== null && parsed < 0) return;
											formik.setFieldValue('prix_vente', parsed === null ? raw : parsed);
										}}
										onBlur={formik.handleBlur('prix_vente')}
										error={formik.touched.prix_vente && Boolean(formik.errors.prix_vente)}
										helperText={formik.touched.prix_vente ? formik.errors.prix_vente : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<SellIcon fontSize="small" />}
										slotProps={{
											input: {
												inputProps: { min: 0 },
											},
										}}
									/>
									<CustomTextInput
										id="tva"
										type="text"
										label="TVA (%)"
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
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<BusinessIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Classification
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomAutoCompleteSelect
										id="categorie"
										size="small"
										noOptionsText="Aucune catégorie trouvée"
										label="Catégorie"
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
												Ajouter
											</Button>
										}
									/>
									<CustomAutoCompleteSelect
										id="emplacement"
										size="small"
										noOptionsText="Aucun emplacement trouvé"
										label="Emplacement"
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
												Ajouter
											</Button>
										}
									/>
									<CustomAutoCompleteSelect
										id="unite"
										size="small"
										noOptionsText="Aucune unité trouvée"
										label="Unité"
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
												Ajouter
											</Button>
										}
									/>
									<CustomAutoCompleteSelect
										id="marque"
										size="small"
										noOptionsText="Aucune marque trouvée"
										label="Marque"
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
												Ajouter
											</Button>
										}
									/>
								</Stack>
							</CardContent>
						</Card>
						{/* Remarque */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<NotesIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Remarque
									</Typography>
								</Stack>
								<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="remarque"
										type="text"
										label="Remarque"
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
								buttonText={isEditMode ? 'Mettre à jour' : "Ajouter l'article"}
								active={!isPending}
								type="submit"
								loading={isPending}
								startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									setHasAttemptedSubmit(true);
									if (!formik.isValid) {
										e.preventDefault();
										formik.handleSubmit();
										onError('Veuillez corriger les erreurs de validation avant de soumettre.');
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
				label="catégorie"
				icon={<BusinessIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={addCategory}
			/>
			<AddEntityModal
				open={openEmplacementModal}
				setOpen={setOpenEmplacementModal}
				label="emplacement"
				icon={<LocationOnIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={addEmplacement}
			/>
			<AddEntityModal
				open={openUniteModal}
				setOpen={setOpenUniteModal}
				label="unité"
				icon={<StraightenIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={addUnite}
			/>
			<AddEntityModal
				open={openMarqueModal}
				setOpen={setOpenMarqueModal}
				label="marque"
				icon={<StarIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={addMarque}
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
