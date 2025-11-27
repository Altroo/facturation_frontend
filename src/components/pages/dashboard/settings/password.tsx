'use client';

import React, { useState } from 'react';
import Styles from '@/styles/dashboard/settings/password.module.sass';
import { Box, Stack } from '@mui/material';
import { setFormikAutoErrors } from '@/utils/helpers';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';
import { useFormik } from 'formik';
import { changePasswordSchema } from '@/utils/formValidationSchemas';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { coordonneeTextInputTheme } from '@/utils/themes';
import CustomPasswordInput from '@/components/formikElements/customPasswordInput/customPasswordInput';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import type { SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { useEditPasswordMutation } from '@/store/services/account';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';

const inputTheme = coordonneeTextInputTheme();

type formikContentType = {
	token: string | undefined;
	onSuccess: () => void;
};

const FormikContenChangePassword: React.FC<formikContentType> = (props: formikContentType) => {
	const { token, onSuccess } = props;
	const [changePassword, { isLoading: isChangePasswordLoading }] = useEditPasswordMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik({
		initialValues: {
			old_password: '',
			new_password: '',
			new_password2: '',
			globalError: '',
		},
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(changePasswordSchema),
		onSubmit: async (values, { setFieldError, resetForm }) => {
			setIsPending(true);
			try {
				await changePassword({
					token,
					data: {
						old_password: values.old_password,
						new_password: values.new_password,
						new_password2: values.new_password2,
					},
				}).unwrap();
				onSuccess();
				resetForm();
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	return (
		<Stack direction="column" alignItems="center" spacing={2} className={`${Styles.flexRootStack}`} mt="32px">
			{(isChangePasswordLoading || isPending) && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
			<h2 className={Styles.pageTitle}>Modifier le mot de passe</h2>
			<form className={Styles.form} onSubmit={(e) => e.preventDefault()}>
				<Stack direction="column" spacing={2}>
					<CustomPasswordInput
						id="old_password"
						value={formik.values.old_password}
						onChange={formik.handleChange('old_password')}
						onBlur={formik.handleBlur('old_password')}
						helperText={formik.touched.old_password ? formik.errors.old_password : ''}
						error={formik.touched.old_password && Boolean(formik.errors.old_password)}
						fullWidth={false}
						size="medium"
						label="Ancien mot de passe"
						placeholder="Ancien mot de passe"
						theme={inputTheme}
					/>
					<CustomPasswordInput
						id="new_password"
						value={formik.values.new_password}
						onChange={formik.handleChange('new_password')}
						onBlur={formik.handleBlur('new_password')}
						helperText={formik.touched.new_password ? formik.errors.new_password : ''}
						error={formik.touched.new_password && Boolean(formik.errors.new_password)}
						fullWidth={false}
						size="medium"
						label="Nouveau mot de passe"
						placeholder="Nouveau mot de passe"
						theme={inputTheme}
					/>
					<CustomPasswordInput
						id="new_password2"
						value={formik.values.new_password2}
						onChange={formik.handleChange('new_password2')}
						onBlur={formik.handleBlur('new_password2')}
						helperText={formik.touched.new_password2 ? formik.errors.new_password2 : ''}
						error={formik.touched.new_password2 && Boolean(formik.errors.new_password2)}
						fullWidth={false}
						size="medium"
						label="Confirmation du nouveau mot de passe"
						placeholder="Confirmation du nouveau mot de passe"
						theme={inputTheme}
					/>
					<PrimaryLoadingButton
						buttonText="Modifier"
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

const PasswordClient: React.FC<SessionProps> = (props: SessionProps) => {
	const { session } = props;
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title="Changer le mot de passe">
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Desktop>
						<Stack direction="row" className={Styles.flexRootStack}>
							<Box sx={{ width: '100%' }}>
								<FormikContenChangePassword token={token} onSuccess={() => setShowDataUpdated(true)} />
							</Box>
						</Stack>
					</Desktop>
					<TabletAndMobile>
						<Stack>
							<Box sx={{ width: '100%', height: '100%' }}>
								<FormikContenChangePassword token={token} onSuccess={() => setShowDataUpdated(true)} />
							</Box>
						</Stack>
					</TabletAndMobile>
				</main>
			</NavigationBar>
			<Portal id="snackbar_portal">
				<CustomToast
					type="success"
					message="Mot de passe mis à jour"
					setShow={setShowDataUpdated}
					show={showDataUpdated}
				/>
			</Portal>
		</Stack>
	);
};

export default PasswordClient;
