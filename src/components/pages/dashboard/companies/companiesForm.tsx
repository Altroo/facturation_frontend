'use client';

import React, { useMemo, useState, useTransition } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import { useAddCompanyMutation, useEditCompanyMutation, useGetCompanyQuery } from '@/store/services/company';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Box,
	Button,
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
import ImageIcon from '@mui/icons-material/Image';
import ContactsIcon from '@mui/icons-material/Contacts';
import DescriptionIcon from '@mui/icons-material/Description';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

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
import { useGetUsersListQuery } from '@/store/services/account';
import type { DropDownType } from '@/types/accountTypes';
import type { CompanyFormValuesType, ManagedByType } from '@/types/companyTypes';
import { UserClass } from '@/models/Classes';
import ManagedByTableSection from '@/components/shared/addManagedByTable/addManagedByTable';
import { Protected } from '@/components/layouts/protected/protected';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	first_name: string | null;
	last_name: string | null;
	id?: number;
	onSuccess: () => void;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, first_name, last_name, id, onSuccess } = props;
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const {
		data: companyData,
		isLoading: isCompanyLoading,
		error: companyError,
	} = useGetCompanyQuery({ token, id: id! }, { skip: !token || !isEditMode });
	const [addCompany, { isLoading: isAddLoading, error: addError }] = useAddCompanyMutation();
	const [updateCompany, { isLoading: isUpdateLoading, error: updateError }] = useEditCompanyMutation();
	const { data: rawUsersData, isLoading: isUsersLoading } = useGetUsersListQuery(
		{ token, with_pagination: false },
		{ skip: !token },
	);
	// enforce the type of the users data
	const usersData = rawUsersData as Array<Partial<UserClass>> | undefined;
	const error = isEditMode ? companyError || updateError : addError;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const { id: userID } = useAppSelector(getProfilState);
	const groupes = useAppSelector(getGroupesState);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const computedManagedBy = useMemo(() => {
		let admins: Array<ManagedByType> = [];

		if (isEditMode && companyData?.admins && Array.isArray(companyData.admins)) {
			admins = companyData.admins;
		} else if (!isEditMode && groupes.length && userID) {
			admins = [
				{
					id: userID,
					first_name: first_name ?? 'Moi',
					last_name: last_name ?? '',
					role: 'Admin',
				},
			];
		}

		// Return the correct type with first_name and last_name
		return admins.map((u) => ({
			pk: u.id,
			role: u.role,
			first_name: u.first_name,
			last_name: u.last_name,
		}));
	}, [isEditMode, companyData, groupes.length, userID, first_name, last_name]);

	const [selectedUser, setSelectedUser] = useState<DropDownType | null>(null);
	const [selectedRole, setSelectedRole] = useState<string>('');
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
			managed_by: computedManagedBy,
			globalError: '',
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

	const adminUsers: Array<ManagedByType> = useMemo(() => {
		return formik.values.managed_by.map((entry) => ({
			id: entry.pk,
			first_name: entry.first_name || '',
			last_name: entry.last_name || '',
			role: entry.role || '',
		}));
	}, [formik.values.managed_by]);

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

	const handleAddCompany = () => {
		if (selectedUser && selectedRole) {
			const userId = parseInt(selectedUser.value);
			const userData = usersData?.find((u) => u.id === userId);
			if (userData?.id && userData.first_name && userData.last_name) {
				formik.setFieldValue('managed_by', [
					...formik.values.managed_by,
					{
						pk: userData.id,
						role: selectedRole,
						first_name: userData.first_name,
						last_name: userData.last_name,
					},
				]);
				setSelectedUser(null);
				setSelectedRole('');
			}
		}
	};

	const isLoading = isUsersLoading || isAddLoading || isUpdateLoading || isPending || (isEditMode && isCompanyLoading);

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction={isMobile ? 'column' : 'row'} pt={2} justifyContent="space-between" spacing={2}>
				<Button
					variant="outlined"
					startIcon={<ArrowBack />}
					onClick={() => router.push(COMPANIES_LIST)}
					sx={{ width: isMobile ? '100%' : 'auto' }}
				>
					Liste des entreprises
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
						{/* Logo and Stamp Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<ImageIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Logo et Cachet
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack direction={isMobile ? 'column' : 'row'} spacing={3}>
									<Box sx={{ flex: 1 }}>
										<Typography variant="subtitle2" fontWeight={600} gutterBottom>
											Logo de l&#39;entreprise
										</Typography>
										<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
											<CustomSquareImageUploading
												image={formik.values.logo}
												croppedImage={formik.values.logo_cropped}
												onChange={(img) => formik.setFieldValue('logo', img)}
												onCrop={(cropped) => formik.setFieldValue('logo_cropped', cropped)}
											/>
										</Box>
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="subtitle2" fontWeight={600} gutterBottom>
											Cachet
										</Typography>
										<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
											<CustomSquareImageUploading
												image={formik.values.cachet}
												croppedImage={formik.values.cachet_cropped}
												onChange={(img) => formik.setFieldValue('cachet', img)}
												onCrop={(cropped) => formik.setFieldValue('cachet_cropped', cropped)}
											/>
										</Box>
									</Box>
								</Stack>
							</CardContent>
						</Card>

						{/* General Information Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<BusinessIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Informations générales
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
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
								</Stack>
							</CardContent>
						</Card>

						{/* Responsible Person Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<ContactsIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Responsable
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
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
								</Stack>
							</CardContent>
						</Card>

						{/* Contact Information Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<PhoneIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Contact
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
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
								</Stack>
							</CardContent>
						</Card>

						{/* Administrative Information Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<DescriptionIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Informations administratives
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
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
								</Stack>
							</CardContent>
						</Card>

						{/* Managers Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<ManagedByTableSection
								title="Utilisateurs gestionnaires"
								icon={<AdminPanelSettingsIcon color="primary" />}
								emptyIcon={<AdminPanelSettingsIcon sx={{ fontSize: 48, color: 'grey.400' }} />}
								emptyMessage="Aucun utilisateur gestionnaire"
								headers={['Utilisateur', 'Rôle']}
								data={adminUsers}
								isUserTable={true}
								currentUserId={userID}
								roleOptions={roleOptions}
								onRoleChange={(index, newRole) => {
									const updated = formik.values.managed_by.map((entry, i) =>
										i === index ? { ...entry, role: newRole } : entry,
									);
									formik.setFieldValue('managed_by', updated);
								}}
								onDelete={(index) => {
									const filtered = formik.values.managed_by.filter((_, i) => i !== index);
									formik.setFieldValue('managed_by', filtered);
								}}
								addSectionProps={{
									title: 'Ajouter une société',
									isMobile,
									selectId: 'new_company_select',
									selectLabel: 'Sélectionner une société',
									selectItems: availableUsers,
									selectValue: selectedUser,
									onSelectChange: (_e, newUser) => setSelectedUser(newUser),
									selectIcon: <BusinessIcon fontSize="small" />,
									roleId: 'new_company_role',
									roleLabel: 'Rôle',
									roleOptions,
									roleValue: selectedRole,
									onRoleChange: (e) => setSelectedRole(e.target.value as string),
									roleIcon: <GroupsIcon fontSize="small" />,
									onAdd: handleAddCompany,
									isAddDisabled: !selectedUser || !selectedRole,
								}}
							/>
						</Card>

						{/* Submit Button */}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? 'Mettre à jour' : "Ajouter l'entreprise"}
								active={formik.isValid && !isPending}
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

const CompaniesForm: React.FC<Props> = ({ session, id }) => {
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);
	const isEditMode = id !== undefined;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? "Modifier l'entreprise" : 'Ajouter une entreprise'}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Protected>
						<Box sx={{ width: '100%' }}>
							<FormikContent
								first_name={session?.user.first_name ?? ''}
								last_name={session?.user.last_name ?? ''}
								token={token}
								id={id}
								onSuccess={() => setShowDataUpdated(true)}
							/>
						</Box>
					</Protected>
				</main>
			</NavigationBar>
			<Portal id="snackbar_portal">
				<CustomToast
					type="success"
					message={isEditMode ? 'Entreprise mise à jour' : 'Entreprise ajouter avec succès.'}
					setShow={setShowDataUpdated}
					show={showDataUpdated}
				/>
			</Portal>
		</Stack>
	);
};

export default CompaniesForm;
