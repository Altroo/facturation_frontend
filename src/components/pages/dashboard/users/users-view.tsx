'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteUserMutation, useGetUserQuery } from '@/store/services/account';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Paper,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	AdminPanelSettings as AdminPanelSettingsIcon,
	ArrowBack as ArrowBackIcon,
	Badge as BadgeIcon,
	Business as BusinessIcon,
	CalendarToday as CalendarTodayIcon,
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	Login as LoginIcon,
	Person as PersonIcon,
	Public as PublicIcon,
} from '@mui/icons-material';
import { USERS_EDIT, USERS_LIST } from '@/utils/routes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
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
	id: number;
}

const UsersViewClient: React.FC<Props> = ({ session, id }) => {
	const router = useRouter();
	const token = useInitAccessToken(session);
	const { data: userData, isLoading, error } = useGetUserQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const [deleteRecord] = useDeleteUserMutation();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess(t.users.deleteSuccess);
			router.push(USERS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.users.deleteError));
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
			<NavigationBar title={t.users.detailsTitle}>
				<Protected>
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
								onClick={() => router.push(USERS_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								{t.users.backToList}
							</Button>
							{!isLoading && !error && (
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
										onClick={() => router.push(USERS_EDIT(id))}
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
											direction={isMobile ? 'column' : 'row'}
											spacing={3}
											sx={{
												alignItems: isMobile ? 'center' : 'flex-start',
											}}
										>
											<Avatar
												src={`${userData?.avatar}`}
												alt={userData?.email}
												sx={{
													width: isMobile ? 100 : 120,
													height: isMobile ? 100 : 120,
													border: '4px solid',
													borderColor: 'primary.light',
													boxShadow: 3,
													'& img': {
														objectFit: 'contain',
													},
												}}
											/>
											<Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
												<Stack
													spacing={1}
													sx={{
														alignItems: isMobile ? 'center' : 'flex-start',
													}}
												>
													<Typography
														variant="h4"
														sx={{
															textAlign: isMobile ? 'center' : 'inherit',
															fontSize: isMobile ? '20px' : '25px',
															fontWeight: 700,
														}}
													>
														{userData?.email ?? t.users.emailFallback}
													</Typography>
													<Stack
														direction="row"
														spacing={1}
														sx={{
															alignItems: 'center',
															flexWrap: 'wrap',
														}}
													>
														<Chip icon={<BadgeIcon />} label={`ID: ${userData?.id}`} size="small" variant="outlined" />
														{userData?.is_staff && (
															<Chip
																icon={<AdminPanelSettingsIcon />}
																label={t.users.adminChip}
																color="primary"
																size="small"
															/>
														)}
														{userData?.is_active ? (
															<Chip
																icon={<CheckCircleIcon />}
																label={t.users.activeChip}
																color="success"
																size="small"
															/>
														) : (
															<Chip icon={<CancelIcon />} label={t.users.inactiveChip} color="error" size="small" />
														)}
													</Stack>
												</Stack>
											</Stack>
										</Stack>
									</CardContent>
								</Card>

								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent
										sx={{
											px: { xs: 2, md: 3 },
											py: { xs: 2, md: 3 },
										}}
									>
										<Stack
											direction="row"
											spacing={2}
											sx={{
												alignItems: 'center',
												mb: 2,
											}}
										>
											<PublicIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.users.generalInfoSection}
											</Typography>
										</Stack>

										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />

										<Stack spacing={0}>
											<InfoRow icon={<EmailIcon />} label={t.users.colEmail} value={userData?.email} />
											<Divider />
											<InfoRow icon={<PersonIcon />} label={t.users.colSexe} value={userData?.gender} />
											<Divider />
											<InfoRow
												icon={<AdminPanelSettingsIcon />}
												label={t.users.colAdmin}
												value={
													userData?.is_staff ? (
														<Chip icon={<CheckCircleIcon />} label={t.users.filterOui} color="primary" size="small" />
													) : (
														<Chip icon={<CancelIcon />} label={t.users.filterNon} size="small" variant="outlined" />
													)
												}
											/>
											<Divider />
											<InfoRow
												icon={<CheckCircleIcon />}
												label={t.users.colActive}
												value={
													userData?.is_active ? (
														<Chip icon={<CheckCircleIcon />} label={t.users.filterOui} color="success" size="small" />
													) : (
														<Chip icon={<CancelIcon />} label={t.users.filterNon} color="error" size="small" />
													)
												}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.users.colDateInscription}
												value={userData?.date_joined && formatDate(userData?.date_joined)}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.common.dateMaj}
												value={userData?.date_updated && formatDate(userData?.date_updated)}
											/>
											<Divider />
											<InfoRow
												icon={<LoginIcon />}
												label={t.users.colDerniereConnexion}
												value={userData?.last_login && formatDate(userData?.last_login)}
											/>
										</Stack>
									</CardContent>
								</Card>

								{userData?.companies && userData.companies.length > 0 ? (
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
													{t.users.companiesSection} ({userData.companies.length})
												</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<Stack spacing={2}>
												{userData.companies.map((companie) => (
													<Paper
														key={companie.membership_id}
														elevation={0}
														sx={{
															p: 2,
															backgroundColor: 'grey.50',
															borderRadius: 2,
															border: '1px solid',
															borderColor: 'grey.200',
															'&:hover': {
																backgroundColor: 'grey.100',
																borderColor: 'primary.main',
																transition: 'all 0.3s ease',
															},
														}}
													>
														<Stack
															direction={isMobile ? 'column' : 'row'}
															spacing={2}
															sx={{
																justifyContent: 'space-between',
																alignItems: isMobile ? 'flex-start' : 'center',
															}}
														>
															<Stack
																direction="row"
																spacing={2}
																sx={{
																	alignItems: 'center',
																}}
															>
																<Avatar
																	sx={{
																		bgcolor: 'primary.main',
																		width: 40,
																		height: 40,
																	}}
																>
																	<BusinessIcon />
																</Avatar>
																<Stack>
																	<Typography
																		variant="body1"
																		sx={{
																			fontWeight: 600,
																		}}
																	>
																		{companie.raison_sociale}
																	</Typography>
																	<Typography
																		variant="caption"
																		sx={{
																			color: 'text.secondary',
																		}}
																	>
																		ID: {companie.membership_id}
																	</Typography>
																</Stack>
															</Stack>
															<Chip label={companie.role} color="primary" variant="outlined" size="small" />
														</Stack>
													</Paper>
												))}
											</Stack>
										</CardContent>
									</Card>
								) : (
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
													{t.users.companiesSection} (0)
												</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<Box sx={{ py: 3, textAlign: 'center' }}>
												<Stack
													spacing={1}
													sx={{
														alignItems: 'center',
														justifyContent: 'center',
														py: 3,
													}}
												>
													<BusinessIcon sx={{ fontSize: 48, color: 'grey.400' }} />
													<Typography
														variant="body1"
														sx={{
															color: 'text.secondary',
														}}
													>
														{t.users.noCompany}
													</Typography>
												</Stack>
											</Box>
										</CardContent>
									</Card>
								)}
							</Stack>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
			{showDeleteModal && (
				<ActionModals
					title={t.users.deleteModalTitle}
					body={t.users.deleteModalBody}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default UsersViewClient;
