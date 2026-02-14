import { setupApiStore } from '@/store/setupApiStore';
import {
	citiesApi,
	marqueApi,
	categorieApi,
	uniteApi,
	emplacementApi,
	modePaiementApi,
	livreParApi,
} from '@/store/services/parameter';

// Set default env vars for each API base URL
beforeAll(() => {
	process.env.NEXT_PUBLIC_PARAMETER_VILLE ||= 'https://example.com/cities';
	process.env.NEXT_PUBLIC_PARAMETER_MARQUE ||= 'https://example.com/marques';
	process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE ||= 'https://example.com/categories';
	process.env.NEXT_PUBLIC_PARAMETER_UNITE ||= 'https://example.com/unites';
	process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT ||= 'https://example.com/emplacements';
	process.env.NEXT_PUBLIC_PARAMETER_MODE_PAIEMENT ||= 'https://example.com/mode-paiement';
	process.env.NEXT_PUBLIC_PARAMETER_MODE_REGLEMENT ||= 'https://example.com/mode-reglement';
	process.env.NEXT_PUBLIC_PARAMETER_LIVRE_PAR ||= 'https://example.com/livre-par';
});

// Mock axiosBaseQuery so all endpoints succeed
jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('citiesApi', () => {
	const storeRef = setupApiStore(citiesApi);

	it('getCitiesList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(citiesApi.endpoints.getCitiesList.initiate({ company_id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('getCity query should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			citiesApi.endpoints.getCity.initiate({
				id: 1,
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('deleteCity mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(citiesApi.endpoints.deleteCity.initiate({ id: 2 }));
		expect('error' in result).toBe(false);
	});

	it('editCity mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			citiesApi.endpoints.editCity.initiate({
				id: 3,
				data: { nom: 'Updated City' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addCity mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			citiesApi.endpoints.addCity.initiate({
				data: { nom: 'New City' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('marqueApi', () => {
	const storeRef = setupApiStore(marqueApi);

	it('getMarqueList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(marqueApi.endpoints.getMarqueList.initiate({ company_id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('getMarque query should complete without error', async () => {
		const result = await storeRef.store.dispatch(marqueApi.endpoints.getMarque.initiate({ id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('deleteMarque mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(marqueApi.endpoints.deleteMarque.initiate({ id: 2 }));
		expect('error' in result).toBe(false);
	});

	it('editMarque mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			marqueApi.endpoints.editMarque.initiate({
				id: 3,
				data: { nom: 'Updated Marque' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addMarque mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			marqueApi.endpoints.addMarque.initiate({
				data: { nom: 'New Marque' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('categorieApi', () => {
	const storeRef = setupApiStore(categorieApi);

	it('getCategorieList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(categorieApi.endpoints.getCategorieList.initiate({ company_id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('getCategorie query should complete without error', async () => {
		const result = await storeRef.store.dispatch(categorieApi.endpoints.getCategorie.initiate({ id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('deleteCategorie mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(categorieApi.endpoints.deleteCategorie.initiate({ id: 2 }));
		expect('error' in result).toBe(false);
	});

	it('editCategorie mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			categorieApi.endpoints.editCategorie.initiate({
				id: 3,
				data: { nom: 'Updated Categorie' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addCategorie mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			categorieApi.endpoints.addCategorie.initiate({
				data: { nom: 'New Categorie' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('uniteApi', () => {
	const storeRef = setupApiStore(uniteApi);

	it('getUniteList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(uniteApi.endpoints.getUniteList.initiate({ company_id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('getUnite query should complete without error', async () => {
		const result = await storeRef.store.dispatch(uniteApi.endpoints.getUnite.initiate({ id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('deleteUnite mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(uniteApi.endpoints.deleteUnite.initiate({ id: 2 }));
		expect('error' in result).toBe(false);
	});

	it('editUnite mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			uniteApi.endpoints.editUnite.initiate({
				id: 3,
				data: { nom: 'Updated Unite' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addUnite mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			uniteApi.endpoints.addUnite.initiate({
				data: { nom: 'New Unite' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('emplacementApi', () => {
	const storeRef = setupApiStore(emplacementApi);

	it('getEmplacementList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(emplacementApi.endpoints.getEmplacementList.initiate({ company_id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('getEmplacement query should complete without error', async () => {
		const result = await storeRef.store.dispatch(emplacementApi.endpoints.getEmplacement.initiate({ id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('deleteEmplacement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(emplacementApi.endpoints.deleteEmplacement.initiate({ id: 2 }));
		expect('error' in result).toBe(false);
	});

	it('editEmplacement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			emplacementApi.endpoints.editEmplacement.initiate({
				id: 3,
				data: { nom: 'Updated Emplacement' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addEmplacement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			emplacementApi.endpoints.addEmplacement.initiate({
				data: { nom: 'New Emplacement' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('modePaiementApi', () => {
	const storeRef = setupApiStore(modePaiementApi);

	it('getModePaiementList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(modePaiementApi.endpoints.getModePaiementList.initiate({ company_id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('getModePaiement query should complete without error', async () => {
		const result = await storeRef.store.dispatch(modePaiementApi.endpoints.getModePaiement.initiate({ id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('deleteModePaiement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(modePaiementApi.endpoints.deleteModePaiement.initiate({ id: 2 }));
		expect('error' in result).toBe(false);
	});

	it('editModePaiement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			modePaiementApi.endpoints.editModePaiement.initiate({
				id: 3,
				data: { nom: 'Updated ModePaiement' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addModePaiement mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			modePaiementApi.endpoints.addModePaiement.initiate({
				data: { nom: 'New ModePaiement' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('livreParApi', () => {
	const storeRef = setupApiStore(livreParApi);

	it('getLivreParList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(livreParApi.endpoints.getLivreParList.initiate({ company_id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('getLivrePar query should complete without error', async () => {
		const result = await storeRef.store.dispatch(livreParApi.endpoints.getLivrePar.initiate({ id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('deleteLivrePar mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(livreParApi.endpoints.deleteLivrePar.initiate({ id: 2 }));
		expect('error' in result).toBe(false);
	});

	it('editLivrePar mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			livreParApi.endpoints.editLivrePar.initiate({
				id: 3,
				data: { nom: 'Updated LivrePar' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addLivrePar mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			livreParApi.endpoints.addLivrePar.initiate({
				data: { nom: 'New LivrePar' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});
