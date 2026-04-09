'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Divider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Business as BusinessIcon,
	CalendarToday as CalendarTodayIcon,
	Category as CategoryIcon,
	CreditCard as CreditCardIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Fingerprint as FingerprintIcon,
	Inventory2 as Inventory2Icon,
	LocationOn as LocationOnIcon,
	Notes as NotesIcon,
	Receipt as ReceiptIcon,
	Sell as SellIcon,
	ShoppingCart as ShoppingCartIcon,
	Star as StarIcon,
	Straighten as StraightenIcon,
} from '@mui/icons-material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { ARTICLES_EDIT, ARTICLES_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { useDeleteArticleMutation, useGetArticleQuery } from '@/store/services/article';
import { useInitAccessToken } from '@/contexts/InitContext';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { getUserCompaniesState } from '@/store/selectors';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';

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
			spacing={2}
			sx={{
				alignItems: 'flex-start',
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
				spacing={isMobile ? 0 : 2}
				sx={{
					alignItems: 'center',
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					sx={{
						fontWeight: 600,
						color: 'text.secondary',
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
	const token = useInitAccessToken(session);
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

	const [deleteRecord] = useDeleteArticleMutation();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess(t.articles.deleteSuccess);
			router.push(ARTICLES_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.articles.deleteError));
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

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '32px',
			}}
		>
			<NavigationBar title={t.articles.detailsTitle}>
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
					<Stack
						direction={isMobile ? 'column' : 'row'}
						spacing={2}
						sx={{
							justifyContent: 'space-between',
							alignItems: isMobile ? 'stretch' : 'center',
						}}
					>
						<Button
							variant="outlined"
							startIcon={<ArrowBackIcon />}
							onClick={() => router.push(ARTICLES_LIST)}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							{t.articles.backToList}
						</Button>
						{!isLoading && !error && (company?.role === 'Caissier' || company?.role === 'Commercial') && (
							<Stack
								direction="row"
								sx={{
									gap: 1,
									flexWrap: 'wrap',
								}}
							>
								<Button
									variant="outlined"
									size="small"
									startIcon={<EditIcon />}
									onClick={() => router.push(ARTICLES_EDIT(id, company_id))}
								>
									{t.common.edit}
								</Button>
								<Button
									variant="outlined"
									color="error"
									size="small"
									startIcon={<DeleteIcon />}
									onClick={() => setShowDeleteModal(true)}
								>
									{t.common.delete}
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
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={3}
										sx={{
											alignItems: 'center',
										}}
									>
										<DescriptionIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.articles.photoSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack
										direction={isMobile ? 'column' : 'row'}
										spacing={3}
										sx={{
											alignItems: isMobile ? 'center' : 'flex-start',
										}}
									>
										{client?.photo ? (
											<Box
												component="img"
												src={`${client.photo}`}
												alt={client?.designation ?? t.articles.colPhoto}
												sx={{
													width: isMobile ? 200 : 300,
													height: isMobile ? 200 : 300,
													borderRadius: 2,
													objectFit: 'cover',
													border: '4px solid',
													borderColor: 'primary.light',
													boxShadow: 3,
												}}
											/>
										) : (
											<Box
												sx={{
													width: isMobile ? 200 : 300,
													height: isMobile ? 200 : 300,
													borderRadius: 2,
													backgroundColor: '#E0E0E0',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													border: '4px solid',
													borderColor: 'primary.light',
													boxShadow: 3,
												}}
											>
												<Inventory2Icon sx={{ fontSize: isMobile ? 60 : 80, color: '#BDBDBD' }} />
											</Box>
										)}
									</Stack>
								</CardContent>
							</Card>
							{/* Identité de l'article */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={3}
										sx={{
											alignItems: 'center',
										}}
									>
										<DescriptionIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.articles.identitySection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<FingerprintIcon />} label={t.articles.colReference} value={client?.reference} />
										<Divider />
										<InfoRow icon={<CategoryIcon />} label={t.articles.colType} value={client?.type_article} />
										<Divider />
										<InfoRow icon={<DescriptionIcon />} label={t.articles.colDesignation} value={client?.designation} />
									</Stack>
								</CardContent>
							</Card>

							{/* Prix et TVA */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<CreditCardIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.articles.pricesSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<ShoppingCartIcon />}
											label={t.articles.colPrixAchat}
											value={client?.prix_achat != null ? `${client.prix_achat} ${client.devise_prix_achat}` : null}
										/>
										<Divider />
										<InfoRow icon={<SellIcon />} label={t.articles.colPrixVente} value={client?.prix_vente} />
										<Divider />
										<InfoRow icon={<ReceiptIcon />} label={t.articles.fieldTva} value={client?.tva} />
									</Stack>
								</CardContent>
							</Card>

							{/* Classification */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<BusinessIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.articles.classificationSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<BusinessIcon />}
											label={t.articles.filterCategorie}
											value={client?.categorie_name}
										/>
										<Divider />
										<InfoRow icon={<StarIcon />} label={t.articles.filterMarque} value={client?.marque_name} />
										<Divider />
										<InfoRow icon={<StraightenIcon />} label={t.articles.filterUnite} value={client?.unite_name} />
										<Divider />
										<InfoRow
											icon={<LocationOnIcon />}
											label={t.articles.filterEmplacement}
											value={client?.emplacement_name}
										/>
									</Stack>
								</CardContent>
							</Card>

							{/* Remarque */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<NotesIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.articles.remarkSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<InfoRow icon={<NotesIcon />} label={t.articles.fieldRemarque} value={client?.remarque} />
								</CardContent>
							</Card>

							{/* Dates */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<CalendarTodayIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.articles.datesSection}
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
					title={t.articles.deleteModalTitle}
					body={t.articles.deleteModalBody}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default ArticlesViewClient;
