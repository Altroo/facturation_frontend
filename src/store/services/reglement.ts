import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { ReglementClass } from '@/models/classes';
import type { ApiErrorResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { ReglementListResponseType, ReglementStatutType } from '@/types/reglementTypes';
import { factureClientApi } from '@/store/services/factureClient';

export const reglementApi = createApi({
	reducerPath: 'reglementApi',
	tagTypes: ['Reglement', 'Dashboard'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getReglementsList: builder.query<
			ReglementListResponseType | ReglementClass[],
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				facture_client?: number;
				statut?: ReglementStatutType;
				date_reglement_after?: string;
				date_reglement_before?: string;
				date_echeance_after?: string;
				date_echeance_before?: string;
				[key: string]: string | number | boolean | undefined;
			}
		>({
			query: ({
				company_id,
				with_pagination,
				page,
				pageSize,
				search,
				facture_client,
				statut,
				date_reglement_after,
				date_reglement_before,
				date_echeance_after,
				date_echeance_before,
				...extraFilters
			}) => ({
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
					date_reglement_after,
					date_reglement_before,
					date_echeance_after,
					date_echeance_before,
					...extraFilters,
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
			invalidatesTags: ['Reglement', 'Dashboard'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(factureClientApi.util.invalidateTags(['FactureClient']));
				} catch {
					// ignore
				}
			},
		}),

		editReglement: builder.mutation<SuccessResponseType<ReglementClass>, { id: number; data: Partial<ReglementClass> }>(
			{
				query: ({ id, data }) => ({
					url: `${process.env.NEXT_PUBLIC_REGLEMENT_ROOT}/${id}/`,
					method: 'PUT',
					data,
				}),
				invalidatesTags: ['Reglement', 'Dashboard'],
				async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
					try {
						await queryFulfilled;
						dispatch(factureClientApi.util.invalidateTags(['FactureClient']));
					} catch {
						// ignore
					}
				},
			},
		),

		addReglement: builder.mutation<ReglementClass, { data: Partial<ReglementClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_REGLEMENT_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Reglement', 'Dashboard'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(factureClientApi.util.invalidateTags(['FactureClient']));
				} catch {
					// ignore
				}
			},
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
			invalidatesTags: ['Reglement', 'Dashboard'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(factureClientApi.util.invalidateTags(['FactureClient']));
				} catch {
					// ignore
				}
			},
		}),
		bulkDeleteReglements: builder.mutation<void | ApiErrorResponseType, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_REGLEMENT_ROOT}/bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Reglement', 'Dashboard'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(factureClientApi.util.invalidateTags(['FactureClient']));
				} catch {
					// ignore
				}
			},
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
	useBulkDeleteReglementsMutation,
} = reglementApi;
