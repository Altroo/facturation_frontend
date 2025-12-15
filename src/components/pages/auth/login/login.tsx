'use client';

import React, { useEffect, useState, useRef } from 'react';
import Styles from '@/styles/auth/login/login.module.sass';
import { Stack, Divider } from '@mui/material';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { allowAnyInstance, setFormikAutoErrors } from '@/utils/helpers';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import type { AccountPostLoginResponseType } from '@/types/accountTypes';
import { postApi } from '@/utils/apiHelpers';
import { AUTH_RESET_PASSWORD, DASHBOARD } from '@/utils/routes';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/utils/hooks';
import AuthLayout from '@/components/layouts/auth/authLayout';
import { useFormik } from 'formik';
import { loginSchema } from '@/utils/formValidationSchemas';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomPasswordInput from '@/components/formikElements/customPasswordInput/customPasswordInput';
import { coordonneeTextInputTheme } from '@/utils/themes';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import { refreshAppTokenStatesAction } from '@/store/actions/_initActions';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { LockResetOutlined, LoginOutlined } from '@mui/icons-material';

const inputTheme = coordonneeTextInputTheme();

const LoginPageContent = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const error = searchParams.get('error') as string;
	const [isPending, setIsPending] = useState(false);

	// Derive error state from URL param instead of storing in state
	const errorState = error === 'AccessDenied' ? 'Service non disponible.' : error;

	const formik = useFormik({
		initialValues: {
			email: '',
			password: '',
			globalError: '',
		},
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(loginSchema),
		onSubmit: async (values, { setFieldError }) => {
			setIsPending(true);
			const url = `${process.env.NEXT_PUBLIC_ACCOUNT_LOGIN}`;
			try {
				const instance = allowAnyInstance();
				const response: AccountPostLoginResponseType = await postApi(url, instance, {
					email: values.email,
					password: values.password,
				});
				if (response.status === 200) {
					await signIn('credentials', {
						email: values.email,
						password: values.password,
						redirect: false,
					});
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	return (
		<Stack direction="column" spacing={4} className={Styles.contentWrapper}>
			<Stack direction="column" justifyContent="flex-start" alignItems="flex-start" width="100%">
				<h2 className={Styles.content}>Connexion</h2>
			</Stack>
			<Stack direction="column" spacing={2} className={Styles.mobileWidth}>
				{errorState && <span className={Styles.errorMessage}>{errorState}</span>}
			</Stack>
			<Divider orientation="horizontal" flexItem className={Styles.divider} />
			<form style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
				<Stack direction="column" spacing={2}>
					<CustomTextInput
						id="email"
						value={formik.values.email}
						onChange={formik.handleChange('email')}
						onBlur={formik.handleBlur('email')}
						helperText={formik.touched.email ? formik.errors.email : ''}
						error={formik.touched.email && Boolean(formik.errors.email)}
						fullWidth={false}
						size="medium"
						type="email"
						label="Adresse email"
						placeholder="Adresse email"
						theme={inputTheme}
					/>
					<CustomPasswordInput
						id="password"
						value={formik.values.password}
						onChange={formik.handleChange('password')}
						onBlur={formik.handleBlur('password')}
						helperText={formik.touched.password ? formik.errors.password : ''}
						error={formik.touched.password && Boolean(formik.errors.password)}
						fullWidth={false}
						size="medium"
						label="Mot de passe"
						placeholder="Mot de passe"
						theme={inputTheme}
					/>
					{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
					<TextButton
						buttonText="Mot de passe oublié ?"
						startIcon={<LockResetOutlined />}
						onClick={() => {
							router.push(AUTH_RESET_PASSWORD);
						}}
					/>
					<PrimaryLoadingButton
						buttonText="Me connecter"
						active={!isPending}
						onClick={formik.handleSubmit}
						cssClass={Styles.emailRegisterButton}
						startIcon={<LoginOutlined />}
						type="submit"
						loading={isPending}
					/>
				</Stack>
			</form>
		</Stack>
	);
};

const LoginClient: React.FC = () => {
	const { data: session, status } = useSession();
	const dispatch = useAppDispatch();
	const router = useRouter();

	// Use ref instead of state to track session update
	const sessionUpdatedRef = useRef(false);

	useEffect(() => {
		if (session && !sessionUpdatedRef.current) {
			dispatch(refreshAppTokenStatesAction(session));
			sessionUpdatedRef.current = true;
			router.replace(DASHBOARD);
		}
	}, [dispatch, router, session]);

	// Always render the same structure on initial render
	if (status === 'loading') {
		return <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;
	}

	// If redirecting to dashboard, keep showing loader
	if (session) {
		return <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;
	}

	return (
		<>
			<Desktop>
				<div>
					<AuthLayout>
						<LoginPageContent />
					</AuthLayout>
				</div>
			</Desktop>
			<TabletAndMobile>
				<div style={{ display: 'flex', width: '100%', height: '100%' }}>
					<main className={Styles.main}>
						<LoginPageContent />
					</main>
				</div>
			</TabletAndMobile>
		</>
	);
};

export default LoginClient;
