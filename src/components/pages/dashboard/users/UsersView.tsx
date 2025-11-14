'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import { useGetUserQuery } from '@/store/services/account';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Stack,
	Typography,
	Avatar,
	useTheme,
	useMediaQuery,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Edit } from '@mui/icons-material';
import { USERS_LIST, USERS_EDIT } from '@/utils/routes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';

const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
	<Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
		<Typography fontWeight="bold" sx={{ minWidth: 190 }}>
			{label}
		</Typography>
		<Typography sx={{ flex: 1 }}>{value && value.toString().length > 1 ? value : '-'}</Typography>
	</Stack>
);

interface Props extends SessionProps {
	id: number;
}

const UsersViewClient: React.FC<Props> = ({ session, id }) => {
	const router = useRouter();
	const token = getAccessTokenFromSession(session);
	const { data: userData, isLoading, error } = useGetUserQuery({ token, id }, { skip: !token });
	const [axiosError, setAxiosError] = useState<ResponseDataInterface<ApiErrorResponseType>>(
		error as ResponseDataInterface<ApiErrorResponseType>,
	);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	useEffect(() => {
		if (error) {
			const axiosError = error as ResponseDataInterface<ApiErrorResponseType>;
			setAxiosError(axiosError);
		}
	}, [error]);

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
			<NavigationBar title="Détails de l'entreprise">
				<Stack spacing={4} sx={{ p: 2 }}>
					<Stack direction="row" alignItems="center" spacing={2}>
						<Stack direction="column" spacing={2} pt={2} width="100%">
							<Stack direction="row" justifyContent="space-between">
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(USERS_LIST)}>
									Liste des utilisateurs
								</Button>
								{!isLoading && !error && (
									<Button variant="contained" startIcon={<Edit />} onClick={() => router.push(USERS_EDIT(id))}>
										Modifier
									</Button>
								)}
							</Stack>
						</Stack>
					</Stack>

					{isLoading ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : axiosError ? (
						<Typography color="error" variant="h6">
							{axiosError.data?.message}
						</Typography>
					) : (
						<Stack spacing={2}>
							<Accordion defaultExpanded sx={{ flex: 1, marginBottom: '0 !important' }}>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography fontWeight="bold">En-tête :</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems="center">
										<Avatar
											src={`${userData?.avatar}`}
											sx={{ width: isMobile ? 56 : 72, height: isMobile ? 56 : 72 }}
										/>
										<Stack>
											<Typography variant="h6">{userData?.email ?? 'Nom de l’utilisateur'}</Typography>
											<Typography variant="body2" color="text.secondary">
												ID : {userData?.id}
											</Typography>
										</Stack>
									</Stack>
								</AccordionDetails>
							</Accordion>

							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography fontWeight="bold">Informations générales :</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack spacing={1}>
										<InfoRow label="Email" value={userData?.email} />
										<InfoRow label="Sexe" value={userData?.gender} />
										<InfoRow label="Admin" value={userData?.is_staff === true ? 'Oui' : 'Non'} />
										<InfoRow label="Active" value={userData?.is_active === true ? 'Oui' : 'Non'} />
										<InfoRow label="Date d'inscription" value={userData?.date_joined} />
										<InfoRow label="Dernière connexion" value={userData?.last_login} />
									</Stack>
								</AccordionDetails>
							</Accordion>
							{userData?.companies && userData.companies.length > 0 && (
								<Accordion defaultExpanded>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Typography fontWeight="bold">Gère :</Typography>
									</AccordionSummary>
									<AccordionDetails>
										<Stack spacing={1}>
											{userData?.companies.map((companie) => (
												<InfoRow key={companie.id} label={companie.raison_sociale} value={companie.role} />
											))}
										</Stack>
									</AccordionDetails>
								</Accordion>
							)}
						</Stack>
					)}
				</Stack>
			</NavigationBar>
		</Stack>
	);
};

export default UsersViewClient;
