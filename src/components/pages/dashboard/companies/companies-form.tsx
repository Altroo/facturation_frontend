'use client';

import React, { useMemo, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { useAddCompanyMutation, useEditCompanyMutation, useGetCompanyQuery } from '@/store/services/company';
import Styles from '@/styles/dashboard/dashboard.module.sass';
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
	Alert,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
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
import { companySchema } from '@/utils/formValidationSchemas';
import { civiliteItemsList, nbrEmployeItemsList } from '@/utils/rawData';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { textInputTheme, customDropdownTheme } from '@/utils/themes';
import { COMPANIES_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getGroupesState, getProfilState } from '@/store/selectors';
import { useGetUsersListQuery } from '@/store/services/account';
import type { DropDownType } from '@/types/accountTypes';
import type { CompanyFormValuesType, ManagedByType } from '@/types/companyTypes';
import type { UserClass } from '@/models/classes';
import ManagedByTableSection from '@/components/shared/addManagedByTable/addManagedByTable';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import CompanyUsersWrapperForm from '@/components/pages/dashboard/shared/companies-users-form/companyUsersWrapperForm';

const inputTheme = textInputTheme();

type FormikContentProps = {
	token: string | undefined;
	first_name: string | null;
	last_name: string | null;
	id?: number;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, first_name, last_name, id } = props;
	const { onSuccess, onError } = useToast();
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
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
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
			setHasAttemptedSubmit(true);
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...payload } = data;
			try {
				if (isEditMode) {
					await updateData({ data: payload, id: id }).unwrap();
					onSuccess("L'entreprise a été mise à jour avec succès.");
				} else {
					await addData({ data: payload }).unwrap();
					onSuccess("L'entreprise a été ajoutée avec succès.");
				}
				if (!isEditMode) {
					router.replace(COMPANIES_LIST);
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

	// Collect validation errors from Formik
	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			raison_sociale: 'Raison sociale',
			email: 'Email',
			nbr_employe: "Nombre d'employés",
			civilite_responsable: 'Civilité du responsable',
			nom_responsable: 'Nom du responsable',
			gsm_responsable: 'GSM du responsable',
			adresse: 'Adresse',
			site_web: 'Site web',
			telephone: 'Téléphone',
			fax: 'Fax',
			numero_du_compte: 'Numéro du compte',
			ICE: 'ICE',
			registre_de_commerce: 'Registre de commerce',
			identifiant_fiscal: 'Identifiant fiscal',
			tax_professionnelle: 'Taxe professionnelle',
			CNSS: 'CNSS',
			logo: 'Logo',
			logo_cropped: 'Logo recadré',
			cachet: 'Cachet',
			cachet_cropped: 'Cachet recadré',
			managed_by: 'Utilisateurs gestionnaires',
			globalError: 'Erreur globale',
		}),
		[],
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

	const isLoading = isUsersLoading || isAddLoading || isUpdateLoading || isPending || (isEditMode && isDataLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction={isMobile ? 'column' : 'row'} pt={2} justifyContent="space-between" spacing={2}>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => router.push(COMPANIES_LIST)}
					sx={{
						whiteSpace: 'nowrap',
						px: { xs: 1.5, sm: 2, md: 3 },
						py: { xs: 0.8, sm: 1, md: 1 },
						fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
					}}
				>
					Liste des entreprises
				</Button>
			</Stack>
			{hasValidationErrors && (
				<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
					<Typography variant="subtitle2" fontWeight={600}>
						Erreurs de validation détectées:
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
										size="small"
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
										size="small"
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
									title: 'Ajouter un gestionnaire',
									isMobile,
									selectId: 'new_company_select',
									selectLabel: 'Sélectionner un utilisateur',
									selectItems: availableUsers,
									selectValue: selectedUser,
									onSelectChange: (_e, newUser) => setSelectedUser(newUser),
									selectIcon: <PersonIcon fontSize="small" />,
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
								startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									setHasAttemptedSubmit(true);
									if (!formik.isValid) {
										e.preventDefault();
										formik.handleSubmit();
										onError('Veuillez corriger les erreurs de validation avant de soumettre.');
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

const CompaniesForm: React.FC<Props> = ({ session, id }) => (
	<CompanyUsersWrapperForm
		session={session}
		id={id}
		entityName="entreprise"
		FormikComponent={FormikContent}
		extraFormikProps={{
			first_name: session?.user.first_name ?? '',
			last_name: session?.user.last_name ?? '',
		}}
	/>
);

export default CompaniesForm;
