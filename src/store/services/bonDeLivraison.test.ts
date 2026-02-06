import { bonDeLivraisonApi } from '@/store/services/bonDeLivraison';
import { setupApiStore } from '@/store/setupApiStore';
import { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';

beforeAll(() => {
	process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_LIST ||= 'https://example.com/bon-de-livraison/';
	process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_ROOT ||= 'https://example.com/bon-de-livraison';
	process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_GENERATE_NUM_BON_DE_LIVRAISON ||=
		'https://example.com/bon-de-livraison/generate-num/';
	process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_SWITCH_STATUT ||= 'https://example.com/bon-de-livraison/switch-status/';
	process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_UNINVOICED ||= 'https://example.com/bon-de-livraison/uninvoiced/';
});

// Mock axiosBaseQuery to always succeed
jest.mock('@/utils/axiosBaseQuery', () => ({
	//eslint-disable-next-line @typescript-eslint/no-unused-vars
	axiosBaseQuery: () => async (_args: unknown, _api: unknown) => ({ data: { ok: true } }),
}));

describe('bonDeLivraisonApi endpoints', () => {
	const storeRef = setupApiStore(bonDeLivraisonApi);

	it('getBonDeLivraisonList query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			bonDeLivraisonApi.endpoints.getBonDeLivraisonList.initiate({
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

	it('getBonDeLivraison query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(bonDeLivraisonApi.endpoints.getBonDeLivraison.initiate({ id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getNumBonDeLivraison query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(bonDeLivraisonApi.endpoints.getNumBonDeLivraison.initiate({ company_id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('deleteBonDeLivraison mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(bonDeLivraisonApi.endpoints.deleteBonDeLivraison.initiate({ id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('editBonDeLivraison mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			bonDeLivraisonApi.endpoints.editBonDeLivraison.initiate({
				id: 1,
				data: { /* partial payload */ numero_bon_livraison: '123' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('addBonDeLivraison mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			bonDeLivraisonApi.endpoints.addBonDeLivraison.initiate({
				data: { /* partial payload */ numero_bon_livraison: 'NEW-1' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('patchStatut mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			bonDeLivraisonApi.endpoints.patchStatut.initiate({
				id: 1,
				data: { statut: 'Brouillon' as TypeFactureLivraisonDevisStatus },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getBonDeLivraisonUninvoicedList query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			bonDeLivraisonApi.endpoints.getBonDeLivraisonUninvoicedList.initiate({
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
});
