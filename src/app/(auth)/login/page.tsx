"use client";

import React, { useEffect, useState, useTransition } from 'react';
import Styles from '@/styles/auth/login/login.module.sass';
import { Stack, Divider } from '@mui/material';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import {
  allowAnyInstance,
  setFormikAutoErrors
} from "@/utils/helpers";
import {Desktop, TabletAndMobile}  from "@/utils/clientHelpers";
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { AccountPostLoginResponseType } from '@/types/account/accountTypes';
import { postApi } from '@/store/services/_init/_initAPI';
import { AUTH_RESET_PASSWORD, DASHBOARD } from '@/utils/routes';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/utils/hooks';
import AuthLayout from '@/components/layouts/auth/authLayout';
import { useFormik } from 'formik';
import { loginSchema } from '@/utils/formValidationSchemas';
import ApiProgress from '@/components/formikElements/apiLoadingResponseOrError/apiProgress/apiProgress';
import CustomPasswordInput from '@/components/formikElements/customPasswordInput/customPasswordInput';
import { coordonneeTextInputTheme } from '@/utils/themes';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import { refreshAppTokenStatesAction } from '@/store/actions/_init/_initActions';
import UserMainNavigationBar from '@/components/layouts/userMainNavigationBar/userMainNavigationBar';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import {NormalizedError} from "@/types/_init/_initTypes";

const inputTheme = coordonneeTextInputTheme();

const LoginPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as string;
  const [errorState, setErrorState] = useState<string | Array<string> | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (error === 'AccessDenied') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorState('Service non disponible.');
    } else {
      setErrorState(error);
    }
  }, [error]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      globalError: '',
    },
    validateOnMount: true,
    validationSchema: toFormikValidationSchema(loginSchema),
    onSubmit: async (values, { setFieldError }) => {
      startTransition(async () => {
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
          setFormikAutoErrors({ e: e as NormalizedError, setFieldError });
        }
      })
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
            onClick={() => {
              router.push(AUTH_RESET_PASSWORD);
            }}
          />
          <PrimaryLoadingButton
            buttonText="Me connecter"
            active={formik.isValid && !isPending}
            onClick={formik.handleSubmit}
            cssClass={Styles.emailRegisterButton}
            type="submit"
            loading={isPending}
          />
        </Stack>
      </form>
    </Stack>
  );
};

const Login: React.FC = () => {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [sessionUpdated, setSessionUpdated] = useState<boolean>(false);

  useEffect(() => {
    if (session && !sessionUpdated) {
      dispatch(refreshAppTokenStatesAction(session));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionUpdated(true);
      router.replace(DASHBOARD);
    }
  }, [dispatch, router, session, sessionUpdated]);

  return (
    <>
      {loading && (
        <ApiProgress
          cssStyle={{ position: 'absolute', top: '50%', left: '50%' }}
          backdropColor="#FFFFFF"
          circularColor="#0D070B"
        />
      )}
      {!loading && !session && (
        <>
          <Desktop>
            <div>
              <AuthLayout>
                <LoginPageContent />
              </AuthLayout>
            </div>
          </Desktop>
          <TabletAndMobile>
            <div style={{display: 'flex', width: '100%', height: '100%'}}>
              <main className={Styles.main}>
                <UserMainNavigationBar />
                <LoginPageContent />
              </main>
            </div>
          </TabletAndMobile>
        </>
      )}
    </>
  );
};

export default Login;
