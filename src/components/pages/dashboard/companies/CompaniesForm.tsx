'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import { useAddCompanyMutation, useEditCompanyMutation, useGetCompanyQuery } from '@/store/services/company';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Box,
	Button,
	IconButton,
	Skeleton,
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
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import PrintIcon from '@mui/icons-material/Print';
import LanguageIcon from '@mui/icons-material/Language';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import BadgeIcon from '@mui/icons-material/Badge';
import CreditCardIcon from '@mui/icons-material/CreditCard';

import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { companySchema } from '@/utils/formValidationSchemas';
import { civiliteItemsList, nbrEmployeItemsList } from '@/utils/rawData';
import { setFormikAutoErrors } from '@/utils/helpers';
import { coordonneeTextInputTheme, customDropdownTheme } from '@/utils/themes';
import { COMPANIES_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';
import { useAppSelector } from '@/utils/hooks';
import { getGroupesState, getProfilState } from '@/store/selectors';
import { useGetUsersQuery } from '@/store/services/account';
import CustomAutocompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import type { DropDownType } from '@/types/accountTypes';
import type { CompanyFormValuesType, ManagedByType } from '@/types/companyTypes';
import { UserClass } from '@/models/Classes';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	first_name: string | null;
	last_name: string | null;
	id?: number; // Optional - if provided, we're editing
	onSuccess: () => void;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, first_name, last_name, id, onSuccess } = props;
	const isEditMode = id !== undefined;

	// Queries and mutations
	const {
		data: companyData,
		isLoading: isCompanyLoading,
		error: companyError,
	} = useGetCompanyQuery({ token, id: id! }, { skip: !token || !isEditMode });
	const [addCompany, { isLoading: isAddLoading, error: addError }] = useAddCompanyMutation();
	const [updateCompany, { isLoading: isUpdateLoading, error: updateError }] = useEditCompanyMutation();
	const { data: rawUsersData, isLoading: isUsersLoading } = useGetUsersQuery(
		{ token, with_pagination: false },
		{ skip: !token },
	);
	// enforce the type of the users data
	const usersData = rawUsersData as Array<Partial<UserClass>> | undefined;
	const error = isEditMode ? companyError || updateError : addError;
	const [axiosError, setAxiosError] = useState<ResponseDataInterface<ApiErrorResponseType>>(
		error as ResponseDataInterface<ApiErrorResponseType>,
	);

	const { id: userID } = useAppSelector(getProfilState);
	const groupes = useAppSelector(getGroupesState);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const [adminUsers, setAdminUsers] = useState<Array<ManagedByType>>(companyData?.admins ?? []);
	const [selectedUser, setSelectedUser] = useState<DropDownType | null>(null);
	const roleOptions = groupes.map((role) => ({ value: role, code: role }));

	const formik = useFormik<CompanyFormValuesType>({
		initialValues: {
			raison_sociale: companyData?.raison_sociale ?? '',
			email: companyData?.email ?? '',
			nbr_employe: companyData?.nbr_employe ?? '',
			civilite_responsable: companyData?.civilite_responsable ?? '',
			nom_responsable: companyData?.nom_responsable ?? '',
			gsm_responsable: companyData?.gsm_responsable ?? '',
			adresse: companyData?.adresse ?? '',
			telephone: companyData?.telephone ?? '',
			fax: companyData?.fax ?? '',
			site_web: companyData?.site_web ?? '',
			numero_du_compte: companyData?.numero_du_compte ?? '',
			ICE: companyData?.ICE ?? '',
			registre_de_commerce: companyData?.registre_de_commerce ?? '',
			identifiant_fiscal: companyData?.identifiant_fiscal ?? '',
			tax_professionnelle: companyData?.tax_professionnelle ?? '',
			CNSS: companyData?.CNSS ?? '',
			logo: companyData?.logo ?? '',
			logo_cropped: companyData?.logo_cropped ?? '',
			cachet: companyData?.cachet ?? '',
			cachet_cropped: companyData?.cachet_cropped ?? '',
			managed_by: [],
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(companySchema),
		onSubmit: async (data, { setFieldError }) => {
			startTransition(async () => {
				try {
					if (isEditMode) {
						await updateCompany({ token, data, id }).unwrap();
					} else {
						await addCompany({ token, data }).unwrap();
					}
					onSuccess();
					if (!isEditMode) {
						setTimeout(() => {
							router.replace(COMPANIES_LIST);
						}, 1000);
					}
				} catch (e) {
					setFormikAutoErrors({ e, setFieldError });
				}
			});
		},
	});

	const managedIds = formik.values.managed_by.map((entry) => entry.pk);
	const availableUsers: DropDownType[] = Array.isArray(usersData)
		? usersData
				.filter(
					(user): user is { id: number; first_name: string; last_name: string; role: string } =>
						typeof user.id === 'number',
				)
				.filter((user) => !managedIds.includes(user.id))
				.map((user) => ({
					value: user.id.toString(),
					code: `${user.first_name} ${user.last_name}`,
				}))
		: [];

	const initializedRef = useRef(false);

	useEffect(() => {
		// Initialize admin users for edit mode
		if (!initializedRef.current && isEditMode && companyData?.admins && Array.isArray(companyData.admins)) {
			setAdminUsers(companyData.admins);
			initializedRef.current = true;
		}
		// Initialize admin users for create mode
		else if (!initializedRef.current && !isEditMode && groupes.length && userID) {
			const defaultAdmin = {
				id: userID,
				first_name: first_name ?? 'Moi',
				last_name: last_name ?? '',
				role: 'Admin',
			};
			setAdminUsers([defaultAdmin]);
			initializedRef.current = true;
		}

		if (error) {
			const axiosError = error as ResponseDataInterface<ApiErrorResponseType>;
			setAxiosError(axiosError);
		}
	}, [isEditMode, companyData?.admins, groupes, userID, first_name, last_name, error]);

	// Sync adminUsers to formik.values.managed_by whenever adminUsers changes
	const setManagedBy = useRef(formik.setFieldValue);

	useEffect(() => {
		setManagedBy.current(
			'managed_by',
			adminUsers.map((u) => ({ pk: u.id, role: u.role })),
		);
	}, [adminUsers]);

	const isLoading = isUsersLoading || isAddLoading || isUpdateLoading || isPending || (isEditMode && isCompanyLoading);

	return (
		<Box padding={2}>
			<Stack spacing={4}>
				<Stack direction="row" alignItems="center" spacing={2}>
					<Stack direction="column" spacing={2} pt={2} width="100%">
						<Stack direction="row" justifyContent="space-between">
							<Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.push(COMPANIES_LIST)}>
								Liste des entreprises
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
							<Stack direction="row" gap={4} className={Styles.mobileStack}>
								<Box>
									<label>Logo</label>
									<CustomSquareImageUploading
										image={formik.values.logo}
										croppedImage={formik.values.logo_cropped}
										onChange={(img) => formik.setFieldValue('logo', img)}
										onCrop={(cropped) => formik.setFieldValue('logo_cropped', cropped)}
									/>
								</Box>
								<Box>
									<label>Cachet</label>
									<CustomSquareImageUploading
										image={formik.values.cachet}
										croppedImage={formik.values.cachet_cropped}
										onChange={(img) => formik.setFieldValue('cachet', img)}
										onCrop={(cropped) => formik.setFieldValue('cachet_cropped', cropped)}
									/>
								</Box>
							</Stack>
							<CustomTextInput
								id="raison_sociale"
								type="text"
								value={formik.values.raison_sociale}
								onChange={formik.handleChange('raison_sociale')}
								onBlur={formik.handleBlur('raison_sociale')}
								helperText={formik.touched.raison_sociale ? formik.errors.raison_sociale : ''}
								error={formik.touched.raison_sociale && Boolean(formik.errors.raison_sociale)}
								fullWidth={false}
								size="small"
								label="Raison sociale"
								theme={inputTheme}
								startIcon={<BusinessIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="email"
								type="email"
								label="Email"
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
							<CustomDropDownSelect
								id="nbr_employe"
								label="Nombre d'employés"
								items={nbrEmployeItemsList}
								value={formik.values.nbr_employe}
								onChange={(e) => formik.setFieldValue('nbr_employe', e.target.value)}
								theme={customDropdownTheme()}
								startIcon={<GroupsIcon fontSize="small" />}
							/>
							<CustomDropDownSelect
								id="civilite_responsable"
								label="Civilité du responsable"
								items={civiliteItemsList}
								value={formik.values.civilite_responsable}
								onChange={(e) => formik.setFieldValue('civilite_responsable', e.target.value)}
								theme={customDropdownTheme()}
								startIcon={<PersonIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="nom_responsable"
								type="text"
								label="Nom du responsable"
								value={formik.values.nom_responsable}
								onChange={formik.handleChange('nom_responsable')}
								onBlur={formik.handleBlur('nom_responsable')}
								error={formik.touched.nom_responsable && Boolean(formik.errors.nom_responsable)}
								helperText={formik.touched.nom_responsable ? formik.errors.nom_responsable : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<PersonOutlineIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="gsm_responsable"
								type="tel"
								label="GSM du responsable"
								value={formik.values.gsm_responsable}
								onChange={formik.handleChange('gsm_responsable')}
								onBlur={formik.handleBlur('gsm_responsable')}
								error={formik.touched.gsm_responsable && Boolean(formik.errors.gsm_responsable)}
								helperText={formik.touched.gsm_responsable ? formik.errors.gsm_responsable : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<SmartphoneIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="adresse"
								type="text"
								label="Adresse"
								value={formik.values.adresse}
								onChange={formik.handleChange('adresse')}
								onBlur={formik.handleBlur('adresse')}
								error={formik.touched.adresse && Boolean(formik.errors.adresse)}
								helperText={formik.touched.adresse ? formik.errors.adresse : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<LocationOnIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="telephone"
								type="tel"
								label="Téléphone"
								value={formik.values.telephone}
								onChange={formik.handleChange('telephone')}
								onBlur={formik.handleBlur('telephone')}
								error={formik.touched.telephone && Boolean(formik.errors.telephone)}
								helperText={formik.touched.telephone ? formik.errors.telephone : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<PhoneIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="fax"
								type="tel"
								label="Fax"
								value={formik.values.fax}
								onChange={formik.handleChange('fax')}
								onBlur={formik.handleBlur('fax')}
								error={formik.touched.fax && Boolean(formik.errors.fax)}
								helperText={formik.touched.fax ? formik.errors.fax : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<PrintIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="site_web"
								type="url"
								label="Site web"
								value={formik.values.site_web}
								onChange={formik.handleChange('site_web')}
								onBlur={formik.handleBlur('site_web')}
								error={formik.touched.site_web && Boolean(formik.errors.site_web)}
								helperText={formik.touched.site_web ? formik.errors.site_web : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<LanguageIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="numero_du_compte"
								type="text"
								label="Numéro du compte"
								value={formik.values.numero_du_compte}
								onChange={formik.handleChange('numero_du_compte')}
								onBlur={formik.handleBlur('numero_du_compte')}
								error={formik.touched.numero_du_compte && Boolean(formik.errors.numero_du_compte)}
								helperText={formik.touched.numero_du_compte ? formik.errors.numero_du_compte : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<AccountBalanceIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="ICE"
								type="text"
								label="ICE"
								value={formik.values.ICE}
								onChange={formik.handleChange('ICE')}
								onBlur={formik.handleBlur('ICE')}
								error={formik.touched.ICE && Boolean(formik.errors.ICE)}
								helperText={formik.touched.ICE ? formik.errors.ICE : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<FingerprintIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="registre_de_commerce"
								type="text"
								label="Registre de commerce"
								value={formik.values.registre_de_commerce}
								onChange={formik.handleChange('registre_de_commerce')}
								onBlur={formik.handleBlur('registre_de_commerce')}
								error={formik.touched.registre_de_commerce && Boolean(formik.errors.registre_de_commerce)}
								helperText={formik.touched.registre_de_commerce ? formik.errors.registre_de_commerce : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<BadgeIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="identifiant_fiscal"
								type="text"
								label="Identifiant fiscal"
								value={formik.values.identifiant_fiscal}
								onChange={formik.handleChange('identifiant_fiscal')}
								onBlur={formik.handleBlur('identifiant_fiscal')}
								error={formik.touched.identifiant_fiscal && Boolean(formik.errors.identifiant_fiscal)}
								helperText={formik.touched.identifiant_fiscal ? formik.errors.identifiant_fiscal : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<CreditCardIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="tax_professionnelle"
								type="text"
								label="Taxe professionnelle"
								value={formik.values.tax_professionnelle}
								onChange={formik.handleChange('tax_professionnelle')}
								onBlur={formik.handleBlur('tax_professionnelle')}
								error={formik.touched.tax_professionnelle && Boolean(formik.errors.tax_professionnelle)}
								helperText={formik.touched.tax_professionnelle ? formik.errors.tax_professionnelle : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<CreditCardIcon fontSize="small" />}
							/>
							<CustomTextInput
								id="CNSS"
								type="text"
								label="CNSS"
								value={formik.values.CNSS}
								onChange={formik.handleChange('CNSS')}
								onBlur={formik.handleBlur('CNSS')}
								error={formik.touched.CNSS && Boolean(formik.errors.CNSS)}
								helperText={formik.touched.CNSS ? formik.errors.CNSS : ''}
								fullWidth={false}
								size="small"
								theme={inputTheme}
								startIcon={<FingerprintIcon fontSize="small" />}
							/>
							<Box>
								<Typography variant="h5" gutterBottom>
									Utilisateurs gestionnaires
								</Typography>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell>Utilisateur</TableCell>
											<TableCell>Rôle</TableCell>
											<TableCell align="right">Actions</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{adminUsers.length === 0 ? (
											<TableRow>
												<TableCell colSpan={3} align="center">
													<Typography variant="body2" color="text.secondary">
														Aucun utilisateur gestionnaire n’a été ajouté.
													</Typography>
												</TableCell>
											</TableRow>
										) : (
											adminUsers.map((user, index) => (
												<TableRow key={`${user.id}-${index}`}>
													<TableCell>
														{user.first_name} {user.last_name}
														{user.id === userID && (
															<Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
																(vous)
															</Typography>
														)}
													</TableCell>
													<TableCell>
														<Box sx={{ maxWidth: 180 }}>
															<CustomDropDownSelect
																id={`managed_by_role_${index}`}
																label="Rôle"
																value={user.role}
																onChange={(e) => {
																	const newRole = e.target.value;
																	const updatedAdmins = adminUsers.map((u, i) =>
																		i === index ? { ...u, role: newRole } : u,
																	);
																	setAdminUsers(updatedAdmins);
																}}
																items={roleOptions}
																theme={customDropdownTheme()}
																disabled={user.id === userID}
															/>
														</Box>
													</TableCell>
													<TableCell align="right">
														<IconButton
															disabled={user.id === userID}
															color="error"
															onClick={() => {
																setAdminUsers(adminUsers.filter((u) => u.id !== user.id));
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

								<Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
									{isUsersLoading ? (
										<Skeleton variant="rectangular" width={250} height={40} />
									) : (
										<CustomAutocompleteSelect
											id="new_user_select"
											label="Ajouter un utilisateur"
											fullWidth={true}
											items={availableUsers}
											value={selectedUser}
											onChange={(_e, newUser) => {
												if (newUser) {
													setSelectedUser(null);
													const userId = parseInt(newUser.value);
													const userData = usersData?.find((u) => u.id === userId);
													if (userData?.id && userData.first_name && userData.last_name) {
														const newAdmin = {
															id: userData.id,
															first_name: userData.first_name,
															last_name: userData.last_name,
															role: 'Lecture',
														};
														setAdminUsers([...adminUsers, newAdmin]);
													}
												}
											}}
											theme={customDropdownTheme()}
											startIcon={<GroupsIcon fontSize="small" />}
										/>
									)}
								</Stack>
							</Box>

							<PrimaryLoadingButton
								buttonText={isEditMode ? 'Mettre à jour' : "Ajouter l'entreprise"}
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
	id?: number; // Optional - if provided, we're in edit mode
}

const CompanyForm: React.FC<Props> = ({ session, id }) => {
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);
	const isEditMode = id !== undefined;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? "Modifier l'entreprise" : 'Créer une entreprise'}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Box sx={{ width: '100%' }}>
						<FormikContent
							first_name={session?.user.first_name}
							last_name={session?.user.last_name}
							token={token}
							id={id}
							onSuccess={() => setShowDataUpdated(true)}
						/>
					</Box>
				</main>
			</NavigationBar>
			<Portal id="snackbar_portal">
				<CustomToast
					type="success"
					message={isEditMode ? 'Entreprise mise à jour' : 'Entreprise créée avec succès.'}
					setShow={setShowDataUpdated}
					show={showDataUpdated}
				/>
			</Portal>
		</Stack>
	);
};

export default CompanyForm;
