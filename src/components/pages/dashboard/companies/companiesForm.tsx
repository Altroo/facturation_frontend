'use client';

import React, { useMemo, useState } from 'react';
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
	useTheme,
	useMediaQuery,
	AlertColor,
} from '@mui/material';
import {
	ArrowBack,
	Business as BusinessIcon,
	Email as EmailIcon,
	Groups as GroupsIcon,
	Person as PersonIcon,
	PersonOutline as PersonOutlineIcon,
	Smartphone as SmartphoneIcon,
	LocationOn as LocationOnIcon,
	Phone as PhoneIcon,
	Print as PrintIcon,
	Language as LanguageIcon,
	AccountBalance as AccountBalanceIcon,
	Fingerprint as FingerprintIcon,
	Badge as BadgeIcon,
	CreditCard as CreditCardIcon,
	Image as ImageIcon,
	Contacts as ContactsIcon,
	Description as DescriptionIcon,
	AdminPanelSettings as AdminPanelSettingsIcon,
} from '@mui/icons-material';
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
import type { UserClass } from '@/models/Classes';
import ManagedByTableSection from '@/components/shared/addManagedByTable/addManagedByTable';
import { Protected } from '@/components/layouts/protected/protected';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	first_name: string | null;
	last_name: string | null;
	id?: number;
	onSuccess: (message: string) => void;
	onError: (message: string) => void;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, first_name, last_name, id, onSuccess, onError } = props;
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetCompanyQuery({ id: id! }, { skip: !token || !isEditMode });
	const [addData, { isLoading: isAddLoading, error: addError }] = useAddCompanyMutation();
	const [updateData, { isLoading: isUpdateLoading, error: updateError }] = useEditCompanyMutation();
	const { data: rawUsersData, isLoading: isUsersLoading } = useGetUsersListQuery(
		{ with_pagination: false },
		{ skip: !token },
	);
	// enforce the type of the users data
	const usersData = rawUsersData as Array<Partial<UserClass>> | undefined;
	const error = isEditMode ? dataError || updateError : addError;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const { id: userID } = useAppSelector(getProfilState);
	const groupes = useAppSelector(getGroupesState);
	const [isPending, setIsPending] = useState(false);
	const router = useRouter();
	const computedManagedBy = useMemo(() => {
		let admins: Array<ManagedByType> = [];

		if (isEditMode && rawData?.admins && Array.isArray(rawData.admins)) {
			admins = rawData.admins;
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
	}, [isEditMode, rawData, groupes.length, userID, first_name, last_name]);

	const [selectedUser, setSelectedUser] = useState<DropDownType | null>(null);
	const [selectedRole, setSelectedRole] = useState<string>('');
	const roleOptions = groupes.map((role) => ({ value: role, code: role }));
	const formik = useFormik<CompanyFormValuesType>({
		initialValues: {
			raison_sociale: rawData?.raison_sociale ?? '',
			email: rawData?.email ?? '',
			nbr_employe: rawData?.nbr_employe ?? '',
			civilite_responsable: rawData?.civilite_responsable ?? '',
			nom_responsable: rawData?.nom_responsable ?? '',
			gsm_responsable: rawData?.gsm_responsable ?? '',
			adresse: rawData?.adresse ?? '',
			telephone: rawData?.telephone ?? '',
			fax: rawData?.fax ?? '',
			site_web: rawData?.site_web ?? '',
			numero_du_compte: rawData?.numero_du_compte ?? '',
			ICE: rawData?.ICE ?? '',
			registre_de_commerce: rawData?.registre_de_commerce ?? '',
			identifiant_fiscal: rawData?.identifiant_fiscal ?? '',
			tax_professionnelle: rawData?.tax_professionnelle ?? '',
			CNSS: rawData?.CNSS ?? '',
			logo: rawData?.logo ?? '',
			logo_cropped: rawData?.logo_cropped ?? '',
			cachet: rawData?.cachet ?? '',
			cachet_cropped: rawData?.cachet_cropped ?? '',
			managed_by: computedManagedBy,
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(companySchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			try {
				if (isEditMode) {
					await updateData({ data, id }).unwrap();
					onSuccess("L'entreprise a été mise à jour avec succès.");
				} else {
					await addData({ data }).unwrap();
					onSuccess("L'entreprise a été ajoutée avec succès.");
				}
				if (!isEditMode) {
					setTimeout(() => {
						router.replace(COMPANIES_LIST);
					}, 500);
				}
			} catch (e) {
				if (isEditMode) {
					onError("La mise à jour de l'entreprise a échoué.");
				} else {
					onError("L'ajout de l'entreprise a échoué.");
				}
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
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

	const isLoading = isUsersLoading || isAddLoading || isUpdateLoading || isPending || (isEditMode && isDataLoading);

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
			) : (axiosError?.status as number) > 400 ? (
				<ApiAlert
					errorDetails={axiosError?.data.details}
					cssStyle={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
					}}
				/>
			) : (
				<form onSubmit={formik.handleSubmit}>
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
										label="Raison sociale *"
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
										label="Nombre d'employés *"
										items={nbrEmployeItemsList}
										value={formik.values.nbr_employe}
										onBlur={formik.handleBlur('nbr_employe')}
										error={formik.touched.nbr_employe && Boolean(formik.errors.nbr_employe)}
										helperText={formik.touched.nbr_employe ? formik.errors.nbr_employe : ''}
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
										label="ICE *"
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
								active={!isPending}
								type="submit"
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
	const [showToast, setShowToast] = useState<boolean>(false);
	const [toastType, setToastType] = useState<AlertColor>('success');
	const [toastMessage, setToastMessage] = useState<string>('');

	const showSuccessToast = (message: string) => {
		setToastType('success');
		setToastMessage(message);
		setShowToast(true);
	};

	const showErrorToast = (message: string) => {
		setToastType('error');
		setToastMessage(message);
		setShowToast(true);
	};

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
								onSuccess={showSuccessToast}
								onError={showErrorToast}
							/>
						</Box>
					</Protected>
				</main>
			</NavigationBar>
			<Portal id="snackbar_portal">
				<CustomToast type={toastType} message={toastMessage} setShow={setShowToast} show={showToast} />
			</Portal>
		</Stack>
	);
};

export default CompaniesForm;
