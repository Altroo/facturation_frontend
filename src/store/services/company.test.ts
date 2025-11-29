// companyApi.test.ts
import { companyApi } from '@/store/services/company';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_COMPANY_LIST ||= 'https://example.com/companies/';
	process.env.NEXT_PUBLIC_COMPANY_ROOT ||= 'https://example.com/company';
	process.env.NEXT_PUBLIC_USER_COMPANIES_LIST ||= 'https://example.com/user-companies/';
});

// Mock axiosBaseQuery to always succeed
jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('companyApi endpoints', () => {
	const storeRef = setupApiStore(companyApi);

	it('getCompaniesList query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			companyApi.endpoints.getCompaniesList.initiate({
				token: 'test-token',
				with_pagination: true,
				page: 1,
				pageSize: 10,
				search: '',
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getCompany query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			companyApi.endpoints.getCompany.initiate({ token: 'test-token', id: 1 }),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('getUserCompanies query should return mocked data', async () => {
		const result = await storeRef.store.dispatch(companyApi.endpoints.getUserCompanies.initiate('test-token'));
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('deleteCompany mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			companyApi.endpoints.deleteCompany.initiate({ token: 'test-token', id: 1 }),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('editCompany mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			companyApi.endpoints.editCompany.initiate({
				token: 'test-token',
				id: 1,
				data: { raison_sociale: 'Updated Co' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});

	it('addCompany mutation should return mocked data', async () => {
		const result = await storeRef.store.dispatch(
			companyApi.endpoints.addCompany.initiate({
				token: 'test-token',
				data: { raison_sociale: 'New Co' },
			}),
		);
		expect(result.error).toBeUndefined();
		expect(result.data).toEqual({ ok: true });
	});
});
