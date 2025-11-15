'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Box,
	Button,
	FormControlLabel,
	Checkbox,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { ArrowBack, Delete } from '@mui/icons-material';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
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
import CustomAutocompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import type { DropDownType } from '@/types/accountTypes';
import { UserCompaniesType, UsersFormValuesType } from '@/types/usersTypes';
import { useGetCompaniesListQuery } from '@/store/services/company';
import { CompanyClass } from '@/models/Classes';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	id?: number;
	onSuccess: () => void;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, id, onSuccess } = props;
	const isEditMode = id !== undefined;

	const {
		data: userData,
		isLoading: isUserLoading,
		error: userError,
	} = useGetUserQuery({ token, id: id! }, { skip: !token || !isEditMode });

	const [addUser, { isLoading: isAddLoading, error: addError }] = useAddUserMutation();
	const [checkEmail, { isLoading: isCheckEmailLoading, error: checkEmailError }] = useCheckEmailMutation();
	const [updateUser, { isLoading: isUpdateLoading, error: updateError }] = useEditUserMutation();

	const error = checkEmailError || isEditMode ? userError || updateError : addError;
	const [axiosError, setAxiosError] = useState<ResponseDataInterface<ApiErrorResponseType>>(
		error as ResponseDataInterface<ApiErrorResponseType>,
	);

	const groupes = useAppSelector(getGroupesState);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const [companiesAdmin, setCompaniesAdmin] = useState<Array<UserCompaniesType>>(userData?.companies ?? []);
	const [selectedCompany, setSelectedCompany] = useState<DropDownType | null>(null);
	const [selectedRole, setSelectedRole] = useState<string>('');

	const roleOptions = groupes.map((role) => ({ value: role, code: role }));

	const { data: rawData, isLoading: isCompaniesLoading } = useGetCompaniesListQuery(
		{
			token,
		},
		{ skip: !token },
	);
	// enforce the type of the users data
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
			companies: [],
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(userSchema),
		onSubmit: async (data, { setFieldError }) => {
			startTransition(async () => {
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
				}
			});
		},
	});

	const managedCompanyIds = companiesAdmin.map((entry) => entry.company_id);
	const availableCompanies: DropDownType[] = (companiesData ?? [])
		.filter(
			(company): company is Partial<CompanyClass> & { id: number; raison_sociale: string } =>
				typeof company.id === 'number' &&
				typeof company.raison_sociale === 'string' &&
				!managedCompanyIds.includes(company.id),
		)
		.map((company) => ({
			value: company.id.toString(),
			code: company.raison_sociale,
		}));

	useEffect(() => {
		if (isEditMode && userData?.companies && Array.isArray(userData.companies)) {
			setCompaniesAdmin(userData.companies);
		}

		if (error) {
			const axiosError = error as ResponseDataInterface<ApiErrorResponseType>;
			setAxiosError(axiosError);
		}
	}, [isEditMode, userData?.companies, error]);

	const setManagedBy = useRef(formik.setFieldValue);

	useEffect(() => {
		setManagedBy.current('companies', companiesAdmin);
	}, [companiesAdmin]);

	const handleAddCompany = () => {
		if (selectedCompany && selectedRole) {
			const companyId = parseInt(selectedCompany.value);
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
		<Box padding={2}>
			<Stack spacing={4}>
				<Stack direction="row" alignItems="center" spacing={2}>
					<Stack direction="column" spacing={2} pt={2} width="100%">
						<Stack direction="row" justifyContent="space-between">
							<Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.push(USERS_LIST)}>
								Liste des utilisateurs
							</Button>
						</Stack>
					</Stack>
				</Stack>

				{isLoading ? (
					<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
				) : axiosError?.status === 404 ? (
					<Typography color="error" variant="h6">
						{axiosError.data?.message}
					</Typography>
				) : (
					<form className={Styles.form}>
						<Stack direction="column" spacing={2}>
							<Box>
								<CustomSquareImageUploading
									image={formik.values.avatar}
									croppedImage={formik.values.avatar_cropped}
									onChange={(img) => formik.setFieldValue('avatar', img)}
									onCrop={(cropped) => formik.setFieldValue('avatar_cropped', cropped)}
								/>
							</Box>
							<CustomTextInput
								id="email"
								type="email"
								label="Email"
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
								label="Nom"
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
								label="Prénom"
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
								label="Sexe"
								items={genderItemsList}
								value={formik.values.gender}
								onChange={(e) => formik.setFieldValue('gender', e.target.value)}
								theme={customDropdownTheme()}
								startIcon={<GroupsIcon fontSize="small" />}
							/>
							<FormControlLabel
								control={<Checkbox checked={formik.values.is_active} onChange={formik.handleChange} name="is_active" />}
								label="Compte Active"
							/>
							<FormControlLabel
								control={<Checkbox checked={formik.values.is_staff} onChange={formik.handleChange} name="is_staff" />}
								label="Compte Administrateur"
							/>
							<Box>
								<Typography variant="h5" gutterBottom>
									L&#39;utilisateur gère les sociétés suivantes :
								</Typography>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell>ID</TableCell>
											<TableCell>Socité ID</TableCell>
											<TableCell>Raison Sociale</TableCell>
											<TableCell>Rôle</TableCell>
											<TableCell align="right">Actions</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{companiesAdmin.length === 0 ? (
											<TableRow>
												<TableCell colSpan={4} align="center">
													<Typography variant="body2" color="text.secondary">
														Aucune société assignée.
													</Typography>
												</TableCell>
											</TableRow>
										) : (
											companiesAdmin.map((company, index) => (
												<TableRow key={`company-${company.company_id}-${index}`}>
													<TableCell>{company.membership_id}</TableCell>
													<TableCell>{company.company_id}</TableCell>
													<TableCell>{company.raison_sociale}</TableCell>
													<TableCell>
														<Box sx={{ maxWidth: 180 }}>
															<CustomDropDownSelect
																id={`company_role_${index}`}
																label="Rôle"
																value={company.role}
																onChange={(e) => {
																	const newRole = e.target.value;
																	const updatedCompanies = companiesAdmin.map((c, i) =>
																		i === index ? { ...c, role: newRole } : c,
																	);
																	setCompaniesAdmin(updatedCompanies);
																}}
																items={roleOptions}
																theme={customDropdownTheme()}
															/>
														</Box>
													</TableCell>
													<TableCell align="right">
														<IconButton
															color="error"
															onClick={() => {
																setCompaniesAdmin(
																	companiesAdmin.filter((c) => c.membership_id !== company.membership_id),
																);
															}}
														>
															<Delete />
														</IconButton>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
								<Typography variant="h5" gutterBottom mt={2}>
									Ajouter une société à gérer :
								</Typography>
								<Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
									<Box sx={{ flexGrow: 1 }}>
										<CustomAutocompleteSelect
											id="new_company_select"
											label="Sélectionner une société"
											fullWidth={true}
											items={availableCompanies}
											value={selectedCompany}
											onChange={(_e, newCompany) => {
												setSelectedCompany(newCompany);
											}}
											theme={customDropdownTheme()}
											startIcon={<BusinessIcon fontSize="small" />}
										/>
									</Box>
									<Box sx={{ flexGrow: 1 }}>
										<CustomDropDownSelect
											id="new_company_role"
											label="Rôle"
											items={roleOptions}
											value={selectedRole}
											onChange={(e) => setSelectedRole(e.target.value)}
											theme={customDropdownTheme()}
											startIcon={<GroupsIcon fontSize="small" />}
										/>
									</Box>
									<Button variant="contained" onClick={handleAddCompany} disabled={!selectedCompany || !selectedRole}>
										Ajouter
									</Button>
								</Stack>
							</Box>

							<PrimaryLoadingButton
								buttonText={isEditMode ? 'Mettre à jour' : "Ajouter l'utilisateur"}
								active={formik.isValid && !isPending}
								onClick={formik.handleSubmit}
								loading={isPending}
								cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
							/>
						</Stack>
					</form>
				)}
			</Stack>
		</Box>
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
					<Box sx={{ width: '100%' }}>
						<FormikContent token={token} id={id} onSuccess={() => setShowDataUpdated(true)} />
					</Box>
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
