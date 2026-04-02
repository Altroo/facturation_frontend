'use client';

import React, { useMemo, isValidElement, useState } from 'react';
import { Box, Stack, Typography, Card, CardContent, Divider, Button, useTheme, useMediaQuery } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Person as PersonIcon,
	Badge as BadgeIcon,
	Notes as NotesIcon,
	Business as BusinessIcon,
	LocationOn as LocationOnIcon,
	Phone as PhoneIcon,
	Email as EmailIcon,
	CreditCard as CreditCardIcon,
	Description as DescriptionIcon,
	Gavel as GavelIcon,
	Fingerprint as FingerprintIcon,
	AccountBalance as AccountBalanceIcon,
	Receipt as ReceiptIcon,
	CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { CLIENTS_LIST, CLIENTS_EDIT } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { useGetClientQuery, useDeleteClientMutation } from '@/store/services/client';
import { useInitAccessToken } from '@/contexts/InitContext';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import { useAppSelector, useToast, useLanguage } from '@/utils/hooks';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { getUserCompaniesState } from '@/store/selectors';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { formatDate, extractApiErrorMessage } from '@/utils/helpers';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue = React.isValidElement(value) ? value : value && value.toString().length > 1 ? value : '-';

	return (
		<Stack
			direction="row"
			alignItems="flex-start"
			spacing={2}
			sx={{
				py: 1.5,
				flexWrap: 'wrap',
			}}
		>
			{/* Icon */}
			<Box
				sx={{
					color: 'primary.main',
					display: 'flex',
					alignItems: 'center',
					minWidth: 40,
				}}
			>
				{icon}
			</Box>

			<Stack
				direction="row"
				alignItems="center"
				spacing={isMobile ? 0 : 2}
				sx={{
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					fontWeight={600}
					color="text.secondary"
					sx={{
						minWidth: { xs: '100%', sm: 200 },
						wordBreak: 'break-word',
					}}
				>
					{label}
				</Typography>

				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

interface Props extends SessionProps {
	company_id: number;
	id: number;
}

const ClientsViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const token = useInitAccessToken(session);
	const companies = useAppSelector(getUserCompaniesState);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const { data: client, isLoading, error } = useGetClientQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const company = useMemo(() => {
		return companies?.find((comp) => comp.id === company_id);
	}, [companies, company_id]);

	const [deleteRecord] = useDeleteClientMutation();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess(t.clients.deleteSuccess);
			router.push(CLIENTS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.clients.deleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <ArrowBackIcon />,
			color: '#6B6B6B',
		},
		{
			text: t.common.delete,
			active: true,
			onClick: handleDelete,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	const isPM = client?.client_type === 'PM';

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
			<NavigationBar title={t.clients.detailsTitle}>
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'stretch' : 'center'} spacing={2}>
					<Button
						variant="outlined"
						startIcon={<ArrowBackIcon />}
						onClick={() => router.push(CLIENTS_LIST)}
						sx={{ width: isMobile ? '100%' : 'auto' }}
					>
						{t.clients.backToList}
					</Button>
					{!isLoading && !error && (company?.role === 'Caissier' || company?.role === 'Commercial') && (
						<Stack direction="row" gap={1} flexWrap="wrap">
							<Button
								variant="outlined"
								size="small"
								startIcon={<EditIcon />}
								onClick={() => router.push(CLIENTS_EDIT(id, company_id))}
							>
								Modifier
							</Button>
							<Button
								variant="outlined"
								color="error"
								size="small"
								startIcon={<DeleteIcon />}
								onClick={() => setShowDeleteModal(true)}
							>
								Supprimer
							</Button>
						</Stack>
					)}
					</Stack>

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
						<Stack spacing={3}>
							{/* {t.clients.identitySection} */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={3} alignItems="center">
										<PersonIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											{t.clients.identitySection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<BadgeIcon />} label={t.clients.fieldCodeClient} value={client?.code_client} />
										<Divider />
										<InfoRow
											icon={<PersonIcon />}
											label={t.clients.colType}
											value={client?.client_type === 'PM' ? t.clients.typePersonneMorale : t.clients.typePersonnePhysique}
										/>
										<Divider />
										{isPM ? (
											<>
												<InfoRow icon={<BusinessIcon />} label={t.clients.fieldRaisonSociale} value={client?.raison_sociale} />
												<Divider />
											</>
										) : (
											<>
												<InfoRow icon={<PersonIcon />} label={t.clients.colNom} value={client?.nom} />
												<Divider />
												<InfoRow icon={<PersonIcon />} label={t.clients.colPrenom} value={client?.prenom} />
												<Divider />
												<InfoRow icon={<LocationOnIcon />} label={t.clients.fieldAdresse} value={client?.adresse} />
												<Divider />
											</>
										)}
									</Stack>
								</CardContent>
							</Card>

							{/* {t.clients.contactSection} */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<PhoneIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											{t.clients.contactSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<EmailIcon />} label={t.clients.fieldEmail} value={client?.email} />
										<Divider />
										<InfoRow icon={<PhoneIcon />} label={t.clients.fieldTelephone} value={client?.tel} />
									</Stack>
								</CardContent>
							</Card>

							{/* {t.clients.adminSection} */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<DescriptionIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											{t.clients.adminSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<AccountBalanceIcon />} label={t.clients.fieldNumeroCompte} value={client?.numero_du_compte} />
										<Divider />
										<InfoRow icon={<FingerprintIcon />} label={t.clients.fieldICE} value={client?.ICE} />
										<Divider />
										<InfoRow icon={<GavelIcon />} label={t.clients.fieldRegistreCommerce} value={client?.registre_de_commerce} />
										<Divider />
										<InfoRow icon={<ReceiptIcon />} label={t.clients.fieldIdentifiantFiscal} value={client?.identifiant_fiscal} />
										<Divider />
										<InfoRow
											icon={<CreditCardIcon />}
											label={t.clients.fieldTaxeProfessionnelle}
											value={client?.taxe_professionnelle}
										/>
										<Divider />
										<InfoRow icon={<FingerprintIcon />} label={t.clients.fieldCNSS} value={client?.CNSS} />
									</Stack>
								</CardContent>
							</Card>

							{/* {t.clients.villeSection} */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<LocationOnIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											{t.clients.villeSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<LocationOnIcon />}
											label={t.clients.fieldVille}
											value={client?.ville_name ? String(client?.ville_name) : ''}
										/>
										<Divider />
										<InfoRow
											icon={<CreditCardIcon />}
											label={t.clients.fieldDelaiPaiement}
											value={client?.delai_de_paiement !== null ? String(client?.delai_de_paiement ?? '') : ''}
										/>
									</Stack>
								</CardContent>
							</Card>
							{/* Remarque */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<NotesIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
										{t.clients.remarkSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<InfoRow icon={<NotesIcon />} label={t.clients.fieldRemarque} value={client?.remarque} />
								</CardContent>
							</Card>

							{/* Dates */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<CalendarTodayIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											{t.clients.datesSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<CalendarTodayIcon />}
											label={t.common.dateCreation}
											value={formatDate(client?.date_created ?? null)}
										/>
										<Divider />
										<InfoRow
											icon={<CalendarTodayIcon />}
											label={t.common.dateMaj}
											value={formatDate(client?.date_updated ?? null)}
										/>
									</Stack>
								</CardContent>
							</Card>
						</Stack>
					)}
				</Stack>
			</NavigationBar>
		{showDeleteModal && (
			<ActionModals
				title={t.clients.deleteModalTitle}
				body={t.clients.deleteModalBody}
				actions={deleteModalActions}
				titleIcon={<DeleteIcon />}
				titleIconColor="#D32F2F"
			/>
		)}
		</Stack>
	);
};

export default ClientsViewClient;
