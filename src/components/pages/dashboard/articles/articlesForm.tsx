'use client';

import React, { useMemo, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Box,
	Button,
	Stack,
	Typography,
	Card,
	CardContent,
	Divider,
	Paper,
	useTheme,
	useMediaQuery,
	ToggleButtonGroup,
	ToggleButton,
	Container,
} from '@mui/material';
import { ArrowBack, BusinessOutlined } from '@mui/icons-material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SellIcon from '@mui/icons-material/Sell';
import ReceiptIcon from '@mui/icons-material/Receipt';
import NotesIcon from '@mui/icons-material/Notes';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import StraightenIcon from '@mui/icons-material/Straighten';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { coordonneeTextInputTheme } from '@/utils/themes';
import { ARTICLES_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import type { DropDownType } from '@/types/accountTypes';
import { useAppSelector } from '@/utils/hooks';
import {
	getCategoriesState,
	getEmplacementsState,
	getUnitesState,
	getMarquesState,
	getUserCompaniesState,
} from '@/store/selectors';
import {
	useAddArticleMutation,
	useEditArticleMutation,
	useGetArticleQuery,
	useGetCodeReferenceQuery,
} from '@/store/services/article';

import { setFormikAutoErrors } from '@/utils/helpers';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import type { TypeArticleType, ArticleSchemaType } from '@/types/articleTypes';
import {
	useAddCategorieMutation,
	useAddEmplacementMutation,
	useAddMarqueMutation,
	useAddUniteMutation,
} from '@/store/services/parameter';
import { CategorieClass, MarqueClass, UniteClass, EmplacementClass } from '@/models/Classes';
import { articleSchema } from '@/utils/formValidationSchemas';
import AddEntityModal from '@/components/desktop/modals/addEntityModal/addEntityModal';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	company_id: number;
	id?: number;
	onSuccess: () => void;
};

const FormikContent: React.FC<FormikContentProps> = ({ token, company_id, id, onSuccess }) => {
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
			setIsPending(true);
			try {
				if (isEditMode) {
					await updateArticle({ data: data, id: id! }).unwrap();
				} else {
					await addArticle({ data: data }).unwrap();
				}
				onSuccess();
				if (!isEditMode) {
					setTimeout(() => {
						router.replace(ARTICLES_LIST);
					}, 1000);
				}
			} catch (e) {
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

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction={isMobile ? 'column' : 'row'} pt={2} justifyContent="space-between" spacing={2}>
				<Button
					variant="outlined"
					startIcon={<ArrowBack />}
					onClick={() => router.push(ARTICLES_LIST)}
					sx={{ width: isMobile ? '100%' : 'auto' }}
				>
					Liste des articles
				</Button>
			</Stack>
			{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
			{isLoading ? (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			) : axiosError?.status === 404 ? (
				<Paper
					elevation={0}
					sx={{
						p: 3,
						backgroundColor: 'error.light',
						borderRadius: 2,
						border: '1px solid',
						borderColor: 'error.main',
					}}
				>
					<Typography color="error.main" variant="h6">
						{axiosError.data?.message}
					</Typography>
				</Paper>
			) : (
				<form>
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
										label="Référence"
										value={formik.values.reference}
										onChange={formik.handleChange('reference')}
										onBlur={formik.handleBlur('reference')}
										error={formik.touched.reference && Boolean(formik.errors.reference)}
										helperText={formik.touched.reference ? (formik.errors.reference as string) : ''}
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
										helperText={formik.touched.designation ? (formik.errors.designation as string) : ''}
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
										type="number"
										label="Prix d'achat"
										value={String(formik.values.prix_achat) ?? ''}
										onChange={(e) =>
											formik.setFieldValue('prix_achat', e.target.value === '' ? null : Number(e.target.value))
										}
										onBlur={formik.handleBlur('prix_achat')}
										error={formik.touched.prix_achat && Boolean(formik.errors.prix_achat)}
										helperText={formik.touched.prix_achat ? (formik.errors.prix_achat as string) : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<ShoppingCartIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="prix_vente"
										type="number"
										label="Prix de vente"
										value={String(formik.values.prix_vente) ?? ''}
										onChange={(e) =>
											formik.setFieldValue('prix_vente', e.target.value === '' ? null : Number(e.target.value))
										}
										onBlur={formik.handleBlur('prix_vente')}
										error={formik.touched.prix_vente && Boolean(formik.errors.prix_vente)}
										helperText={formik.touched.prix_vente ? (formik.errors.prix_vente as string) : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<SellIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="tva"
										type="number"
										label="TVA (%)"
										value={String(formik.values.tva) ?? ''}
										onChange={(e) => formik.setFieldValue('tva', e.target.value === '' ? null : Number(e.target.value))}
										onBlur={formik.handleBlur('tva')}
										error={formik.touched.tva && Boolean(formik.errors.tva)}
										helperText={formik.touched.tva ? (formik.errors.tva as string) : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<ReceiptIcon fontSize="small" />}
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
										helperText={formik.touched.remarque ? (formik.errors.remarque as string) : ''}
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
								onClick={formik.handleSubmit}
								loading={isPending}
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

const ArticlesForm: React.FC<Props> = ({ session, company_id, id }) => {
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((comp) => comp.id === company_id);

	const isEditMode = id !== undefined;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? "Modifier l'article" : 'Ajouter un article'}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{company?.role === 'Admin' ? (
						<Box sx={{ width: '100%' }}>
							<FormikContent token={token} id={id} company_id={company_id} onSuccess={() => setShowDataUpdated(true)} />
						</Box>
					) : (
						<Container maxWidth="sm" sx={{ mt: 8 }}>
							<Paper
								elevation={3}
								sx={{
									p: 6,
									textAlign: 'center',
									borderRadius: 3,
									background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)',
								}}
							>
								<Box
									sx={{
										width: 80,
										height: 80,
										borderRadius: '50%',
										backgroundColor: 'rgba(13, 7, 11, 0.08)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										margin: '0 auto 24px',
									}}
								>
									<BusinessOutlined sx={{ fontSize: 48, color: '#0D070B', opacity: 0.6 }} />
								</Box>
								<Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
									{isEditMode
										? "Vous n'avez pas le droit de modifier cette article. Veuillez contacter votre administrateur."
										: "Vous n'avez pas le droit d'ajouter un article. Veuillez contacter votre administrateur."}
								</Typography>
							</Paper>
						</Container>
					)}
				</main>
			</NavigationBar>
			<Portal id="snackbar_portal">
				<CustomToast
					type="success"
					message={isEditMode ? 'Article mis à jour' : 'Article ajouté avec succès.'}
					setShow={setShowDataUpdated}
					show={showDataUpdated}
				/>
			</Portal>
		</Stack>
	);
};

export default ArticlesForm;
