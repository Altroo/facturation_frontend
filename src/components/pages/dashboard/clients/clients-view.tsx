'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	MenuItem,
	Stack,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	TextField,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	AccountBalance as AccountBalanceIcon,
	ArrowBack as ArrowBackIcon,
	Badge as BadgeIcon,
	Business as BusinessIcon,
	CalendarToday as CalendarTodayIcon,
	CreditCard as CreditCardIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	Fingerprint as FingerprintIcon,
	Gavel as GavelIcon,
	LocationOn as LocationOnIcon,
	Notes as NotesIcon,
	Payment as PaymentIcon,
	Person as PersonIcon,
	Print as PrintIcon,
	Phone as PhoneIcon,
	Receipt as ReceiptIcon,
} from '@mui/icons-material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { CLIENTS_EDIT, CLIENTS_LIST } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { useDeleteClientMutation, useGetClientHistoryQuery, useGetClientQuery } from '@/store/services/client';
import { useInitAccessToken } from '@/contexts/InitContext';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { getUserCompaniesState } from '@/store/selectors';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { extractApiErrorMessage, formatDate, formatNumberWithSpaces } from '@/utils/helpers';

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

type StatementType = 'all' | 'invoice' | 'credit_note' | 'payment';

type AccountStatementRow = {
	id: string;
	type: Exclude<StatementType, 'all'>;
	typeLabel: string;
	reference: string;
	date: string;
	status: string | null;
	devise: string;
	debit: number;
	credit: number;
	balance: number;
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
	const { data: history, isLoading: isHistoryLoading } = useGetClientHistoryQuery({ id }, { skip: !token });
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
	const [historyTab, setHistoryTab] = useState(0);
	const [statementDateFrom, setStatementDateFrom] = useState('');
	const [statementDateTo, setStatementDateTo] = useState('');
	const [statementType, setStatementType] = useState<StatementType>('all');

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
	const formatMoney = (value: string | number | null | undefined, devise = 'MAD') =>
		`${formatNumberWithSpaces(value ?? 0, 2)} ${devise}`;
	const parseMoney = (value: string | number | null | undefined) => {
		if (typeof value === 'number') return value;
		const normalized = String(value ?? '0')
			.replace(/\s/g, '')
			.replace(',', '.');
		const parsed = Number(normalized);
		return Number.isFinite(parsed) ? parsed : 0;
	};
	const clientDisplayName =
		client?.raison_sociale || [client?.nom, client?.prenom].filter(Boolean).join(' ') || client?.code_client || '-';
	const historyRows = [
		history?.devis ?? [],
		history?.factures ?? [],
		history?.avoirs ?? [],
		history?.reglements ?? [],
	][historyTab];

	const accountStatementRows = useMemo<AccountStatementRow[]>(() => {
		const rows: Omit<AccountStatementRow, 'balance'>[] = [
			...(history?.factures ?? []).map((row) => ({
				id: `invoice-${row.id}`,
				type: 'invoice' as const,
				typeLabel: t.clients.historyFactures,
				reference: String(row.numero_facture ?? '-'),
				date: row.date_facture,
				status: row.statut_paiement || row.statut,
				devise: row.devise || 'MAD',
				debit: parseMoney(row.total_ttc_apres_remise),
				credit: 0,
			})),
			...(history?.avoirs ?? []).map((row) => ({
				id: `credit-note-${row.id}`,
				type: 'credit_note' as const,
				typeLabel: t.clients.historyAvoirs,
				reference: String(row.numero_avoir ?? '-'),
				date: row.date_avoir,
				status: row.statut,
				devise: row.devise || 'MAD',
				debit: 0,
				credit: parseMoney(row.total_ttc_apres_remise),
			})),
			...(history?.reglements ?? []).map((row) => ({
				id: `payment-${row.id}`,
				type: 'payment' as const,
				typeLabel: t.clients.historyReglements,
				reference: row.libelle || row.facture_client_numero || '-',
				date: row.date_reglement,
				status: row.statut,
				devise: row.devise || 'MAD',
				debit: 0,
				credit: parseMoney(row.montant),
			})),
		]
			.filter((row) => {
				const date = row.date?.slice(0, 10) || '';
				if (statementType !== 'all' && row.type !== statementType) return false;
				if (statementDateFrom && date < statementDateFrom) return false;
				if (statementDateTo && date > statementDateTo) return false;
				return true;
			})
			.sort((a, b) => {
				const dateCompare = (a.date || '').localeCompare(b.date || '');
				return dateCompare === 0 ? a.reference.localeCompare(b.reference) : dateCompare;
			});

		const balances: Record<string, number> = {};
		return rows.map((row) => {
			balances[row.devise] = (balances[row.devise] ?? 0) + row.debit - row.credit;
			return { ...row, balance: balances[row.devise] };
		});
	}, [history, statementDateFrom, statementDateTo, statementType, t.clients.historyAvoirs, t.clients.historyFactures, t.clients.historyReglements]);

	const statementFinalBalances = useMemo(() => {
		const balances: Record<string, number> = {};
		accountStatementRows.forEach((row) => {
			balances[row.devise] = row.balance;
		});
		return Object.entries(balances);
	}, [accountStatementRows]);

	const handlePrintStatement = () => {
		const printWindow = window.open('', '_blank', 'width=1100,height=800');
		if (!printWindow) return;
		const escapeHtml = (value: unknown) =>
			String(value ?? '').replace(/[&<>"']/g, (char) => {
				const entities: Record<string, string> = {
					'&': '&amp;',
					'<': '&lt;',
					'>': '&gt;',
					'"': '&quot;',
					"'": '&#39;',
				};
				return entities[char] ?? char;
			});
		const rowsHtml = accountStatementRows
			.map(
				(row) => `
					<tr>
						<td>${escapeHtml(formatDate(row.date).split(',')[0])}</td>
						<td>${escapeHtml(row.typeLabel)}</td>
						<td>${escapeHtml(row.reference)}</td>
						<td>${escapeHtml(row.status || '-')}</td>
						<td class="money">${escapeHtml(formatMoney(row.debit, row.devise))}</td>
						<td class="money">${escapeHtml(formatMoney(row.credit, row.devise))}</td>
						<td class="money">${escapeHtml(formatMoney(row.balance, row.devise))}</td>
					</tr>
				`,
			)
			.join('');
		const balancesHtml = statementFinalBalances
			.map(([devise, balance]) => `<strong>${escapeHtml(formatMoney(balance, devise))}</strong>`)
			.join(' / ');
		printWindow.document.write(`
			<!doctype html>
			<html>
				<head>
					<title>${escapeHtml(t.clients.accountStatement)}</title>
					<style>
						body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
						h1 { font-size: 22px; margin: 0 0 4px; }
						h2 { font-size: 16px; margin: 0 0 20px; font-weight: 500; }
						table { border-collapse: collapse; width: 100%; }
						th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
						th { background: #f3f4f6; }
						.money { text-align: right; white-space: nowrap; }
						.footer { margin-top: 16px; text-align: right; font-size: 14px; }
					</style>
				</head>
				<body>
					<h1>${escapeHtml(t.clients.accountStatement)}</h1>
					<h2>${escapeHtml(clientDisplayName)}</h2>
					<table>
						<thead>
							<tr>
								<th>${escapeHtml(t.common.date)}</th>
								<th>${escapeHtml(t.clients.statementType)}</th>
								<th>${escapeHtml(t.clients.statementReference)}</th>
								<th>${escapeHtml(t.common.status)}</th>
								<th>${escapeHtml(t.clients.statementDebit)}</th>
								<th>${escapeHtml(t.clients.statementCredit)}</th>
								<th>${escapeHtml(t.clients.statementBalance)}</th>
							</tr>
						</thead>
						<tbody>${rowsHtml}</tbody>
					</table>
					<div class="footer">${escapeHtml(t.clients.statementFinalBalance)}: ${balancesHtml || escapeHtml(formatMoney(0))}</div>
				</body>
			</html>
		`);
		printWindow.document.close();
		printWindow.focus();
		printWindow.print();
	};

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '32px',
			}}
		>
			<NavigationBar title={t.clients.detailsTitle}>
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
							onClick={() => router.push(CLIENTS_LIST)}
							sx={{ width: isMobile ? '100%' : 'auto' }}
						>
							{t.clients.backToList}
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
									<Stack
										direction="row"
										spacing={3}
										sx={{
											alignItems: 'center',
										}}
									>
										<PersonIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
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
											value={
												client?.client_type === 'PM' ? t.clients.typePersonneMorale : t.clients.typePersonnePhysique
											}
										/>
										<Divider />
										{isPM ? (
											<>
												<InfoRow
													icon={<BusinessIcon />}
													label={t.clients.fieldRaisonSociale}
													value={client?.raison_sociale}
												/>
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
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<PhoneIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
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
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<DescriptionIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.clients.adminSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack spacing={0}>
										<InfoRow
											icon={<AccountBalanceIcon />}
											label={t.clients.fieldNumeroCompte}
											value={client?.numero_du_compte}
										/>
										<Divider />
										<InfoRow icon={<FingerprintIcon />} label={t.clients.fieldICE} value={client?.ICE} />
										<Divider />
										<InfoRow
											icon={<GavelIcon />}
											label={t.clients.fieldRegistreCommerce}
											value={client?.registre_de_commerce}
										/>
										<Divider />
										<InfoRow
											icon={<ReceiptIcon />}
											label={t.clients.fieldIdentifiantFiscal}
											value={client?.identifiant_fiscal}
										/>
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
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<LocationOnIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
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
											{t.clients.remarkSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<InfoRow icon={<NotesIcon />} label={t.clients.fieldRemarque} value={client?.remarque} />
								</CardContent>
							</Card>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction={{ xs: 'column', md: 'row' }}
										spacing={2}
										sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', mb: 2 }}
									>
										<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
											<AccountBalanceIcon color="primary" />
											<Typography variant="h6" sx={{ fontWeight: 700 }}>
												{t.clients.accountStatement}
											</Typography>
										</Stack>
										<Button
											variant="outlined"
											size="small"
											startIcon={<PrintIcon />}
											onClick={handlePrintStatement}
											disabled={accountStatementRows.length === 0}
										>
											{t.clients.statementPrint}
										</Button>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
										<TextField
											type="date"
											size="small"
											label={t.clients.statementDateFrom}
											value={statementDateFrom}
											onChange={(event) => setStatementDateFrom(event.target.value)}
											slotProps={{ inputLabel: { shrink: true } }}
											fullWidth
										/>
										<TextField
											type="date"
											size="small"
											label={t.clients.statementDateTo}
											value={statementDateTo}
											onChange={(event) => setStatementDateTo(event.target.value)}
											slotProps={{ inputLabel: { shrink: true } }}
											fullWidth
										/>
										<TextField
											select
											size="small"
											label={t.clients.statementType}
											value={statementType}
											onChange={(event) => setStatementType(event.target.value as StatementType)}
											fullWidth
										>
											<MenuItem value="all">{t.clients.statementAllTypes}</MenuItem>
											<MenuItem value="invoice">{t.clients.historyFactures}</MenuItem>
											<MenuItem value="credit_note">{t.clients.historyAvoirs}</MenuItem>
											<MenuItem value="payment">{t.clients.historyReglements}</MenuItem>
										</TextField>
									</Stack>
									{isHistoryLoading ? (
										<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
									) : accountStatementRows.length === 0 ? (
										<Typography variant="body2" color="text.secondary">
											{t.clients.noHistory}
										</Typography>
									) : (
										<>
											<TableContainer>
												<Table size="small">
													<TableHead>
														<TableRow>
															<TableCell>{t.common.date}</TableCell>
															<TableCell>{t.clients.statementType}</TableCell>
															<TableCell>{t.clients.statementReference}</TableCell>
															<TableCell>{t.common.status}</TableCell>
															<TableCell align="right">{t.clients.statementDebit}</TableCell>
															<TableCell align="right">{t.clients.statementCredit}</TableCell>
															<TableCell align="right">{t.clients.statementBalance}</TableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{accountStatementRows.map((row) => (
															<TableRow key={row.id}>
																<TableCell>{formatDate(row.date).split(',')[0]}</TableCell>
																<TableCell>{row.typeLabel}</TableCell>
																<TableCell>{row.reference}</TableCell>
																<TableCell>
																	<Chip label={row.status || '-'} size="small" variant="outlined" />
																</TableCell>
																<TableCell align="right">{formatMoney(row.debit, row.devise)}</TableCell>
																<TableCell align="right">{formatMoney(row.credit, row.devise)}</TableCell>
																<TableCell align="right">{formatMoney(row.balance, row.devise)}</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</TableContainer>
											<Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', mt: 2 }}>
												<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
													{t.clients.statementFinalBalance}:
												</Typography>
												{statementFinalBalances.length === 0 ? (
													<Typography variant="subtitle1">{formatMoney(0)}</Typography>
												) : (
													statementFinalBalances.map(([devise, balance]) => (
														<Chip
															key={devise}
															label={formatMoney(balance, devise)}
															color={balance > 0 ? 'warning' : 'success'}
															variant="outlined"
														/>
													))
												)}
											</Stack>
										</>
									)}
								</CardContent>
							</Card>

							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<ReceiptIcon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											{t.clients.historySection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
									<Tabs
										value={historyTab}
										onChange={(_, value) => setHistoryTab(value)}
										variant={isMobile ? 'scrollable' : 'standard'}
										allowScrollButtonsMobile
										sx={{ mb: 2 }}
									>
										<Tab label={t.clients.historyDevis} />
										<Tab label={t.clients.historyFactures} />
										<Tab label={t.clients.historyAvoirs} />
										<Tab label={t.clients.historyReglements} />
									</Tabs>
									{isHistoryLoading ? (
										<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
									) : historyRows.length === 0 ? (
										<Typography variant="body2" color="text.secondary">
											{t.clients.noHistory}
										</Typography>
									) : (
										<TableContainer>
											<Table size="small">
												<TableHead>
													<TableRow>
														<TableCell>{t.common.reference}</TableCell>
														<TableCell>{t.common.date}</TableCell>
														<TableCell>{t.common.status}</TableCell>
														<TableCell align="right">{t.reglements.colMontant}</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{historyTab === 0 &&
														(history?.devis ?? []).map((row) => (
															<TableRow key={`devis-${row.id}`}>
																<TableCell>{row.numero_devis}</TableCell>
																<TableCell>{formatDate(row.date_devis).split(',')[0]}</TableCell>
																<TableCell>
																	<Chip label={row.statut} size="small" variant="outlined" />
																</TableCell>
																<TableCell align="right">
																	{formatMoney(row.total_ttc_apres_remise, row.devise)}
																</TableCell>
															</TableRow>
														))}
													{historyTab === 1 &&
														(history?.factures ?? []).map((row) => (
															<TableRow key={`facture-${row.id}`}>
																<TableCell>{row.numero_facture}</TableCell>
																<TableCell>{formatDate(row.date_facture).split(',')[0]}</TableCell>
																<TableCell>
																	<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
																		<Chip label={row.statut} size="small" variant="outlined" />
																		{row.statut_paiement && (
																			<Chip label={row.statut_paiement} size="small" color="info" variant="outlined" />
																		)}
																	</Stack>
																</TableCell>
																<TableCell align="right">
																	{formatMoney(row.total_ttc_apres_remise, row.devise)}
																</TableCell>
															</TableRow>
														))}
													{historyTab === 2 &&
														(history?.avoirs ?? []).map((row) => (
															<TableRow key={`avoir-${row.id}`}>
																<TableCell>{row.numero_avoir}</TableCell>
																<TableCell>{formatDate(row.date_avoir).split(',')[0]}</TableCell>
																<TableCell>
																	<Chip label={row.statut} size="small" variant="outlined" />
																</TableCell>
																<TableCell align="right">
																	{formatMoney(row.total_ttc_apres_remise, row.devise)}
																</TableCell>
															</TableRow>
														))}
													{historyTab === 3 &&
														(history?.reglements ?? []).map((row) => (
															<TableRow key={`reglement-${row.id}`}>
																<TableCell>{row.libelle || row.facture_client_numero || '-'}</TableCell>
																<TableCell>{formatDate(row.date_reglement).split(',')[0]}</TableCell>
																<TableCell>
																	<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
																		<Chip label={row.statut} size="small" variant="outlined" />
																		{row.mode_reglement_name && (
																			<Chip
																				label={row.mode_reglement_name}
																				size="small"
																				color="primary"
																				variant="outlined"
																				icon={<PaymentIcon />}
																			/>
																		)}
																	</Stack>
																</TableCell>
																<TableCell align="right">{formatMoney(row.montant, row.devise)}</TableCell>
															</TableRow>
														))}
												</TableBody>
											</Table>
										</TableContainer>
									)}
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
