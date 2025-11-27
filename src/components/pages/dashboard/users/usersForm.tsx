'use client';

import React, { useState, useMemo } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
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
	Paper,
	useTheme,
	useMediaQuery,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { userSchema } from '@/utils/formValidationSchemas';
import { genderItemsList } from '@/utils/rawData';
import { setFormikAutoErrors } from '@/utils/helpers';
import { coordonneeTextInputTheme, customDropdownTheme } from '@/utils/themes';
import { USERS_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';
import { useAppSelector } from '@/utils/hooks';
import { getGroupesState } from '@/store/selectors';
import {
	useAddUserMutation,
	useCheckEmailMutation,
	useEditUserMutation,
	useGetUserQuery,
} from '@/store/services/account';
import type { DropDownType } from '@/types/accountTypes';
import { UserCompaniesType, UsersFormValuesType } from '@/types/usersTypes';
import { useGetCompaniesListQuery } from '@/store/services/company';
import { CompanyClass } from '@/models/Classes';
import PersonIcon from '@mui/icons-material/Person';
import ManagedByTableSection from '@/components/shared/addManagedByTable/addManagedByTable';
import { Protected } from '@/components/layouts/protected/protected';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	id?: number;
	onSuccess: () => void;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, id, onSuccess } = props;
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();

	const {
		data: userData,
		isLoading: isUserLoading,
		error: userError,
	} = useGetUserQuery({ token, id: id! }, { skip: !token || !isEditMode });

	const [addUser, { isLoading: isAddLoading, error: addError }] = useAddUserMutation();
	const [checkEmail, { isLoading: isCheckEmailLoading, error: checkEmailError }] = useCheckEmailMutation();
	const [updateUser, { isLoading: isUpdateLoading, error: updateError }] = useEditUserMutation();

	// Compose error without local state or effects
	const error = checkEmailError || (isEditMode ? userError || updateError : addError);
	const axiosError: ResponseDataInterface<ApiErrorResponseType> | undefined = useMemo(() => {
		return error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;
	}, [error]);

	const groupes = useAppSelector(getGroupesState);
	const [isPending, setIsPending] = useState(false);

	const { data: rawData, isLoading: isCompaniesLoading } = useGetCompaniesListQuery({ token }, { skip: !token });

	// Enforce the type of the companies data returned
	const companiesData = rawData as Array<Partial<CompanyClass>> | undefined;

	const formik = useFormik<UsersFormValuesType>({
		initialValues: {
			first_name: userData?.first_name ?? '',
			last_name: userData?.last_name ?? '',
			email: userData?.email ?? '',
			gender: userData?.gender ?? '',
			is_active: userData?.is_active ?? true,
			is_staff: userData?.is_staff ?? false,
			avatar: userData?.avatar ?? '',
			avatar_cropped: userData?.avatar ?? '',
			// Initialize with server companies; Formik will reinitialize when userData changes
			companies: Array.isArray(userData?.companies) ? (userData!.companies as UserCompaniesType[]) : [],
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(userSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			try {
				if (userData?.email !== data.email) {
					await checkEmail({ token, email: data.email }).unwrap();
				}
				if (isEditMode) {
					await updateUser({ token, data, id }).unwrap();
				} else {
					await addUser({ token, data }).unwrap();
				}
				onSuccess();
				if (!isEditMode) {
					setTimeout(() => {
						router.replace(USERS_LIST);
					}, 1000);
				}
			} catch (e) {
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

	const isLoading: boolean =
		isCompaniesLoading ||
		isAddLoading ||
		isCheckEmailLoading ||
		isUpdateLoading ||
		isPending ||
		(isEditMode && isUserLoading);

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction={isMobile ? 'column' : 'row'} pt={2} justifyContent="space-between" spacing={2}>
				<Button
					variant="outlined"
					startIcon={<ArrowBack />}
					onClick={() => router.push(USERS_LIST)}
					sx={{ width: isMobile ? '100%' : 'auto' }}
				>
					Liste des utilisateurs
				</Button>
			</Stack>
			{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
			{isLoading ? (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			) : axiosError?.status === 404 ? (
				<Paper
					elevation={0}
					sx={{
						p: 3,
						backgroundColor: 'error.light',
						borderRadius: 2,
						border: '1px solid',
						borderColor: 'error.main',
					}}
				>
					<Typography color="error.main" variant="h6">
						{axiosError.data?.message}
					</Typography>
				</Paper>
			) : (
				<form>
					<Stack spacing={3}>
						{/* Profile Picture Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<AccountCircleIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Photo de profil
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
										Informations personnelles
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="email"
										type="email"
										label="Email *"
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
										label="Nom *"
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
										label="Prénom *"
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
										id="gender"
										label="Sexe *"
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
										Paramètres du compte
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
												<Typography>Compte Active</Typography>
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
												<Typography>Compte Administrateur</Typography>
											</Stack>
										}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Managed Companies Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<ManagedByTableSection
								title="Sociétés gérées"
								icon={<BusinessIcon color="primary" />}
								emptyIcon={<BusinessIcon sx={{ fontSize: 48, color: 'grey.400' }} />}
								emptyMessage="Aucune société assignée"
								headers={['Raison Sociale', 'Rôle']}
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
									title: 'Ajouter un gestionnaire',
									isMobile,
									selectId: 'new_user_select',
									selectLabel: 'Sélectionner un utilisateur',
									selectItems: availableCompanies,
									selectValue: selectedCompany,
									onSelectChange: (_e, newCompany) => setSelectedCompany(newCompany),
									selectIcon: <PersonIcon fontSize="small" />,
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
								buttonText={isEditMode ? 'Mettre à jour' : "Ajouter l'utilisateur"}
								active={!isPending}
								onClick={formik.handleSubmit}
								loading={isPending}
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

const UsersForm: React.FC<Props> = ({ session, id }) => {
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);
	const isEditMode = id !== undefined;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Protected>
						<Box sx={{ width: '100%' }}>
							<FormikContent token={token} id={id} onSuccess={() => setShowDataUpdated(true)} />
						</Box>
					</Protected>
				</main>
			</NavigationBar>
			<Portal id="snackbar_portal">
				<CustomToast
					type="success"
					message={isEditMode ? 'Utilisateur mise à jour' : 'Utilisateur ajouter avec succès.'}
					setShow={setShowDataUpdated}
					show={showDataUpdated}
				/>
			</Portal>
		</Stack>
	);
};

export default UsersForm;
