'use client';

import { type FC } from 'react';
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetLogistiqueSuppliersQuery } from '@/store/services/logistique';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { formatDate } from '@/utils/helpers';
import { useLanguage } from '@/utils/hooks';

const SupplierListContent: FC<SessionProps & { company_id: number }> = ({ session, company_id }) => {
	const token = useInitAccessToken(session);
	const { data = [], isLoading, error } = useGetLogistiqueSuppliersQuery({ company_id }, { skip: !token });
	const apiError = error as ResponseDataInterface<ApiErrorResponseType> | undefined;

	if (isLoading) return <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;
	if (apiError) return <ApiAlert errorDetails={apiError.data?.details} />;

	return (
		<Stack spacing={2} sx={{ py: 2 }}>
			{data.length === 0 ? (
				<Typography color="text.secondary">Aucun fournisseur lié à un dossier logistique.</Typography>
			) : (
				data.map((supplier) => (
					<Card
						key={`${supplier.fournisseur}-${supplier.fournisseur_email}`}
						variant="outlined"
						sx={{ borderRadius: 2 }}
					>
						<CardContent>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
								<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
									<BusinessIcon color="primary" />
									<Stack>
										<Typography sx={{ fontWeight: 700 }}>{supplier.fournisseur}</Typography>
										<Typography variant="body2" color="text.secondary">
											{supplier.fournisseur_email || 'E-mail non renseigné'}
										</Typography>
									</Stack>
								</Stack>
								<Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
									<Chip label={`${supplier.total_dossiers} dossier(s)`} color="primary" variant="outlined" />
									<Typography variant="caption" color="text.secondary">
										Dernière activité : {formatDate(supplier.derniere_activite)}
									</Typography>
								</Stack>
							</Stack>
						</CardContent>
					</Card>
				))
			)}
		</Stack>
	);
};

const LogistiqueSuppliers: FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperList session={session} title={t.navigation.logistiqueSuppliers}>
			{({ company_id }) => <SupplierListContent session={session} company_id={company_id} />}
		</CompanyDocumentsWrapperList>
	);
};

export default LogistiqueSuppliers;
