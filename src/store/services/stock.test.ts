import { stockApi } from '@/store/services/stock';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_STOCK_ROOT ||= '/stock';
});

jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true, logistics_order: 1 } }),
}));

describe('stockApi endpoints', () => {
	const storeRef = setupApiStore(stockApi);
	const endpointCalls: Array<[string, () => Promise<unknown>]> = [
		[
			'getStockBalances',
			async () =>
				storeRef.store.dispatch(stockApi.endpoints.getStockBalances.initiate({ company_id: 1 })).unwrap(),
		],
		[
			'getStockBalance',
			async () =>
				storeRef.store.dispatch(stockApi.endpoints.getStockBalance.initiate({ company_id: 1, id: 2 })).unwrap(),
		],
		[
			'getStockMovements',
			async () =>
				storeRef.store.dispatch(stockApi.endpoints.getStockMovements.initiate({ company_id: 1 })).unwrap(),
		],
		[
			'getStockMovement',
			async () =>
				storeRef.store.dispatch(stockApi.endpoints.getStockMovement.initiate({ company_id: 1, id: 2 })).unwrap(),
		],
		[
			'createStockAdjustment',
			async () =>
				storeRef.store
					.dispatch(
						stockApi.endpoints.createStockAdjustment.initiate({
							company_id: 1,
							article: 2,
							emplacement: 3,
							quantity: 5,
							movement_type: 'adjustment',
							reason: 'Count correction',
						}),
					)
					.unwrap(),
		],
		[
			'getStockReceipts',
			async () =>
				storeRef.store.dispatch(stockApi.endpoints.getStockReceipts.initiate({ company_id: 1 })).unwrap(),
		],
		[
			'getStockReceipt',
			async () =>
				storeRef.store.dispatch(stockApi.endpoints.getStockReceipt.initiate({ company_id: 1, id: 2 })).unwrap(),
		],
		[
			'createStockReceipt',
			async () =>
				storeRef.store
					.dispatch(
						stockApi.endpoints.createStockReceipt.initiate({
							company_id: 1,
							logistics_order: 4,
							reference: 'REC-1',
							note: '',
							lines: [{ logistics_line: 5, article: 2, emplacement: 3, quantity: 6 }],
						}),
					)
					.unwrap(),
		],
		[
			'validateStockReceipt',
			async () =>
				storeRef.store.dispatch(stockApi.endpoints.validateStockReceipt.initiate({ company_id: 1, id: 2 })).unwrap(),
		],
		[
			'cancelStockReceipt',
			async () =>
				storeRef.store.dispatch(stockApi.endpoints.cancelStockReceipt.initiate({ company_id: 1, id: 2 })).unwrap(),
		],
		[
			'getInventories',
			async () => storeRef.store.dispatch(stockApi.endpoints.getInventories.initiate({ company_id: 1 })).unwrap(),
		],
		[
			'getInventory',
			async () =>
				storeRef.store.dispatch(stockApi.endpoints.getInventory.initiate({ company_id: 1, id: 2 })).unwrap(),
		],
		[
			'createInventory',
			async () =>
				storeRef.store
					.dispatch(
						stockApi.endpoints.createInventory.initiate({
							company_id: 1,
							emplacement: 3,
							reference: 'INV-1',
							note: '',
							lines: [{ article: 2, counted_quantity: 8 }],
						}),
					)
					.unwrap(),
		],
		[
			'validateInventory',
			async () =>
				storeRef.store.dispatch(stockApi.endpoints.validateInventory.initiate({ company_id: 1, id: 2 })).unwrap(),
		],
	];

	it.each(endpointCalls)('%s completes without an API error', async (_name, callEndpoint) => {
		await expect(callEndpoint()).resolves.toEqual(expect.objectContaining({ ok: true }));
	});

	it('exposes every tested endpoint', () => {
		expect(Object.keys(stockApi.endpoints)).toHaveLength(endpointCalls.length);
	});
});
