'use client';

import { type FC, isValidElement } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	CalendarToday as CalendarTodayIcon,
	History as HistoryIcon,
	Inventory2 as Inventory2Icon,
	Notes as NotesIcon,
	Person as PersonIcon,
	Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetStockMovementQuery } from '@/store/services/stock';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type {
	StockMovement,
	StockMovementViewInfoRowProps as InfoRowProps,
	StockMovementViewProps,
} from '@/types/stockTypes';
import { formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { STOCK_VIEW } from '@/utils/routes';

const InfoRow: FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue = isValidElement(value) ? value : value && value.toString().length > 0 ? value : '—';

	return (
		<Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', py: 1.5, flexWrap: 'wrap' }}>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack direction="row" spacing={isMobile ? 0 : 2} sx={{ alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
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

const movementColor = (
	type: StockMovement['movement_type'],
): 'default' | 'warning' | 'success' | 'error' | 'info' | 'secondary' => {
	if (type === 'adjustment') return 'warning';
	if (type === 'receipt') return 'success';
	if (type === 'delivery') return 'error';
	if (type === 'inventory') return 'info';
	if (type === 'reversal') return 'secondary';
	return 'default';
};

const StockMovementView: FC<StockMovementViewProps> = ({ session, company_id, id }) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const { data: movement, isLoading, isError } = useGetStockMovementQuery({ company_id, id }, { skip: !token });

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '32px' }}>
			<NavigationBar title="Détails du mouvement">
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
					<Stack
						direction={isMobile ? 'column' : 'row'}
						spacing={2}
						sx={{ justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center' }}
					>
						<Button
							variant="outlined"
							startIcon={<ArrowBackIcon />}
							onClick={() => router.back()}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							Mouvements de stock
						</Button>
						{!isLoading && !isError && movement && (
							<Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
								<Button
									variant="outlined"
									size="small"
									startIcon={<Inventory2Icon />}
									onClick={() => router.push(STOCK_VIEW(movement.balance, company_id))}
								>
									Voir le stock concerné
								</Button>
							</Stack>
						)}
					</Stack>

					{isLoading ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : isError || !movement ? (
						<Typography sx={{ p: 4 }}>Ce mouvement est introuvable.</Typography>
					) : (
						<Stack spacing={3}>
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<Inventory2Icon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Informations du mouvement
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<Inventory2Icon />}
											label="Article"
											value={`${movement.article_reference} — ${movement.article_designation}`}
										/>
										<Divider />
										<InfoRow icon={<WarehouseIcon />} label="Emplacement" value={movement.emplacement_name} />
										<Divider />
										<InfoRow
											icon={<HistoryIcon />}
											label="Type"
											value={
												<Chip
													size="small"
													variant="outlined"
													label={movement.movement_type_display}
													color={movementColor(movement.movement_type)}
												/>
											}
										/>
										<Divider />
										<InfoRow
											icon={<Inventory2Icon />}
											label="Quantité"
											value={
												<Typography
													sx={{ fontWeight: 700, color: Number(movement.quantity) < 0 ? 'error.main' : 'success.main' }}
												>
													{Number(movement.quantity) > 0 ? '+' : ''}
													{formatNumberWithSpaces(movement.quantity, 3)}
												</Typography>
											}
										/>
										<Divider />
										<InfoRow
											icon={<Inventory2Icon />}
											label="Stock après mouvement"
											value={
												<Typography color="primary" sx={{ fontWeight: 600 }}>
													{formatNumberWithSpaces(movement.balance_after, 3)}
												</Typography>
											}
										/>
									</Stack>
								</CardContent>
							</Card>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<HistoryIcon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Traçabilité
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow icon={<CalendarTodayIcon />} label="Date" value={formatDate(movement.date_created)} />
										<Divider />
										<InfoRow icon={<PersonIcon />} label="Utilisateur" value={movement.actor_name || 'Système'} />
										<Divider />
										<InfoRow
											icon={<NotesIcon />}
											label="Motif / source"
											value={movement.note || movement.source_type}
										/>
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

export default StockMovementView;
