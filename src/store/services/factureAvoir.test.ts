import { factureAvoirApi } from '@/store/services/factureAvoir';
import { setupApiStore } from '@/store/setupApiStore';
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';

beforeAll(() => {
	process.env.NEXT_PUBLIC_FACTURE_AVOIR_LIST ||= 'https://example.com/facture-avoir/';
	process.env.NEXT_PUBLIC_FACTURE_AVOIR_ROOT ||= 'https://example.com/facture-avoir';
	process.env.NEXT_PUBLIC_FACTURE_AVOIR_GENERATE_NUM_FACTURE ||= 'https://example.com/facture-avoir/generate-num/';
	process.env.NEXT_PUBLIC_FACTURE_AVOIR_SWITCH_STATUT ||= 'https://example.com/facture-avoir/switch-status/';
	process.env.NEXT_PUBLIC_FACTURE_AVOIR_FROM_FACTURE ||= 'https://example.com/facture-avoir/from-facture/';
});

jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('factureAvoirApi endpoints', () => {
	const storeRef = setupApiStore(factureAvoirApi);

	it('getFactureAvoirList query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureAvoirApi.endpoints.getFactureAvoirList.initiate({
				company_id: 1,
				with_pagination: true,
				page: 1,
				pageSize: 10,
				search: '',
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getFactureAvoir query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(factureAvoirApi.endpoints.getFactureAvoir.initiate({ id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getNumFactureAvoir query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(factureAvoirApi.endpoints.getNumFactureAvoir.initiate({ company_id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getFactureAvoirFromFacture query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(factureAvoirApi.endpoints.getFactureAvoirFromFacture.initiate({ id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('addFactureAvoir mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureAvoirApi.endpoints.addFactureAvoir.initiate({
				data: { numero_avoir: 'AV-2026-0001' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('editFactureAvoir mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureAvoirApi.endpoints.editFactureAvoir.initiate({
				id: 1,
				data: { motif_avoir: 'retour_marchandise' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('patchFactureAvoirStatut mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureAvoirApi.endpoints.patchFactureAvoirStatut.initiate({
				id: 1,
				data: { statut: 'Envoyé' as TypeFactureLivraisonDevisStatus },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});
});
