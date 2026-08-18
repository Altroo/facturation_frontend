import { act, renderHook } from '@testing-library/react';
import type { LogistiqueOrder, LogistiquePaymentInstallment } from '@/types/logistiqueTypes';
import { hasPendingLogistiqueEmailDelivery, useLogistiqueEmailPolling } from './use-logistique-email-polling';

const deliveryState = (
	accounting: LogistiqueOrder['demande_paiement_email_statut'],
	supplier: LogistiquePaymentInstallment['preuve_email_statut'] = 'Non demandé',
	accountingRetry = false,
	supplierRetry = false,
) =>
	({
		demande_paiement_email_statut: accounting,
		demande_paiement_email_relance_disponible: accountingRetry,
		echeancier_paiement: [
			{
				preuve_email_statut: supplier,
				preuve_email_relance_disponible: supplierRetry,
			},
		],
	}) as Pick<
		LogistiqueOrder,
		'demande_paiement_email_statut' | 'demande_paiement_email_relance_disponible' | 'echeancier_paiement'
	>;

describe('logistics email delivery polling', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('polls while an accounting or supplier delivery is queued', () => {
		expect(hasPendingLogistiqueEmailDelivery(deliveryState('En attente'))).toBe(true);
		expect(hasPendingLogistiqueEmailDelivery(deliveryState('Envoyé', 'Envoi en cours'))).toBe(true);
		expect(hasPendingLogistiqueEmailDelivery(deliveryState('Envoyé', 'Envoyé'))).toBe(false);
		expect(hasPendingLogistiqueEmailDelivery(deliveryState('Échec', 'Échec'))).toBe(false);
		expect(hasPendingLogistiqueEmailDelivery(deliveryState('En attente', 'Non demandé', true))).toBe(false);
		expect(hasPendingLogistiqueEmailDelivery(deliveryState('Envoyé', 'En attente', false, true))).toBe(false);
	});

	it('stops polling as soon as the worker reports a terminal state', () => {
		const refetch = jest.fn();
		const { rerender } = renderHook(({ order }) => useLogistiqueEmailPolling(order, true, refetch), {
			initialProps: { order: deliveryState('En attente') },
		});

		act(() => jest.advanceTimersByTime(2500));
		expect(refetch).toHaveBeenCalledTimes(1);

		rerender({ order: deliveryState('Envoyé') });
		act(() => jest.advanceTimersByTime(5000));
		expect(refetch).toHaveBeenCalledTimes(1);
	});
});
