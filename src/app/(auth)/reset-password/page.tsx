"use client";

import React, {useTransition} from 'react';
import Styles from '@/styles/auth/reset-password/reset-password.module.sass';
import {
  setFormikAutoErrors
} from "@/utils/helpers";
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {Desktop, TabletAndMobile} from "@/utils/clientHelpers";
import { cookiesPoster } from '@/store/services/_init/_initAPI';
import {AUTH_RESET_PASSWORD_ENTER_CODE} from '@/utils/routes';
import AuthLayout from '@/components/layouts/auth/authLayout';
import { Stack, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { emailSchema } from '@/utils/formValidationSchemas';
import { coordonneeTextInputTheme } from '@/utils/themes';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import UserMainNavigationBar from '@/components/layouts/userMainNavigationBar/userMainNavigationBar';
import PrimaryLoadingButton from "@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton";
import { useSendPasswordResetCodeMutation } from '@/store/services/account/account';
import {NormalizedError} from "@/types/_init/_initTypes";
import { useSession } from 'next-auth/react';
import ApiProgress from "@/components/formikElements/apiLoadingResponseOrError/apiProgress/apiProgress";

const inputTheme = coordonneeTextInputTheme();
const ResetPasswordPageContent = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [reSendPasswordResetCode, { isLoading: isResendLoading }] = useSendPasswordResetCodeMutation();

  const formik = useFormik({
    initialValues: {
      email: '',
      globalError: '',
    },
    validateOnMount: true,
    validationSchema: toFormikValidationSchema(emailSchema),
    onSubmit: async (values, { setFieldError }) => {
      startTransition(async () => {
        try {
          await reSendPasswordResetCode({ email: values.email }).unwrap();
          await cookiesPoster('/cookies', { new_email: values.email });
          router.push(AUTH_RESET_PASSWORD_ENTER_CODE);
        } catch (e) {
          setFormikAutoErrors({ e: e as NormalizedError, setFieldError });
        }
      });
    },
  });

  return (
    <Stack direction="column" className={Styles.contentWrapper} spacing={4}>
      <Stack direction="column" spacing={1} alignItems="flex-start" width="100%">
        <Stack direction="column">
          <span className={Styles.content}>Récupération</span>
          <span className={Styles.subContent}>du mot de passe</span>
        </Stack>
        <span className={Styles.paragraphe}>
					Entrez votre email pour recevoir un code et modifier votre mot de passe.
				</span>
      </Stack>
      <Divider orientation="horizontal" flexItem className={Styles.divider} />
      <form style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
        <Stack direction="column" spacing={4}>
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
          <PrimaryLoadingButton
            buttonText="Modifier mot de passe"
            active={formik.isValid && !isResendLoading && !isPending}
            onClick={formik.handleSubmit}
            cssClass={Styles.emailRegisterButton}
            type="submit"
            loading={isResendLoading || isPending}
          />
        </Stack>
      </form>
    </Stack>
  );
};

const ResetPassword: React.FC = () => {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

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
                <ResetPasswordPageContent />
              </AuthLayout>
            </div>

          </Desktop>
          <TabletAndMobile>
            <div style={{display: 'flex', width: '100%', height: '100%'}}>
              <main className={Styles.main}>
                <UserMainNavigationBar />
                <ResetPasswordPageContent />
              </main>
            </div>

          </TabletAndMobile>
        </>
      )}
    </>
  );
};

export default ResetPassword;
