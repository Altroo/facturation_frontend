'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import Styles from '@/styles/dashboard/settings/edit-profil.module.sass';
import { TabletAndMobile, Desktop } from '@/utils/clientHelpers';
import { Box, Stack } from '@mui/material';
import { useFormik } from 'formik';
import { profilSchema } from '@/utils/formValidationSchemas';
import CircularAvatarInputFile from '@/components/htmlElements/buttons/circularAvatarInputFile/circularAvatarInputFile';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryButton from '@/components/htmlElements/buttons/primaryButton/primaryButton';
import { coordonneeTextInputTheme, customDropdownTheme } from '@/utils/themes';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { genderItemsList } from '@/utils/rawData';
import { useAppDispatch } from '@/utils/hooks';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import { customActionsModalTheme } from '@/utils/themes';
import 'cropperjs/dist/cropper.css';
import Cropper, { ReactCropperElement } from 'react-cropper';
import CustomSwipeModal from '@/components/desktop/modals/rightSwipeModal/customSwipeModal';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { setFormikAutoErrors } from '@/utils/helpers';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import type { SessionProps } from '@/types/_initTypes';
import { useGetProfilQuery, useEditProfilMutation } from '@/store/services/account';
import { getAccessTokenFromSession } from '@/store/session';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { accountEditProfilAction } from '@/store/actions/accountActions';

const inputTheme = coordonneeTextInputTheme();

type formikContentType = {
	token: string | undefined;
	onSuccess: () => void;
};

