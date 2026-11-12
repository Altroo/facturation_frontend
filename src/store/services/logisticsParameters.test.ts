import { setupApiStore } from '@/store/setupApiStore';
import { incotermApi } from './parameter';
import type { LogisticsParameterKind } from '@/types/parameterTypes';

const mockQuery = jest.fn();
jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery:
		() =>
		(...args: unknown[]) =>
			mockQuery(...args),
}));
const storeRef = setupApiStore(incotermApi);

beforeEach(() => {
	mockQuery.mockReset();
	mockQuery.mockResolvedValue({ data: [] });
});

it.each<LogisticsParameterKind>(['incoterm', 'origine_marchandise', 'nature_marchandise'])(
	'uses the correct %s endpoints and company on CRUD requests',
	async (kind) => {
		await storeRef.store.dispatch(
			incotermApi.endpoints.getLogisticsParameterList.initiate({ kind, company_id: 3 }, { subscribe: false }),
		);
		expect(mockQuery.mock.lastCall[0]).toEqual({
			url: `/parameter/${kind}/`,
			method: 'GET',
			params: { company_id: 3 },
		});
		const data = { company: 3, nom: 'AAA' };
		await storeRef.store.dispatch(incotermApi.endpoints.addLogisticsParameter.initiate({ kind, data }));
		expect(mockQuery.mock.lastCall[0]).toEqual({ url: `/parameter/${kind}/`, method: 'POST', data });
		await storeRef.store.dispatch(incotermApi.endpoints.editLogisticsParameter.initiate({ kind, id: 7, data }));
		expect(mockQuery.mock.lastCall[0]).toEqual({ url: `/parameter/${kind}/7/`, method: 'PUT', data });
		await storeRef.store.dispatch(incotermApi.endpoints.deleteLogisticsParameter.initiate({ kind, id: 7 }));
		expect(mockQuery.mock.lastCall[0]).toEqual({ url: `/parameter/${kind}/7/`, method: 'DELETE' });
	},
);
