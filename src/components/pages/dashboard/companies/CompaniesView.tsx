'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiErrorResponseType, AppSession, ResponseDataInterface } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import { useGetCompanyQuery } from '@/store/services/company';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Stack,
	Typography,
	Avatar,
	Chip,
	useTheme,
	useMediaQuery,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import { Edit } from '@mui/icons-material';
import { COMPANIES_LIST, COMPANIES_EDIT } from '@/utils/routes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import Image from 'next/image';

type Props = {
	session?: AppSession;
	id: number;
};

const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
	<Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
		<Typography fontWeight="bold" sx={{ minWidth: 190 }}>
			{label}
		</Typography>
		<Typography sx={{ flex: 1 }}>{value && value.toString().length > 1 ? value : '-'}</Typography>
	</Stack>
);

const CompaniesViewClient: React.FC<Props> = ({ session, id }) => {
	const router = useRouter();
	const token = getAccessTokenFromSession(session);
	const { data: companyData, isLoading, error } = useGetCompanyQuery({ token, id }, { skip: !token });
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
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(COMPANIES_LIST)}>
									Liste des entreprises
								</Button>
								{!isLoading && !error && (
									<Button variant="contained" startIcon={<Edit />} onClick={() => router.push(COMPANIES_EDIT(id))}>
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
							<Stack direction={isMobile ? 'column' : 'row'} gap={2}>
								<Accordion defaultExpanded sx={{ flex: 1, marginBottom: '0 !important' }}>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Typography fontWeight="bold">En-tête</Typography>
									</AccordionSummary>
									<AccordionDetails>
										<Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems="center">
											<Avatar
												src={`${companyData?.logo_cropped}`}
												sx={{ width: isMobile ? 56 : 72, height: isMobile ? 56 : 72 }}
											/>
											<Stack>
												<Typography variant="h6">{companyData?.raison_sociale ?? 'Nom de l’entreprise'}</Typography>
												<Typography variant="body2" color="text.secondary">
													ID : {companyData?.id}
												</Typography>
											</Stack>
										</Stack>
									</AccordionDetails>
								</Accordion>
								<Accordion defaultExpanded sx={{ flex: 1, marginTop: '0 !important' }}>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Typography fontWeight="bold">Cachet</Typography>
									</AccordionSummary>
									<AccordionDetails>
										<Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
											<Image
												alt="Cachet de l'entreprise"
												loading="eager"
												width={360}
												height={250}
												src={`${companyData?.cachet_cropped}`}
												style={{ objectFit: 'contain' }}
											/>
										</Stack>
									</AccordionDetails>
								</Accordion>
							</Stack>

							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography fontWeight="bold">Informations générales</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack spacing={1}>
										<InfoRow label="Date de création" value={companyData?.date_created} />
										<InfoRow label="Nombre d'employés" value={companyData?.nbr_employe} />
										<InfoRow label="Adresse" value={companyData?.adresse} />
										<InfoRow label="Site web" value={companyData?.site_web} />
									</Stack>
								</AccordionDetails>
							</Accordion>

							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography fontWeight="bold">Informations administratives</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack spacing={1}>
										<InfoRow label="Numéro du compte" value={companyData?.numero_du_compte} />
										<InfoRow label="ICE" value={companyData?.ICE} />
										<InfoRow label="Registre de commerce" value={companyData?.registre_de_commerce} />
										<InfoRow label="Identifiant fiscal" value={companyData?.identifiant_fiscal} />
										<InfoRow label="Taxe professionnelle" value={companyData?.tax_professionnelle} />
										<InfoRow label="CNSS" value={companyData?.CNSS} />
									</Stack>
								</AccordionDetails>
							</Accordion>

							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography fontWeight="bold">Responsable</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack spacing={1}>
										<InfoRow label="Civilité" value={companyData?.civilite_responsable} />
										<InfoRow label="Nom" value={companyData?.nom_responsable} />
										<InfoRow label="GSM" value={companyData?.gsm_responsable} />
									</Stack>
								</AccordionDetails>
							</Accordion>

							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography fontWeight="bold">Contact</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack spacing={1}>
										<InfoRow label="Email" value={companyData?.email} />
										<InfoRow label="Téléphone" value={companyData?.telephone} />
										<InfoRow label="Fax" value={companyData?.fax} />
									</Stack>
								</AccordionDetails>
							</Accordion>

							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography fontWeight="bold">Gestionnaires</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack direction="row" spacing={1} flexWrap="wrap">
										{companyData?.admins?.length ? (
											companyData.admins.map((manager, index) => (
												<Chip
													key={manager.id ?? index}
													label={
														(`${manager.first_name ?? ''} ${manager.last_name ?? ''}`.trim() ||
															`Utilisateur ${manager.id}`) + (manager.role ? ` – ${manager.role}` : '')
													}
													icon={<PersonIcon />}
												/>
											))
										) : (
											<Typography>Aucun gestionnaire renseigné</Typography>
										)}
									</Stack>
								</AccordionDetails>
							</Accordion>
						</Stack>
					)}
				</Stack>
			</NavigationBar>
		</Stack>
	);
};

export default CompaniesViewClient;
