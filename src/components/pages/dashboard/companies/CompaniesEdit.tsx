'use client';

import React, { useState, useTransition } from 'react';
import type { AppSession } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import { useEditCompanyMutation, useGetCompanyQuery } from '@/store/services/company';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Stack, Box, Typography, Button, IconButton } from '@mui/material';
import { ArrowBack, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { companySchema } from '@/utils/formValidationSchemas';
import { nbrEmployeItemsList, civiliteItemsList } from '@/utils/rawData';
import { setFormikAutoErrors } from '@/utils/helpers';
import { coordonneeTextInputTheme, customDropdownTheme } from '@/utils/themes';
import { COMPANIES_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';

const inputTheme = coordonneeTextInputTheme();

type FormikContentProps = {
	token: string | undefined;
	id: number;
	onSuccess: () => void;
};

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, id, onSuccess } = props;
	const { data: companyData, isLoading: isCompanyLoading, error } = useGetCompanyQuery({ token, id }, { skip: !token });
	const [updateCompany, { isLoading: isUpdateLoading }] = useEditCompanyMutation();
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const formik = useFormik({
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
			managed_by: companyData?.managed_by ?? [],
			logo: null as string | ArrayBuffer | null,
			cachet: null as string | ArrayBuffer | null,
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(companySchema),
		onSubmit: async (data, { setFieldError }) => {
			startTransition(async () => {
				try {
					await updateCompany({ token, data, id }).unwrap();
					onSuccess();
				} catch (e) {
					setFormikAutoErrors({ e, setFieldError });
				}
			});
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'cachet') => {
		const file = e.currentTarget.files?.[0] ?? null;
		formik.setFieldValue(field, file);
	};

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
				{isCompanyLoading || isUpdateLoading || isPending ? (
					<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
				) : error ? (
					<Typography color="error" variant="h6">
						Entreprise introuvable. Veuillez vérifier l&#39;identifiant.
					</Typography>
				) : (
					<form className={Styles.form}>
						<Stack direction="column" spacing={2}>
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
							/>
							<CustomDropDownSelect
								id="nbr_employe"
								label="Nombre d'employés"
								items={nbrEmployeItemsList}
								value={formik.values.nbr_employe}
								onChange={(e) => formik.setFieldValue('nbr_employe', e.target.value)}
								theme={customDropdownTheme()}
							/>
							<CustomDropDownSelect
								id="civilite_responsable"
								label="Civilité du responsable"
								items={civiliteItemsList}
								value={formik.values.civilite_responsable}
								onChange={(e) => formik.setFieldValue('civilite_responsable', e.target.value)}
								theme={customDropdownTheme()}
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
							/>
							<Box>
								<label htmlFor="logo">Logo</label>
								<input
									id="logo"
									name="logo"
									type="file"
									accept="image/*"
									onChange={(e) => handleFileChange(e, 'logo')}
								/>
							</Box>
							<Box>
								<label htmlFor="cachet">Cachet</label>
								<input
									id="cachet"
									name="cachet"
									type="file"
									accept="image/*"
									onChange={(e) => handleFileChange(e, 'cachet')}
								/>
							</Box>
							{/* Managed By Section */}
							<Box>
								<Typography variant="subtitle1" gutterBottom>
									Utilisateurs gestionnaires
								</Typography>
								<Stack spacing={2}>
									{formik.values.managed_by.map((user, index) => (
										<Stack key={index} direction="row" spacing={2} alignItems="center">
											<Box flex={1}>
												<Typography variant="body2" noWrap>
													{user.first_name} {user.last_name}
												</Typography>
											</Box>
											<CustomDropDownSelect
												id={`managed_by_role_${index}`}
												label="Rôle"
												items={[
													{ value: 'Admin', code: 'Admin' },
													{ value: 'Manager', code: 'Manager' },
													{ value: 'User', code: 'Utilisateur' },
												]}
												value={user.role}
												onChange={(e) => {
													const updatedUsers = [...formik.values.managed_by];
													updatedUsers[index].role = e.target.value;
													formik.setFieldValue('managed_by', updatedUsers);
												}}
												theme={customDropdownTheme()}
											/>
											<IconButton
												color="error"
												onClick={() => {
													const updatedUsers = formik.values.managed_by.filter((_, i) => i !== index);
													formik.setFieldValue('managed_by', updatedUsers);
												}}
											>
												<Delete />
											</IconButton>
										</Stack>
									))}

									{/* Add New User */}
									<Stack direction="row" spacing={2} alignItems="flex-end">
										<CustomDropDownSelect
											id="new_user_select"
											label="Ajouter un utilisateur"
											items={[
												// Dummy data - replace with API call later
												{ value: '2', code: 'Ahmed Benali' },
												{ value: '3', code: 'Fatima Zahra' },
												{ value: '4', code: 'Mohammed Alaoui' },
											].filter((item) => !formik.values.managed_by.some((u) => u.id === parseInt(item.value)))}
											value=""
											onChange={(e) => {
												const userId = parseInt(e.target.value);
												// Dummy data - replace with actual user fetch later
												const dummyUsers = [
													{ id: 2, first_name: 'Ahmed', last_name: 'Benali' },
													{ id: 3, first_name: 'Fatima', last_name: 'Zahra' },
													{ id: 4, first_name: 'Mohammed', last_name: 'Alaoui' },
												];
												const selectedUser = dummyUsers.find((u) => u.id === userId);
												if (selectedUser) {
													formik.setFieldValue('managed_by', [
														...formik.values.managed_by,
														{ ...selectedUser, role: 'User' },
													]);
												}
											}}
											theme={customDropdownTheme()}
										/>
									</Stack>
								</Stack>
							</Box>
							<PrimaryLoadingButton
								buttonText="Mettre à jour"
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

type Props = {
	session?: AppSession;
	id: number;
};

const CompaniesEditClient: React.FC<Props> = ({ session, id }) => {
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title="Modifier l'entreprise">
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Desktop>
						<Box sx={{ width: '100%' }}>
							<FormikContent token={token} id={id} onSuccess={() => setShowDataUpdated(true)} />
						</Box>
					</Desktop>
					<TabletAndMobile>
						<Box sx={{ width: '100%' }}>
							<FormikContent token={token} id={id} onSuccess={() => setShowDataUpdated(true)} />
						</Box>
					</TabletAndMobile>
				</main>
			</NavigationBar>

			<Portal id="snackbar_portal">
				<CustomToast
					type="success"
					message="Entreprise mise à jour"
					setShow={setShowDataUpdated}
					show={showDataUpdated}
				/>
			</Portal>
		</Stack>
	);
};

export default CompaniesEditClient;
