'use client';

import React, { useMemo, isValidElement } from 'react';
import {
	Avatar,
	Box,
	Stack,
	Typography,
	Card,
	CardContent,
	Divider,
	Button,
	useTheme,
	useMediaQuery,
} from '@mui/material';
import {
	ArrowBack,
	Edit,
	Description as DescriptionIcon,
	CreditCard as CreditCardIcon,
	Fingerprint as FingerprintIcon,
	Category as CategoryIcon,
	ShoppingCart as ShoppingCartIcon,
	Sell as SellIcon,
	Receipt as ReceiptIcon,
	Business as BusinessIcon,
	Star as StarIcon,
	Straighten as StraightenIcon,
	LocationOn as LocationOnIcon,
	Notes as NotesIcon,
} from '@mui/icons-material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { ARTICLES_LIST, ARTICLES_EDIT } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { useGetArticleQuery } from '@/store/services/article';
import { getAccessTokenFromSession } from '@/store/session';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import Styles from '@/styles/dashboard/clients/clients.module.sass';
import { useAppSelector } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';

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

const ArticlesViewClient: React.FC<Props> = ({ session, company_id, id }) => {
	const token = getAccessTokenFromSession(session);
	const companies = useAppSelector(getUserCompaniesState);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const { data: client, isLoading, error } = useGetArticleQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const company = useMemo(() => {
		return companies?.find((comp) => comp.id === company_id);
	}, [companies, company_id]);

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
			<NavigationBar title="Détails de l'article">
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
					<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
						<Button
							variant="outlined"
							startIcon={<ArrowBack />}
							onClick={() => router.push(ARTICLES_LIST)}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							Liste des articles
						</Button>
						{!isLoading && !error && company?.role === 'Admin' && (
							<Button
								variant="contained"
								startIcon={<Edit />}
								onClick={() => router.push(ARTICLES_EDIT(id, company_id))}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								Modifier
							</Button>
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
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={3} alignItems="center">
										<DescriptionIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Photo d&#39;article
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack
										direction={isMobile ? 'column' : 'row'}
										spacing={3}
										alignItems={isMobile ? 'center' : 'flex-start'}
									>
										<Avatar
											variant="square"
											src={`${client?.photo}`}
											sx={{
												width: isMobile ? 200 : 300,
												height: isMobile ? 200 : 300,
												border: '4px solid',
												borderColor: 'primary.light',
												boxShadow: 3,
											}}
										/>
									</Stack>
								</CardContent>
							</Card>
							{/* Identité de l'article */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={3} alignItems="center">
										<DescriptionIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Identité de l&#39;article
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<FingerprintIcon />} label="Référence" value={client?.reference} />
										<Divider />
										<InfoRow icon={<CategoryIcon />} label="Type" value={client?.type_article} />
										<Divider />
										<InfoRow icon={<DescriptionIcon />} label="Désignation" value={client?.designation} />
									</Stack>
								</CardContent>
							</Card>

							{/* Prix et TVA */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<CreditCardIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Prix et TVA
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<ShoppingCartIcon />} label="Prix d'achat" value={client?.prix_achat} />
										<Divider />
										<InfoRow icon={<SellIcon />} label="Prix de vente" value={client?.prix_vente} />
										<Divider />
										<InfoRow icon={<ReceiptIcon />} label="TVA (%)" value={client?.tva} />
									</Stack>
								</CardContent>
							</Card>

							{/* Classification */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<BusinessIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Classification
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<BusinessIcon />} label="Catégorie" value={client?.categorie_name} />
										<Divider />
										<InfoRow icon={<StarIcon />} label="Marque" value={client?.marque_name} />
										<Divider />
										<InfoRow icon={<StraightenIcon />} label="Unité" value={client?.unite_name} />
										<Divider />
										<InfoRow icon={<LocationOnIcon />} label="Emplacement" value={client?.emplacement_name} />
									</Stack>
								</CardContent>
							</Card>

							{/* Remarque */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<NotesIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Remarque
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<InfoRow icon={<NotesIcon />} label="Remarque" value={client?.remarque} />
								</CardContent>
							</Card>
						</Stack>
					)}
				</Stack>
			</NavigationBar>
		</Stack>
	);
};

export default ArticlesViewClient;
