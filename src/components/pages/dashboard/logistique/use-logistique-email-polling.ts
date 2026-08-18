import { useEffect } from 'react';
import type { LogistiqueOrder } from '@/types/logistiqueTypes';

const ACTIVE_DELIVERY_STATUSES = new Set(['En attente', 'Envoi en cours']);

export const hasPendingLogistiqueEmailDelivery = (
	order:
		| Pick<
				LogistiqueOrder,
				'demande_paiement_email_statut' | 'demande_paiement_email_relance_disponible' | 'echeancier_paiement'
		  >
		| undefined,
) =>
	Boolean(
		order &&
		((ACTIVE_DELIVERY_STATUSES.has(order.demande_paiement_email_statut) &&
			!order.demande_paiement_email_relance_disponible) ||
			order.echeancier_paiement?.some(
				(installment) =>
					ACTIVE_DELIVERY_STATUSES.has(installment.preuve_email_statut) && !installment.preuve_email_relance_disponible,
			)),
	);

export const useLogistiqueEmailPolling = (
	order:
		| Pick<
				LogistiqueOrder,
				'demande_paiement_email_statut' | 'demande_paiement_email_relance_disponible' | 'echeancier_paiement'
		  >
		| undefined,
	enabled: boolean,
	refetch: () => unknown,
) => {
	const shouldPoll = enabled && hasPendingLogistiqueEmailDelivery(order);

	useEffect(() => {
		if (!shouldPoll) return undefined;
		const interval = window.setInterval(() => {
			void refetch();
		}, 2500);
		return () => window.clearInterval(interval);
	}, [refetch, shouldPoll]);
};
