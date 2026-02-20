import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { DeviClass } from '@/models/classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';
import { factureProFormaApi } from '@/store/services/factureProForma';
import { factureClientApi } from '@/store/services/factureClient';

export const deviApi = createApi({
	reducerPath: 'deviApi',
	tagTypes: ['Devi', 'Dashboard'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getDevisList: builder.query<
			Array<Partial<DeviClass>> | PaginationResponseType<DeviClass>,
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
				url: process.env.NEXT_PUBLIC_DEVIS_LIST,
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
			providesTags: ['Devi'],
		}),

		getDevi: builder.query<DeviClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['Devi'],
		}),
		getNumDevis: builder.query<Pick<DeviClass, 'numero_devis'>, { company_id: number }>({
			query: ({ company_id }) => ({
				url: process.env.NEXT_PUBLIC_DEVIS_GENERATE_NUM_DEVIS,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['Devi'],
		}),
		deleteDevi: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Devi', 'Dashboard'],
		}),
		editDevi: builder.mutation<SuccessResponseType<DeviClass>, { id: number; data: Partial<DeviClass> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Devi', 'Dashboard'],
		}),
		addDevi: builder.mutation<DeviClass, { data: Partial<DeviClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Devi', 'Dashboard'],
		}),
		convertDeviToFactureProForma: builder.mutation<{ id: number }, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_CONVERT_TO_FACTURE_PRO_FORMA}${id}/`,
				method: 'POST',
			}),
			invalidatesTags: ['Devi', 'Dashboard'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					// Invalidate the factureProFormaApi tag so its list refetches
					dispatch(factureProFormaApi.util.invalidateTags(['FactureProForma']));
				} catch {
					// Conversion or cache invalidation failed — RTK Query will still show the error to the user
				}
			},
		}),
		convertDeviToFactureClient: builder.mutation<{ id: number }, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_CONVERT_TO_FACTURE_CLIENT}${id}/`,
				method: 'POST',
			}),
			invalidatesTags: ['Devi', 'Dashboard'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(factureClientApi.util.invalidateTags(['FactureClient']));
				} catch {
					// Conversion or cache invalidation failed — RTK Query will still show the error to the user
				}
			},
		}),
		patchStatut: builder.mutation<
			SuccessResponseType<DeviClass>,
			{ id: number; data: { statut: TypeFactureLivraisonDevisStatus } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['Devi', 'Dashboard'],
		}),
		bulkDeleteDevis: builder.mutation<void | ApiErrorResponseType, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_ROOT}/bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Devi', 'Dashboard'],
		}),
	}),
});

export const {
	useGetDevisListQuery,
	useDeleteDeviMutation,
	useEditDeviMutation,
	useGetNumDevisQuery,
	useGetDeviQuery,
	useAddDeviMutation,
	usePatchStatutMutation,
	useConvertDeviToFactureProFormaMutation,
	useConvertDeviToFactureClientMutation,
	useBulkDeleteDevisMutation,
} = deviApi;
