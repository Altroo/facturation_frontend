import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { ReglementClass } from '@/models/classes';
import type { ApiErrorResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { ReglementListResponseType, ReglementStatutType } from '@/types/reglementTypes';

export const reglementApi = createApi({
	reducerPath: 'reglementApi',
	tagTypes: ['Reglement'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getReglementsList: builder.query<
			ReglementListResponseType,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				facture_client?: number;
				statut?: ReglementStatutType;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search, facture_client, statut }) => ({
				url: process.env.NEXT_PUBLIC_REGLEMENT_LIST,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					facture_client,
					statut,
				},
			}),
			providesTags: ['Reglement'],
		}),

		getReglement: builder.query<ReglementClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_REGLEMENT_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['Reglement'],
		}),

		deleteReglement: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_REGLEMENT_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Reglement'],
		}),

		editReglement: builder.mutation<SuccessResponseType<ReglementClass>, { id: number; data: Partial<ReglementClass> }>(
			{
				query: ({ id, data }) => ({
					url: `${process.env.NEXT_PUBLIC_REGLEMENT_ROOT}/${id}/`,
					method: 'PUT',
					data,
				}),
				invalidatesTags: ['Reglement'],
			},
		),

		addReglement: builder.mutation<ReglementClass, { data: Partial<ReglementClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_REGLEMENT_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Reglement'],
		}),

		patchReglementStatut: builder.mutation<
			SuccessResponseType<ReglementClass>,
			{ id: number; data: { statut: ReglementStatutType } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_REGLEMENT_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['Reglement'],
		}),
	}),
});

export const {
	useGetReglementsListQuery,
	useGetReglementQuery,
	useDeleteReglementMutation,
	useEditReglementMutation,
	useAddReglementMutation,
	usePatchReglementStatutMutation,
} = reglementApi;
