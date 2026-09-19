import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { getInitStateToken } from '@/store/selectors';
import { initToken } from '@/store/slices/_initSlice';
import { articleApi } from '@/store/services/article';
import { logistiqueApi } from '@/store/services/logistique';
import type { RootState } from '@/store/store';
import type {
	InventorySession,
	InventoryResponse,
	StockBalance,
	StockBalanceResponse,
	StockMovement,
	StockMovementResponse,
	StockMovementType,
	StockListFilters,
	StockReceipt,
	StockReceiptResponse,
} from '@/types/stockTypes';

export const stockApi = createApi({
	reducerPath: 'stockApi',
	tagTypes: ['StockBalance', 'StockMovement', 'StockReceipt', 'Inventory'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getStockBalances: builder.query<
			StockBalanceResponse,
			{
				company_id: number;
				page?: number;
				pageSize?: number;
				search?: string;
				low_only?: boolean;
				article_id?: number;
				filters?: StockListFilters;
			}
		>({
			query: ({ company_id, page = 1, pageSize = 25, search, low_only, article_id, filters = {} }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/balances/`,
				method: 'GET',
				params: { company_id, page, page_size: pageSize, search, low_only, article_id, pagination: true, ...filters },
			}),
			providesTags: ['StockBalance'],
		}),
		getStockBalance: builder.query<StockBalance, { company_id: number; id: number }>({
			query: ({ company_id, id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/balances/${id}/`,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['StockBalance'],
		}),
		getStockMovements: builder.query<
			StockMovementResponse,
			{
				company_id: number;
				page?: number;
				pageSize?: number;
				search?: string;
				article_id?: number;
				filters?: StockListFilters;
			}
		>({
			query: ({ company_id, page = 1, pageSize = 25, search, article_id, filters = {} }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/movements/`,
				method: 'GET',
				params: { company_id, page, page_size: pageSize, search, article_id, ...filters },
			}),
			providesTags: ['StockMovement'],
		}),
		getStockMovement: builder.query<StockMovement, { company_id: number; id: number }>({
			query: ({ company_id, id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/movements/${id}/`,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['StockMovement'],
		}),
		createStockAdjustment: builder.mutation<
			StockMovement,
			{
				company_id: number;
				article: number;
				emplacement: number;
				quantity: number;
				movement_type: Extract<StockMovementType, 'opening' | 'adjustment'>;
				reason: string;
			}
		>({
			query: (data) => ({ url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/adjustments/`, method: 'POST', data }),
			invalidatesTags: ['StockBalance', 'StockMovement'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(articleApi.util.invalidateTags(['Article']));
				} catch {
					// Keep cached article stock values when the adjustment fails.
				}
			},
		}),
		getStockReceipts: builder.query<
			StockReceiptResponse,
			{ company_id: number; page?: number; pageSize?: number; search?: string; filters?: StockListFilters }
		>({
			query: ({ company_id, page = 1, pageSize = 25, search, filters = {} }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/receipts/`,
				method: 'GET',
				params: { company_id, page, page_size: pageSize, search, ...filters },
			}),
			providesTags: ['StockReceipt'],
		}),
		getStockReceipt: builder.query<StockReceipt, { company_id: number; id: number }>({
			query: ({ company_id, id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/receipts/${id}/`,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['StockReceipt'],
		}),
		createStockReceipt: builder.mutation<
			StockReceipt,
			{
				company_id: number;
				logistics_order: number;
				reference: string;
				note: string;
				lines: Array<{ logistics_line: number; article: number; emplacement: number; quantity: number }>;
			}
		>({
			query: (data) => ({ url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/receipts/`, method: 'POST', data }),
			invalidatesTags: ['StockReceipt'],
		}),
		validateStockReceipt: builder.mutation<StockReceipt, { company_id: number; id: number }>({
			query: ({ company_id, id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/receipts/${id}/validate/`,
				method: 'POST',
				data: { company_id },
			}),
			invalidatesTags: ['StockReceipt', 'StockBalance', 'StockMovement'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					const { data } = await queryFulfilled;
					dispatch(articleApi.util.invalidateTags(['Article']));
					dispatch(
						logistiqueApi.util.invalidateTags([
							{ type: 'Logistique', id: 'LIST' },
							{ type: 'Logistique', id: data.logistics_order },
						]),
					);
				} catch {
					// Keep cached stock and logistics values when validation fails.
				}
			},
		}),
		cancelStockReceipt: builder.mutation<StockReceipt, { company_id: number; id: number }>({
			query: ({ company_id, id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/receipts/${id}/cancel/`,
				method: 'POST',
				data: { company_id },
			}),
			invalidatesTags: ['StockReceipt', 'StockBalance', 'StockMovement'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					const { data } = await queryFulfilled;
					dispatch(articleApi.util.invalidateTags(['Article']));
					dispatch(
						logistiqueApi.util.invalidateTags([
							{ type: 'Logistique', id: 'LIST' },
							{ type: 'Logistique', id: data.logistics_order },
						]),
					);
				} catch {
					// Keep cached stock and logistics values when cancellation fails.
				}
			},
		}),
		getInventories: builder.query<
			InventoryResponse,
			{ company_id: number; page?: number; pageSize?: number; search?: string; filters?: StockListFilters }
		>({
			query: ({ company_id, page = 1, pageSize = 25, search, filters = {} }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/inventories/`,
				method: 'GET',
				params: { company_id, page, page_size: pageSize, search, ...filters },
			}),
			providesTags: ['Inventory'],
		}),
		getInventory: builder.query<InventorySession, { company_id: number; id: number }>({
			query: ({ company_id, id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/inventories/${id}/`,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['Inventory'],
		}),
		createInventory: builder.mutation<
			InventorySession,
			{
				company_id: number;
				emplacement: number;
				reference: string;
				note: string;
				lines: Array<{ article: number; counted_quantity: number }>;
			}
		>({
			query: (data) => ({ url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/inventories/`, method: 'POST', data }),
			invalidatesTags: ['Inventory'],
		}),
		validateInventory: builder.mutation<InventorySession, { company_id: number; id: number }>({
			query: ({ company_id, id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_ROOT}/inventories/${id}/validate/`,
				method: 'POST',
				data: { company_id },
			}),
			invalidatesTags: ['Inventory', 'StockBalance', 'StockMovement'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(articleApi.util.invalidateTags(['Article']));
				} catch {
					// Keep cached article stock values when inventory validation fails.
				}
			},
		}),
	}),
});

export const {
	useGetStockBalancesQuery,
	useGetStockBalanceQuery,
	useGetStockMovementsQuery,
	useGetStockMovementQuery,
	useCreateStockAdjustmentMutation,
	useGetStockReceiptsQuery,
	useGetStockReceiptQuery,
	useCreateStockReceiptMutation,
	useValidateStockReceiptMutation,
	useCancelStockReceiptMutation,
	useGetInventoriesQuery,
	useGetInventoryQuery,
	useCreateInventoryMutation,
	useValidateInventoryMutation,
} = stockApi;
