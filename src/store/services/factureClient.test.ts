import { factureClientApi } from '@/store/services/factureClient';
import { setupApiStore } from '@/store/setupApiStore';
import { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';

beforeAll(() => {
	process.env.NEXT_PUBLIC_FACTURE_CLIENT_LIST ||= 'https://example.com/facture-client/';
	process.env.NEXT_PUBLIC_FACTURE_CLIENT_ROOT ||= 'https://example.com/facture-client';
	process.env.NEXT_PUBLIC_FACTURE_CLIENT_GENERATE_NUM_FACTURE ||= 'https://example.com/facture-client/generate-num/';
	process.env.NEXT_PUBLIC_FACTURE_CLIENT_SWITCH_STATUT ||= 'https://example.com/facture-client/switch-status/';
	process.env.NEXT_PUBLIC_FACTURE_CLIENT_UNPAID ||= 'https://example.com/facture-client/unpaid/';
	process.env.NEXT_PUBLIC_FACTURE_CLIENT_CONVERT_TO_BON_DE_LIVRAISON ||=
		'https://example.com/facture-client/convert-to-bon-de-livraison/';
});

// Mock axiosBaseQuery to always succeed
jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async (args: unknown, api: unknown) => ({ data: { ok: true } }),
}));

describe('factureClientApi endpoints', () => {
	const storeRef = setupApiStore(factureClientApi);

	it('getFactureClientList query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureClientApi.endpoints.getFactureClientList.initiate({
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

	it('getFactureClient query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(factureClientApi.endpoints.getFactureClient.initiate({ id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getNumFactureClient query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(factureClientApi.endpoints.getNumFactureClient.initiate({ company_id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('deleteFactureClient mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(factureClientApi.endpoints.deleteFactureClient.initiate({ id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('editFactureClient mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureClientApi.endpoints.editFactureClient.initiate({
				id: 1,
				data: { /* partial payload */ numero_facture: '123' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('addFactureClient mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureClientApi.endpoints.addFactureClient.initiate({
				data: { /* partial payload */ numero_facture: 'NEW-1' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('patchStatut mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureClientApi.endpoints.patchStatut.initiate({
				id: 1,
				data: { statut: 'Brouillon' as TypeFactureLivraisonDevisStatus },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getFactureClientUnpaidList query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureClientApi.endpoints.getFactureClientUnpaidList.initiate({
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

	it('convertFactureClientToBonDeLivraison mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureClientApi.endpoints.convertFactureClientToBonDeLivraison.initiate({
				id: 1,
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});
});
