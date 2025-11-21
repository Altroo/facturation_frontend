import { companyApi } from '@/store/services/company';
import { setupApiStore } from '@/store/store.test';

beforeAll(() => {
	process.env.NEXT_PUBLIC_COMPANY_LIST ||= 'https://example.com/companies/';
	process.env.NEXT_PUBLIC_COMPANY_ROOT ||= 'https://example.com/company';
});

jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('companyApi', () => {
	const storeRef = setupApiStore(companyApi);

	it('getCompaniesList query should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			companyApi.endpoints.getCompaniesList.initiate({
				token: 'test-token',
				with_pagination: true,
				page: 1,
				pageSize: 10,
				search: '',
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('getCompany query should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			companyApi.endpoints.getCompany.initiate({ token: 'test-token', id: 1 }),
		);
		expect('error' in result).toBe(false);
	});

	it('deleteCompany mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			companyApi.endpoints.deleteCompany.initiate({ token: 'test-token', id: 1 }),
		);
		expect('error' in result).toBe(false);
	});

	it('editCompany mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			companyApi.endpoints.editCompany.initiate({
				token: 'test-token',
				id: 1,
				data: { raison_sociale: 'Updated Co' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addCompany mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			companyApi.endpoints.addCompany.initiate({
				token: 'test-token',
				data: { raison_sociale: 'New Co' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});
