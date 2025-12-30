import { factureProFormaApi } from '@/store/services/factureProForma';
import { setupApiStore } from '@/store/setupApiStore';
import { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';

beforeAll(() => {
	process.env.NEXT_PUBLIC_FACTURE_PROFORMA_LIST ||= 'https://example.com/facture-proforma/';
	process.env.NEXT_PUBLIC_FACTURE_PROFORMA_ROOT ||= 'https://example.com/facture-proforma';
	process.env.NEXT_PUBLIC_FACTURE_PROFORMA_GENERATE_NUM_FACTURE ||=
		'https://example.com/facture-proforma/generate-num/';
	process.env.NEXT_PUBLIC_FACTURE_PROFORMA_SWITCH_STATUT ||= 'https://example.com/facture-proforma/switch-status/';
});

// Mock axiosBaseQuery to always succeed
jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('factureProFormaApi endpoints', () => {
	const storeRef = setupApiStore(factureProFormaApi);

	it('getFactureProFormaList query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureProFormaApi.endpoints.getFactureProFormaList.initiate({
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

	it('getFactureProForma query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(factureProFormaApi.endpoints.getFactureProForma.initiate({ id: 1 }));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getNumFactureProForma query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(factureProFormaApi.endpoints.getNumFactureProForma.initiate());
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('deleteFactureProForma mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureProFormaApi.endpoints.deleteFactureProForma.initiate({ id: 1 }),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('editFactureProForma mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureProFormaApi.endpoints.editFactureProForma.initiate({
				id: 1,
				data: { /* partial payload */ numero_facture: '123' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('addFactureProForma mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureProFormaApi.endpoints.addFactureProForma.initiate({
				data: { /* partial payload */ numero_facture: 'NEW-1' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('patchStatut mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			factureProFormaApi.endpoints.patchStatut.initiate({
				id: 1,
				data: { statut: 'Brouillon' as TypeFactureLivraisonDevisStatus },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});
});
