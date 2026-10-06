import { usersApi } from './account';
import { companyApi } from './company';
import { clientApi } from './client';
import { articleApi } from './article';
import { deviApi } from './devi';
import { factureClientApi } from './factureClient';
import { factureAvoirApi } from './factureAvoir';
import { factureProFormaApi } from './factureProForma';
import { bonDeLivraisonApi } from './bonDeLivraison';
import { reglementApi } from './reglement';
import { logistiqueApi } from './logistique';
import { stockApi } from './stock';
import { setupApiStore } from '@/store/setupApiStore';

jest.mock('@/utils/axiosBaseQuery', () => {
	const baseQuery = jest.fn(async () => ({ data: { count: 0, results: [] } }));
	return { axiosBaseQuery: () => baseQuery, mockOrderingBaseQuery: baseQuery };
});
const { mockOrderingBaseQuery } = jest.requireMock('@/utils/axiosBaseQuery') as { mockOrderingBaseQuery: jest.Mock };

describe('getUsersList ordering', () => {
	const storeRef = setupApiStore(usersApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(usersApi.endpoints.getUsersList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getCompaniesList ordering', () => {
	const storeRef = setupApiStore(companyApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(companyApi.endpoints.getCompaniesList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getClientsList ordering', () => {
	const storeRef = setupApiStore(clientApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(clientApi.endpoints.getClientsList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getArticlesList ordering', () => {
	const storeRef = setupApiStore(articleApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(articleApi.endpoints.getArticlesList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getDevisList ordering', () => {
	const storeRef = setupApiStore(deviApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(deviApi.endpoints.getDevisList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getFactureClientList ordering', () => {
	const storeRef = setupApiStore(factureClientApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(factureClientApi.endpoints.getFactureClientList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getFactureClientUnpaidList ordering', () => {
	const storeRef = setupApiStore(factureClientApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(factureClientApi.endpoints.getFactureClientUnpaidList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getFactureAvoirList ordering', () => {
	const storeRef = setupApiStore(factureAvoirApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(factureAvoirApi.endpoints.getFactureAvoirList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getFactureProFormaList ordering', () => {
	const storeRef = setupApiStore(factureProFormaApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(factureProFormaApi.endpoints.getFactureProFormaList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getBonDeLivraisonList ordering', () => {
	const storeRef = setupApiStore(bonDeLivraisonApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(bonDeLivraisonApi.endpoints.getBonDeLivraisonList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getBonDeLivraisonUninvoicedList ordering', () => {
	const storeRef = setupApiStore(bonDeLivraisonApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(
			bonDeLivraisonApi.endpoints.getBonDeLivraisonUninvoicedList.initiate(params),
		);
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getReglementsList ordering', () => {
	const storeRef = setupApiStore(reglementApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(reglementApi.endpoints.getReglementsList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getLogistiqueList ordering', () => {
	const storeRef = setupApiStore(logistiqueApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(logistiqueApi.endpoints.getLogistiqueList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getStockBalances ordering', () => {
	const storeRef = setupApiStore(stockApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(stockApi.endpoints.getStockBalances.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getStockMovements ordering', () => {
	const storeRef = setupApiStore(stockApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(stockApi.endpoints.getStockMovements.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getStockReceipts ordering', () => {
	const storeRef = setupApiStore(stockApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(stockApi.endpoints.getStockReceipts.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getInventories ordering', () => {
	const storeRef = setupApiStore(stockApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(stockApi.endpoints.getInventories.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});