const FormikContent: React.FC<formikContentType> = (props: formikContentType) => {
	const { token, onSuccess } = props;
	const { data: profilData, isLoading: isProfilLoading } = useGetProfilQuery(token, { skip: !token });
	const [editProfil, { isLoading: isEditLoading }] = useEditProfilMutation();
	const dispatch = useAppDispatch();
	const [isPending, startTransition] = useTransition();

	let avatarInitial: string | ArrayBuffer | null = null;
	if (profilData?.avatar) {
		avatarInitial = profilData.avatar;
	}
	const [preview, setPreview] = useState<string | ArrayBuffer | null>(avatarInitial);
	const [avatar, setAvatar] = useState<File | null>(null);

	const formik = useFormik({
		initialValues: {
			first_name: profilData?.first_name ?? '',
			last_name: profilData?.last_name ?? '',
			gender: profilData?.gender ? (profilData.gender === 'H' ? 'Homme' : 'Femme') : '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(profilSchema),
		onSubmit: async (values, { setFieldError }) => {
			startTransition(async () => {
				const payload = {
					avatar: preview,
					first_name: values.first_name,
					last_name: values.last_name,
					gender: values.gender,
				};
				try {
					const response = await editProfil({ token, data: payload }).unwrap();
					if (response) {
						dispatch(accountEditProfilAction(response));
						onSuccess();
					}
				} catch (e) {
					setFormikAutoErrors({ e, setFieldError });
				}
			});
		},
	});
	const [openCropModal, setOpenCropModal] = useState<boolean>(false);

	useEffect(() => {
		if (avatar) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result);
				setOpenCropModal(true);
			};
			reader.readAsDataURL(avatar);
		} else {
			setPreview(avatarInitial);
			setOpenCropModal(false);
		}
	}, [avatarInitial, avatar, dispatch]);

	const cropperRef = useRef<ReactCropperElement>(null);

	const onSaveCropImage = () => {
		const imageElement: ReactCropperElement | null = cropperRef?.current;
		const cropper = imageElement?.cropper;
		if (cropper) {
			setPreview(cropper.getCroppedCanvas().toDataURL());
			setOpenCropModal(false);
		}
	};

	return (
		<Stack direction="column" alignItems="center" spacing={2} className={`${Styles.flexRootStack}`} mt="32px">
			{(isEditLoading || isPending || isProfilLoading) && (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			)}
			<h2 className={Styles.pageTitle}>Profil</h2>
			<CircularAvatarInputFile setAvatar={setAvatar} preview={preview} active={true} showText />
			<form className={Styles.form} onSubmit={(e) => e.preventDefault()}>
				<Stack direction="column" spacing={2}>
					<CustomTextInput
						id="first_name"
						type="text"
						value={formik.values.first_name}
						onChange={formik.handleChange('first_name')}
						onBlur={formik.handleBlur('first_name')}
						helperText={formik.touched.first_name ? formik.errors.first_name : ''}
						error={formik.touched.first_name && Boolean(formik.errors.first_name)}
						fullWidth={false}
						size="medium"
						label="Nom"
						placeholder="Nom"
						theme={inputTheme}
					/>
					<CustomTextInput
						id="last_name"
						type="text"
						value={formik.values.last_name}
						onChange={formik.handleChange('last_name')}
						onBlur={formik.handleBlur('last_name')}
						helperText={formik.touched.last_name ? formik.errors.last_name : ''}
						error={formik.touched.last_name && Boolean(formik.errors.last_name)}
						fullWidth={false}
						size="medium"
						label="Prénom"
						placeholder="Prénom"
						theme={inputTheme}
					/>
					<CustomDropDownSelect
						id="gender"
						label="Genre"
						items={genderItemsList}
						theme={customDropdownTheme()}
						onChange={(e) => formik.setFieldValue('gender', e.target.value)}
						value={formik.values.gender}
					/>
					<PrimaryLoadingButton
						buttonText="Mettre à jour"
						active={formik.isValid && !isPending}
						onClick={formik.handleSubmit}
						cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
						type="submit"
						loading={isPending}
					/>
				</Stack>
			</form>
			<CustomSwipeModal
				keepMounted={false}
				direction="up"
				fullScreen={false}
				showCloseIcon={false}
				onBackdrop={() => {}}
				theme={customActionsModalTheme()}
				transition
				open={openCropModal}
				handleClose={() => setOpenCropModal(false)}
				cssClasse={Styles.centerModal}
			>
				<Stack direction="column" spacing="24px" id="userAvatarCropper">
					<Cropper
						src={preview as string}
						style={{ height: '100%', width: '100%' }}
						cropBoxResizable={false}
						initialAspectRatio={4 / 4}
						minCropBoxWidth={98}
						minCropBoxHeight={98}
						minCanvasWidth={98}
						minCanvasHeight={98}
						minContainerHeight={98}
						minContainerWidth={98}
						dragMode="move"
						ref={cropperRef}
						viewMode={3}
					/>
					<Stack direction="row" width="100%" justifyContent="center" pb="24px">
						<PrimaryButton
							buttonText="Enregistrer"
							active={true}
							onClick={onSaveCropImage}
							cssClass={Styles.cropButton}
						/>
					</Stack>
				</Stack>
			</CustomSwipeModal>
		</Stack>
	);
};

const EditProfilClient: React.FC<SessionProps> = (props: SessionProps) => {
	const { session } = props;
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);

	useEffect(() => {
		console.log('showDataUpdated', showDataUpdated);
	}, [showDataUpdated]);

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title="Éditer le profil">
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Desktop>
						<Stack direction="row" className={Styles.flexRootStack}>
							<Box sx={{ width: '100%' }}>
								<FormikContent token={token} onSuccess={() => setShowDataUpdated(true)} />
							</Box>
						</Stack>
					</Desktop>
					<TabletAndMobile>
						<Stack>
							<Box sx={{ width: '100%', height: '100%' }}>
								<FormikContent token={token} onSuccess={() => setShowDataUpdated(true)} />
							</Box>
						</Stack>
					</TabletAndMobile>
				</main>
			</NavigationBar>
			<Portal id="snackbar_portal">
				<CustomToast type="success" message="Profil mis à jour" setShow={setShowDataUpdated} show={showDataUpdated} />
			</Portal>
		</Stack>
	);
};

export default EditProfilClient;
