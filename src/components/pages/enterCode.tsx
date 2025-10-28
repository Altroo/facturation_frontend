"use client";

import React, { useState, useTransition } from 'react';
import Styles from '@/styles/auth/reset-password/enter-code.module.sass';
import { setFormikAutoErrors } from "@/utils/helpers";
import { Desktop, TabletAndMobile } from "@/utils/clientHelpers";
import { cookiesPoster } from "@/store/services/_init/_initAPI";
import { AUTH_RESET_PASSWORD_SET_PASSWORD } from '@/utils/routes';
import AuthLayout from '@/components/layouts/auth/authLayout';
import { Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { passwordResetCodeSchema } from '@/utils/formValidationSchemas';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { codeTextInputTheme } from '@/utils/themes';
import CustomOutlinedText from '@/components/formikElements/customOutlinedText/customOutlinedText';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import ApiProgress from '@/components/formikElements/apiLoadingResponseOrError/apiProgress/apiProgress';
import UserMainNavigationBar from '@/components/layouts/userMainNavigationBar/userMainNavigationBar';
import Portal from '@/contexts/Portal';
import CustomToast from '@/components/portals/customToast/customToast';
import PrimaryLoadingButton from "@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton";
import { useSendPasswordResetCodeMutation, usePasswordResetMutation } from '@/store/services/account/account';
import { isAxiosError } from 'axios';
import { NormalizedError } from "@/types/_init/_initTypes";
import { useSession } from 'next-auth/react';

type EnterCodePageContentProps = {
  email: string;
};

const EnterCodePageContent = ({ email }: EnterCodePageContentProps) => {
  const router = useRouter();
  const [showDataUpdated, setShowDataUpdated] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const [reSendPasswordResetCode, { isLoading: isResendLoading }] = useSendPasswordResetCodeMutation();
  const [passwordReset, { isLoading: isPasswordResetLoading }] = usePasswordResetMutation();

  const renvoyerLeCodeHandler = async () => {
    try {
      await reSendPasswordResetCode({ email }).unwrap();
      setToastMessage('code envoyé.');
      setShowDataUpdated(true);
    } catch (err) {
      if (isAxiosError(err)) {
        const message = err.response?.data?.error?.message ?? err.message;
        setToastMessage(message);
      }
    }
  };

  const formik = useFormik({
    initialValues: { one: '', two: '', three: '', four: '', globalError: '' },
    validateOnMount: true,
    validationSchema: toFormikValidationSchema(passwordResetCodeSchema),
    onSubmit: async (values, { setFieldError }) => {
      startTransition(async () => {
        const code = values.one + values.two + values.three + values.four;
        try {
          await passwordReset({ email, code }).unwrap();
          await cookiesPoster('/cookies', { code });
          router.push(AUTH_RESET_PASSWORD_SET_PASSWORD);
        } catch (e) {
          setFormikAutoErrors({ e: e as NormalizedError, setFieldError });
        }
      });
    },
  });

  return (
    <>
      <Stack direction="column" className={Styles.contentWrapper} spacing={4}>
        {(isResendLoading || isPending || isPasswordResetLoading) && (
          <ApiProgress
            cssStyle={{ position: 'absolute', top: '50%', left: '50%' }}
            backdropColor="#FFFFFF"
            circularColor="#FFFFFF"
          />
        )}
        <Stack direction="column" spacing={1}>
          <span className={Styles.content}>Rentrez le code</span>
          <span className={Styles.paragraphe}>
            Un code a été envoyé à <span className={Styles.email}>{email}</span>
          </span>
        </Stack>
        <form style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
          <Stack direction="column" spacing={8}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
              className={Styles.mobileCodeRootWrapper}
            >
              {['one', 'two', 'three', 'four'].map((field) => (
                <CustomOutlinedText
                  key={field}
                  id={field}
                  value={formik.values[field as keyof typeof formik.values]}
                  onChange={formik.handleChange(field)}
                  onBlur={formik.handleBlur(field)}
                  error={formik.touched[field as keyof typeof formik.touched] && Boolean(formik.errors[field as keyof typeof formik.errors])}
                  fullWidth={false}
                  size="medium"
                  type="tel"
                  slotProps={{ htmlInput: { maxLength: 1 } }}
                  theme={codeTextInputTheme(
                    formik.touched[field as keyof typeof formik.touched] &&
                    Boolean(formik.errors[field as keyof typeof formik.errors])
                  )}
                />
              ))}
            </Stack>
            {formik.errors.globalError && (
              <span className={Styles.errorMessage}>{formik.errors.globalError}</span>
            )}
            <Stack direction="column" justifyContent="center" alignItems="center" spacing={2}>
              <PrimaryLoadingButton
                buttonText="Confirmer le code"
                active={formik.isValid && !isPasswordResetLoading}
                onClick={formik.handleSubmit}
                cssClass={Styles.emailRegisterButton}
                type="submit"
                loading={isPasswordResetLoading}
              />
              <TextButton
                buttonText="Renvoyer le code"
                onClick={renvoyerLeCodeHandler}
                cssClass={Styles.resendCodeButton}
                disabled={isResendLoading}
              />
            </Stack>
          </Stack>
        </form>
      </Stack>
      <Portal id="snackbar_portal">
        <CustomToast type="success" message={toastMessage} setShow={setShowDataUpdated} show={showDataUpdated} />
      </Portal>
    </>
  );
};

type Props = {
  email: string;
};

const EnterCode: React.FC<Props> = ({ email }) => {
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
            <AuthLayout>
              <EnterCodePageContent email={email} />
            </AuthLayout>
          </Desktop>
          <TabletAndMobile>
            <div style={{ display: 'flex', width: '100%', height: '100%' }}>
              <main className={Styles.main}>
                <UserMainNavigationBar />
                <EnterCodePageContent email={email} />
              </main>
            </div>
          </TabletAndMobile>
        </>
      )}
    </>
  );
};

export default EnterCode;
