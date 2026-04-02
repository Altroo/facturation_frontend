'use client';

import React, { useState, useMemo } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import {
	Box,
	Button,
	FormControlLabel,
	Checkbox,
	Stack,
	Typography,
	Card,
	CardContent,
	Divider,
	useTheme,
	useMediaQuery,
	Alert,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Business as BusinessIcon,
	Email as EmailIcon,
	Groups as GroupsIcon,
	PersonOutline as PersonOutlineIcon,
	AdminPanelSettings as AdminPanelSettingsIcon,
	CheckCircle as CheckCircleIcon,
	AccountCircle as AccountCircleIcon,
	Edit as EditIcon,
	Add as AddIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { userSchema } from '@/utils/formValidationSchemas';
import { genderItemsList } from '@/utils/rawData';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { textInputTheme, customDropdownTheme } from '@/utils/themes';
import { USERS_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';
import { useAppSelector, useToast, useLanguage } from '@/utils/hooks';
import { getGroupesState } from '@/store/selectors';
import {
	useAddUserMutation,
	useCheckEmailMutation,
	useEditUserMutation,
	useGetUserQuery,
} from '@/store/services/account';
import type { DropDownType } from '@/types/accountTypes';
import type { UserCompaniesType, UsersFormValuesType } from '@/types/usersTypes';
import { useGetCompaniesListQuery } from '@/store/services/company';
import type { CompanyClass } from '@/models/classes';
import ManagedByTableSection from '@/components/shared/addManagedByTable/addManagedByTable';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import CompanyUsersWrapperForm from '@/components/pages/dashboard/shared/companies-users-form/companyUsersWrapperForm';

const inputTheme = textInputTheme();

type FormikContentProps = {
	token: string | undefined;
	id?: number;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, id } = props;
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();

	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetUserQuery({ id: id! }, { skip: !token || !isEditMode });

	const [addUser, { isLoading: isAddLoading, error: addError }] = useAddUserMutation();
	const [checkEmail, { isLoading: isCheckEmailLoading, error: checkEmailError }] = useCheckEmailMutation();
	const [updateUser, { isLoading: isUpdateLoading, error: updateError }] = useEditUserMutation();

	// Compose error without local state or effects
	const error = checkEmailError || (isEditMode ? dataError || updateError : addError);
	const axiosError: ResponseDataInterface<ApiErrorResponseType> | undefined = useMemo(() => {
		return error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;
	}, [error]);

	const groupes = useAppSelector(getGroupesState);
	const [isPending, setIsPending] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

	const { data: companiesRawData, isLoading: isCompaniesLoading } = useGetCompaniesListQuery(
		{ with_pagination: false },
		{ skip: !token },
	);

	// Enforce the type of the companies data returned
	const companiesData = companiesRawData as Array<Partial<CompanyClass>> | undefined;

	const formik = useFormik<UsersFormValuesType>({
		initialValues: {
			first_name: rawData?.first_name ?? '',
			last_name: rawData?.last_name ?? '',
			email: rawData?.email ?? '',
			gender: rawData?.gender ?? '',
			is_active: rawData?.is_active ?? true,
			is_staff: rawData?.is_staff ?? true,
			avatar: rawData?.avatar ?? '',
			avatar_cropped: rawData?.avatar ?? '',
			// Initialize with server companies; Formik will reinitialize when rawData changes
			companies: Array.isArray(rawData?.companies) ? (rawData!.companies as UserCompaniesType[]) : [],
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(userSchema),
		onSubmit: async (data, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...payload } = data;
			try {
				if (rawData?.email !== data.email) {
					await checkEmail({ email: data.email }).unwrap();
				}
				if (isEditMode) {
					await updateUser({ data: payload, id: id }).unwrap();
					onSuccess(t.users.updateSuccess);
				} else {
					await addUser({ data: payload }).unwrap();
					onSuccess(t.users.addSuccess);
				}
				if (!isEditMode) {
					router.replace(USERS_LIST);
				}
			} catch (e) {
				if (isEditMode) {
					onError(t.users.updateError);
				} else {
					onError(t.users.addError);
				}
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	// Derive role options
	const roleOptions = useMemo(() => groupes.map((role) => ({ value: role, code: role })), [groupes]);

	// Expose companies to your table under the same name, derived from Formik
	const companiesAdmin: Array<UserCompaniesType> = useMemo(
		() => formik.values.companies ?? [],
		[formik.values.companies],
	);

	// Expose a setter with the same name that writes back into Formik
	const setCompaniesAdmin = (next: Array<UserCompaniesType>) => {
		formik.setFieldValue('companies', next, true);
	};

	const managedCompanyIds = useMemo(() => companiesAdmin.map((entry) => entry.company_id), [companiesAdmin]);

	const availableCompanies: DropDownType[] = useMemo(
		() =>
			(companiesData ?? [])
				.filter(
					(company): company is Partial<CompanyClass> & { id: number; raison_sociale: string } =>
						typeof company.id === 'number' &&
						typeof company.raison_sociale === 'string' &&
						!managedCompanyIds.includes(company.id),
				)
				.map((company) => ({
					value: company.id.toString(),
					code: company.raison_sociale,
				})),
		[companiesData, managedCompanyIds],
	);

	const [selectedCompany, setSelectedCompany] = useState<DropDownType | null>(null);
	const [selectedRole, setSelectedRole] = useState<string>('');

	// Add via Formik-backed setter; no local state effects needed
	const handleAddCompany = () => {
		if (selectedCompany && selectedRole) {
			const companyId = parseInt(selectedCompany.value, 10);
			const companyData = companiesData?.find((c) => c.id === companyId);
			if (
				companyData &&
				companyData.id &&
				companyData.raison_sociale &&
				!companiesAdmin.some((c) => c.company_id === companyId)
			) {
				const newCompany: UserCompaniesType = {
					membership_id: 0,
					company_id: companyData.id,
					raison_sociale: companyData.raison_sociale,
					role: selectedRole,
				};
				setCompaniesAdmin([...companiesAdmin, newCompany]);
				setSelectedCompany(null);
				setSelectedRole('');
			}
		}
	};

	// Collect validation errors from Formik
	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			email: t.users.fieldEmail,
			first_name: t.users.fieldNom,
			last_name: t.users.fieldPrenom,
			gender: t.users.fieldSexe,
			is_active: t.users.isActiveLabel,
			is_staff: t.users.isAdminLabel,
			companies: t.users.companiesSection,
			avatar: t.users.photoSection,
			avatar_cropped: t.users.fieldAvatarCropped,
			globalError: t.common.genericError,
		}),
		[t],
	);

	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) {
			Object.entries(formik.errors).forEach(([key, value]) => {
				if (key !== 'globalError' && typeof value === 'string') {
					errors[key] = value;
				}
			});
		}
		return errors;
	}, [formik.errors, hasAttemptedSubmit]);

	const hasValidationErrors = Object.keys(validationErrors).length > 0;

	const isLoading: boolean =
		isCompaniesLoading ||
		isAddLoading ||
		isCheckEmailLoading ||
		isUpdateLoading ||
		isPending ||
		(isEditMode && isDataLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction={isMobile ? 'column' : 'row'} pt={2} justifyContent="space-between" spacing={2}>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => router.push(USERS_LIST)}
					sx={{
						whiteSpace: 'nowrap',
						px: { xs: 1.5, sm: 2, md: 3 },
						py: { xs: 0.8, sm: 1, md: 1 },
						fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
					}}
				>
					{t.users.backToList}
				</Button>
			</Stack>
			{hasValidationErrors && (
				<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
					<Typography variant="subtitle2" fontWeight={600}>
						{t.common.validationErrors}
					</Typography>
					<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
						{Object.entries(validationErrors).map(([key, error]) => (
							<li key={key}>
								<Typography variant="body2">
									{getLabelForKey(fieldLabels, key)} : {error}
								</Typography>
							</li>
						))}
					</ul>
				</Alert>
			)}
			{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
			{isLoading ? (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			) : shouldShowError ? (
				<ApiAlert errorDetails={axiosError?.data.details} />
			) : (
				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						{/* Profile Picture Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<AccountCircleIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.users.photoSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Box sx={{ display: 'flex', justifyContent: 'center' }}>
									<CustomSquareImageUploading
										image={formik.values.avatar}
										croppedImage={formik.values.avatar_cropped}
										onChange={(img) => formik.setFieldValue('avatar', img)}
										onCrop={(cropped) => formik.setFieldValue('avatar_cropped', cropped)}
									/>
								</Box>
							</CardContent>
						</Card>

						{/* Personal Information Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<PersonOutlineIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.users.personalSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="email"
										type="email"
										label={t.users.fieldEmail}
										disabled={isEditMode}
										value={formik.values.email}
										onChange={formik.handleChange('email')}
										onBlur={formik.handleBlur('email')}
										error={formik.touched.email && Boolean(formik.errors.email)}
										helperText={formik.touched.email ? formik.errors.email : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<EmailIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="first_name"
										type="text"
										label={t.users.fieldNom}
										value={formik.values.first_name}
										onChange={formik.handleChange('first_name')}
										onBlur={formik.handleBlur('first_name')}
										error={formik.touched.first_name && Boolean(formik.errors.first_name)}
										helperText={formik.touched.first_name ? formik.errors.first_name : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<PersonOutlineIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="last_name"
										type="text"
										label={t.users.fieldPrenom}
										value={formik.values.last_name}
										onChange={formik.handleChange('last_name')}
										onBlur={formik.handleBlur('last_name')}
										error={formik.touched.last_name && Boolean(formik.errors.last_name)}
										helperText={formik.touched.last_name ? formik.errors.last_name : ''}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<PersonOutlineIcon fontSize="small" />}
									/>
									<CustomDropDownSelect
										size="small"
										id="gender"
										label={t.users.fieldSexe}
										items={genderItemsList}
										value={formik.values.gender}
										onChange={(e) => formik.setFieldValue('gender', e.target.value)}
										theme={customDropdownTheme()}
										startIcon={<GroupsIcon fontSize="small" />}
										onBlur={formik.handleBlur('gender')}
										error={formik.touched.gender && Boolean(formik.errors.gender)}
										helperText={formik.touched.gender ? formik.errors.gender : ''}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Account Settings Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<AdminPanelSettingsIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.users.accountSection}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={1}>
									<FormControlLabel
										control={
											<Checkbox
												checked={formik.values.is_active}
												onChange={formik.handleChange}
												name="is_active"
												color="success"
											/>
										}
										label={
											<Stack direction="row" spacing={1} alignItems="center">
												<CheckCircleIcon fontSize="small" color={formik.values.is_active ? 'success' : 'disabled'} />
												<Typography>{t.users.isActiveLabel}</Typography>
											</Stack>
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={formik.values.is_staff}
												onChange={formik.handleChange}
												name="is_staff"
												color="primary"
											/>
										}
										label={
											<Stack direction="row" spacing={1} alignItems="center">
												<AdminPanelSettingsIcon
													fontSize="small"
													color={formik.values.is_staff ? 'primary' : 'disabled'}
												/>
												<Typography>{t.users.isAdminLabel}</Typography>
											</Stack>
										}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Managed Companies Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<ManagedByTableSection
								title="{t.users.companiesSection}"
								icon={<BusinessIcon color="primary" />}
								emptyIcon={<BusinessIcon sx={{ fontSize: 48, color: 'grey.400' }} />}
								emptyMessage={t.users.noCompany}
								headers={[t.shared.companyHeader, t.shared.roleHeader]}
								data={companiesAdmin}
								isUserTable={false}
								roleOptions={roleOptions}
								onRoleChange={(index, newRole) => {
									const updatedCompanies = companiesAdmin.map((company, i) =>
										i === index ? { ...company, role: newRole } : company,
									);
									setCompaniesAdmin(updatedCompanies);
								}}
								onDelete={(index) => {
									const membershipId = companiesAdmin[index].membership_id;
									setCompaniesAdmin(companiesAdmin.filter((c) => c.membership_id !== membershipId));
								}}
								addSectionProps={{
									title: t.shared.addCompany,
									isMobile,
									selectId: 'new_user_select',
									selectLabel: t.shared.selectCompany,
									selectItems: availableCompanies,
									selectValue: selectedCompany,
									onSelectChange: (_e, newCompany) => setSelectedCompany(newCompany),
									selectIcon: <BusinessIcon fontSize="small" />,
									roleId: 'new_user_role',
									roleLabel: 'Rôle',
									roleOptions,
									roleValue: selectedRole,
									onRoleChange: (e) => setSelectedRole(e.target.value as string),
									roleIcon: <GroupsIcon fontSize="small" />,
									onAdd: handleAddCompany,
									isAddDisabled: !selectedCompany || !selectedRole,
								}}
							/>
						</Card>

						{/* Submit Button */}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								type="submit"
								buttonText={isEditMode ? t.common.update : t.users.addTitle}
								active={!isPending}
								loading={isPending}
								startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									setHasAttemptedSubmit(true);
									if (!formik.isValid) {
										e.preventDefault();
										formik.handleSubmit();
										onError(t.common.correctErrors);
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}
								}}
								cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
							/>
						</Box>
					</Stack>
				</form>
			)}
		</Stack>
	);
};

interface Props extends SessionProps {
	id?: number;
}

const UsersForm: React.FC<Props> = ({ session, id }) => (
	<CompanyUsersWrapperForm session={session} id={id} entityName="utilisateur" FormikComponent={FormikContent} />
);

export default UsersForm;
