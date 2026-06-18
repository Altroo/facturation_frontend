'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { Add as AddIcon, Payment as PaymentIcon } from '@mui/icons-material';
import { REGLEMENTS_ADD } from '@/utils/routes';
import { useGetReglementsListQuery } from '@/store/services/reglement';
import { useLanguage } from '@/utils/hooks';
import { formatDate, formatNumberWithSpaces } from '@/utils/helpers';
import type { ReglementClass } from '@/models/classes';

type InvoicePaymentsSectionProps = {
	companyId: number;
	factureClientId: number;
	token?: string;
	canManagePayments: boolean;
};

const InvoicePaymentsSection: React.FC<InvoicePaymentsSectionProps> = ({
	companyId,
	factureClientId,
	token,
	canManagePayments,
}) => {
	const router = useRouter();
	const { t } = useLanguage();
	const { data: rawPayments, isLoading } = useGetReglementsListQuery(
		{ company_id: companyId, with_pagination: false, facture_client: factureClientId },
		{ skip: !token },
	);
	const payments: ReglementClass[] = Array.isArray(rawPayments) ? rawPayments : (rawPayments?.results ?? []);

	return (
		<Card elevation={2} sx={{ borderRadius: 2 }}>
			<CardContent sx={{ p: 3 }}>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={2}
					sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
				>
					<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
						<PaymentIcon color="primary" />
						<Typography variant="h6" sx={{ fontWeight: 700 }}>
							{t.facturesClient.paymentsSection}
						</Typography>
					</Stack>
					{canManagePayments && (
						<Button
							variant="outlined"
							size="small"
							startIcon={<AddIcon />}
							onClick={() => router.push(REGLEMENTS_ADD(companyId, factureClientId))}
						>
							{t.facturesClient.addPayment}
						</Button>
					)}
				</Stack>
				<Divider sx={{ mb: 2 }} />
				{isLoading ? (
					<Typography variant="body2" color="text.secondary">
						{t.common.loading}
					</Typography>
				) : payments.length === 0 ? (
					<Typography variant="body2" color="text.secondary">
						{t.facturesClient.noPayments}
					</Typography>
				) : (
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>{t.reglements.fieldLibelle}</TableCell>
									<TableCell>{t.reglements.fieldDateReglement}</TableCell>
									<TableCell>{t.reglements.fieldModeReglement}</TableCell>
									<TableCell align="right">{t.reglements.colMontant}</TableCell>
									<TableCell>{t.reglements.fieldObservations}</TableCell>
									<TableCell>{t.reglements.colStatut}</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{payments.map((payment) => (
									<TableRow key={payment.id}>
										<TableCell>{payment.libelle || '-'}</TableCell>
										<TableCell>{formatDate(payment.date_reglement).split(',')[0]}</TableCell>
										<TableCell>{payment.mode_reglement_name || '-'}</TableCell>
										<TableCell align="right">
											{formatNumberWithSpaces(payment.montant, 2)} {payment.devise || 'MAD'}
										</TableCell>
										<TableCell>{payment.observations || '-'}</TableCell>
										<TableCell>
											<Chip
												label={payment.statut}
												size="small"
												color={payment.statut === 'Valide' ? 'success' : 'error'}
												variant="outlined"
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</CardContent>
		</Card>
	);
};

export default InvoicePaymentsSection;
