'use client';

import { runWithCleanup } from '@/utils/runWithCleanup';
import { isValidElement, useState, type FC } from 'react';
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
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Inventory2 as Inventory2Icon,
	LocalShipping as LocalShippingIcon,
	Notes as NotesIcon,
	Person as PersonIcon,
	ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getUserCompaniesState } from '@/store/selectors';
import {
	useCancelStockReceiptMutation,
	useGetStockReceiptQuery,
	useValidateStockReceiptMutation,
} from '@/store/services/stock';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface } from '@/types/_initTypes';
import type { StockReceiptLine } from '@/types/stockTypes';
import { extractApiErrorMessage, formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { useAppSelector, useToast } from '@/utils/hooks';
import type {
	StockReceiptViewInfoRowProps as InfoRowProps,
	StockReceiptViewProps,
	PendingAction,
} from '@/types/stockTypes';

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

const StockReceiptView: FC<StockReceiptViewProps> = ({ session, company_id, id }) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const { onSuccess, onError } = useToast();
	const companies = useAppSelector(getUserCompaniesState);
	const canReceive = companies?.find((company) => company.id === company_id)?.role === 'Logistique';
	const { data: receipt, isLoading, error } = useGetStockReceiptQuery({ company_id, id }, { skip: !token });
	const axiosError = error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;
	const [validateReceipt, validateState] = useValidateStockReceiptMutation();
	const [cancelReceipt, cancelState] = useCancelStockReceiptMutation();
	const [pendingAction, setPendingAction] = useState<PendingAction>(null);

	const columns = [
		{ field: 'article_reference', headerName: 'Référence', minWidth: 150, flex: 0.8 },
		{ field: 'article_designation', headerName: 'Désignation', minWidth: 240, flex: 1.5 },
		{ field: 'emplacement_name', headerName: 'Emplacement', minWidth: 190, flex: 1 },
		{
			field: 'quantity',
			headerName: 'Quantité reçue',
			type: 'number',
			minWidth: 150,
			flex: 0.8,
			valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
			renderCell: (params) => (
				<Typography color="primary" sx={{ fontWeight: 600 }}>
					{formatNumberWithSpaces(params.row.quantity, 3)}
				</Typography>
			),
		},
	] as GridColDef<StockReceiptLine>[];

	const handleValidate = async () => {
		await runWithCleanup(
			async () => {
				try {
					await validateReceipt({ company_id, id }).unwrap();
					onSuccess('Réception validée et ajoutée au stock.');
				} catch (mutationError) {
					onError(extractApiErrorMessage(mutationError, 'Impossible de valider la réception.'));
				}
			},
			() => {
				setPendingAction(null);
			},
		);
	};

	const handleCancel = async () => {
		await runWithCleanup(
			async () => {
				try {
					await cancelReceipt({ company_id, id }).unwrap();
					onSuccess('Réception annulée.');
				} catch (mutationError) {
					onError(extractApiErrorMessage(mutationError, "Impossible d'annuler la réception."));
				}
			},
			() => {
				setPendingAction(null);
			},
		);
	};

	const statusLabel =
		receipt?.status === 'validated' ? 'Validée' : receipt?.status === 'cancelled' ? 'Annulée' : 'Brouillon';
	const statusColor: 'success' | 'error' | 'default' =
		receipt?.status === 'validated' ? 'success' : receipt?.status === 'cancelled' ? 'error' : 'default';
	const mutationLoading = validateState.isLoading || cancelState.isLoading;

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '32px' }}>
			<NavigationBar title="Détails de la réception">
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
							Retour aux réceptions
						</Button>
						{!isLoading && !error && canReceive && (
							<Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
								{receipt?.status === 'draft' && (
									<Button
										variant="outlined"
										color="success"
										size="small"
										startIcon={<CheckCircleIcon />}
										onClick={() => setPendingAction('validate')}
									>
										Valider
									</Button>
								)}
								{receipt?.status === 'validated' && (
									<Button
										variant="outlined"
										color="error"
										size="small"
										startIcon={<CancelIcon />}
										onClick={() => setPendingAction('cancel')}
									>
										Annuler
									</Button>
								)}
							</Stack>
						)}
					</Stack>

					{isLoading ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : (axiosError?.status ?? 0) > 400 || !receipt ? (
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
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<ReceiptLongIcon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Informations de réception
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<ReceiptLongIcon />}
											label="Référence"
											value={receipt.reference || `REC-${receipt.id}`}
										/>
										<Divider />
										<InfoRow
											icon={<LocalShippingIcon />}
											label="Dossier logistique"
											value={receipt.logistics_order_number}
										/>
										<Divider />
										<InfoRow
											icon={<CheckCircleIcon />}
											label="Statut"
											value={<Chip size="small" variant="outlined" label={statusLabel} color={statusColor} />}
										/>
										<Divider />
										<InfoRow icon={<PersonIcon />} label="Créée par" value={receipt.created_by_name} />
									</Stack>
								</CardContent>
							</Card>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<CalendarTodayIcon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Suivi de validation
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<CalendarTodayIcon />}
											label="Date de création"
											value={formatDate(receipt.date_created)}
										/>
										<Divider />
										<InfoRow
											icon={<CalendarTodayIcon />}
											label="Date de validation"
											value={receipt.date_validated ? formatDate(receipt.date_validated) : '—'}
										/>
										<Divider />
										<InfoRow icon={<PersonIcon />} label="Validée par" value={receipt.validated_by_name} />
									</Stack>
								</CardContent>
							</Card>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<NotesIcon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Note
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<InfoRow icon={<NotesIcon />} label="Note" value={receipt.note} />
								</CardContent>
							</Card>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<Inventory2Icon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Articles reçus
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<DataGrid
										rows={receipt.lines}
										columns={columns}
										disableRowSelectionOnClick
										showToolbar={true}
										slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
										localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
										pagination
										pageSizeOptions={[5, 10, 25, 50, 100]}
										initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
									/>
								</CardContent>
							</Card>
						</Stack>
					)}
				</Stack>
			</NavigationBar>

			{pendingAction === 'validate' && (
				<ActionModals
					title="Valider la réception"
					body="Voulez-vous vraiment valider cette réception ? Les quantités reçues seront ajoutées au stock."
					titleIcon={<CheckCircleIcon />}
					titleIconColor="#2E7D32"
					onClose={() => setPendingAction(null)}
					actions={[
						{
							text: 'Annuler',
							active: false,
							onClick: () => setPendingAction(null),
							icon: <CloseIcon />,
							color: '#6B6B6B',
							disabled: mutationLoading,
						},
						{
							text: 'Valider',
							active: true,
							onClick: handleValidate,
							icon: <CheckCircleIcon />,
							color: '#2E7D32',
							disabled: mutationLoading,
						},
					]}
				/>
			)}
			{pendingAction === 'cancel' && (
				<ActionModals
					title="Annuler la réception"
					body="Voulez-vous vraiment annuler cette réception ? Les quantités validées seront retirées du stock."
					titleIcon={<CancelIcon />}
					titleIconColor="#D32F2F"
					onClose={() => setPendingAction(null)}
					actions={[
						{
							text: 'Retour',
							active: false,
							onClick: () => setPendingAction(null),
							icon: <CloseIcon />,
							color: '#6B6B6B',
							disabled: mutationLoading,
						},
						{
							text: 'Annuler la réception',
							active: true,
							onClick: handleCancel,
							icon: <CancelIcon />,
							color: '#D32F2F',
							disabled: mutationLoading,
						},
					]}
				/>
			)}
		</Stack>
	);
};

export default StockReceiptView;
