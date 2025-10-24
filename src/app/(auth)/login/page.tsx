"use client";

import {NextPage} from "next";
import {signIn, useSession} from "next-auth/react";
import {useFormik} from "formik";
import {z} from "zod";
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {Container, TextField, Typography, Stack} from "@mui/material";
import {useAppDispatch} from "@/utils/hooks";
import {useSearchParams, useRouter} from "next/navigation";
import {useEffect, useState, useCallback, useTransition} from "react";
import {allowAnyInstance, setFormikAutoErrors} from "@/utils/helpers";
import {AccountPostLoginResponseType} from "@/types/account/accountTypes";
import {postApi} from "@/store/services/_init/_initAPI";
import {ThemeProvider} from "@mui/system";
import { Button } from '@mui/material';
import {getDefaultTheme} from "@/utils/themes";
import {refreshAppTokenStatesAction} from "@/store/actions/_init/_initActions";


const Login: NextPage = () => {
  const {data: session} = useSession();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const error = searchParams.get("error") as string;
  const router = useRouter();

  const [sessionUpdated, setSessionUpdated] = useState(false);
  const [errorState, setErrorState] = useState<string | Array<string> | undefined>(undefined);

  const accessDeniedMessage = "Service non disponible.";

  const handleErrorsAndSession = useCallback(() => {
    if (error === "AccessDenied") {
      setErrorState(accessDeniedMessage);
    } else {
      setErrorState(error);
    }
    if (session && !sessionUpdated) {
      dispatch(refreshAppTokenStatesAction(session));
      setSessionUpdated(true);
    }
    if (session) {
      router.replace("/dashboard");
    }
  }, [dispatch, error, router, session, sessionUpdated]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleErrorsAndSession();
  }, [handleErrorsAndSession]);

  const loginFormSchema = z.object({
    email: z.email({ message: "Invalid email address" }).nonempty("Required"),
    password: z.string({ message: "Password must be at least 8 characters" }).nonempty("Required").min(8),
    globalError: z.string().optional(),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      globalError: "",
    },
    validationSchema: toFormikValidationSchema(loginFormSchema),
    onSubmit: async (values, {setFieldError}) => {
      startTransition(async () => {
        try {
          const url = `${process.env.NEXT_PUBLIC_ACCOUNT_LOGIN}`;
          const instance = allowAnyInstance();
          const response: AccountPostLoginResponseType = await postApi(url, instance, {
            email: values.email,
            password: values.password,
          });

          if (response.status === 200) {
            await signIn("credentials", {
              email: values.email,
              password: values.password,
              redirect: false
            });
          }
        } catch (e) {
          setFormikAutoErrors({e, setFieldError});
        }
      });
    },
  });

  return (
    <Container maxWidth="sm">
      {!session && (
        <>
          <Typography variant="h4" component="h1" gutterBottom>
            Login
          </Typography>
          {errorState && <span>{errorState}</span>}
          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              variant="outlined"
              margin="normal"
              value={formik.values.email}
              onChange={(e) => {
                formik.handleChange(e);
                // Reset global error when user starts typing
                formik.setFieldValue('globalError', '');
              }}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />
            {formik.errors.globalError && (
              <Typography color="error" variant="body2" sx={{mt: 2, mb: 2}}>
                {formik.errors.globalError}
              </Typography>
            )}
            <ThemeProvider theme={getDefaultTheme()}>
              <Stack direction="row" justifyContent="space-between">
                <Button
                  loading={isPending}
                  disabled={!(formik.isValid && !isPending)}
                  type="submit"
                  color="primary"
                  size="large"
                  variant="outlined"
                >
                  Login
                </Button>
              </Stack>
            </ThemeProvider>
          </form>
        </>
      )}
    </Container>
  );
};

export default Login;