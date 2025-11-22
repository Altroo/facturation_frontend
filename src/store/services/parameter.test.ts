import { setupApiStore } from '@/store/setupApiStore';
import { citiesApi } from '@/store/services/parameter';

beforeAll(() => {
	process.env.NEXT_PUBLIC_PARAMETER_VILLE ||= 'https://example.com/cities';
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
