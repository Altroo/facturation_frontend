'use client';

import { useState, type FC } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { ArrowBack, Business, Email, Save } from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ClientArticleWrapperForm from '@/components/pages/dashboard/shared/client-article-form/clientArticleWrapperForm';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import {
	useAddLogistiqueSupplierMutation,
	useEditLogistiqueSupplierMutation,
	useGetLogistiqueSupplierQuery,
} from '@/store/services/logistique';
import { useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage, setFormikAutoErrors } from '@/utils/helpers';
import { logistiqueSupplierSchema } from '@/utils/logistiqueSupplierSchema';
import { textInputTheme } from '@/utils/themes';
import { LOGISTIQUE_SUPPLIERS, LOGISTIQUE_SUPPLIER_VIEW } from '@/utils/routes';
import { listReturnUrl } from '@/utils/listReturn';
import type { SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const inputTheme = textInputTheme();
const FormikContent: FC<{ token?: string; company_id: number; id?: number }> = ({ token, company_id, id }) => {
	const { t } = useLanguage();
	const { onSuccess } = useToast();
	const router = useRouter();
	const [saveError, setSaveError] = useState('');
	const {
		currentData: supplier,
		isFetching,
		error,
		refetch,
	} = useGetLogistiqueSupplierQuery({ id: id ?? 0, company_id }, { skip: !token || !id });
	const [add] = useAddLogistiqueSupplierMutation();
	const [edit] = useEditLogistiqueSupplierMutation();
	const formik = useFormik({
		initialValues: { nom: supplier?.nom ?? '', email: supplier?.email ?? '' },
		enableReinitialize: true,
		validationSchema: toFormikValidationSchema(logistiqueSupplierSchema(t.logistique)),
		onSubmit: async (values, { setFieldError }) => {
			setSaveError('');
			try {
				const data = { company_id, nom: values.nom.trim(), email: values.email.trim() };
				const saved = await (id ? edit({ ...data, id }) : add(data)).unwrap();
				onSuccess(t.logistique.supplierSaved);
				router.replace(LOGISTIQUE_SUPPLIER_VIEW(saved.id, company_id));
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				setSaveError(extractApiErrorMessage(e, t.logistique.supplierSaveError));
			}
		},
	});
	const loading = !token || (!!id && isFetching);
	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
			<Box sx={{ pt: 2 }}>
				<Button
					variant="outlined"
					startIcon={<ArrowBack />}
					disabled={formik.isSubmitting}
					onClick={() => router.push(listReturnUrl(`${LOGISTIQUE_SUPPLIERS}?company_id=${company_id}`))}
				>
					{t.logistique.supplierBackToList}
				</Button>
			</Box>
			{loading ? (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			) : error ? (
				<Alert severity="error">
					{extractApiErrorMessage(error, t.logistique.supplierLoadError)}{' '}
					<Button onClick={() => refetch()}>{t.common.retry}</Button>
				</Alert>
			) : (
				<form onSubmit={formik.handleSubmit} noValidate>
					<Stack spacing={3}>
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<Business color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{t.logistique.supplierIdentity}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={3}>
									<CustomTextInput
										id="nom"
										type="text"
										label={t.logistique.supplierName}
										required
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<Business fontSize="small" />}
										ai={false}
										maxLength={255}
										value={formik.values.nom}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										error={!!(formik.touched.nom && formik.errors.nom)}
										helperText={formik.touched.nom ? formik.errors.nom : undefined}
										disabled={formik.isSubmitting}
									/>
									<CustomTextInput
										id="email"
										type="email"
										label={t.logistique.colSupplierEmail}
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<Email fontSize="small" />}
										ai={false}
										maxLength={254}
										value={formik.values.email}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										error={!!(formik.touched.email && formik.errors.email)}
										helperText={formik.touched.email ? formik.errors.email : undefined}
										disabled={formik.isSubmitting}
									/>
								</Stack>
							</CardContent>
						</Card>
						{saveError && <Alert severity="error">{saveError}</Alert>}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
							<PrimaryLoadingButton
								type="submit"
								buttonText={t.common.save}
								active={!formik.isSubmitting}
								loading={formik.isSubmitting}
								startIcon={<Save />}
								cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
							/>
						</Box>
					</Stack>
				</form>
			)}
		</Stack>
	);
};

const LogistiqueSuppliersForm: FC<SessionProps & { company_id: number; id?: number }> = (props) => (
	<ClientArticleWrapperForm {...props} entityName="supplier" FormikComponent={FormikContent} />
);
export default LogistiqueSuppliersForm;
