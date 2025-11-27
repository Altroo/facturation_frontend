'use client';

import React, { useState } from 'react';
import Styles from '@/styles/dashboard/settings/edit-profil.module.sass';
import { TabletAndMobile, Desktop } from '@/utils/clientHelpers';
import { Box, Stack } from '@mui/material';
import { useFormik } from 'formik';
import { profilSchema } from '@/utils/formValidationSchemas';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { coordonneeTextInputTheme, customDropdownTheme } from '@/utils/themes';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { genderItemsList } from '@/utils/rawData';
import { useAppDispatch } from '@/utils/hooks';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { setFormikAutoErrors } from '@/utils/helpers';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import type { SessionProps } from '@/types/_initTypes';
import { useGetProfilQuery, useEditProfilMutation } from '@/store/services/account';
import { getAccessTokenFromSession } from '@/store/session';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { accountEditProfilAction } from '@/store/actions/accountActions';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';

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
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik({
		initialValues: {
			first_name: profilData?.first_name ?? '',
			last_name: profilData?.last_name ?? '',
			gender: profilData?.gender ? (profilData.gender === 'H' ? 'Homme' : 'Femme') : '',
			avatar: profilData?.avatar ?? '',
			avatar_cropped: profilData?.avatar_cropped ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(profilSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			try {
				const response = await editProfil({ token, data }).unwrap();
				if (response) {
					dispatch(accountEditProfilAction(response));
					onSuccess();
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	return (
		<Stack direction="column" alignItems="center" spacing={2} className={`${Styles.flexRootStack}`} mt="32px">
			{(isEditLoading || isPending || isProfilLoading) && (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			)}
			<h2 className={Styles.pageTitle}>Profil</h2>
			<form className={Styles.form} onSubmit={(e) => e.preventDefault()}>
				<Stack direction="column" spacing={2}>
					<CustomSquareImageUploading
						cssClasse={Styles.centerAvatar}
						image={formik.values.avatar}
						croppedImage={formik.values.avatar_cropped}
						onChange={(img) => formik.setFieldValue('avatar', img)}
						onCrop={(cropped) => formik.setFieldValue('avatar_cropped', cropped)}
					/>
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
						active={!isPending}
						onClick={formik.handleSubmit}
						cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
						type="submit"
						loading={isPending}
					/>
				</Stack>
			</form>
		</Stack>
	);
};

const EditProfilClient: React.FC<SessionProps> = (props: SessionProps) => {
	const { session } = props;
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);

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
