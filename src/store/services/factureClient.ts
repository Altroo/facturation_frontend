import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { FactureClass } from '@/models/classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { TypeFactureDevisStatus } from '@/types/devisTypes';

export const factureClientApi = createApi({
	reducerPath: 'factureClientApi',
	tagTypes: ['FactureClient'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getFactureClientList: builder.query<
			Array<Partial<FactureClass>> | PaginationResponseType<FactureClass>,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search }) => ({
				url: process.env.NEXT_PUBLIC_FACTURE_CLIENT_LIST as string,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
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
		getNumFactureClient: builder.query<Pick<FactureClass, 'numero_facture'>, void>({
			query: () => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_GENERATE_NUM_FACTURE}`,
				method: 'GET',
			}),
			providesTags: ['FactureClient'],
		}),
		deleteFactureClient: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['FactureClient'],
		}),
		editFactureClient: builder.mutation<SuccessResponseType<FactureClass>, { id: number; data: Partial<FactureClass> }>(
			{
				query: ({ id, data }) => ({
					url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_ROOT}/${id}/`,
					method: 'PUT',
					data,
				}),
				invalidatesTags: ['FactureClient'],
			},
		),
		addFactureClient: builder.mutation<FactureClass, { data: Partial<FactureClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['FactureClient'],
		}),
		patchStatut: builder.mutation<
			SuccessResponseType<FactureClass>,
			{ id: number; data: { statut: TypeFactureDevisStatus } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_CLIENT_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['FactureClient'],
		}),
	}),
});

export const {
	useGetFactureClientListQuery,
	useDeleteFactureClientMutation,
	useEditFactureClientMutation,
	useGetNumFactureClientQuery,
	useGetFactureClientQuery,
	useAddFactureClientMutation,
	usePatchStatutMutation,
} = factureClientApi;
