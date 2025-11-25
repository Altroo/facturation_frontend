'use client';

import React, { useState, useEffect, isValidElement } from 'react';
import {
	Box,
	Stack,
	Typography,
	Card,
	CardContent,
	Divider,
	Paper,
	Button,
	useTheme,
	useMediaQuery,
} from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DescriptionIcon from '@mui/icons-material/Description';
import GavelIcon from '@mui/icons-material/Gavel';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';

import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { CLIENTS_LIST, CLIENTS_EDIT } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { useGetClientQuery } from '@/store/services/client';
import { getAccessTokenFromSession } from '@/store/session';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import Styles from '@/styles/dashboard/clients/clients.module.sass';

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
	const token = getAccessTokenFromSession(session);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const { data: client, isLoading, error } = useGetClientQuery({ token, id }, { skip: !token });
	const [axiosError, setAxiosError] = useState<ResponseDataInterface<ApiErrorResponseType>>(
		error as ResponseDataInterface<ApiErrorResponseType>,
	);
	const isPM = client?.client_type === 'PM';

	useEffect(() => {
		if (error) {
			const axiosError = error as ResponseDataInterface<ApiErrorResponseType>;
			setAxiosError(axiosError);
		}
	}, [error]);

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
			<NavigationBar title="Détails du client">
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
					<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
						<Button
							variant="outlined"
							startIcon={<ArrowBack />}
							onClick={() => router.push(CLIENTS_LIST)}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							Liste des clients
						</Button>
						{!isLoading && !error && (
							<Button
								variant="contained"
								startIcon={<Edit />}
								onClick={() => router.push(CLIENTS_EDIT(id, company_id))}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								Modifier
							</Button>
						)}
					</Stack>

					{isLoading ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : axiosError ? (
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
						<Stack spacing={3}>
							{/* Identité du client */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={3} alignItems="center">
										<PersonIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Identité du client
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<BadgeIcon />} label="Code client" value={client?.code_client} />
										<Divider />
										<InfoRow
											icon={<PersonIcon />}
											label="Type"
											value={client?.client_type === 'PM' ? 'Personne morale' : 'Personne physique'}
										/>
										<Divider />
										{isPM ? (
											<>
												<InfoRow icon={<BusinessIcon />} label="Raison sociale" value={client?.raison_sociale} />
												<Divider />
											</>
										) : (
											<>
												<InfoRow icon={<PersonIcon />} label="Nom" value={client?.nom} />
												<Divider />
												<InfoRow icon={<PersonIcon />} label="Prénom" value={client?.prenom} />
												<Divider />
												<InfoRow icon={<LocationOnIcon />} label="Adresse" value={client?.adresse} />
												<Divider />
											</>
										)}
									</Stack>
								</CardContent>
							</Card>

							{/* Contact */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<PhoneIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Contact
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<EmailIcon />} label="Email" value={client?.email} />
										<Divider />
										<InfoRow icon={<PhoneIcon />} label="Téléphone" value={client?.tel} />
									</Stack>
								</CardContent>
							</Card>

							{/* Informations administratives */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<DescriptionIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Informations administratives
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<AccountBalanceIcon />} label="Numéro du compte" value={client?.numero_du_compte} />
										<Divider />
										<InfoRow icon={<FingerprintIcon />} label="ICE" value={client?.ICE} />
										<Divider />
										<InfoRow icon={<GavelIcon />} label="Registre de commerce" value={client?.registre_de_commerce} />
										<Divider />
										<InfoRow icon={<ReceiptIcon />} label="Identifiant fiscal" value={client?.identifiant_fiscal} />
										<Divider />
										<InfoRow
											icon={<CreditCardIcon />}
											label="Taxe professionnelle"
											value={client?.taxe_professionnelle}
										/>
										<Divider />
										<InfoRow icon={<FingerprintIcon />} label="CNSS" value={client?.CNSS} />
									</Stack>
								</CardContent>
							</Card>

							{/* Ville et paiement */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<LocationOnIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Ville et paiement
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<LocationOnIcon />}
											label="Ville"
											value={client?.ville_name ? String(client?.ville_name) : null} // map to city name if available
										/>
										<Divider />
										<InfoRow
											icon={<CreditCardIcon />}
											label="Délai de paiement (j)"
											value={client?.delai_de_paiement !== null ? String(client?.delai_de_paiement ?? '') : null}
										/>
										<Divider />
										<InfoRow icon={<DescriptionIcon />} label="Remarque" value={client?.remarque} />
									</Stack>
								</CardContent>
							</Card>
						</Stack>
					)}
				</Stack>
			</NavigationBar>
		</Stack>
	);
};

export default ClientsViewClient;
