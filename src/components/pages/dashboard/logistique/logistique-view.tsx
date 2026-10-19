'use client';

import { lazy, Suspense, type FC } from 'react';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetLogistiqueQuery } from '@/store/services/logistique';
import type { LogistiqueViewProps as Props } from '@/types/logistiqueTypes';

const HistoricalDossier = lazy(() => import('./logistique-historical-view'));
const SupplierPurchase = lazy(() => import('./supplier-purchase'));

const PurchaseRoute: FC<Props> = (props) => {
	const token = useInitAccessToken(props.session);
	const { currentData: record, error } = useGetLogistiqueQuery({ id: props.id ?? 0 }, { skip: !token || !props.id });
	const loading = <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;

	if (!token || (props.id && !record && !error)) return loading;

	return (
		<Suspense fallback={loading}>
			{!record || record.workflow_version === 2 || record.can_adopt_supplier_workflow ? (
				<SupplierPurchase {...props} />
			) : (
				<HistoricalDossier {...props} />
			)}
		</Suspense>
	);
};

export default PurchaseRoute;
