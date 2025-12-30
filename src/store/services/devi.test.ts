import { deviApi } from '@/store/services/devi';
import { setupApiStore } from '@/store/setupApiStore';
import { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';

beforeAll(() => {
	process.env.NEXT_PUBLIC_DEVIS_LIST ||= 'https://example.com/devis/';
	process.env.NEXT_PUBLIC_DEVIS_ROOT ||= 'https://example.com/devis';
	process.env.NEXT_PUBLIC_DEVIS_GENERATE_NUM_DEVIS ||= 'https://example.com/devis/generate-num/';
	process.env.NEXT_PUBLIC_DEVIS_SWITCH_STATUT ||= 'https://example.com/devis/switch-status/';
});

// Mock axiosBaseQuery to always succeed
jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('deviApi endpoints', () => {
	const storeRef = setupApiStore(deviApi);

	it('getDevisList query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			deviApi.endpoints.getDevisList.initiate({
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

	it('getDevi query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(deviApi.endpoints.getDevi.initiate({ id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getNumDevis query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(deviApi.endpoints.getNumDevis.initiate());
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('deleteDevi mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(deviApi.endpoints.deleteDevi.initiate({ id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('editDevi mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			deviApi.endpoints.editDevi.initiate({
				id: 1,
				data: { /* partial payload */ numero_devis: '123' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('addDevi mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			deviApi.endpoints.addDevi.initiate({
				data: { /* partial payload */ numero_devis: 'NEW-1' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('patchStatut mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			deviApi.endpoints.patchStatut.initiate({
				id: 1,
				data: { statut: 'Brouillon' as TypeFactureLivraisonDevisStatus },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});
});
