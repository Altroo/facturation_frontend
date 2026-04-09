'use client';

import React, { useEffect, useState } from 'react';
import Styles from '@/styles/dashboard/settings/settings.module.sass';
import type { SelectChangeEvent } from '@mui/material';
import {
	Box,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Switch,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { setFormikAutoErrors } from '@/utils/helpers';
import { useFormik } from 'formik';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import {
	useGetNotificationPreferencesQuery,
	useUpdateNotificationPreferencesMutation,
} from '@/store/services/notification';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useLanguage, useToast } from '@/utils/hooks';
import { Edit as EditIcon } from '@mui/icons-material';
import type { NotificationPreferenceFormValues, QuoteExpiryDaysValue } from '@/types/facturationTypes';

const FormikContent: React.FC = () => {
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const quoteExpiryOptions: { value: QuoteExpiryDaysValue; label: string }[] = t.settings.quoteExpiryOptions as {
		value: QuoteExpiryDaysValue;
		label: string;
	}[];
	const { data: preferences, isLoading: isPreferencesLoading } = useGetNotificationPreferencesQuery();
	const [updatePreferences, { isLoading: isUpdateLoading }] = useUpdateNotificationPreferencesMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<NotificationPreferenceFormValues>({
		initialValues: {
			notify_overdue_invoice: preferences?.notify_overdue_invoice ?? true,
			notify_expiring_quote: preferences?.notify_expiring_quote ?? true,
			notify_uninvoiced_bdl: preferences?.notify_uninvoiced_bdl ?? true,
			quote_expiry_days: preferences?.quote_expiry_days ?? 7,
			globalError: '',
		},
		enableReinitialize: true,
		onSubmit: async (values, { setFieldError }) => {
			setIsPending(true);
			try {
				await updatePreferences({
					notify_overdue_invoice: values.notify_overdue_invoice,
					notify_expiring_quote: values.notify_expiring_quote,
					notify_uninvoiced_bdl: values.notify_uninvoiced_bdl,
					quote_expiry_days: values.quote_expiry_days,
				}).unwrap();
				onSuccess(t.settings.notificationUpdateSuccess);
			} catch (e) {
				onError(t.settings.notificationUpdateError);
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
			void Notification.requestPermission();
		}
	}, []);

	return (
		<Stack
			direction="column"
			spacing={2}
			className={`${Styles.flexRootStack}`}
			sx={{
				alignItems: 'center',
				mt: '32px',
			}}
		>
			{(isPreferencesLoading || isUpdateLoading || isPending) && (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			)}
			<h2 className={Styles.pageTitle}>{t.settings.notificationPreferences}</h2>
			<form className={Styles.form} onSubmit={(e) => e.preventDefault()}>
				<Stack
					direction="column"
					spacing={3}
					sx={{
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<Box sx={{ maxWidth: 365, width: '100%' }}>
						<Stack spacing={2}>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_overdue_invoice}
										onChange={(e) => formik.setFieldValue('notify_overdue_invoice', e.target.checked)}
									/>
								}
								label={t.settings.notifyOverdueInvoice}
							/>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_expiring_quote}
										onChange={(e) => formik.setFieldValue('notify_expiring_quote', e.target.checked)}
									/>
								}
								label={t.settings.notifyExpiringQuote}
							/>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_uninvoiced_bdl}
										onChange={(e) => formik.setFieldValue('notify_uninvoiced_bdl', e.target.checked)}
									/>
								}
								label={t.settings.notifyUninvoicedBdl}
							/>
							<FormControl size="small" fullWidth>
								<InputLabel id="quote-expiry-days-label">{t.settings.quoteExpiryDays}</InputLabel>
								<Select
									labelId="quote-expiry-days-label"
									value={String(formik.values.quote_expiry_days)}
									label={t.settings.quoteExpiryDays}
									onChange={(e: SelectChangeEvent) => formik.setFieldValue('quote_expiry_days', Number(e.target.value))}
								>
									{quoteExpiryOptions.map((opt) => (
										<MenuItem key={opt.value} value={String(opt.value)}>
											{opt.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Stack>
					</Box>
					<PrimaryLoadingButton
						buttonText={t.settings.save}
						active={!isPending}
						onClick={formik.handleSubmit}
						cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
						type="submit"
						startIcon={<EditIcon />}
						loading={isPending}
					/>
				</Stack>
			</form>
		</Stack>
	);
};

const NotificationsClient: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const { t } = useLanguage();

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={t.settings.notificationPreferences}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Box
						sx={{
							width: '100%',
							display: 'flex',
							justifyContent: isMobile ? 'center' : 'flex-start',
							alignItems: 'flex-start',
						}}
					>
						<Box sx={{ width: '100%' }}>
							<FormikContent />
						</Box>
					</Box>
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default NotificationsClient;
