'use client';

import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import NoPermission from '@/components/shared/noPermission/noPermission';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getInitStateToken, getUserCompaniesState } from '@/store/selectors';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { useGetLogistiqueQuery } from '@/store/services/logistique';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { LogistiqueFormProps } from '@/types/logistiqueTypes';
import type { PurchaseFormMode } from '@/types/supplierPurchaseTypes';
import { extractApiErrorMessage } from '@/utils/helpers';
import { useAppSelector, useLanguage } from '@/utils/hooks';
import { logistiqueManagerRoles, purchaseFormTitles as titles } from '@/utils/rawData';
import { LOGISTIQUE_VIEW } from '@/utils/routes';
import { Alert, Stack } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS, frFR } from '@mui/x-date-pickers/locales';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fr } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import SupplierPurchaseFormContent from './supplier-purchase-form-content';
const allowedModes = new Set(Object.keys(titles));
export default function SupplierPurchaseForm(props: LogistiqueFormProps) {
	const { language } = useLanguage();
	const token = useInitAccessToken(props.session);
	const query = useSearchParams();
	const router = useRouter();
	const companiesState = useAppSelector(getUserCompaniesState);
	const { data: companies, isLoading: loadingCompanies } = useGetUserCompaniesQuery(undefined, { skip: !token });
	const {
		data: order,
		isLoading: loadingOrder,
		error,
		refetch,
	} = useGetLogistiqueQuery({ id: props.id ?? 0 }, { skip: !token || !props.id });
	const requested = query.get('etape') ?? order?.workflow?.etape_courante ?? 'dossier';
	const requestedMode: PurchaseFormMode = allowedModes.has(requested) ? (requested as PurchaseFormMode) : 'dossier';
	const mode: PurchaseFormMode = order?.can_adopt_supplier_workflow ? 'dossier' : requestedMode;
	const company = (companies ?? companiesState)?.find((entry) => entry.id === props.company_id);
	const title = !props.id && mode === 'dossier' ? 'Nouveau dossier fournisseur' : titles[mode];
	const paymentActionsUrl =
		props.id &&
		company &&
		!query.has('etape') &&
		!order?.can_adopt_supplier_workflow &&
		['paiement', 'solde'].includes(order?.workflow?.etape_courante ?? '')
			? `${LOGISTIQUE_VIEW(props.id, props.company_id)}&etape=${order?.workflow?.etape_courante}`
			: null;
	useEffect(() => {
		if (token && paymentActionsUrl) router.replace(paymentActionsUrl);
	}, [token, paymentActionsUrl, router]);

	const currentUser = useAppSelector(getInitStateToken).user.pk;
	const isAccounting = ['paiement', 'justificatif'].includes(mode);
	const canManage = !!company?.role && logistiqueManagerRoles.has(company.role);
	const assignedAccountant = company?.role === 'Comptable' && order?.paiement_assigne_a === currentUser;
	const correctionId = Number(query.get('correction_id') ?? 0);
	const correction = order?.change_requests?.find(
		(entry) =>
			entry.id === correctionId &&
			entry.demandeur === currentUser &&
			entry.statut === 'approved' &&
			entry.etape === (query.get('etape_correction') ?? mode),
	);
	const step =
		isAccounting || mode === 'demande_paiement'
			? order?.workflow?.etapes?.find((entry) => entry.payment_ids?.includes(Number(query.get('echeance_id'))))?.key
			: mode;
	const proposalMode = query.get('proposer') === '1';
	const proposedStep = query.get('etape_correction') ?? step;
	const canPropose =
		proposalMode &&
		canManage &&
		!!order?.workflow?.etapes?.some(
			(entry) =>
				entry.key === proposedStep &&
				entry.completed &&
				entry.accessible &&
				entry.key !== order.workflow?.etape_courante,
		) &&
		!order?.change_requests?.some(
			(entry) =>
				entry.etape === proposedStep &&
				entry.demandeur === currentUser &&
				entry.statut === 'pending' &&
				entry.has_proposal,
		);
	const permittedStep = proposalMode
		? canPropose
		: !order?.workflow?.etape_courante ||
			!!correction ||
			step === order.workflow.etape_courante ||
			mode === 'remarque' ||
			!!order.can_adopt_supplier_workflow;
	const canAccess =
		permittedStep &&
		(isAccounting
			? assignedAccountant || ((!!correction || canPropose) && canManage)
			: canManage || (mode === 'remarque' && assignedAccountant));
	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={title}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{loadingCompanies || loadingOrder || !token || paymentActionsUrl ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : error ? (
						<Alert severity="error">
							{extractApiErrorMessage(error, 'Impossible de charger le dossier.')}
							<PrimaryLoadingButton
								buttonText="Réessayer"
								size="small"
								loading={false}
								active
								inverted
								onClick={() => refetch()}
							/>
						</Alert>
					) : !canAccess || (props.id && !order) ? (
						<NoPermission />
					) : (
						<LocalizationProvider
							dateAdapter={AdapterDateFns}
							adapterLocale={fr}
							localeText={(language === 'en' ? enUS : frFR).components.MuiLocalizationProvider.defaultProps.localeText}
						>
							<SupplierPurchaseFormContent
								key={`${props.company_id}-${props.id ?? 'new'}-${mode}-${query.get('echeance_id') ?? ''}-${query.get('reception_id') ?? ''}-${correctionId}-${canPropose}`}
								{...props}
								token={token}
								mode={mode}
								order={order}
								echeanceId={Number(query.get('echeance_id') ?? 0)}
								correctionId={correction?.id}
								proposalMode={canPropose}
							/>
						</LocalizationProvider>
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
}
