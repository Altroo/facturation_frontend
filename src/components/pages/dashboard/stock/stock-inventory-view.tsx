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
	CheckCircle as CheckCircleIcon,
	FactCheck as FactCheckIcon,
	Inventory2 as Inventory2Icon,
	Notes as NotesIcon,
	Person as PersonIcon,
	Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getUserCompaniesState } from '@/store/selectors';
import { useGetInventoryQuery, useValidateInventoryMutation } from '@/store/services/stock';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type {
	InventoryLine,
	StockInventoryViewInfoRowProps as InfoRowProps,
	StockInventoryViewProps,
} from '@/types/stockTypes';
import { extractApiErrorMessage, formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import { useAppSelector, useToast } from '@/utils/hooks';

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

const StockInventoryView: FC<StockInventoryViewProps> = ({ session, company_id, id }) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const { onSuccess, onError } = useToast();
	const companies = useAppSelector(getUserCompaniesState);
	const canAdjust = companies?.find((company) => company.id === company_id)?.role === 'Caissier';
	const { data: inventory, isLoading, isError } = useGetInventoryQuery({ company_id, id }, { skip: !token });
	const [validateInventory, validateState] = useValidateInventoryMutation();
	const columns = [
		{ field: 'article_reference', headerName: 'Référence', minWidth: 150, flex: 0.8 },
		{ field: 'article_designation', headerName: 'Désignation', minWidth: 240, flex: 1.5 },
		{
			field: 'expected_quantity',
			headerName: 'Quantité attendue',
			type: 'number',
			minWidth: 160,
			flex: 0.9,
			valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
			renderCell: (params) => (
				<Typography color="primary" sx={{ fontWeight: 600 }}>
					{formatNumberWithSpaces(params.row.expected_quantity, 3)}
				</Typography>
			),
		},
		{
			field: 'counted_quantity',
			headerName: 'Quantité comptée',
			type: 'number',
			minWidth: 160,
			flex: 0.9,
			valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
			renderCell: (params) => (
				<Typography sx={{ fontWeight: 600 }}>{formatNumberWithSpaces(params.row.counted_quantity, 3)}</Typography>
			),
		},
		{
			field: 'difference',
			headerName: 'Écart',
			type: 'number',
			minWidth: 130,
			flex: 0.8,
			valueGetter: (value: string | number | null | undefined) => Number(value ?? 0),
			renderCell: (params) => (
				<Typography
					color={
						Number(params.row.difference) === 0
							? 'text.primary'
							: Number(params.row.difference) > 0
								? 'success.main'
								: 'error.main'
					}
					sx={{ fontWeight: 700 }}
				>
					{Number(params.row.difference) > 0 ? '+' : ''}
					{formatNumberWithSpaces(params.row.difference, 3)}
				</Typography>
			),
		},
	] as GridColDef<InventoryLine>[];

	const handleValidate = async () => {
		try {
			await validateInventory({ company_id, id }).unwrap();
			onSuccess('Inventaire validé et stock ajusté.');
		} catch (error) {
			onError(extractApiErrorMessage(error, "Impossible de valider l'inventaire."));
		}
	};

	const statusLabel =
		inventory?.status === 'validated' ? 'Validé' : inventory?.status === 'cancelled' ? 'Annulé' : 'Brouillon';
	const statusColor: 'success' | 'error' | 'default' =
		inventory?.status === 'validated' ? 'success' : inventory?.status === 'cancelled' ? 'error' : 'default';

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '32px' }}>
			<NavigationBar title="Détails de l’inventaire">
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
							Inventaires de stock
						</Button>
						{!isLoading && !isError && canAdjust && inventory?.status === 'draft' && (
							<Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
								<Button
									variant="outlined"
									color="success"
									size="small"
									startIcon={<CheckCircleIcon />}
									disabled={validateState.isLoading}
									onClick={handleValidate}
								>
									Valider
								</Button>
							</Stack>
						)}
					</Stack>

					{isLoading ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : isError || !inventory ? (
						<Typography sx={{ p: 4 }}>Cet inventaire est introuvable.</Typography>
					) : (
						<Stack spacing={3}>
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<FactCheckIcon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Informations de l’inventaire
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<FactCheckIcon />}
											label="Référence"
											value={inventory.reference || `INV-${inventory.id}`}
										/>
										<Divider />
										<InfoRow icon={<WarehouseIcon />} label="Emplacement" value={inventory.emplacement_name} />
										<Divider />
										<InfoRow
											icon={<CheckCircleIcon />}
											label="Statut"
											value={<Chip size="small" variant="outlined" label={statusLabel} color={statusColor} />}
										/>
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
											value={formatDate(inventory.date_created)}
										/>
										<Divider />
										<InfoRow icon={<PersonIcon />} label="Créé par" value={inventory.created_by_name} />
										<Divider />
										<InfoRow
											icon={<CalendarTodayIcon />}
											label="Date de validation"
											value={inventory.date_validated ? formatDate(inventory.date_validated) : null}
										/>
										<Divider />
										<InfoRow icon={<PersonIcon />} label="Validé par" value={inventory.validated_by_name} />
									</Stack>
								</CardContent>
							</Card>

							{inventory.note && (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
											<NotesIcon color="primary" />
											<Typography variant="h6" sx={{ fontWeight: 700 }}>
												Note
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<InfoRow icon={<NotesIcon />} label="Note" value={inventory.note} />
									</CardContent>
								</Card>
							)}

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<Inventory2Icon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Lignes comptées
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Box sx={{ height: '100%' }}>
										<DataGrid
											rows={inventory.lines}
											columns={columns}
											showToolbar={true}
											slotProps={{
												toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } },
											}}
											localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
											disableRowSelectionOnClick
											pagination
											pageSizeOptions={[5, 10, 25, 50, 100]}
											initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
										/>
									</Box>
								</CardContent>
							</Card>
						</Stack>
					)}
				</Stack>
			</NavigationBar>
		</Stack>
	);
};

export default StockInventoryView;
