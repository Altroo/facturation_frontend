import { clientApi } from '@/store/services/client';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_CLIENT_LIST ||= 'https://example.com/clients/';
	process.env.NEXT_PUBLIC_CLIENT_ROOT ||= 'https://example.com/client';
	process.env.NEXT_PUBLIC_ARCHIVE_CLIENT ||= 'https://example.com/client/archive';
	process.env.NEXT_PUBLIC_CLIENT_GENERATE_CODE_CLIENT ||= 'https://example.com/client/code';
});

// Mock axiosBaseQuery so all endpoints succeed
jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('clientApi', () => {
	const storeRef = setupApiStore(clientApi);

	it('getClientsList query with pagination should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			clientApi.endpoints.getClientsList.initiate({
				company_id: 123,
				with_pagination: true,
				page: 1,
				pageSize: 10,
				search: 'abc',
				archived: false,
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('getClient query should complete without error', async () => {
		const result = await storeRef.store.dispatch(clientApi.endpoints.getClient.initiate({ id: 123 }));
		expect('error' in result).toBe(false);
	});

	it('getCodeClient query should complete without error', async () => {
		const result = await storeRef.store.dispatch(clientApi.endpoints.getCodeClient.initiate());
		expect('error' in result).toBe(false);
	});

	it('deleteClient mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(clientApi.endpoints.deleteClient.initiate({ id: 456 }));
		expect('error' in result).toBe(false);
	});

	it('editClient mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			clientApi.endpoints.editClient.initiate({
				id: 789,
				data: { nom: 'Updated Client' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addClient mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			clientApi.endpoints.addClient.initiate({
				data: { nom: 'New Client' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('patchArchive mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			clientApi.endpoints.patchArchive.initiate({
				id: 321,
				data: { archived: true },
			}),
		);
		expect('error' in result).toBe(false);
	});
});
