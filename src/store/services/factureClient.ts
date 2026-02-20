import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { FactureClass } from '@/models/classes';
import type { ApiErrorResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { FactureClientListResponseType, FactureForPayment } from '@/types/companyDocumentsTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';
import { bonDeLivraisonApi } from '@/store/services/bonDeLivraison';

export const factureClientApi = createApi({
	reducerPath: 'factureClientApi',
	tagTypes: ['FactureClient', 'Dashboard'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getFactureClientList: builder.query<
			Array<Partial<FactureClass>> | FactureClientListResponseType,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				date_after?: string;
				date_before?: string;
				[key: string]: string | number | boolean | undefined;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search, date_after, date_before, ...extraFilters }) => ({
				url: process.env.NEXT_PUBLIC_FACTURE_CLIENT_LIST,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					date_after,
					date_before,
					...extraFilters,
				},
			}),
			providesTags: ['FactureClient'],
		}),
		getFactureClientUnpaidList: builder.query<
			Array<Partial<FactureClass>> | FactureClientListResponseType,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				date_after?: string;
				date_before?: string;
				[key: string]: string | number | boolean | undefined;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search, date_after, date_before, ...extraFilters }) => ({
				url: process.env.NEXT_PUBLIC_FACTURE_CLIENT_UNPAID,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					date_after,
					date_before,
					...extraFilters,
				},
			}),
			providesTags: ['FactureClient'],
		}),
		getFactureClientForPayment: builder.query<FactureForPayment[], { company_id: number }>({
			query: ({ company_id }) => ({
				url: process.env.NEXT_PUBLIC_FACTURE_CLIENT_FOR_PAYMENT,
				method: 'GET',
				params: {
					company_id,
				},
			}),
			providesTags: ['FactureClient'],
		}),

		getFactureClient: builder.query<FactureClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['FactureClient'],
		}),
		getNumFactureClient: builder.query<Pick<FactureClass, 'numero_facture'>, { company_id: number }>({
			query: ({ company_id }) => ({
				url: process.env.NEXT_PUBLIC_FACTURE_CLIENT_GENERATE_NUM_FACTURE,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['FactureClient'],
		}),
		deleteFactureClient: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['FactureClient', 'Dashboard'],
		}),
		editFactureClient: builder.mutation<SuccessResponseType<FactureClass>, { id: number; data: Partial<FactureClass> }>(
			{
				query: ({ id, data }) => ({
					url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_ROOT}/${id}/`,
					method: 'PUT',
					data,
				}),
				invalidatesTags: ['FactureClient', 'Dashboard'],
			},
		),
		addFactureClient: builder.mutation<FactureClass, { data: Partial<FactureClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['FactureClient', 'Dashboard'],
		}),
		convertFactureClientToBonDeLivraison: builder.mutation<{ id: number }, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_CONVERT_TO_BON_DE_LIVRAISON}${id}/`,
				method: 'POST',
			}),
			invalidatesTags: ['FactureClient', 'Dashboard'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					// Invalidate the factureProFormaApi tag so its list refetches
					dispatch(bonDeLivraisonApi.util.invalidateTags(['BonDeLivraison']));
				} catch {
					// ignore
				}
			},
		}),
		patchStatut: builder.mutation<
			SuccessResponseType<FactureClass>,
			{ id: number; data: { statut: TypeFactureLivraisonDevisStatus } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['FactureClient', 'Dashboard'],
		}),
		bulkDeleteFactureClient: builder.mutation<void | ApiErrorResponseType, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_ROOT}/bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['FactureClient', 'Dashboard'],
		}),
	}),
});

export const {
	useGetFactureClientListQuery,
	useGetFactureClientUnpaidListQuery,
	useGetFactureClientForPaymentQuery,
	useDeleteFactureClientMutation,
	useEditFactureClientMutation,
	useGetNumFactureClientQuery,
	useGetFactureClientQuery,
	useAddFactureClientMutation,
	useConvertFactureClientToBonDeLivraisonMutation,
	usePatchStatutMutation,
	useBulkDeleteFactureClientMutation,
} = factureClientApi;
