import { setupApiStore } from '@/store/setupApiStore';
import { citiesApi, marqueApi, categorieApi, uniteApi, emplacementApi } from '@/store/services/parameter';

// Set default env vars for each API base URL
beforeAll(() => {
	process.env.NEXT_PUBLIC_PARAMETER_VILLE ||= 'https://example.com/cities';
	process.env.NEXT_PUBLIC_PARAMETER_MARQUE ||= 'https://example.com/marques';
	process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE ||= 'https://example.com/categories';
	process.env.NEXT_PUBLIC_PARAMETER_UNITE ||= 'https://example.com/unites';
	process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT ||= 'https://example.com/emplacements';
});

// Mock axiosBaseQuery so all endpoints succeed
jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('citiesApi', () => {
	const storeRef = setupApiStore(citiesApi);

	it('getCitiesList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(citiesApi.endpoints.getCitiesList.initiate({ token: 'test-token' }));
		expect('error' in result).toBe(false);
	});

	it('getCity query should complete without error', async () => {
		const result = await storeRef.store.dispatch(citiesApi.endpoints.getCity.initiate({ token: 'test-token', id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('deleteCity mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			citiesApi.endpoints.deleteCity.initiate({ token: 'test-token', id: 2 }),
		);
		expect('error' in result).toBe(false);
	});

	it('editCity mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			citiesApi.endpoints.editCity.initiate({
				token: 'test-token',
				id: 3,
				data: { nom: 'Updated City' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addCity mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			citiesApi.endpoints.addCity.initiate({
				token: 'test-token',
				data: { nom: 'New City' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('marqueApi', () => {
	const storeRef = setupApiStore(marqueApi);

	it('getMarqueList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(marqueApi.endpoints.getMarqueList.initiate({ token: 'test-token' }));
		expect('error' in result).toBe(false);
	});

	it('getMarque query should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			marqueApi.endpoints.getMarque.initiate({ token: 'test-token', id: 1 }),
		);
		expect('error' in result).toBe(false);
	});

	it('deleteMarque mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			marqueApi.endpoints.deleteMarque.initiate({ token: 'test-token', id: 2 }),
		);
		expect('error' in result).toBe(false);
	});

	it('editMarque mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			marqueApi.endpoints.editMarque.initiate({
				token: 'test-token',
				id: 3,
				data: { nom: 'Updated Marque' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addMarque mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			marqueApi.endpoints.addMarque.initiate({
				token: 'test-token',
				data: { nom: 'New Marque' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('categorieApi', () => {
	const storeRef = setupApiStore(categorieApi);

	it('getCategorieList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			categorieApi.endpoints.getCategorieList.initiate({ token: 'test-token' }),
		);
		expect('error' in result).toBe(false);
	});

	it('getCategorie query should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			categorieApi.endpoints.getCategorie.initiate({ token: 'test-token', id: 1 }),
		);
		expect('error' in result).toBe(false);
	});

	it('deleteCategorie mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			categorieApi.endpoints.deleteCategorie.initiate({ token: 'test-token', id: 2 }),
		);
		expect('error' in result).toBe(false);
	});

	it('editCategorie mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			categorieApi.endpoints.editCategorie.initiate({
				token: 'test-token',
				id: 3,
				data: { nom: 'Updated Categorie' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addCategorie mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			categorieApi.endpoints.addCategorie.initiate({
				token: 'test-token',
				data: { nom: 'New Categorie' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('uniteApi', () => {
	const storeRef = setupApiStore(uniteApi);

	it('getUniteList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(uniteApi.endpoints.getUniteList.initiate({ token: 'test-token' }));
		expect('error' in result).toBe(false);
	});

	it('getUnite query should complete without error', async () => {
		const result = await storeRef.store.dispatch(uniteApi.endpoints.getUnite.initiate({ token: 'test-token', id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('deleteUnite mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			uniteApi.endpoints.deleteUnite.initiate({ token: 'test-token', id: 2 }),
		);
		expect('error' in result).toBe(false);
	});

	it('editUnite mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			uniteApi.endpoints.editUnite.initiate({
				token: 'test-token',
				id: 3,
				data: { nom: 'Updated Unite' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addUnite mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			uniteApi.endpoints.addUnite.initiate({
				token: 'test-token',
				data: { nom: 'New Unite' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('emplacementApi', () => {
	const storeRef = setupApiStore(emplacementApi);

	it('getEmplacementList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			emplacementApi.endpoints.getEmplacementList.initiate({ token: 'test-token' }),
		);
		expect('error' in result).toBe(false);
	});

	it('getEmplacement query should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			emplacementApi.endpoints.getEmplacement.initiate({ token: 'test-token', id: 1 }),
		);
		expect('error' in result).toBe(false);
	});

	it('deleteEmplacement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			emplacementApi.endpoints.deleteEmplacement.initiate({ token: 'test-token', id: 2 }),
		);
		expect('error' in result).toBe(false);
	});

	it('editEmplacement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			emplacementApi.endpoints.editEmplacement.initiate({
				token: 'test-token',
				id: 3,
				data: { nom: 'Updated Emplacement' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addEmplacement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			emplacementApi.endpoints.addEmplacement.initiate({
				token: 'test-token',
				data: { nom: 'New Emplacement' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});
