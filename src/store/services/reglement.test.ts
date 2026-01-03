import { reglementApi } from '@/store/services/reglement';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_REGLEMENT_LIST ||= 'https://example.com/reglements/';
	process.env.NEXT_PUBLIC_REGLEMENT_ROOT ||= 'https://example.com/reglement';
	process.env.NEXT_PUBLIC_REGLEMENT_SWITCH_STATUT ||= 'https://example.com/reglement/switch-statut/';
});

// Mock axiosBaseQuery so all endpoints succeed
jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('reglementApi', () => {
	const storeRef = setupApiStore(reglementApi);

	it('getReglementsList query with pagination should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			reglementApi.endpoints.getReglementsList.initiate({
				company_id: 123,
				with_pagination: true,
				page: 1,
				pageSize: 10,
				search: 'abc',
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('getReglementsList query with facture_client filter should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			reglementApi.endpoints.getReglementsList.initiate({
				company_id: 123,
				with_pagination: true,
				page: 1,
				pageSize: 10,
				facture_client: 456,
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('getReglement query should complete without error', async () => {
		const result = await storeRef.store.dispatch(reglementApi.endpoints.getReglement.initiate({ id: 123 }));
		expect('error' in result).toBe(false);
	});

	it('deleteReglement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(reglementApi.endpoints.deleteReglement.initiate({ id: 456 }));
		expect('error' in result).toBe(false);
	});

	it('editReglement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			reglementApi.endpoints.editReglement.initiate({
				id: 789,
				data: { montant: 1500 },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addReglement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			reglementApi.endpoints.addReglement.initiate({
				data: {
					facture_client: 1,
					mode_reglement: 1,
					montant: 1000,
					date_reglement: '2024-01-01',
					date_echeance: '2024-02-01',
					libelle: 'Test reglement',
					statut: 'Valide',
				},
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('patchReglementStatut mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			reglementApi.endpoints.patchReglementStatut.initiate({
				id: 321,
				data: { statut: 'Annulé' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});
